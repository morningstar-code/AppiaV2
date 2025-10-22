import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

const globalForPrisma = globalThis as unknown as {
  prisma: any;
};

export const prisma = globalForPrisma.prisma ?? 
  (new PrismaClient() as any).$extends(withAccelerate());

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { method, query, body } = req;
    const { userId, promptId } = query;

    switch (method) {
      case 'GET':
        // Get all saved prompts for a user
        if (userId && typeof userId === 'string') {
          const prompts = await prisma.savedPrompt.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 50 // Limit to last 50 prompts
          });
          return res.status(200).json(prompts);
        }
        return res.status(400).json({ error: 'userId is required' });

      case 'POST':
        // Save a new prompt
        const { userId: bodyUserId, prompt, language } = body;

        if (!bodyUserId || !prompt) {
          return res.status(400).json({ error: 'userId and prompt are required' });
        }

        // First, ensure the user exists (upsert)
        await prisma.user.upsert({
          where: { id: bodyUserId },
          update: {},
          create: {
            id: bodyUserId,
            email: `${bodyUserId}@clerk.local`,
            name: 'Clerk User'
          }
        });

        const newPrompt = await prisma.savedPrompt.create({
          data: {
            userId: bodyUserId,
            prompt,
            language: language || 'react'
          }
        });

        return res.status(201).json(newPrompt);

      case 'DELETE':
        // Delete a saved prompt
        if (!promptId || typeof promptId !== 'string') {
          return res.status(400).json({ error: 'promptId is required' });
        }

        await prisma.savedPrompt.delete({
          where: { id: promptId }
        });

        return res.status(200).json({ success: true });

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Prompts API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

