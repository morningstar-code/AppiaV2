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
      const { u: userId } = req.query;
      
      if (!userId || Array.isArray(userId)) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      console.log(`[ProjectsAPI] Fetching projects for user ${userId}`);
      
      const { rows } = await sql`
        SELECT id, name, description, language, prompt, code, files, is_public, created_at, updated_at
        FROM projects 
        WHERE user_id = ${userId}
        ORDER BY updated_at DESC
      `;

      return res.status(200).json(rows);
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

      const { rows } = await sql`
        INSERT INTO projects (user_id, name, description, language, prompt, code, files, is_public, created_at, updated_at)
        VALUES (${userId}, ${name}, ${description || ''}, ${language || 'react'}, ${prompt || ''}, ${code}, ${JSON.stringify(files || {})}, ${isPublic}, NOW(), NOW())
        RETURNING id, name, description, language, prompt, code, files, is_public, created_at, updated_at
      `;

      return res.status(201).json(rows[0]);
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

      const { rowCount } = await sql`
        DELETE FROM projects 
        WHERE id = ${id} AND user_id = ${userId}
      `;

      if (rowCount === 0) {
        return res.status(404).json({ error: 'Project not found' });
      }

      return res.status(200).json({ success: true });
    } catch (error: any) {
      console.error('[ProjectsAPI] Error:', error);
      return res.status(500).json({ error: 'Failed to delete project' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}