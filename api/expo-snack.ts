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
    const { files, name, description } = req.body;

    if (!files || typeof files !== 'object') {
      return res.status(400).json({ error: 'Files object is required' });
    }

    console.log('[Expo Snack] Creating snack with', Object.keys(files).length, 'files');

    // Call Expo Snack API from backend to avoid CORS
    const response = await fetch('https://snack.expo.dev/api/v2/snacks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: name || 'Appia Generated App',
        description: description || 'Created with Appia Builder',
        files,
        dependencies: {}, // Expo Snack auto-detects
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

    const data = await response.json();
    const snackUrl = `https://snack.expo.dev/${data.id}`;
    const embedUrl = `https://snack.expo.dev/embedded/@snack/${data.id}?preview=true&platform=ios`;

    console.log('[Expo Snack] ✅ Created:', snackUrl);

    return res.status(200).json({
      success: true,
      snackUrl,
      embedUrl,
      id: data.id
    });

  } catch (error: any) {
    console.error('[Expo Snack] Error:', error.message);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}
