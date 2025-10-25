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

  if (req.method === 'POST') {
    try {
      const { userId, projectName, files } = req.body;
      
      if (!userId || !projectName || !files) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const postgres = await import('@vercel/postgres').catch(() => null);
      const sql = postgres?.sql;
      if (!sql) {
        console.log('[DeployAPI] Database not available - cannot deploy');
        return res.status(503).json({ error: 'Database not available' });
      }

      // Get user's Vercel access token
      const { rows } = await sql`
        SELECT access_token FROM user_vercel_tokens WHERE user_id = ${userId}
      `;

      if (rows.length === 0) {
        return res.status(401).json({ error: 'Vercel account not connected' });
      }

      const accessToken = rows[0].access_token;

      // Create a simple project structure for Vercel
      const projectFiles = Object.entries(files).map(([path, content]) => ({
        path,
        content: content as string
      }));

      // Upload to Vercel using their API
      const formData = new FormData();
      formData.append('name', projectName);
      
      // Add files to form data
      projectFiles.forEach(({ path, content }) => {
        formData.append(`files[${path}]`, content);
      });

      const deployResponse = await fetch('https://api.vercel.com/v13/deployments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        body: formData,
      });

      if (!deployResponse.ok) {
        const errorText = await deployResponse.text();
        throw new Error(`Vercel deployment failed: ${errorText}`);
      }

      const deployData = await deployResponse.json() as any;
      const deploymentUrl = `https://${deployData.url}`;

      // Store deployment info
      await sql`
        INSERT INTO user_deployments (user_id, project_name, deployment_id, deployment_url, created_at)
        VALUES (${userId}, ${projectName}, ${deployData.id}, ${deploymentUrl}, NOW())
      `;

      return res.status(200).json({
        success: true,
        deploymentUrl,
        deploymentId: deployData.id,
        message: 'Project deployed successfully to Vercel'
      });
    } catch (error: any) {
      console.error('[VercelDeploy] Error:', error);
      return res.status(500).json({ error: 'Deployment failed', details: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
