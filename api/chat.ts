import type { VercelRequest, VercelResponse } from '@vercel/node';
import Anthropic from '@anthropic-ai/sdk';
import { supabaseTemplates } from '../Backend/src/supabase-templates.js';

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
    const { messages, language = 'react' } = req.body;

// System prompt for conversational AI like Bolt with Supabase integration
const systemPrompt = `You are Appia, a friendly AI pair programmer. Be conversational, helpful, and engaging like talking to a colleague.

CRITICAL: Your response MUST be in EXACTLY TWO parts:
1. A SHORT conversational message (MAX 2 sentences, like "Hey! I'll create that for you...")
2. The XML code block (ALL code goes in XML, NEVER in the message)

FORBIDDEN: 
- NEVER show code in your conversational message
- NEVER show package.json, HTML, CSS, or JS in the message
- NEVER show file contents outside of XML
- NEVER make the message longer than 2 sentences
- NEVER show any code snippets, file contents, or technical details in the chat message

REQUIRED XML format:
<boltArtifact id="project-code" title="Project Files">
  <boltAction type="file" filePath="path/to/file.ext">
file content here
  </boltAction>
</boltArtifact>

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

EXAMPLES OF CORRECT RESPONSES:

✅ GOOD:
"Hey! I'll create a blue button that turns green when clicked. Let me set that up for you!"

<bolt size="large" id="project-code" title="Project Files">
  <boltAction type="file" filePath="package.json">
{"name": "button-app", "scripts": {"dev": "vite"}}
  </boltAction>
  <boltAction type="file" filePath="index.html">
<!DOCTYPE html>...full HTML here...
  </boltAction>
</bolt>

❌ BAD (NEVER DO THIS):
"Hey! Here's your code: {package.json content} <!DOCTYPE html>...all the code..."

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
- The chat message should be like Bolt: short, friendly, and conversational only!`;

    // Handle different message formats
    let processedMessages;
    
    if (Array.isArray(messages)) {
      // Convert array of messages to Claude format with system prompt
      // Limit to last 3 messages to avoid context length issues
      const recentMessages = messages.slice(-3);
      processedMessages = recentMessages.map((msg: any) => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content || msg
      }));
      
      // Add system instructions to the first user message
      if (processedMessages.length > 0 && processedMessages[0].role === 'user') {
        processedMessages[0].content = `${systemPrompt}\n\nIMPORTANT: Your response must ONLY contain a short conversational message (max 2 sentences) followed by XML code block. NO CODE IN THE MESSAGE!\n\n${processedMessages[0].content}`;
      }
    } else {
      // Handle single message or string
      const messageContent = typeof messages === 'string' ? messages : messages?.content || '';
      processedMessages = [{
        role: 'user',
        content: `${systemPrompt}\n\nIMPORTANT: Your response must ONLY contain a short conversational message (max 2 sentences) followed by XML code block. NO CODE IN THE MESSAGE!\n\n${messageContent}`
      }];
    }

    const response = await anthropic.messages.create({
      model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      messages: processedMessages
    });

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
  } catch (error) {
    console.error('Chat error:', error);
    return res.status(500).json({ error: 'Failed to process chat request' });
  }
}
