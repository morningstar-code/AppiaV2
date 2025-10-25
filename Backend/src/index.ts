require('dotenv').config();
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { logger } from './config/logger';
import templateRoutes from './routes/template';
import chatRoutes from './routes/chat';
import projectRoutes from './routes/projects';
import usageRoutes from './routes/usage';
import publishRoutes from './routes/publish';
import { config } from './config/environment';

const app = express();

// Security: Helmet for security headers
app.use(helmet({
  crossOriginEmbedderPolicy: false, // Allow WebContainer embedding
  contentSecurityPolicy: false // Disable for API, frontend handles this
}));

// CORS: Configure for production
app.use(cors({
  origin: [
    'https://appia-v2.vercel.app',
    'https://appia-v2-*.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting: Prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

const strictLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute for expensive operations
  message: 'Too many requests, please slow down'
});

app.use(limiter);
app.use(express.json({ limit: '10mb' }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  logger.info('Incoming request', {
    method: req.method,
    path: req.path,
    ip: req.ip
  });
  next();
});

// Health check
app.get('/', (req, res) => {
  res.json({ 
    message: 'AppiaV2 API is running!', 
    status: 'healthy',
    version: '2.0.0',
    timestamp: new Date().toISOString()
  });
});

// Setup routes
app.use('/template', templateRoutes);
app.use('/chat', strictLimiter, chatRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/usage', usageRoutes);
app.use('/api/publish', strictLimiter, publishRoutes);

// Global error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path
  });
  
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

// Export for Vercel serverless
export default app;

// Only listen if not in serverless environment
if (process.env.VERCEL !== '1') {
  app.listen(config.port, () => {
    logger.info(`AppiaV2 API running on port ${config.port}`);
    logger.info(`Environment: ${config.nodeEnv}`);
  });
}
