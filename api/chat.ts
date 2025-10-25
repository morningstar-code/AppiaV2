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

    // Check token limits before processing (only if database is available)
    if (userId && process.env.POSTGRES_URL) {
      try {
        const postgres = await import('@vercel/postgres').catch(() => null);
        const sql = postgres?.sql;
        if (sql) {
          const { rows } = await sql`
            SELECT tier, tokens_used, tokens_limit 
            FROM users 
            WHERE user_id = ${userId}
          `;
        
          if (rows.length > 0) {
            const user = rows[0];
            if (user.tokens_used >= user.tokens_limit) {
              return res.status(429).json({ 
                error: 'Token limit exceeded', 
                message: 'You have reached your monthly token limit. Please upgrade to Pro to continue.',
                tier: user.tier,
                tokensUsed: user.tokens_used,
                tokensLimit: user.tokens_limit
              });
            }
          }
        }
      } catch (limitError) {
        console.warn('Failed to check token limits:', limitError);
        // Continue processing if limit check fails
      }
    } else if (userId && !process.env.POSTGRES_URL) {
      console.log('Database not configured - skipping token limit check');
    }
    
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
    
    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307', // Use Haiku for better API key compatibility
      system: getSystemPrompt('/home/project'),
      messages: conversationHistory,
      max_tokens: 2000,
      temperature: 0.1,
      stop_sequences: []
    });
    
    console.log('✅ [API] Response received');
    
    // Log response details
    const responseText = response.content[0].type === 'text' ? (response.content[0] as any).text : '';
    console.log('[Response] bytes:', JSON.stringify(responseText).length);
    console.log('[Usage]', response.usage);
    
    // Parse boltArtifact format
    const artifactMatch = responseText.match(/<boltArtifact[^>]*>([\s\S]*?)<\/boltArtifact>/);
    const files: any[] = [];

    if (artifactMatch) {
      const artifactContent = artifactMatch[1];
      
      // Extract file actions from the artifact
      const fileActions = artifactContent.match(/<boltAction type="file"[^>]*>([\s\S]*?)<\/boltAction>/g);
      
      if (fileActions) {
        for (const action of fileActions) {
          const filePathMatch = action.match(/filePath="([^"]+)"/);
          const contentMatch = action.match(/<boltAction type="file"[^>]*>([\s\S]*?)<\/boltAction>/);
          
          if (filePathMatch && contentMatch) {
            const filePath = filePathMatch[1];
            const content = contentMatch[1].trim();
            
            // Convert to our patch format
            files.push({
              type: 'editFile',
              path: filePath,
              replace: content
            });
          }
        }
      }
    }
    
    const patchData = files.length > 0 ? { ops: files } : null;
    
    return res.status(200).json({
      response: responseText,
      usage: response.usage,
      patch: patchData
    });

  } catch (error: any) {
    console.error('❌ Chat API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}