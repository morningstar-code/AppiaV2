import React, { useState, useEffect } from 'react';
import { 
  Save, 
  FolderOpen, 
  Download, 
  Upload, 
  Trash2, 
  Edit3, 
  Star,
  Share2,
  Cloud,
  HardDrive,
  Clock
} from 'lucide-react';
import { storageService, SavedProject, User } from '../services/storage';

interface ProjectManagerProps {
  currentProject: {
    name: string;
    description: string;
    language: string;
    prompt: string;
    code: string;
    files: { [key: string]: string };
  };
  onLoadProject: (project: SavedProject) => void;
  user: User | null;
}

export const ProjectManager: React.FC<ProjectManagerProps> = ({
  currentProject,
  onLoadProject,
  user
}) => {
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);
  const [saveForm, setSaveForm] = useState({
    name: '',
    description: '',
    isPublic: false
  });

  useEffect(() => {
    loadSavedProjects();
  }, [user]);

  const loadSavedProjects = async () => {
    try {
      const projects = storageService.getLocalProjects();
      setSavedProjects(projects);
      
      if (user) {
        // Load cloud projects
        const cloudProjects = await storageService.getCloudProjects(user);
        setSavedProjects(prev => [...prev, ...cloudProjects]);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  const handleSaveProject = async () => {
    if (!saveForm.name.trim()) return;

    try {
      const projectData = {
        ...currentProject,
        ...saveForm
      };

      if (user) {
        // Save to cloud
        const savedProject = await storageService.saveProjectToCloud(projectData as SavedProject, user);
        setSavedProjects(prev => [...prev, savedProject]);
      } else {
        // Save locally
        const savedProject = storageService.saveProjectLocally(projectData);
        setSavedProjects(prev => [...prev, savedProject]);
      }

      setShowSaveModal(false);
      setSaveForm({ name: '', description: '', isPublic: false });
    } catch (error) {
      console.error('Failed to save project:', error);
    }
  };

  const handleLoadProject = (project: SavedProject) => {
    onLoadProject(project);
    setShowLoadModal(false);
  };

  const handleDeleteProject = (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;

    try {
      storageService.deleteProjectLocally(projectId);
      setSavedProjects(prev => prev.filter(p => p.id !== projectId));
    } catch (error) {
      console.error('Failed to delete project:', error);
    }
  };

  const handleExportProjects = () => {
    const data = storageService.exportProjects();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'appiav2-projects.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportProjects = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result as string;
        const success = storageService.importProjects(data);
        if (success) {
          loadSavedProjects();
          alert('Projects imported successfully!');
        } else {
          alert('Failed to import projects. Invalid file format.');
        }
      } catch (error) {
        alert('Failed to import projects. Invalid file format.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setShowSaveModal(true)}
        className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        <Save className="w-4 h-4" />
        Save Project
      </button>

      <button
        onClick={() => setShowLoadModal(true)}
        className="flex items-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
      >
        <FolderOpen className="w-4 h-4" />
        Load Project
      </button>

      <div className="flex items-center gap-1">
        <button
          onClick={handleExportProjects}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          title="Export projects"
        >
          <Download className="w-4 h-4" />
        </button>
        <label className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer">
          <Upload className="w-4 h-4" />
          <input
            type="file"
            accept=".json"
            onChange={handleImportProjects}
            className="hidden"
          />
        </label>
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">Save Project</h2>
              <button
                onClick={() => setShowSaveModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleSaveProject(); }} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Name
                </label>
                <input
                  type="text"
                  value={saveForm.name}
                  onChange={(e) => setSaveForm({ ...saveForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter project name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={saveForm.description}
                  onChange={(e) => setSaveForm({ ...saveForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter project description"
                  rows={3}
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={saveForm.isPublic}
                  onChange={(e) => setSaveForm({ ...saveForm, isPublic: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="isPublic" className="text-sm text-gray-700">
                  Make project public
                </label>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600">
                {user ? (
                  <>
                    <Cloud className="w-4 h-4" />
                    <span>Will be saved to cloud</span>
                  </>
                ) : (
                  <>
                    <HardDrive className="w-4 h-4" />
                    <span>Will be saved locally</span>
                  </>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowSaveModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Load Modal */}
      {showLoadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh]">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">Load Project</h2>
              <button
                onClick={() => setShowLoadModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="p-6 max-h-96 overflow-y-auto">
              {savedProjects.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <FolderOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No saved projects yet</p>
                  <p className="text-sm">Create and save your first project to see it here</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {savedProjects.map((project) => (
                    <div
                      key={project.id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-gray-900">{project.name}</h3>
                            {project.isPublic && (
                              <span className="px-2 py-1 bg-green-100 text-green-600 text-xs rounded">
                                Public
                              </span>
                            )}
                            <div className="flex items-center gap-1 text-gray-500 text-sm">
                              <Clock className="w-3 h-3" />
                              {new Date(project.updatedAt).toLocaleDateString()}
                            </div>
                          </div>
                          <p className="text-gray-600 text-sm mb-2">{project.description}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <span className="font-medium">Language:</span> {project.language}
                            </span>
                            <span className="flex items-center gap-1">
                              {user ? <Cloud className="w-3 h-3" /> : <HardDrive className="w-3 h-3" />}
                              {user ? 'Cloud' : 'Local'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleLoadProject(project)}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                          >
                            Load
                          </button>
                          <button
                            onClick={() => handleDeleteProject(project.id)}
                            className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                            title="Delete project"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
