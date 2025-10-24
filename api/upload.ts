import { put } from '@vercel/blob';

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get('file') as File;
    if (!file) return new Response('No file', { status: 400 });

    // sanitize filename (no spaces → kebab-case)
    const base = file.name.replace(/\s+/g, '-').toLowerCase();
    const name = `uploads/${Date.now()}-${base}`;

    const blob = await put(name, file, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
      contentType: file.type,
      addRandomSuffix: false
    });

    console.log('[UploadAPI] Uploaded:', { name, url: blob.url, size: file.size, type: file.type });
    return Response.json({ url: blob.url });
  } catch (e) {
    console.error('[UploadAPI] Error:', e);
    return new Response('Upload failed', { status: 500 });
  }
}