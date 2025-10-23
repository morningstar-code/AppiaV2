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
    const { messages, language = 'react', image, imageType, imageUrl, model } = req.body;

    // Use optimized system prompt (saves ~80% tokens)
    const systemPrompt = BASE_SYSTEM_PROMPT;

    // Handle different message formats
    let processedMessages;
    
    if (Array.isArray(messages)) {
      // Convert array of messages to Claude format with system prompt
      // Limit to last 3 messages to avoid context length issues
      const recentMessages = messages.slice(-3);
      processedMessages = recentMessages.map((msg: any, index: number) => {
        // If this is the last message and it's from user, and we have an image
        if (index === recentMessages.length - 1 && msg.role === 'user' && (image || imageUrl)) {
          // Use URL-based image (preferred) or fallback to base64
          if (imageUrl) {
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
          } else if (image) {
            console.log('🖼️ Using base64 image (fallback)');
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
                    type: 'base64',
                    media_type: imageType || 'image/jpeg',
                    data: image.split(',')[1] // Remove data:image/jpeg;base64, prefix
                  }
                }
              ]
            };
          }
        }
        
        // Regular text message
        return {
          role: msg.role,
          content: msg.content || msg
        };
      });
    } else {
      // Single message format
      processedMessages = [{
        role: 'user',
        content: messages
      }];
    }

    // Build optimized context with smart compression
    const optimizedMessages = buildPromptContext(processedMessages);
    
    // Determine optimal model based on prompt complexity
    const selectedModel = model || getOptimalModel(optimizedMessages, !!imageUrl);
    
    console.log(`🤖 Using model: ${selectedModel}`);

    // Make the API call with caching
    const response = await cachedClaudeCall({
      model: selectedModel,
      messages: [
        { role: 'user', content: systemPrompt },
        ...optimizedMessages
      ],
      max_tokens: 4000,
      temperature: 0.7
    });

    // Log token usage for analytics
    if (response.usage) {
      await logTokenUsage({
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
        model: selectedModel
      });
    }

    // Return the response
    return res.status(200).json({
      response: response.content[0].text,
      usage: response.usage,
      model: selectedModel
    });

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