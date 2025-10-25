import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import { logger } from '../config/logger';

export const validate = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
      await schema.parseAsync(req.body);
      return next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.warn('Validation error', { errors: error.errors, path: req.path });
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
      return next(error);
    }
  };
};

// Common validation schemas
export const schemas = {
  chatMessage: z.object({
    messages: z.array(z.any()).optional(),
    userText: z.string().min(1).max(10000),
    language: z.string().optional(),
    userId: z.string().min(1),
    imageUrl: z.string().url().optional(),
    projectId: z.string().optional()
  }),

  createProject: z.object({
    userId: z.string().min(1),
    name: z.string().min(1).max(200),
    description: z.string().max(1000).optional(),
    language: z.string().default('react'),
    prompt: z.string().min(1),
    code: z.string().optional(),
    files: z.any().optional(),
    isPublic: z.boolean().default(false)
  }),

  updateProject: z.object({
    name: z.string().min(1).max(200).optional(),
    description: z.string().max(1000).optional(),
    language: z.string().optional(),
    prompt: z.string().optional(),
    code: z.string().optional(),
    files: z.any().optional(),
    isPublic: z.boolean().optional()
  }),

  usageTracking: z.object({
    userId: z.string().min(1),
    actionType: z.string().min(1),
    tokensUsed: z.number().int().positive(),
    metadata: z.any().optional()
  }),

  publishProject: z.object({
    projectId: z.string().optional(),
    userId: z.string().min(1),
    files: z.record(z.string()),
    projectName: z.string().min(1).max(200),
    environmentVariables: z.record(z.string()).optional(),
    framework: z.enum(['react', 'nextjs', 'vue', 'static']).optional()
  })
};
