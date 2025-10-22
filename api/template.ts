import type { VercelRequest, VercelResponse } from '@vercel/node';
import Anthropic from '@anthropic-ai/sdk';

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
    const { prompt, language = 'react' } = req.body;

    const response = {
      prompts: [
        `You are an expert in ${language}. Generate a complete, production-ready web application with Supabase integration like Bolt.new.

        DETECT DATABASE NEEDS: If the user mentions database, storage, user accounts, login, or backend functionality, automatically include Supabase integration.

        SUPABASE SETUP:
        - Always include @supabase/supabase-js in dependencies
        - Create .env.example with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
        - Set up authentication with Supabase Auth
        - Generate appropriate database tables and schema
        - Include real-time subscriptions for dynamic data
        - Add proper Row Level Security (RLS) policies

        DATABASE TEMPLATES:
        - Todo apps: todos table (id, user_id, text, completed, created_at)
        - Chat apps: rooms and messages tables with real-time updates
        - Blog apps: posts, categories, comments tables
        - E-commerce: products, cart, orders tables with relationships`,
        `CRITICAL: The package.json MUST include these scripts:
        {
          "scripts": {
            "dev": "vite",
            "build": "vite build",
            "preview": "vite preview"
          }
        }
        This is REQUIRED for the preview to work. Do not forget this!

        SUPABASE DEPENDENCIES:
        {
          "dependencies": {
            "@supabase/supabase-js": "^2.39.0"
          }
        }`,
        `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\nGenerate complete Supabase integration when database features are needed.`
      ],
      uiPrompts: [
        `You are an expert in ${language}. Generate a complete, production-ready web application with Vite.`
      ]
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error('Template error:', error);
    return res.status(500).json({ error: 'Failed to process template request' });
  }
}
