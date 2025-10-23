import type { VercelRequest, VercelResponse } from '@vercel/node';
import { put } from '@vercel/blob';
import { handleUpload } from '@vercel/blob';

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
    // Use Vercel Blob's handleUpload for proper multipart parsing
    const result = await handleUpload({
      request: req,
      onBeforeGenerateToken: async (pathname: string) => {
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        const fileExtension = pathname.split('.').pop()?.toLowerCase();
        const mimeType = `image/${fileExtension}`;
        
        if (!allowedTypes.includes(mimeType)) {
          throw new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.');
        }
        
        return {
          allowedContentTypes: allowedTypes,
          maximumSizeInBytes: 10 * 1024 * 1024, // 10MB
        };
      },
      onUploadCompleted: async ({ blob, token }) => {
        console.log('✅ Image uploaded to Vercel Blob:', blob.url);
        return {
          url: blob.url,
          filename: blob.pathname,
          size: blob.size,
          type: blob.contentType
        };
      }
    });

    return res.status(200).json(result);

  } catch (error: any) {
    console.error('❌ Upload error:', error);
    
    // Handle specific error types
    if (error.message.includes('Invalid file type')) {
      return res.status(400).json({ error: error.message });
    }
    if (error.message.includes('too large')) {
      return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
    }
    
    return res.status(500).json({ error: 'Upload failed' });
  }
}
