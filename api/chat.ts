import type { VercelRequest, VercelResponse } from '@vercel/node';
import Anthropic from '@anthropic-ai/sdk';
import { getSystemPrompt } from './prompts';

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY!,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userText, imageUrl, summary, language = 'react', userId, messages = [], projectId } = req.body;
    
    if (!userText || userText.trim().length === 0) {
      return res.status(400).json({ error: 'User text is required' });
    }

    // Token limit checking is handled by the usage API via Prisma
    // We'll check limits there and let this API focus on generation
    
    // Truncate user text to prevent excessive tokens
    const userTextShort = userText.length > 1000 ? userText.substring(0, 1000) : userText;
    const summaryShort = summary && summary.length > 240 ? summary.substring(0, 240) : summary;
    
    // Log prompt details
    console.log('[Prompt]', { 
      hasImage: !!imageUrl, 
      userLen: userTextShort.length, 
      summaryLen: summaryShort?.length || 0 
    });
    
    // Build messages array
    const content: any[] = [
      { type: "text", text: userTextShort }
    ];
    
    if (imageUrl) {
      content.push({
        type: "image",
        source: { type: "url", url: imageUrl }
      });
    }
    
    if (summaryShort) {
      content.push({
        type: "text", 
        text: `Project summary: ${summaryShort}`
      });
    }
    
    // Build conversation history with current message
    const conversationHistory = messages.map((msg: any) => ({
      role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
      content: msg.text || msg.content || ''
    }));

    // Add current user message
    conversationHistory.push({ role: "user" as const, content });
    
    // Make Claude request
    console.log('🚀 [API] Processing chat request');
    
    const systemPrompt = getSystemPrompt('/home/project');
    console.log('[System Prompt] Length:', systemPrompt.length, 'chars');
    console.log('[System Prompt] First 200 chars:', systemPrompt.substring(0, 200));
    
    // Smart model selection based on request complexity
    // Use Haiku (fast, cheap) for most requests, only use Sonnet for extremely complex ones
    const isComplexRequest = 
      // Only use complex model for VERY specific scenarios requiring deep reasoning
      (/extremely complex|refactor entire codebase|advanced algorithm/i.test(userTextShort) && messages.length > 5);
    
    // ALWAYS use Haiku - it's 10x faster and generates files reliably
    const model = 'claude-3-haiku-20240307';
    const maxTokens = 4096; // Max for Haiku is 4096
    
    console.log(`[Model Selection] Using ${model} (complex: ${isComplexRequest})`);
    
    // Enable streaming for faster response
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    let responseText = '';
    let inputTokens = 0;
    let outputTokens = 0;
    
    const stream = await anthropic.messages.stream({
      model,
      system: systemPrompt,
      messages: conversationHistory,
      max_tokens: maxTokens,
      temperature: 0.1,
      stop_sequences: []
    });
    
    // Stream response chunks to client
    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        const text = chunk.delta.text;
        responseText += text;
        // Send chunk to client
        res.write(`data: ${JSON.stringify({ type: 'chunk', text })}

`);
      } else if (chunk.type === 'message_start') {
        inputTokens = chunk.message.usage.input_tokens;
      } else if (chunk.type === 'message_delta') {
        outputTokens = chunk.usage.output_tokens;
      }
    }
    
    console.log('✅ [API] Response received');
    
    // Log response details
    console.log('[Response] bytes:', JSON.stringify(responseText).length);
    console.log('[Response] First 500 chars:', responseText.substring(0, 500));
    console.log('[Response] Has boltArtifact:', responseText.includes('<boltArtifact'));
    console.log('[Usage]', { input_tokens: inputTokens, output_tokens: outputTokens });
    
    // Parse boltArtifact format
    const artifactMatch = responseText.match(/<boltArtifact[^>]*>([\s\S]*?)<\/boltArtifact>/);
    const files: any[] = [];

    if (artifactMatch) {
      console.log('✅ [Parser] Found boltArtifact');
      const artifactContent = artifactMatch[1];
      
      // Extract file actions from the artifact
      const fileActions = artifactContent.match(/<boltAction type="file"[^>]*>([\s\S]*?)<\/boltAction>/g);
      console.log(`[Parser] Found ${fileActions?.length || 0} file actions`);
      
      if (fileActions) {
        for (const action of fileActions) {
          const filePathMatch = action.match(/filePath="([^"]+)"/);
          const contentMatch = action.match(/<boltAction type="file"[^>]*>([\s\S]*?)<\/boltAction>/);
          
          if (filePathMatch && contentMatch) {
            const filePath = filePathMatch[1];
            const content = contentMatch[1].trim();
            console.log(`[Parser] ✅ Extracted file: ${filePath} (${content.length} chars)`);
            
            // Convert to our patch format
            files.push({
              type: 'editFile',
              path: filePath,
              replace: content
            });
          } else {
            console.log('[Parser] ❌ Failed to extract file path or content from action');
          }
        }
      }
    } else {
      console.log('❌ [Parser] NO boltArtifact found in response!');
      console.log('[Parser] Response sample:', responseText.substring(0, 300));
    }
    
    const patchData = files.length > 0 ? { ops: files } : null;
    
    // Calculate total tokens for proper usage tracking
    const usageData = {
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      totalTokens: inputTokens + outputTokens,
      inputTokens: inputTokens,
      outputTokens: outputTokens
    };
    
    // Send final message with complete data
    res.write(`data: ${JSON.stringify({
      type: 'done',
      response: responseText,
      usage: usageData,
      patch: patchData
    })}

`);
    
    res.end();
    
    // Log usage to database using Prisma (non-blocking)
    if (userId) {
      const totalTokens = inputTokens + outputTokens;
      try {
        const { prisma } = await import('./lib/prisma');
        
        console.log('[Usage] Logging ' + totalTokens + ' tokens for user ' + userId);
        
        // Get or create subscription
        let subscription = await prisma.subscription.findUnique({
          where: { userId }
        });
        
        if (!subscription) {
          subscription = await prisma.subscription.create({
            data: {
              userId,
              tier: 'free',
              tokensLimit: 108000,
              tokensUsed: 0,
              resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            }
          });
        }
        
        // Update subscription token usage
        await prisma.subscription.update({
          where: { userId },
          data: {
            tokensUsed: { increment: totalTokens },
            updatedAt: new Date()
          }
        });
        
        // Log the usage event
        await prisma.usage.create({
          data: {
            userId,
            actionType: 'chat_generation',
            tokensUsed: totalTokens,
            metadata: {
              inputTokens,
              outputTokens,
              model
            }
          }
        });
        
        console.log('[Usage] ✅ Logged successfully');
      } catch (usageError) {
        console.error('[Usage] ❌ Failed to log:', usageError);
        // Don't fail the request if usage logging fails
      }
    }

  } catch (error: any) {
    console.error('❌ Chat API error:', error);
    
    // Better error messages based on error type
    let errorMessage = 'Internal server error';
    let statusCode = 500;
    
    if (error.message?.includes('API key')) {
      errorMessage = 'API configuration error. Please check your Claude API key.';
      statusCode = 503;
    } else if (error.message?.includes('rate limit')) {
      errorMessage = 'Rate limit exceeded. Please try again in a moment.';
      statusCode = 429;
    } else if (error.message?.includes('timeout')) {
      errorMessage = 'Request timed out. Please try again.';
      statusCode = 504;
    } else if (error.response?.data) {
      errorMessage = error.response.data.error?.message || errorMessage;
    }
    
    return res.status(statusCode).json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
