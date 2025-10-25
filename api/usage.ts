import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from './lib/prisma';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      const { userId } = req.query;
      
      if (!userId || Array.isArray(userId)) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      console.log(`[UsageAPI] Fetching usage for user ${userId}`);
      
      // Get user's subscription or create if doesn't exist
      let subscription = await prisma.subscription.findUnique({
        where: { userId }
      });
      
      if (!subscription) {
        console.log('[UsageAPI] Creating new subscription for user');
        subscription = await prisma.subscription.create({
          data: {
            userId,
            tier: 'free',
            tokensLimit: 108000,
            tokensUsed: 0,
            resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
          }
        });
      } else if (subscription.tier === 'free' && subscription.tokensLimit !== 108000) {
        // Fix legacy free tier users with wrong limit
        console.log('[UsageAPI] Fixing token limit for free tier user:', subscription.tokensLimit, '→ 108000');
        subscription = await prisma.subscription.update({
          where: { userId },
          data: { tokensLimit: 108000 }
        });
      }
      
      const tokensRemaining = subscription.tokensLimit - subscription.tokensUsed;
      const usagePercentage = (subscription.tokensUsed / subscription.tokensLimit) * 100;

      return res.status(200).json({
        tier: subscription.tier,
        tokensUsed: subscription.tokensUsed,
        tokensLimit: subscription.tokensLimit,
        tokensRemaining,
        usagePercentage: Math.round(usagePercentage * 100) / 100
      });
    } catch (error: any) {
      console.error('[UsageAPI] Error:', error);
      return res.status(500).json({ error: 'Failed to fetch usage data' });
    }
  }

  if (req.method === 'POST') {
    try {
      console.log('[UsageAPI] Raw request body:', JSON.stringify(req.body, null, 2));
      
      const { userId, actionType, tokensUsed: rawTokensUsed, metadata } = req.body;

      // Strong validation with detailed error messages
      if (!userId) {
        console.log('[UsageAPI] Missing userId');
        return res.status(400).json({ error: 'Missing userId field' });
      }
      
      if (!actionType) {
        console.log('[UsageAPI] Missing actionType');
        return res.status(400).json({ error: 'Missing actionType field' });
      }
      
      // Handle undefined tokensUsed by defaulting to 0
      let tokensUsed = rawTokensUsed;
      if (tokensUsed === undefined || tokensUsed === null) {
        console.log('[UsageAPI] tokensUsed is undefined, defaulting to 0');
        tokensUsed = 0;
      }
      
      if (typeof tokensUsed !== 'number' || tokensUsed < 0) {
        console.log('[UsageAPI] Invalid tokensUsed:', tokensUsed);
        return res.status(400).json({ error: 'tokensUsed must be a positive number' });
      }

      console.log(`[UsageAPI] Valid request: userId=${userId}, actionType=${actionType}, tokensUsed=${tokensUsed}`);
      console.log(`[UsageAPI] Logging usage: ${tokensUsed} tokens for user ${userId}`);

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

      // Check if user would exceed limit
      const newTotal = subscription.tokensUsed + tokensUsed;
      if (newTotal > subscription.tokensLimit) {
        console.log(`[UsageAPI] ⚠️ User ${userId} would exceed limit: ${newTotal}/${subscription.tokensLimit}`);
        return res.status(429).json({ 
          success: false,
          error: 'Token limit exceeded',
          tokensUsed: subscription.tokensUsed,
          tokensLimit: subscription.tokensLimit
        });
      }

      // Update subscription token usage
      await prisma.subscription.update({
        where: { userId },
        data: {
          tokensUsed: { increment: tokensUsed },
          updatedAt: new Date()
        }
      });

      // Log the usage event
      await prisma.usage.create({
        data: {
          userId,
          actionType,
          tokensUsed,
          metadata: metadata || {}
        }
      });

      console.log('[UsageAPI] Usage logged successfully');
      return res.status(200).json({ success: true });
    } catch (error: any) {
      console.error('[UsageAPI] Error:', error);
      // Always return 200 in dev to prevent UI crashes
      return res.status(200).json({ success: false, error: 'Failed to log usage' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}