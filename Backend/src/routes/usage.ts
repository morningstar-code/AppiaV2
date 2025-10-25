import { Router } from 'express';
import { prisma } from '../services/database';
import { validate, schemas } from '../middleware/validation';
import { optionalAuth } from '../middleware/auth';
import { logger } from '../config/logger';
import { ErrorResponse } from '../types';

const router = Router();

/**
 * Track usage (token consumption)
 * POST /api/usage
 */
router.post('/', optionalAuth, validate(schemas.usageTracking), async (req, res): Promise<void> => {
  try {
    const { userId, actionType, tokensUsed, metadata } = req.body;
    
    logger.info('Tracking usage', { userId, actionType, tokensUsed });
    
    // Create usage record
    const usage = await prisma.usage.create({
      data: {
        userId,
        actionType,
        tokensUsed,
        metadata: metadata || {}
      }
    });
    
    // Update subscription token usage if exists
    try {
      const subscription = await prisma.subscription.findUnique({
        where: { userId }
      });
      
      if (subscription) {
        await prisma.subscription.update({
          where: { userId },
          data: {
            tokensUsed: {
              increment: tokensUsed
            }
          }
        });
        
        // Check if user exceeded limit
        const updatedSubscription = await prisma.subscription.findUnique({
          where: { userId }
        });
        
        if (updatedSubscription && updatedSubscription.tokensUsed >= updatedSubscription.tokensLimit) {
          logger.warn('User exceeded token limit', { 
            userId, 
            tokensUsed: updatedSubscription.tokensUsed, 
            tokensLimit: updatedSubscription.tokensLimit 
          });
        }
      }
    } catch (subError) {
      // Subscription tracking is optional, don't fail the request
      logger.warn('Subscription update failed', { userId, error: subError });
    }
    
    res.json({
      success: true,
      usage: {
        id: usage.id,
        tokensUsed: usage.tokensUsed,
        createdAt: usage.createdAt
      }
    });
    
  } catch (error) {
    logger.error('Usage tracking error', { error, body: req.body });
    const errorResponse: ErrorResponse = { error: 'Failed to track usage' };
    res.status(500).json(errorResponse);
  }
});

/**
 * Get usage statistics for a user
 * GET /api/usage/:userId
 */
router.get('/:userId', optionalAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get total usage
    const totalUsage = await prisma.usage.aggregate({
      where: { userId },
      _sum: {
        tokensUsed: true
      }
    });
    
    // Get current month usage
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const monthlyUsage = await prisma.usage.aggregate({
      where: {
        userId,
        createdAt: {
          gte: startOfMonth
        }
      },
      _sum: {
        tokensUsed: true
      }
    });
    
    // Get subscription info
    const subscription = await prisma.subscription.findUnique({
      where: { userId }
    });
    
    res.json({
      userId,
      totalTokensUsed: totalUsage._sum.tokensUsed || 0,
      monthlyTokensUsed: monthlyUsage._sum.tokensUsed || 0,
      subscription: subscription ? {
        tier: subscription.tier,
        limit: subscription.tokensLimit,
        used: subscription.tokensUsed,
        remaining: Math.max(0, subscription.tokensLimit - subscription.tokensUsed),
        resetDate: subscription.resetDate
      } : null
    });
    
  } catch (error) {
    logger.error('Usage retrieval error', { error, userId: req.params.userId });
    const errorResponse: ErrorResponse = { error: 'Failed to retrieve usage' };
    res.status(500).json(errorResponse);
  }
});

export default router;
