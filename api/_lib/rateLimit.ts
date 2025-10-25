import type { VercelRequest, VercelResponse } from '@vercel/node';

// Simple in-memory rate limiting (works for serverless)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(maxRequests: number = 100, windowMs: number = 15 * 60 * 1000) {
  return (req: VercelRequest, res: VercelResponse): boolean => {
    const ip = req.headers['x-forwarded-for'] as string || 'unknown';
    const now = Date.now();
    
    const record = requestCounts.get(ip);
    
    if (!record || now > record.resetTime) {
      // New window
      requestCounts.set(ip, { count: 1, resetTime: now + windowMs });
      return true;
    }
    
    if (record.count >= maxRequests) {
      res.status(429).json({ 
        error: 'Too many requests', 
        message: 'Please try again later' 
      });
      return false;
    }
    
    record.count++;
    return true;
  };
}

// Cleanup old entries every hour
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of requestCounts.entries()) {
    if (now > record.resetTime) {
      requestCounts.delete(ip);
    }
  }
}, 60 * 60 * 1000);
