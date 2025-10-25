import { Router } from 'express';
import { validate, schemas } from '../middleware/validation';
import { optionalAuth } from '../middleware/auth';
import { logger } from '../config/logger';
import { vercelService } from '../services/vercel.service';
import { ErrorResponse } from '../types';

const router = Router();

/**
 * Deploy project to Vercel
 * POST /api/publish
 */
router.post('/', optionalAuth, validate(schemas.publishProject), async (req, res): Promise<void> => {
  try {
    const { projectName, files, environmentVariables, framework } = req.body;
    const userId = req.userId || req.body.userId;
    
    logger.info('Publishing project', { userId, projectName, fileCount: Object.keys(files).length });
    
    // Deploy to Vercel
    const result = await vercelService.deploy({
      projectName,
      files,
      environmentVariables,
      framework
    });
    
    if (result.success) {
      logger.info('Project published successfully', {
        userId,
        projectName,
        url: result.url,
        deploymentId: result.deploymentId
      });
      
      res.json({
        success: true,
        url: result.url,
        deploymentId: result.deploymentId,
        message: 'Project deployed successfully'
      });
    } else {
      logger.error('Deployment failed', { userId, projectName, error: result.error });
      
      res.status(500).json({
        success: false,
        error: result.error || 'Deployment failed'
      });
    }
    
  } catch (error: any) {
    logger.error('Publish route error', { error: error.message, body: req.body });
    const errorResponse: ErrorResponse = { 
      error: 'Failed to publish project',
      message: error.message 
    };
    res.status(500).json(errorResponse);
  }
});

/**
 * Get deployment status
 * GET /api/publish/:deploymentId
 */
router.get('/:deploymentId', optionalAuth, async (req, res) => {
  try {
    const { deploymentId } = req.params;
    
    const status = await vercelService.getDeploymentStatus(deploymentId);
    
    res.json({
      success: true,
      deployment: status
    });
    
  } catch (error: any) {
    logger.error('Get deployment status error', { error: error.message });
    const errorResponse: ErrorResponse = { error: 'Failed to get deployment status' };
    res.status(500).json(errorResponse);
  }
});

/**
 * Delete deployment
 * DELETE /api/publish/:deploymentId
 */
router.delete('/:deploymentId', optionalAuth, async (req, res) => {
  try {
    const { deploymentId } = req.params;
    const userId = req.userId || req.body.userId;
    
    logger.info('Deleting deployment', { userId, deploymentId });
    
    const deleted = await vercelService.deleteDeployment(deploymentId);
    
    if (deleted) {
      res.json({
        success: true,
        message: 'Deployment deleted successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to delete deployment'
      });
    }
    
  } catch (error: any) {
    logger.error('Delete deployment error', { error: error.message });
    const errorResponse: ErrorResponse = { error: 'Failed to delete deployment' };
    res.status(500).json(errorResponse);
  }
});

export default router;
