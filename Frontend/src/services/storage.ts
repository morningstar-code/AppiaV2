export interface SavedProject {
  id: string;
  name: string;
  description: string;
  language: string;
  prompt: string;
  code: string;
  files: { [key: string]: string };
  createdAt: Date;
  updatedAt: Date;
  isPublic: boolean;
}

// User interface removed - using Clerk for authentication

class StorageService {
  private readonly STORAGE_KEY = 'appiav2_projects';
  private readonly USER_KEY = 'appiav2_user';

  // Local Storage Methods
  saveProjectLocally(project: Omit<SavedProject, 'id' | 'createdAt' | 'updatedAt'>): SavedProject {
    const projects = this.getLocalProjects();
    const newProject: SavedProject = {
      ...project,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    projects.push(newProject);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(projects));
    return newProject;
  }

  getLocalProjects(): SavedProject[] {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (!stored) return [];
    
    try {
      return JSON.parse(stored).map((p: any) => ({
        ...p,
        createdAt: new Date(p.createdAt),
        updatedAt: new Date(p.updatedAt)
      }));
    } catch {
      return [];
    }
  }

  updateProjectLocally(id: string, updates: Partial<SavedProject>): boolean {
    const projects = this.getLocalProjects();
    const index = projects.findIndex(p => p.id === id);
    
    if (index === -1) return false;
    
    projects[index] = {
      ...projects[index],
      ...updates,
      updatedAt: new Date()
    };
    
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(projects));
    return true;
  }

  deleteProjectLocally(id: string): boolean {
    const projects = this.getLocalProjects();
    const filtered = projects.filter(p => p.id !== id);
    
    if (filtered.length === projects.length) return false;
    
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
    return true;
  }

  // Cloud Storage Methods (Production - uses Prisma backend)
  async saveProjectToCloud(project: SavedProject, userId: string): Promise<SavedProject> {
    const API_URL = import.meta.env.PROD ? '/api' : 'http://localhost:3000/api';
    
    const response = await fetch(`${API_URL}/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        name: project.name,
        description: project.description,
        language: project.language,
        prompt: project.prompt,
        code: project.code,
        files: project.files,
        isPublic: project.isPublic
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to save project to cloud');
    }
    return response.json();
  }

  async getCloudProjects(userId: string): Promise<SavedProject[]> {
    const API_URL = import.meta.env.PROD ? '/api' : 'http://localhost:3000/api';
    
    const response = await fetch(`${API_URL}/projects/${userId}`, {
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch projects');
    }
    return response.json();
  }

  async updateCloudProject(projectId: string, updates: Partial<SavedProject>): Promise<SavedProject> {
    const API_URL = import.meta.env.PROD ? '/api' : 'http://localhost:3000/api';
    
    const response = await fetch(`${API_URL}/projects/${projectId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update project');
    }
    return response.json();
  }

  async deleteCloudProject(projectId: string): Promise<void> {
    const API_URL = import.meta.env.PROD ? '/api' : 'http://localhost:3000/api';
    
    const response = await fetch(`${API_URL}/projects/${projectId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete project');
    }
  }

  async syncProjects(userId: string): Promise<void> {
    const localProjects = this.getLocalProjects();
    const cloudProjects = await this.getCloudProjects(userId);
    
    // Sync local projects to cloud
    for (const localProject of localProjects) {
      try {
        // Check if project already exists in cloud
        const existsInCloud = cloudProjects.some(cp => cp.id === localProject.id);
        if (!existsInCloud) {
          await this.saveProjectToCloud(localProject, userId);
        }
      } catch (error) {
        console.error('Failed to sync project:', localProject.id, error);
      }
    }
  }

  // User Management removed - using Clerk authentication

  // Utility Methods
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  exportProjects(): string {
    const projects = this.getLocalProjects();
    return JSON.stringify(projects, null, 2);
  }

  importProjects(jsonData: string): boolean {
    try {
      const projects = JSON.parse(jsonData);
      if (!Array.isArray(projects)) return false;
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(projects));
      return true;
    } catch {
      return false;
    }
  }
}

export const storageService = new StorageService();
