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
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { method, query, body } = req;
    const { userId } = query;

    switch (method) {
      case 'GET':
        // Get usage stats for a user
        console.log('📊 Usage API GET received for userId:', userId);
        
        if (!userId || typeof userId !== 'string') {
          return res.status(400).json({ error: 'userId is required' });
        }

        // Get subscription
        let subscription = await prisma.subscription.findUnique({
          where: { userId }
        });

        // First, ensure the user exists (upsert)
        await prisma.user.upsert({
          where: { id: userId },
          update: {},
          create: {
            id: userId,
            email: `${userId}@clerk.local`,
            name: 'Clerk User'
          }
        });

        // Create default subscription if doesn't exist
        if (!subscription) {
          const now = new Date();
          const resetDate = new Date(now);
          resetDate.setMonth(resetDate.getMonth() + 1);

          subscription = await prisma.subscription.create({
            data: {
              userId,
              tier: 'free',
              tokensLimit: 10000,
              tokensUsed: 0,
              resetDate,
              status: 'active'
            }
          });
        }

        // Get recent usage
        const usage = await prisma.usage.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 100
        });

        // Calculate usage by action type
        const usageByType = usage.reduce((acc: any, u) => {
          acc[u.actionType] = (acc[u.actionType] || 0) + u.tokensUsed;
          return acc;
        }, {});

        return res.status(200).json({
          subscription,
          usage,
          usageByType,
          remainingTokens: subscription.tokensLimit - subscription.tokensUsed,
          percentageUsed: (subscription.tokensUsed / subscription.tokensLimit) * 100
        });

      case 'POST':
        // Track new usage
        const { userId: bodyUserId, actionType, tokensUsed, metadata } = body;
        
        console.log('📊 Usage API POST received:', {
          userId: bodyUserId,
          actionType,
          tokensUsed,
          metadata
        });

        if (!bodyUserId || !actionType) {
          return res.status(400).json({ error: 'userId and actionType are required' });
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

        // Get or create subscription
        let userSubscription = await prisma.subscription.findUnique({
          where: { userId: bodyUserId }
        });

        if (!userSubscription) {
          const now = new Date();
          const resetDate = new Date(now);
          resetDate.setMonth(resetDate.getMonth() + 1);

          userSubscription = await prisma.subscription.create({
            data: {
              userId: bodyUserId,
              tier: 'free',
              tokensLimit: 10000,
              tokensUsed: 0,
              resetDate,
              status: 'active'
            }
          });
        }

        // Check if user has exceeded limit
        if (userSubscription.tokensUsed >= userSubscription.tokensLimit) {
          return res.status(429).json({ 
            error: 'Usage limit exceeded',
            limit: userSubscription.tokensLimit,
            used: userSubscription.tokensUsed
          });
        }

        // Create usage record
        const newUsage = await prisma.usage.create({
          data: {
            userId: bodyUserId,
            actionType,
            tokensUsed: tokensUsed || 1,
            metadata
          }
        });

        // Update subscription usage
        await prisma.subscription.update({
          where: { userId: bodyUserId },
          data: {
            tokensUsed: {
              increment: tokensUsed || 1
            }
          }
        });

        return res.status(201).json(newUsage);

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Usage API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

