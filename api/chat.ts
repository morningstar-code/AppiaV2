import type { VercelRequest, VercelResponse } from '@vercel/node';
import Anthropic from '@anthropic-ai/sdk';
import { getSystemPrompt } from './_lib/prompts';
import { prisma } from './_lib/prisma';
import { logger } from './_lib/logger';
import { rateLimit } from './_lib/rateLimit';

// Inline RN to Web compiler to avoid module resolution issues
function transformReactNativeCode(code: string): string {
  let transformed = code;
  transformed = transformed.replace(/from ['"]react-native['"]/g, "from 'react-native-web'");
  transformed = transformed.replace(/import.*from ['"]expo-.*['"]/g, '// Expo imports removed for web');
  transformed = transformed.replace(/<StatusBar[^>]*\/>/g, '{/* StatusBar not available on web */}');
  transformed = transformed.replace(/Haptics\.(.*)\(\)/g, '// Haptics.$1() not available on web');
  return transformed;
}

function generateWebPackageJson(name: string = 'rn-web-app'): string {
  return JSON.stringify({
    name,
    version: '1.0.0',
    type: 'module',
    scripts: { dev: 'vite', build: 'vite build', preview: 'vite preview' },
    dependencies: { 
      react: '^18.2.0', 
      'react-dom': '^18.2.0', 
      'react-native-web': '^0.19.10',
      '@react-navigation/native': '^6.1.0',
      '@react-navigation/stack': '^6.3.0',
      'react-native-gesture-handler': '^2.9.0',
      'react-native-reanimated': '^2.14.4',
      'react-native-safe-area-context': '^4.5.0',
      'react-native-screens': '^3.20.0'
    },
    devDependencies: {
      '@types/react': '^18.2.0',
      '@types/react-dom': '^18.2.0',
      '@vitejs/plugin-react': '^4.2.0',
      vite: '^5.0.0',
      typescript: '^5.3.0'
    }
  }, null, 2);
}

function generateIndexHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>React Native Web App</title>
    <style>
      * { box-sizing: border-box; }
      body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
      #root { display: flex; height: 100vh; width: 100vw; }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/index.tsx"></script>
  </body>
</html>`;
}

function generateViteConfig(): string {
  return `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { 'react-native': 'react-native-web' },
    extensions: ['.web.tsx', '.web.ts', '.web.jsx', '.web.js', '.tsx', '.ts', '.jsx', '.js']
  },
  optimizeDeps: { include: ['react-native-web'] }
});`;
}

function generateWebEntry(): string {
  return `import { createRoot } from 'react-dom/client';
import { AppRegistry } from 'react-native-web';
import App from './App';

AppRegistry.registerComponent('App', () => App);
const rootTag = document.getElementById('root');
if (rootTag) {
  const { element, getStyleElement } = AppRegistry.getApplication('App');
  if (getStyleElement) {
    const style = getStyleElement();
    if (style) document.head.appendChild(style);
  }
  createRoot(rootTag).render(element);
}`;
}

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY!,
});

// Enterprise rate limiter - 10 requests per minute for AI chat
const chatLimiter = rateLimit(10, 60 * 1000);

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

  // Enterprise: Rate limiting
  if (!chatLimiter(req, res)) return;

  try {
    // Enterprise: Log request
    logger.info('Chat request received', { userId: req.body.userId, hasImage: !!req.body.imageUrl });
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
    
    let patchData = files.length > 0 ? { ops: files } : null;
    
    // Check if this is a React Native project and compile to web
    if (patchData && files.length > 0) {
      const hasReactNative = files.some(f => 
        f.path === 'app.json' || 
        (f.replace && (f.replace.includes('react-native') || f.replace.includes('expo')))
      );
      
      if (hasReactNative) {
        console.log('📱 [RN Compiler] React Native project detected, compiling to web...');
        
        try {
          // Compile React Native files to web - ONLY copy non-app.json, non-package.json files
          const webFiles: any[] = [];
          
          for (const file of files) {
            // Skip app.json and package.json - we'll generate new ones
            if (file.path === 'app.json' || file.path === 'package.json') continue;
            
            // Put App.tsx in src/ folder, keep other files in their original structure
            const targetPath = file.path === 'App.tsx' ? 'src/App.tsx' : file.path;
            
            // Copy all other files with transformed imports
            webFiles.push({
              path: targetPath,
              content: transformReactNativeCode(file.replace || '')
            });
          }
          
          // Add web-specific files
          webFiles.push({ path: 'package.json', content: generateWebPackageJson() });
          webFiles.push({ path: 'index.html', content: generateIndexHtml() });
          webFiles.push({ path: 'vite.config.ts', content: generateViteConfig() });
          webFiles.push({ path: 'src/index.tsx', content: generateWebEntry() });
          
          if (webFiles.length > 0) {
            console.log('✅ [RN Compiler] Successfully compiled to web');
            
            // Add compiled web files to patch with special prefix
            const webPatchOps = webFiles.map(f => ({
              type: 'editFile',
              path: `web-preview/${f.path}`,
              replace: f.content
            }));
            
            // Combine native files + compiled web files
            patchData = {
              ops: [...files, ...webPatchOps]
            };
            
            console.log(`[RN Compiler] Added ${webPatchOps.length} web-preview files to patch`);
          }
        } catch (error: any) {
          console.error('❌ [RN Compiler] Compilation error:', error.message);
          // Continue with native files only
        }
      }
    }
    
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
      // Don't await - let it run in background to not block response
      (async () => {
        try {
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
          if (usageError instanceof Error) {
            console.error('[Usage] Error details:', usageError.message);
            console.error('[Usage] Stack:', usageError.stack);
          }
        }
      })();
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
