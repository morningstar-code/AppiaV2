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

interface PublishRequest {
  userId: string;
  projectId?: string;
  domain: string;
  customDomain?: string;
  seoBoost?: boolean;
  files: any[];
}

interface HostingStats {
  bandwidth: number;
  requests: number;
  limit: number;
  resetDate: Date;
}

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
    const { method, body } = req;

    switch (method) {
      case 'POST':
        // Publish project
        const { userId, projectId, domain, customDomain, seoBoost, files }: PublishRequest = body;

        if (!userId || !domain || !files) {
          return res.status(400).json({ error: 'Missing required fields' });
        }

        // Get user subscription from Clerk
        const clerkUser = await clerkClient.users.getUser(userId);
        const subscription = clerkUser.publicMetadata?.subscription || {
          tier: 'free',
          tokensLimit: 108000,
          tokensUsed: 0,
          resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: 'active'
        };

        // Check if user has Pro plan for custom domain and SEO boost
        if ((customDomain || seoBoost) && subscription.tier !== 'pro') {
          return res.status(403).json({ 
            error: 'Custom domains and SEO boost require Pro plan',
            requiredPlan: 'pro'
          });
        }

        // Generate unique domain if not provided
        const finalDomain = domain.includes('.appia.host') ? domain : `${domain}.appia.host`;

        // Create hosting record
        const hosting = await prisma.hosting.create({
          data: {
            userId,
            projectId: projectId || null,
            domain: finalDomain,
            customDomain: customDomain || null,
            seoBoost: seoBoost || false,
            status: 'active',
            files: JSON.stringify(files),
            publishedAt: new Date(),
            tier: subscription.tier,
            bandwidthUsed: 0,
            requestsUsed: 0,
            bandwidthLimit: subscription.tier === 'pro' ? 30000 : 10000, // MB
            requestsLimit: subscription.tier === 'pro' ? 1000000 : 333333,
            resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          }
        });

        console.log('🚀 Project published:', {
          domain: finalDomain,
          customDomain,
          seoBoost,
          tier: subscription.tier
        });

        return res.status(200).json({
          success: true,
          hosting: {
            id: hosting.id,
            domain: finalDomain,
            customDomain,
            seoBoost,
            publishedAt: hosting.publishedAt,
            url: `https://${finalDomain}`,
            tier: subscription.tier
          }
        });

      case 'GET':
        // Get hosting stats for user
        const { userId: queryUserId } = req.query;

        if (!queryUserId || typeof queryUserId !== 'string') {
          return res.status(400).json({ error: 'userId is required' });
        }

        // Get user's hosting records
        const hostings = await prisma.hosting.findMany({
          where: { userId: queryUserId },
          orderBy: { publishedAt: 'desc' }
        });

        // Calculate total usage
        const totalUsage = hostings.reduce((acc, hosting) => ({
          bandwidth: acc.bandwidth + hosting.bandwidthUsed,
          requests: acc.requests + hosting.requestsUsed,
          limit: Math.max(acc.limit, hosting.bandwidthLimit),
          requestsLimit: Math.max(acc.requestsLimit, hosting.requestsLimit)
        }), { bandwidth: 0, requests: 0, limit: 0, requestsLimit: 0 });

        // Get user subscription
        const user = await clerkClient.users.getUser(queryUserId);
        const userSubscription = user.publicMetadata?.subscription || {
          tier: 'free',
          tokensLimit: 108000,
          tokensUsed: 0,
          resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: 'active'
        };

        return res.status(200).json({
          hostings: hostings.map(h => ({
            id: h.id,
            domain: h.domain,
            customDomain: h.customDomain,
            seoBoost: h.seoBoost,
            status: h.status,
            publishedAt: h.publishedAt,
            url: `https://${h.domain}`,
            bandwidthUsed: h.bandwidthUsed,
            requestsUsed: h.requestsUsed,
            bandwidthLimit: h.bandwidthLimit,
            requestsLimit: h.requestsLimit
          })),
          stats: {
            totalBandwidth: totalUsage.bandwidth,
            totalRequests: totalUsage.requests,
            bandwidthLimit: totalUsage.limit,
            requestsLimit: totalUsage.requestsLimit,
            bandwidthRemaining: Math.max(0, totalUsage.limit - totalUsage.bandwidth),
            requestsRemaining: Math.max(0, totalUsage.requestsLimit - totalUsage.requests),
            resetDate: userSubscription.resetDate
          },
          subscription: userSubscription
        });

      case 'DELETE':
        // Unpublish project
        const { hostingId } = body;

        if (!hostingId) {
          return res.status(400).json({ error: 'hostingId is required' });
        }

        await prisma.hosting.update({
          where: { id: hostingId },
          data: { status: 'unpublished' }
        });

        return res.status(200).json({ success: true });

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Hosting API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
