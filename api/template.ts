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
        `You are an expert in ${language}. Generate a complete, production-ready web application.`,
        `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.`
      ],
      uiPrompts: [
        `You are an expert in ${language}. Generate a complete, production-ready web application.`
      ]
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error('Template error:', error);
    return res.status(500).json({ error: 'Failed to process template request' });
  }
}
