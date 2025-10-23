import type { VercelRequest, VercelResponse } from '@vercel/node';
import { put } from '@vercel/blob';
import Busboy from 'busboy';

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

  return new Promise<void>((resolve) => {
    try {
      // Parse multipart form data using Busboy
      const busboy = Busboy({ 
        headers: req.headers,
        limits: {
          fileSize: 10 * 1024 * 1024, // 10MB max
          files: 1 // Only one file
        }
      });

      let fileBuffer: Uint8Array | null = null;
      let fileName = '';
      let fileType = '';

      // Handle file upload
      busboy.on('file', (fieldname, file, info) => {
        const { filename, mimeType } = info;
        
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(mimeType)) {
          file.destroy();
          res.status(400).json({ error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.' });
          resolve();
          return;
        }

        fileName = filename;
        fileType = mimeType;

        // Collect file data
        const chunks: Uint8Array[] = [];
        file.on('data', (chunk) => {
          chunks.push(chunk);
        });

        file.on('end', () => {
          // Combine chunks into a single Uint8Array
          const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
          fileBuffer = new Uint8Array(totalLength);
          let offset = 0;
          for (const chunk of chunks) {
            fileBuffer.set(chunk, offset);
            offset += chunk.length;
          }
        });

        file.on('error', (err) => {
          console.error('File stream error:', err);
          res.status(500).json({ error: 'File upload failed' });
          resolve();
        });
      });

      // Handle form completion
      busboy.on('finish', async () => {
        if (!fileBuffer) {
          res.status(400).json({ error: 'No file provided' });
          resolve();
          return;
        }

        try {
          // Upload to Vercel Blob
          const blob = await put(fileName, fileBuffer.buffer, {
            access: 'public',
            contentType: fileType
          });

          console.log('✅ Image uploaded to Vercel Blob:', blob.url);

          res.status(200).json({
            url: blob.url,
            filename: fileName,
            size: fileBuffer.length,
            type: fileType
          });
          resolve();

        } catch (error) {
          console.error('❌ Blob upload error:', error);
          res.status(500).json({ error: 'Upload failed' });
          resolve();
        }
      });

      // Handle busboy errors
      busboy.on('error', (err) => {
        console.error('❌ Busboy error:', err);
        res.status(400).json({ error: 'Invalid form data' });
        resolve();
      });

      // Pipe the request to busboy
      req.pipe(busboy);

    } catch (error: any) {
      console.error('❌ Upload error:', error);
      res.status(500).json({ error: 'Upload failed' });
      resolve();
    }
  });
}
