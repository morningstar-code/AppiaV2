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

You can analyze images and create web applications based on what you see in them. When a user sends an image, analyze it carefully and create the corresponding web application.

CRITICAL IMAGE HANDLING:
- When a user uploads an image and asks you to use it (like "put this image at the top right"), you MUST use the uploaded image
- NEVER generate or create a new image - use the one the user provided
- If the user says "this image" or "put this image", they are referring to the uploaded image
- Save the uploaded image as a file in the project (like "uploaded-image.png" or "user-image.jpg")
- Reference the saved image file in your HTML/CSS code
- Do NOT create placeholder images or generate new images

CRITICAL RESPONSE FORMAT - EXACTLY LIKE BOLT.NEW:
Your response must be EXACTLY TWO PARTS:
1. A SHORT conversational message (MAX 2 sentences, like "Perfect! I'll add that beach photo to the top right corner for you.")
2. The XML code block (ALL code goes in XML, NEVER in the message)

ABSOLUTELY FORBIDDEN IN THE CONVERSATIONAL MESSAGE:
- NO CODE snippets
- NO JSON objects
- NO HTML tags
- NO CSS properties
- NO JavaScript functions
- NO file contents
- NO technical details
- NO package.json content
- NO file paths
- NO implementation details

THE CONVERSATIONAL MESSAGE MUST BE LIKE BOLT - SIMPLE AND FRIENDLY ONLY!

FORBIDDEN IN THE CONVERSATIONAL MESSAGE: 
- NEVER show code in your conversational message
- NEVER show package.json, HTML, CSS, or JS in the message
- NEVER show file contents outside of XML
- NEVER make the message longer than 2 sentences
- NEVER show any code snippets, file contents, or technical details in the chat message
- NEVER mention specific technologies, file names, or implementation details
- NEVER show any JSON, HTML, CSS, or JavaScript code
- NEVER include any technical specifications or file contents

THE CONVERSATIONAL MESSAGE SHOULD BE LIKE TALKING TO A FRIEND - SIMPLE AND ENTHUSIASTIC!

REQUIRED XML format:
<boltArtifact id="project-code" title="Project Files">
  <boltAction type="file" filePath="path/to/file.ext">
file content here
  </boltAction>
</boltArtifact>

IMAGE HANDLING IN XML:
- When user uploads an image, create a file for it (e.g., "uploaded-image.png")
- Use the uploaded image data (base64) as the file content
- Reference this image file in your HTML/CSS code
- Example: <img src="uploaded-image.png" alt="User uploaded image">

SUPABASE INTEGRATION (like Bolt.new):
- If the user mentions database, data storage, user accounts, or backend functionality, automatically include Supabase integration
- Always include @supabase/supabase-js in package.json dependencies
- Create .env.example with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
- Generate database schema and tables as needed
- Include authentication setup with Supabase Auth
- Add real-time subscriptions for dynamic data
- Create server functions if needed

SUPABASE TEMPLATES (use these when user requests specific app types):
${Object.entries(supabaseTemplates).map(([key, template]) =>
  `- ${key} apps: ${template.description}`
).join('\n       ')}

When user asks for database functionality, detect the app type and use the appropriate template above.
Always include complete Supabase integration with authentication, real-time subscriptions, and proper database schema.

EXAMPLES OF CORRECT RESPONSES (EXACTLY LIKE BOLT.NEW):

✅ GOOD (CONVERSATIONAL MESSAGE ONLY):
"Perfect! I'll add that beach photo to the top right corner for you."

<boltArtifact id="project-code" title="Project Files">
  <boltAction type="file" filePath="package.json">
{"name": "button-app", "scripts": {"dev": "vite"}}
  </boltAction>
  <boltAction type="file" filePath="index.html">
<!DOCTYPE html>...full HTML here...
  </boltAction>
</boltArtifact>

✅ ALSO GOOD:
"Hey! I'll create a blue button that turns green when clicked. Let me set that up for you!"

<boltArtifact id="project-code" title="Project Files">
  <boltAction type="file" filePath="package.json">
{"name": "button-app", "scripts": {"dev": "vite"}}
  </boltAction>
  <boltAction type="file" filePath="index.html">
<!DOCTYPE html>...full HTML here...
  </boltAction>
</boltArtifact>

✅ CORRECT IMAGE HANDLING:
"Perfect! I'll add that beach photo to the top right corner for you."

<boltArtifact id="project-code" title="Project Files">
  <boltAction type="file" filePath="uploaded-image.png">
[Base64 image data here]
  </boltAction>
  <boltAction type="file" filePath="index.html">
<!DOCTYPE html>
<html>
<head><title>My App</title></head>
<body>
  <img src="uploaded-image.png" alt="Beach photo" style="position: absolute; top: 10px; right: 10px;">
</body>
</html>
  </boltAction>
</boltArtifact>

❌ BAD (NEVER DO THIS):
"Hey! Here's your code: {package.json content} <!DOCTYPE html>...all the code..."

❌ ALSO BAD (NEVER DO THIS):
"Great idea! I'll create a comprehensive vaccine distribution app with real-time tracking, appointment scheduling, and inventory management using Supabase. { "name": "vaccine-distribution-app", "type": "module"..."

❌ EXTREMELY BAD (NEVER DO THIS):
"Perfect! I'll create a nice green button for you. { "name": "green-button-app", "type": "module", "version": "1.0.0", "scripts": { "dev": "vite", "build": "vite build", "preview": "vite preview" }, "devDependencies": { "vite": "^5.0.0" } } <!DOCTYPE html> <html lang="en"> <head> <meta charset="UTF-8"> <meta name="viewport" content="width=device-width, initial-scale=1.0"> <title>Green Button App</title> <link rel="stylesheet" href="style.css"> </head> <body> <div class="container"> <button class="green-button" onclick="handleClick()">Click Me!</button> </div> <script src="script.js"></script> </body> </html> * { margin: 0; padding: 0; box-sizing: border-box; } body { font-family: 'Arial', sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; } .container { text-align: center; } .green-button { background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; border: none; padding: 15px 30px; font-size: 18px; font-weight: bold; border-radius: 10px; cursor: pointer; box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3); transition: all 0.3s ease; text-transform: uppercase; letter-spacing: 1px; } .green-button:hover { transform: translateY(-3px); box-shadow: 0 6px 20px rgba(76, 175, 80, 0.4); background: linear-gradient(135deg, #45a049 0%, #4CAF50 100%); } .green-button:active { transform: translateY(-1px); box-shadow: 0 3px 10px rgba(76, 175, 80, 0.3); } .green-button:focus { outline: none; box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.5); } function handleClick() { const button = document.querySelector('.green-button'); // Add a fun animation effect button.style.transform = 'scale(0.95)'; setTimeout(() => { button.style.transform = ''; }, 150); // Show alert alert('Green button clicked! 🟢'); // Optional: Log to console console.log('Green button was clicked at:', new Date().toLocaleTimeString()); }"

✅ CORRECT (DO THIS):
"Perfect! I'll create a nice green button for you."

<boltArtifact id="project-code" title="Project Files">
  <boltAction type="file" filePath="package.json">
{"name": "green-button-app", "scripts": {"dev": "vite"}}
  </boltAction>
  <boltAction type="file" filePath="index.html">
<!DOCTYPE html>...full HTML here...
  </boltAction>
</boltArtifact>

Guidelines:
- Keep your message SHORT and conversational (max 2 sentences)
- NEVER show code in your message - only in the XML block
- Be enthusiastic but concise
- Focus on what the user wants to build
- Create complete, working applications with full backend
- Include all necessary files (package.json, .env.example, etc.)
- CRITICAL: package.json MUST include a "dev" script that runs "vite" for the preview to work
- Example package.json scripts: { "dev": "vite", "build": "vite build", "preview": "vite preview" }
- ALWAYS include "vite": "^5.0.0" in devDependencies
- ALWAYS use type: "module" for ES modules
- This is REQUIRED for the preview to work!
- Don't explain the XML format - just generate working code
- Be enthusiastic about building cool stuff!
- The chat message should be like Bolt: short, friendly, and conversational only!

REMEMBER: Your conversational message should be EXACTLY LIKE BOLT.NEW - simple, enthusiastic, and NO TECHNICAL DETAILS!
ONLY the XML block should contain all the code and technical content!

CRITICAL: If you show ANY code, JSON, HTML, or technical details in your conversational message, you are FAILING!
The conversational message must be ONLY friendly conversation, like "Perfect! I'll add that beach photo to the top right corner for you."
ALL code must go in the XML block!

WHEN USER UPLOADS AN IMAGE:
1. Save the image as a file in the project (e.g., "uploaded-image.png")
2. Use the uploaded image data (base64) as the file content
3. Reference this image file in your HTML/CSS code
4. Do NOT create placeholder images or generate new images
5. Use the exact image the user uploaded!

🚨🚨🚨 CRITICAL FINAL INSTRUCTION 🚨🚨🚨:
YOUR CONVERSATIONAL MESSAGE MUST BE EXACTLY LIKE THIS:
"Perfect! I'll create a nice green button for you."

THAT'S IT! NO CODE, NO JSON, NO HTML, NO CSS, NO JAVASCRIPT IN THE MESSAGE!
ALL CODE GOES IN THE XML BLOCK ONLY!
IF YOU PUT ANY CODE IN THE CONVERSATIONAL MESSAGE, YOU ARE FAILING!
THE CONVERSATIONAL MESSAGE IS ONLY FOR FRIENDLY CONVERSATION!`;

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
          processedMessages[0].content[0].text = `${systemPrompt}\n\n🚨🚨🚨 CRITICAL INSTRUCTION: Your response must be EXACTLY LIKE BOLT.NEW! The conversational message must be ONLY 1-2 sentences with NO CODE, NO JSON, NO HTML, NO TECHNICAL DETAILS. ONLY the XML block should contain code! Example: "Perfect! I'll add that beach photo to the top right corner for you." - that's it!\n\n🚨🚨🚨 NEVER PUT CODE IN THE CONVERSATIONAL MESSAGE! ONLY FRIENDLY CONVERSATION!\n\n🚨 IMAGE INSTRUCTION: If the user uploaded an image, you MUST use that uploaded image! Save it as a file and reference it in your code. Do NOT create new images!\n\n${processedMessages[0].content[0].text}`;
        } else {
          processedMessages[0].content = `${systemPrompt}\n\n🚨🚨🚨 CRITICAL INSTRUCTION: Your response must be EXACTLY LIKE BOLT.NEW! The conversational message must be ONLY 1-2 sentences with NO CODE, NO JSON, NO HTML, NO TECHNICAL DETAILS. ONLY the XML block should contain code! Example: "Perfect! I'll add that beach photo to the top right corner for you." - that's it!\n\n🚨🚨🚨 NEVER PUT CODE IN THE CONVERSATIONAL MESSAGE! ONLY FRIENDLY CONVERSATION!\n\n${processedMessages[0].content}`;
        }
      }
    } else {
      // Handle single message or string
      const messageContent = typeof messages === 'string' ? messages : messages?.content || '';
      
      if (image) {
        // Single message with image
        processedMessages = [{
          role: 'user',
          content: [
            {
              type: 'text',
              text: `${systemPrompt}\n\n🚨🚨🚨 CRITICAL INSTRUCTION: Your response must be EXACTLY LIKE BOLT.NEW! The conversational message must be ONLY 1-2 sentences with NO CODE, NO JSON, NO HTML, NO TECHNICAL DETAILS. ONLY the XML block should contain code! Example: "Perfect! I'll add that beach photo to the top right corner for you." - that's it!\n\n🚨🚨🚨 NEVER PUT CODE IN THE CONVERSATIONAL MESSAGE! ONLY FRIENDLY CONVERSATION!\n\n🚨 IMAGE INSTRUCTION: If the user uploaded an image, you MUST use that uploaded image! Save it as a file and reference it in your code. Do NOT create new images!\n\n${messageContent}`
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
        }];
      } else {
        // Single message without image
        processedMessages = [{
          role: 'user',
          content: `${systemPrompt}\n\n🚨🚨🚨 CRITICAL INSTRUCTION: Your response must be EXACTLY LIKE BOLT.NEW! The conversational message must be ONLY 1-2 sentences with NO CODE, NO JSON, NO HTML, NO TECHNICAL DETAILS. ONLY the XML block should contain code! Example: "Perfect! I'll add that beach photo to the top right corner for you." - that's it!\n\n🚨🚨🚨 NEVER PUT CODE IN THE CONVERSATIONAL MESSAGE! ONLY FRIENDLY CONVERSATION!\n\n🚨 IMAGE INSTRUCTION: If the user uploaded an image, you MUST use that uploaded image! Save it as a file and reference it in your code. Do NOT create new images!\n\n${messageContent}`
        }];
      }
    }

    console.log('🚀 Sending request to Claude with image:', !!image);
    
    const response = await anthropic.messages.create({
      model: model,
      max_tokens: 8000,
      messages: processedMessages
    });
    
    console.log('✅ Claude response received');

    const responseText = response.content[0].type === 'text' ? response.content[0].text : '';

    // Get real token usage from Claude API response
    const realTokensUsed = response.usage?.input_tokens + response.usage?.output_tokens || 0;
    
    console.log('📊 Real Claude API usage:', {
      inputTokens: response.usage?.input_tokens || 0,
      outputTokens: response.usage?.output_tokens || 0,
      totalTokens: realTokensUsed
    });

    // Track usage (async, don't wait for it)
    const { userId } = req.body;
    if (userId && realTokensUsed > 0) {
      fetch(`${process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : 'http://localhost:3000'}/api/usage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          actionType: 'chat_generation',
          tokensUsed: realTokensUsed, // Real tokens from Claude API
          metadata: { 
            language: language || 'react',
            inputTokens: response.usage?.input_tokens || 0,
            outputTokens: response.usage?.output_tokens || 0,
            model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514'
          }
        })
      }).catch(err => console.error('Failed to track usage:', err));
    }

    return res.status(200).json({ 
      response: responseText,
      usage: {
        inputTokens: response.usage?.input_tokens || 0,
        outputTokens: response.usage?.output_tokens || 0,
        totalTokens: realTokensUsed
      }
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
