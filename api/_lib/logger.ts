// Simple console logger for Vercel serverless (Winston doesn't work well here)
// Logs are automatically captured by Vercel's logging system

export const logger = {
  info: (message: string, meta?: any) => {
    console.log(`[INFO] ${message}`, meta ? JSON.stringify(meta) : '');
  },
  
  warn: (message: string, meta?: any) => {
    console.warn(`[WARN] ${message}`, meta ? JSON.stringify(meta) : '');
  },
  
  error: (message: string, meta?: any) => {
    console.error(`[ERROR] ${message}`, meta ? JSON.stringify(meta) : '');
  }
};
