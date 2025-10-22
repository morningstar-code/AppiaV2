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

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

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

  // Cloud Storage Methods (mock implementation)
  async saveProjectToCloud(project: SavedProject, user: User): Promise<SavedProject> {
    // Mock API call - replace with actual backend
    const response = await fetch('/api/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getAuthToken()}`
      },
      body: JSON.stringify({ ...project, userId: user.id })
    });
    
    if (!response.ok) throw new Error('Failed to save project to cloud');
    return response.json();
  }

  async getCloudProjects(user: User): Promise<SavedProject[]> {
    const response = await fetch('/api/projects', {
      headers: {
        'Authorization': `Bearer ${this.getAuthToken()}`
      }
    });
    
    if (!response.ok) throw new Error('Failed to fetch projects');
    return response.json();
  }

  async syncProjects(user: User): Promise<void> {
    const localProjects = this.getLocalProjects();
    const cloudProjects = await this.getCloudProjects(user);
    
    // Merge and sync logic here
    // This is a simplified version
    for (const localProject of localProjects) {
      try {
        await this.saveProjectToCloud(localProject, user);
      } catch (error) {
        console.error('Failed to sync project:', localProject.id, error);
      }
    }
  }

  // User Management
  saveUser(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  getCurrentUser(): User | null {
    const stored = localStorage.getItem(this.USER_KEY);
    if (!stored) return null;
    
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }

  clearUser(): void {
    localStorage.removeItem(this.USER_KEY);
  }

  // Auth Token Management
  private getAuthToken(): string | null {
    return localStorage.getItem('appiav2_auth_token');
  }

  setAuthToken(token: string): void {
    localStorage.setItem('appiav2_auth_token', token);
  }

  clearAuthToken(): void {
    localStorage.removeItem('appiav2_auth_token');
  }

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
