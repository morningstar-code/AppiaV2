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

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check if this is an Expo Snack request (JSON payload)
    const contentType = req.headers['content-type'] || '';
    
    if (contentType.includes('application/json')) {
      // Expo Snack creation
      const { files, name, description } = req.body;

      if (!files || typeof files !== 'object') {
        return res.status(400).json({ error: 'Files object is required' });
      }

      console.log('[Expo Snack] Creating snack with', Object.keys(files).length, 'files');

      // Use Expo Snack's save endpoint instead of direct creation
      const response = await fetch('https://snack.expo.dev/--/api/v2/snacks', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Snack-Api-Version': '3.0.0'
        },
        body: JSON.stringify({
          manifest: {
            name: name || 'Appia Generated App',
            description: description || 'Created with Appia Builder',
            sdkVersion: '48.0.0'
          },
          code: files,
          dependencies: {}
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Expo Snack] API error:', response.status, errorText);
        return res.status(response.status).json({ 
          error: 'Failed to create Expo Snack',
          details: errorText 
        });
      }

      const data = await response.json() as { id: string };
      const snackUrl = `https://snack.expo.dev/${data.id}`;
      const embedUrl = `https://snack.expo.dev/embedded/@snack/${data.id}?preview=true&platform=ios`;

      console.log('[Expo Snack] ✅ Created:', snackUrl);

      return res.status(200).json({
        success: true,
        snackUrl,
        embedUrl,
        id: data.id
      });
    } 
    
    // File upload (multipart/form-data)
    else if (contentType.includes('multipart/form-data')) {
      // Note: Vercel serverless functions don't natively support FormData parsing
      // Using a simple base64 approach for now
      const { file, filename } = req.body;
      
      if (!file) {
        return res.status(400).json({ error: 'No file provided' });
      }

      // For now, return a data URL (client can use this directly)
      // In production, you'd upload to a proper storage service
      const dataUrl = `data:image/png;base64,${file}`;
      
      console.log('[Upload] File uploaded:', filename);
      return res.status(200).json({ 
        url: dataUrl,
        filename: filename || 'uploaded-file'
      });
    }
    
    else {
      return res.status(400).json({ 
        error: 'Invalid content type. Use application/json for Expo Snack or multipart/form-data for file uploads.' 
      });
    }
  } catch (error: any) {
    console.error('[Upload API] Error:', error.message);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}
