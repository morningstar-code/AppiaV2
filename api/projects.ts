import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

// Initialize Prisma with Accelerate extension
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
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { method, query, body } = req;
    const { userId, projectId } = query;

    switch (method) {
      case 'GET':
        // Fetch a single project when projectId is provided
        if (projectId && typeof projectId === 'string') {
          const project = await prisma.project.findUnique({
            where: { id: projectId }
          });

          if (!project) {
            return res.status(404).json({ error: 'Project not found' });
          }

          if (userId && typeof userId === 'string' && project.userId !== userId) {
            return res.status(403).json({ error: 'Not authorized to access this project' });
          }

          return res.status(200).json(project);
        }

        // Get all projects for a user
        if (userId && typeof userId === 'string') {
          const projects = await prisma.project.findMany({
            where: { userId },
            orderBy: { updatedAt: 'desc' }
          });
          return res.status(200).json(projects);
        }
        return res.status(400).json({ error: 'userId is required' });

      case 'POST':
        // Create a new project
        const { userId: bodyUserId, name, description, language, prompt, code, files, isPublic } = body;

        if (!bodyUserId || !name || !prompt) {
          return res.status(400).json({ error: 'userId, name, and prompt are required' });
        }

        // First, ensure the user exists (upsert)
        await prisma.user.upsert({
          where: { id: bodyUserId },
          update: {
            // Update with real data if available
            email: body.email || `${bodyUserId}@clerk.local`,
            name: body.userName || 'Clerk User'
          },
          create: {
            id: bodyUserId,
            email: body.email || `${bodyUserId}@clerk.local`,
            name: body.userName || 'Clerk User'
          }
        });

        const newProject = await prisma.project.create({
          data: {
            userId: bodyUserId,
            name,
            description: description || '',
            language: language || 'react',
            prompt,
            code: code || '',
            files: files || {},
            isPublic: isPublic || false
          }
        });

        return res.status(201).json(newProject);

      case 'PUT':
        // Update a project
        if (!projectId || typeof projectId !== 'string') {
          return res.status(400).json({ error: 'projectId is required' });
        }

        const updates = body;
        const updatedProject = await prisma.project.update({
          where: { id: projectId },
          data: updates
        });

        return res.status(200).json(updatedProject);

      case 'DELETE':
        // Delete a project
        if (!projectId || typeof projectId !== 'string') {
          return res.status(400).json({ error: 'projectId is required' });
        }

        await prisma.project.delete({
          where: { id: projectId }
        });

        return res.status(200).json({ success: true });

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Projects API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
