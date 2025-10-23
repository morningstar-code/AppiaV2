// Project Management System
class ProjectManager {
    constructor() {
        this.projects = this.loadProjects();
        this.currentProjectId = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.showMyProjects();
        this.renderProjects();
    }

    setupEventListeners() {
        // New project form
        document.getElementById('new-project-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createProject();
        });

        // Project notes auto-save
        document.getElementById('project-notes').addEventListener('input', (e) => {
            this.saveProjectNotes(e.target.value);
        });
    }

    // Navigation functions
    showHome() {
        this.hideAllViews();
        document.getElementById('home-view').style.display = 'block';
        this.updateNavLinks('home');
    }

    showMyProjects() {
        this.hideAllViews();
        document.getElementById('my-projects-view').style.display = 'block';
        this.updateNavLinks('projects');
        this.renderProjects();
    }

    showNewProject() {
        this.hideAllViews();
        document.getElementById('new-project-view').style.display = 'block';
        this.updateNavLinks('new');
        // Clear form
        document.getElementById('new-project-form').reset();
    }

    showProjectDetail(projectId) {
        this.hideAllViews();
        document.getElementById('project-detail-view').style.display = 'block';
        this.updateNavLinks('detail');
        this.loadProjectDetail(projectId);
    }

    hideAllViews() {
        const views = document.querySelectorAll('.view');
        views.forEach(view => view.style.display = 'none');
    }

    updateNavLinks(active) {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => link.classList.remove('active'));
        
        if (active === 'projects') {
            document.querySelector('a[onclick="showMyProjects()"]').classList.add('active');
        } else if (active === 'new') {
            document.querySelector('a[onclick="showNewProject()"]').classList.add('active');
        } else if (active === 'home') {
            document.querySelector('a[onclick="showHome()"]').classList.add('active');
        }
    }

    // Project CRUD operations
    createProject() {
        const name = document.getElementById('project-name').value.trim();
        const description = document.getElementById('project-description').value.trim();

        if (!name) {
            alert('Please enter a project name');
            return;
        }

        const project = {
            id: Date.now().toString(),
            name: name,
            description: description,
            createdAt: new Date().toISOString(),
            lastModified: new Date().toISOString(),
            notes: ''
        };

        this.projects.push(project);
        this.saveProjects();
        this.showMyProjects();
        
        // Show success message
        this.showNotification('Project created successfully!', 'success');
    }

    loadProjectDetail(projectId) {
        const project = this.projects.find(p => p.id === projectId);
        if (!project) {
            this.showNotification('Project not found', 'error');
            this.showMyProjects();
            return;
        }

        this.currentProjectId = projectId;
        
        // Update project detail view
        document.getElementById('project-detail-title').textContent = project.name;
        document.getElementById('project-detail-name').textContent = project.name;
        document.getElementById('project-detail-description').textContent = project.description || 'No description';
        document.getElementById('project-detail-date').textContent = new Date(project.createdAt).toLocaleDateString();
        document.getElementById('project-notes').value = project.notes || '';
    }

    saveProjectNotes(notes) {
        if (this.currentProjectId) {
            const project = this.projects.find(p => p.id === this.currentProjectId);
            if (project) {
                project.notes = notes;
                project.lastModified = new Date().toISOString();
                this.saveProjects();
            }
        }
    }

    deleteProject(projectId) {
        if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
            this.projects = this.projects.filter(p => p.id !== projectId);
            this.saveProjects();
            this.renderProjects();
            this.showNotification('Project deleted successfully', 'success');
        }
    }

    // Rendering functions
    renderProjects() {
        const projectsList = document.getElementById('projects-list');
        
        if (this.projects.length === 0) {
            projectsList.innerHTML = `
                <div class="empty-state">
                    <h3>No projects yet</h3>
                    <p>Create your first project to get started</p>
                    <button class="btn btn-primary" onclick="showNewProject()">Create Project</button>
                </div>
            `;
            return;
        }

        projectsList.innerHTML = this.projects
            .sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified))
            .map(project => `
                <div class="project-card" onclick="projectManager.showProjectDetail('${project.id}')">
                    <h3>${this.escapeHtml(project.name)}</h3>
                    <p>${this.escapeHtml(project.description || 'No description')}</p>
                    <div class="project-meta">
                        <span>Modified: ${new Date(project.lastModified).toLocaleDateString()}</span>
                        <button class="btn btn-danger" onclick="event.stopPropagation(); projectManager.deleteProject('${project.id}')">Delete</button>
                    </div>
                </div>
            `).join('');
    }

    // Utility functions
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 6px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;

        if (type === 'success') {
            notification.style.backgroundColor = '#28a745';
        } else if (type === 'error') {
            notification.style.backgroundColor = '#dc3545';
        } else {
            notification.style.backgroundColor = '#007bff';
        }

        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // Local storage functions
    saveProjects() {
        localStorage.setItem('appia-projects', JSON.stringify(this.projects));
    }

    loadProjects() {
        const saved = localStorage.getItem('appia-projects');
        return saved ? JSON.parse(saved) : [];
    }
}

// Global functions for onclick handlers
function showHome() {
    projectManager.showHome();
}

function showMyProjects() {
    projectManager.showMyProjects();
}

function showNewProject() {
    projectManager.showNewProject();
}

// Initialize the application
let projectManager;
document.addEventListener('DOMContentLoaded', () => {
    projectManager = new ProjectManager();
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
