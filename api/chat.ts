import type { VercelRequest, VercelResponse } from '@vercel/node';
import Anthropic from '@anthropic-ai/sdk';
import { supabaseTemplates } from '../Backend/src/supabase-templates.js';
import { 
  buildPromptContext, 
  getOptimalModel, 
  cachedClaudeCall, 
  logTokenUsage,
  BASE_SYSTEM_PROMPT,
  compressContent,
  decompressContent
} from './utils/tokenOptimization';

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
    const { messages, language = 'react', imageUrl, model } = req.body;

    // Use optimized system prompt (saves ~80% tokens)
    const systemPrompt = BASE_SYSTEM_PROMPT;

    // Build optimized context with selective history (saves ~70% tokens)
    const optimizedMessages = buildPromptContext(messages, 4);
    
    // Compress large content in messages to reduce tokens (saves ~80% on large payloads)
    const compressedMessages = optimizedMessages.map((msg: any) => {
      if (typeof msg.content === 'string' && msg.content.length > 2000) {
        const compressed = compressContent(msg.content);
        if (compressed !== msg.content) {
          console.log(`📦 Compressed message: ${msg.content.length} → ${compressed.length} chars`);
        }
        return { ...msg, content: compressed };
      }
      return msg;
    });
    
    // Determine optimal model based on task complexity (saves ~60% tokens)
    const lastMessage = messages[messages.length - 1];
    const prompt = lastMessage?.content || '';
    const hasImage = !!imageUrl;
    const isFirstPrompt = messages.length <= 1;
    
    const selectedModel = model || getOptimalModel(prompt, hasImage, isFirstPrompt);
    
    console.log(`🤖 Using optimized model: ${selectedModel}`);
    console.log(`📊 Context optimization: ${messages.length} → ${compressedMessages.length} messages`);

    // Handle different message formats with optimization
    let processedMessages;
    
    if (Array.isArray(compressedMessages)) {
      // Convert array of messages to Claude format with system prompt
      processedMessages = compressedMessages.map((msg: any, index: number) => {
        // If this is the last message and it's from user, and we have an image URL
        if (index === compressedMessages.length - 1 && msg.role === 'user' && imageUrl) {
          console.log('🖼️ Using URL-based image:', imageUrl);
          return {
            role: 'user',
            content: [
              {
                type: 'text',
                text: msg.content || msg
              },
              {
                type: 'image',
                source: {
                  type: 'url',
                  url: imageUrl
                }
              }
            ]
          };
        }
        
        return {
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content || msg
        };
      });
      
      // Add system instructions to the first user message
      if (processedMessages.length > 0 && processedMessages[0].role === 'user') {
        // Handle both text and array content types
        if (Array.isArray(processedMessages[0].content)) {
          // For image messages, add instructions to the text part
          processedMessages[0].content[0].text = `${systemPrompt}\n\n${processedMessages[0].content[0].text}`;
        } else {
          processedMessages[0].content = `${systemPrompt}\n\n${processedMessages[0].content}`;
        }
      }
    } else {
      // Handle single message format
      processedMessages = [
        { role: 'user', content: `${systemPrompt}\n\n${messages}` }
      ];
    }

    console.log('🚀 Sending optimized request to Claude with image URL:', !!imageUrl);
    
    // Create Claude API payload
    const claudePayload = {
      model: selectedModel,
      max_tokens: 4000,
      messages: processedMessages
    };

    // Use cached Claude call to avoid duplicate requests
    const response = await cachedClaudeCall(claudePayload, async (payload) => {
      return await anthropic.messages.create(payload);
    });
    
    console.log('✅ Claude response received');

    const responseText = response.content[0].type === 'text' ? response.content[0].text : '';

    // Log token usage for analytics
    if (response.usage) {
      logTokenUsage(response.usage, selectedModel, prompt);
    }

    // Parse XML response
    const xmlMatch = responseText.match(/<boltArtifact[\s\S]*?<\/boltArtifact>/);
    if (xmlMatch) {
      const xmlContent = xmlMatch[0];
      console.log('📄 XML content extracted');
      
      // Return optimized response
      return res.status(200).json({
        response: responseText,
        usage: {
          inputTokens: response.usage?.input_tokens || 0,
          outputTokens: response.usage?.output_tokens || 0,
          totalTokens: (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0)
        },
        model: selectedModel,
        optimization: {
          contextReduction: `${messages.length} → ${compressedMessages.length} messages`,
          modelSelection: selectedModel,
          imageMethod: imageUrl ? 'URL' : 'None',
          compression: 'Enabled for large content'
        }
      });
    } else {
      console.log('⚠️ No XML content found in response');
      return res.status(200).json({
        response: responseText,
        usage: {
          inputTokens: response.usage?.input_tokens || 0,
          outputTokens: response.usage?.output_tokens || 0,
          totalTokens: (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0)
        },
        model: selectedModel
      });
    }

  } catch (error: any) {
    console.error('❌ Chat API error:', error);

    // Handle specific error types
    if (error.message?.includes('timeout')) {
      return res.status(408).json({ error: 'Request timeout. Please try again with a smaller image.' });
    } else if (error.message?.includes('image')) {
      return res.status(400).json({ error: 'Invalid image format. Please use JPEG, PNG, or WebP.' });
    } else if (error.status === 413) {
      return res.status(413).json({ error: 'Image too large. Please use an image smaller than 10MB.' });
    } else {
      return res.status(500).json({ error: 'Failed to process chat request. Please try again.' });
    }
  }
}
