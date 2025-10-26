import type { VercelRequest, VercelResponse } from '@vercel/node';

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
      const { userId, u } = req.query;
      const userIdValue = userId || u;
      
      if (!userIdValue || Array.isArray(userIdValue)) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      console.log(`[ProjectsAPI] Fetching projects for user ${userIdValue}`);
      
      const postgres = await import('@vercel/postgres').catch(() => null);
      if (!postgres) {
        console.log('[ProjectsAPI] Database not available - returning empty projects');
        return res.status(200).json([]);
      }
      
      // Use createClient for direct connections (handles both pooled and direct)
      const client = postgres.createClient();
      await client.connect();
      
      try {
        const { rows } = await client.query(
          'SELECT id, name, description, language, prompt, code, files, is_public, created_at, updated_at FROM projects WHERE user_id = $1 ORDER BY updated_at DESC',
          [userIdValue]
        );
        await client.end();
        return res.status(200).json(rows);
      } catch (queryError) {
        await client.end();
        throw queryError;
      }

    } catch (error: any) {
      console.error('[ProjectsAPI] Error:', error);
      return res.status(500).json({ error: 'Failed to fetch projects' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { userId, name, description, language, prompt, code, files, isPublic = false } = req.body;
      
      if (!userId || !name || !code) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      console.log(`[ProjectsAPI] Creating project for user ${userId}`);

      const postgres = await import('@vercel/postgres').catch(() => null);
      if (!postgres) {
        console.log('[ProjectsAPI] Database not available - cannot create project');
        return res.status(503).json({ error: 'Database not available' });
      }

      const client = postgres.createClient();
      await client.connect();
      
      try {
        const { rows } = await client.query(
          'INSERT INTO projects (user_id, name, description, language, prompt, code, files, is_public, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()) RETURNING id, name, description, language, prompt, code, files, is_public, created_at, updated_at',
          [userId, name, description || '', language || 'react', prompt || '', code, JSON.stringify(files || {}), isPublic]
        );
        await client.end();
        return res.status(201).json(rows[0]);
      } catch (queryError) {
        await client.end();
        throw queryError;
      }
    } catch (error: any) {
      console.error('[ProjectsAPI] Error:', error);
      return res.status(500).json({ error: 'Failed to create project' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { id } = req.query;
      const { userId } = req.body;

      if (!id || Array.isArray(id) || !userId) {
        return res.status(400).json({ error: 'Project ID and User ID are required' });
      }

      console.log(`[ProjectsAPI] Deleting project ${id} for user ${userId}`);

      const postgres = await import('@vercel/postgres').catch(() => null);
      if (!postgres) {
        console.log('[ProjectsAPI] Database not available - cannot delete project');
        return res.status(503).json({ error: 'Database not available' });
      }

      const client = postgres.createClient();
      await client.connect();
      
      try {
        const result = await client.query(
          'DELETE FROM projects WHERE id = $1 AND user_id = $2',
          [id, userId]
        );
        await client.end();
        
        if (result.rowCount === 0) {
          return res.status(404).json({ error: 'Project not found' });
        }

        return res.status(200).json({ success: true });
      } catch (queryError) {
        await client.end();
        throw queryError;
      }
    } catch (error: any) {
      console.error('[ProjectsAPI] Error:', error);
      return res.status(500).json({ error: 'Failed to delete project' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}