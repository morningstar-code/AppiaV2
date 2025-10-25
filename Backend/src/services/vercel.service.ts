import axios from 'axios';
import { logger } from '../config/logger';

export interface DeploymentFile {
  file: string;
  data: string;
}

export interface VercelDeploymentOptions {
  projectName: string;
  files: Record<string, string>;
  environmentVariables?: Record<string, string>;
  framework?: string;
}

export interface VercelDeploymentResult {
  success: boolean;
  url?: string;
  deploymentId?: string;
  error?: string;
}

export class VercelService {
  private readonly apiToken: string;
  private readonly apiUrl = 'https://api.vercel.com';
  
  constructor() {
    this.apiToken = process.env.VERCEL_TOKEN || '';
    
    if (!this.apiToken) {
      logger.warn('VERCEL_TOKEN not configured - deployments will fail');
    }
  }
  
  /**
   * Deploy a project to Vercel
   */
  async deploy(options: VercelDeploymentOptions): Promise<VercelDeploymentResult> {
    try {
      if (!this.apiToken) {
        return {
          success: false,
          error: 'Vercel API token not configured'
        };
      }
      
      logger.info('Starting Vercel deployment', { projectName: options.projectName });
      
      // Convert files to Vercel format
      const files: DeploymentFile[] = Object.entries(options.files).map(([path, content]) => ({
        file: path,
        data: Buffer.from(content).toString('base64')
      }));
      
      // Prepare deployment payload
      const payload: any = {
        name: options.projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        files,
        projectSettings: {
          framework: options.framework || 'vite'
        }
      };
      
      // Add environment variables if provided
      if (options.environmentVariables && Object.keys(options.environmentVariables).length > 0) {
        payload.env = options.environmentVariables;
      }
      
      // Create deployment
      const response = await axios.post(
        `${this.apiUrl}/v13/deployments`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      const deployment = response.data;
      
      logger.info('Vercel deployment created', {
        deploymentId: deployment.id,
        url: deployment.url
      });
      
      return {
        success: true,
        url: `https://${deployment.url}`,
        deploymentId: deployment.id
      };
      
    } catch (error: any) {
      logger.error('Vercel deployment failed', {
        error: error.message,
        response: error.response?.data,
        projectName: options.projectName
      });
      
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message || 'Deployment failed'
      };
    }
  }
  
  /**
   * Get deployment status
   */
  async getDeploymentStatus(deploymentId: string): Promise<any> {
    try {
      const response = await axios.get(
        `${this.apiUrl}/v13/deployments/${deploymentId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiToken}`
          }
        }
      );
      
      return response.data;
    } catch (error: any) {
      logger.error('Failed to get deployment status', {
        deploymentId,
        error: error.message
      });
      throw error;
    }
  }
  
  /**
   * List user's deployments
   */
  async listDeployments(projectName?: string): Promise<any[]> {
    try {
      const url = projectName
        ? `${this.apiUrl}/v6/deployments?projectId=${projectName}`
        : `${this.apiUrl}/v6/deployments`;
        
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`
        }
      });
      
      return response.data.deployments || [];
    } catch (error: any) {
      logger.error('Failed to list deployments', { error: error.message });
      return [];
    }
  }
  
  /**
   * Delete a deployment
   */
  async deleteDeployment(deploymentId: string): Promise<boolean> {
    try {
      await axios.delete(
        `${this.apiUrl}/v13/deployments/${deploymentId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiToken}`
          }
        }
      );
      
      logger.info('Deployment deleted', { deploymentId });
      return true;
    } catch (error: any) {
      logger.error('Failed to delete deployment', {
        deploymentId,
        error: error.message
      });
      return false;
    }
  }
}

export const vercelService = new VercelService();
