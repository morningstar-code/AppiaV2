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
    const { method, body, query } = req;

    switch (method) {
      case 'POST':
        // Connect GitHub account
        const { userId, code, state } = body;

        if (!userId || !code) {
          return res.status(400).json({ error: 'Missing required fields' });
        }

        // Exchange code for access token
        const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            client_id: process.env.GITHUB_CLIENT_ID,
            client_secret: process.env.GITHUB_CLIENT_SECRET,
            code,
            state
          })
        });

        const tokenData = await tokenResponse.json();

        if (tokenData.error) {
          return res.status(400).json({ error: tokenData.error_description });
        }

        // Get user info from GitHub
        const userResponse = await fetch('https://api.github.com/user', {
          headers: {
            'Authorization': `token ${tokenData.access_token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        });

        const githubUser = await userResponse.json();

        // Save GitHub connection
        const githubConnection = await prisma.githubConnection.upsert({
          where: { userId },
          update: {
            githubId: githubUser.id,
            githubUsername: githubUser.login,
            accessToken: tokenData.access_token,
            connectedAt: new Date()
          },
          create: {
            userId,
            githubId: githubUser.id,
            githubUsername: githubUser.login,
            accessToken: tokenData.access_token,
            connectedAt: new Date()
          }
        });

        // Update user metadata in Clerk
        await clerkClient.users.updateUser(userId, {
          publicMetadata: {
            githubConnected: true,
            githubUsername: githubUser.login,
            githubId: githubUser.id
          }
        });

        return res.status(200).json({
          success: true,
          githubUser: {
            id: githubUser.id,
            username: githubUser.login,
            name: githubUser.name,
            avatar: githubUser.avatar_url,
            connectedAt: githubConnection.connectedAt
          }
        });

      case 'GET':
        // Get GitHub connection status
        const { userId: queryUserId } = query;

        if (!queryUserId || typeof queryUserId !== 'string') {
          return res.status(400).json({ error: 'userId is required' });
        }

        const connection = await prisma.githubConnection.findUnique({
          where: { userId: queryUserId }
        });

        if (!connection) {
          return res.status(200).json({ connected: false });
        }

        // Verify token is still valid
        try {
          const verifyResponse = await fetch('https://api.github.com/user', {
            headers: {
              'Authorization': `token ${connection.accessToken}`,
              'Accept': 'application/vnd.github.v3+json'
            }
          });

          if (!verifyResponse.ok) {
            // Token is invalid, mark as disconnected
            await prisma.githubConnection.update({
              where: { userId: queryUserId },
              data: { accessToken: null }
            });
            
            return res.status(200).json({ connected: false });
          }

          const githubUser = await verifyResponse.json();

          return res.status(200).json({
            connected: true,
            githubUser: {
              id: githubUser.id,
              username: githubUser.login,
              name: githubUser.name,
              avatar: githubUser.avatar_url,
              connectedAt: connection.connectedAt
            }
          });
        } catch (error) {
          console.error('GitHub token verification error:', error);
          return res.status(200).json({ connected: false });
        }

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('GitHub OAuth API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
