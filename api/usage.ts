import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';

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

      // Check if database is available
      if (!process.env.POSTGRES_URL) {
        console.log('[UsageAPI] Database not configured - returning default usage');
        return res.status(200).json({
          tier: 'free',
          tokensUsed: 0,
          tokensLimit: 108000,
          tokensRemaining: 108000,
          usagePercentage: 0
        });
      }

      console.log(`[UsageAPI] Fetching usage for user ${userId}`);
      
      // Get user's current usage
      const { rows: usageRows } = await sql`
        SELECT 
          tier,
          tokens_used,
          tokens_limit,
          (tokens_limit - tokens_used) as tokens_remaining,
          ROUND((tokens_used::float / tokens_limit::float) * 100, 2) as usage_percentage
        FROM users 
        WHERE user_id = ${userId}
      `;

      if (usageRows.length === 0) {
        // Create new user with free tier
        await sql`
          INSERT INTO users (user_id, tier, tokens_used, tokens_limit, created_at, updated_at)
          VALUES (${userId}, 'free', 0, 108000, NOW(), NOW())
        `;
        
        return res.status(200).json({
          tier: 'free',
          tokensUsed: 0,
          tokensLimit: 108000,
          tokensRemaining: 108000,
          usagePercentage: 0
        });
      }

      const usage = usageRows[0];
      return res.status(200).json({
        tier: usage.tier,
        tokensUsed: usage.tokens_used,
        tokensLimit: usage.tokens_limit,
        tokensRemaining: usage.tokens_remaining,
        usagePercentage: usage.usage_percentage
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

      // Check if database is available
      if (!process.env.POSTGRES_URL) {
        console.log('[UsageAPI] Database not configured - returning success without tracking');
        return res.status(200).json({ success: true, message: 'Database not configured' });
      }

      console.log(`[UsageAPI] Logging usage: ${tokensUsed} tokens for user ${userId}`);

      // Update user's token usage
      await sql`
        UPDATE users 
        SET tokens_used = tokens_used + ${tokensUsed}, updated_at = NOW()
        WHERE user_id = ${userId}
      `;

      // Log the usage event
      await sql`
        INSERT INTO usage_logs (user_id, action_type, tokens_used, metadata, created_at)
        VALUES (${userId}, ${actionType}, ${tokensUsed}, ${JSON.stringify(metadata || {})}, NOW())
      `;

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