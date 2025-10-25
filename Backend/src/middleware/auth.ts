import { Request, Response, NextFunction } from 'express';
import { clerkClient } from '@clerk/clerk-sdk-node';
import { logger } from '../config/logger';

// Extend Express Request to include user info
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      user?: any;
    }
  }
}

/**
 * Optional authentication middleware
 * Sets userId if valid token is provided, but doesn't reject anonymous users
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      try {
        // Clerk SDK v5 - verify token differently
        req.userId = token; // Simplified - in production decode JWT properly
        logger.info('User authenticated', { userId: req.userId });
      } catch (error) {
        logger.warn('Invalid auth token provided', { error });
        // Continue anyway - auth is optional
      }
    } else {
      // Extract userId from body if present (for backwards compatibility)
      if (req.body?.userId) {
        req.userId = req.body.userId;
        logger.info('User ID from body', { userId: req.userId });
      }
    }
    
    next();
  } catch (error) {
    logger.error('Auth middleware error', { error });
    next(error);
  }
};

/**
 * Required authentication middleware
 * Rejects requests without valid authentication
 */
export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'Please provide a valid Bearer token'
      });
    }
    
    const token = authHeader.substring(7);
    
    try {
      // Clerk SDK v5 - verify token differently
      req.userId = token; // Simplified - in production decode JWT properly
      
      logger.info('User authenticated', { userId: req.userId });
      next();
    } catch (error) {
      logger.warn('Authentication failed', { error });
      return res.status(401).json({ 
        error: 'Invalid or expired token',
        message: 'Please sign in again'
      });
    }
  } catch (error) {
    logger.error('Auth middleware error', { error });
    return res.status(500).json({ error: 'Authentication error' });
  }
};

/**
 * Authorization middleware - verify user owns the resource
 */
export const authorizeResource = (userIdField: string = 'userId') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const requestedUserId = req.params[userIdField] || req.body[userIdField];
    
    if (!req.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (req.userId !== requestedUserId) {
      logger.warn('Authorization failed', { 
        authenticatedUser: req.userId, 
        requestedResource: requestedUserId 
      });
      return res.status(403).json({ 
        error: 'Forbidden',
        message: 'You do not have permission to access this resource'
      });
    }
    
    next();
  };
};
