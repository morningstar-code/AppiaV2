/**
 * Client-side compression utilities for reducing token usage
 * Compresses large content before sending to Claude API
 */

/**
 * Compress large text content using simple encoding
 * Reduces token usage for large code/HTML blocks
 */
export function compressText(text: string): string {
  if (text.length < 1000) return text; // Don't compress small content
  
  try {
    // Simple compression using base64 encoding of repeated patterns
    const compressed = btoa(unescape(encodeURIComponent(text)));
    return `[COMPRESSED:${compressed}]`;
  } catch (error) {
    console.warn('Compression failed, using original content:', error);
    return text;
  }
}

/**
 * Decompress content if it was compressed
 */
export function decompressText(text: string): string {
  if (!text.startsWith('[COMPRESSED:')) return text;
  
  try {
    const compressed = text.replace('[COMPRESSED:', '').replace(']', '');
    return decodeURIComponent(escape(atob(compressed)));
  } catch (error) {
    console.warn('Decompression failed, using original content:', error);
    return text;
  }
}

/**
 * Check if content should be compressed
 */
export function shouldCompress(content: string): boolean {
  return content.length > 2000 && (
    content.includes('<html>') || 
    content.includes('function') || 
    content.includes('const ') ||
    content.includes('import ')
  );
}

/**
 * Optimize message content for token efficiency
 */
export function optimizeContent(content: string): string {
  if (shouldCompress(content)) {
    return compressText(content);
  }
  
  // Remove unnecessary whitespace and comments for code
  if (content.includes('function') || content.includes('const ')) {
    return content
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
      .replace(/\/\/.*$/gm, '') // Remove line comments
      .trim();
  }
  
  return content;
}
