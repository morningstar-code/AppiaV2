import type { VercelRequest, VercelResponse } from '@vercel/node';
import { clerkClient } from '@clerk/clerk-sdk-node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    console.log('🔧 Setting up user with free plan:', userId);

    // Get user from Clerk
    const clerkUser = await clerkClient.users.getUser(userId);
    
    // Check if user already has subscription metadata
    if (clerkUser.publicMetadata?.subscription) {
      console.log('✅ User already has subscription:', clerkUser.publicMetadata.subscription);
      return res.status(200).json({
        message: 'User already has subscription',
        subscription: clerkUser.publicMetadata.subscription
      });
    }

    // Create default free plan subscription
    const freePlan = {
      tier: 'free',
      tokensLimit: 108000, // 108k tokens like Bolt.new
      tokensUsed: 0,
      resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      status: 'active',
      createdAt: new Date().toISOString(),
      planKey: 'free_user'
    };

    // Update user with free plan
    await clerkClient.users.updateUser(userId, {
      publicMetadata: {
        ...clerkUser.publicMetadata,
        subscription: freePlan
      }
    });

    console.log('✅ User set up with free plan successfully');

    return res.status(200).json({
      message: 'User set up with free plan successfully',
      subscription: freePlan
    });

  } catch (error) {
    console.error('❌ User setup error:', error);
    return res.status(500).json({ error: 'Failed to set up user' });
  }
}
