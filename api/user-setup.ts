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

  if (req.method === 'POST') {
    try {
      const { userId, email, firstName, lastName } = req.body;

      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      console.log(`[UserSetupAPI] Setting up user ${userId} with free tier`);

      // Check if user already exists
      const { rows: existingUsers } = await sql`
        SELECT user_id FROM users WHERE user_id = ${userId}
      `;

      if (existingUsers.length > 0) {
        return res.status(200).json({ 
          success: true, 
          message: 'User already exists',
          tier: 'free',
          tokensLimit: 108000
        });
      }

      // Create new user with free tier
      await sql`
        INSERT INTO users (user_id, email, first_name, last_name, tier, tokens_used, tokens_limit, created_at, updated_at)
        VALUES (${userId}, ${email || ''}, ${firstName || ''}, ${lastName || ''}, 'free', 0, 108000, NOW(), NOW())
      `;

      return res.status(200).json({ 
        success: true, 
        message: 'User setup completed',
        tier: 'free',
        tokensLimit: 108000
      });
    } catch (error: any) {
      console.error('[UserSetupAPI] Error:', error);
      return res.status(500).json({ error: 'Failed to setup user' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}