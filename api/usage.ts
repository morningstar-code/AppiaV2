import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';
import { clerkClient } from '@clerk/clerk-sdk-node';

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

        try {
          // Get user from Clerk
          const clerkUser = await clerkClient.users.getUser(userId);
          
          // Get user's subscription from Clerk
          const subscription = clerkUser.publicMetadata?.subscription || {
            tier: 'free',
            tokensLimit: 108000, // 108k tokens like Bolt.new
            tokensUsed: 0,
            resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            status: 'active'
          };

          // Get recent usage from Prisma (still using Prisma for usage tracking)
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
            percentageUsed: (subscription.tokensUsed / subscription.tokensLimit) * 100,
            clerkUser: {
              id: clerkUser.id,
              email: clerkUser.emailAddresses[0]?.emailAddress,
              firstName: clerkUser.firstName,
              lastName: clerkUser.lastName
            }
          });
        } catch (clerkError) {
          console.error('❌ Clerk error:', clerkError);
          // Fallback to default free plan
          return res.status(200).json({
            subscription: {
              tier: 'free',
              tokensLimit: 108000, // 108k tokens like Bolt.new
              tokensUsed: 0,
              resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              status: 'active'
            },
            usage: [],
            usageByType: {},
            remainingTokens: 108000,
            percentageUsed: 0
          });
        }

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

        try {
          // Get user from Clerk
          const clerkUser = await clerkClient.users.getUser(bodyUserId);
          
          // Get user's subscription from Clerk
          let subscription = clerkUser.publicMetadata?.subscription || {
            tier: 'free',
            tokensLimit: 108000, // 108k tokens like Bolt.new
            tokensUsed: 0,
            resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            status: 'active'
          };

          // Check if user has exceeded limit
          if (subscription.tokensUsed >= subscription.tokensLimit) {
            return res.status(429).json({ 
              error: 'Usage limit exceeded',
              limit: subscription.tokensLimit,
              used: subscription.tokensUsed
            });
          }

          // Create usage record in Prisma
          const newUsage = await prisma.usage.create({
            data: {
              userId: bodyUserId,
              actionType,
              tokensUsed: tokensUsed || 1,
              metadata
            }
          });

          // Update subscription usage in Clerk
          const updatedSubscription = {
            ...subscription,
            tokensUsed: subscription.tokensUsed + (tokensUsed || 1)
          };

          await clerkClient.users.updateUser(bodyUserId, {
            publicMetadata: {
              ...clerkUser.publicMetadata,
              subscription: updatedSubscription
            }
          });

          return res.status(201).json({
            ...newUsage,
            subscription: updatedSubscription
          });
        } catch (clerkError) {
          console.error('❌ Clerk error in POST:', clerkError);
          return res.status(500).json({ error: 'Failed to update user subscription' });
        }

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Usage API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

