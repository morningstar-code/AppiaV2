import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import axios from 'axios';
import { API_URL } from '../config.ts';

interface SavedProjectRecord {
  id: string;
  name: string;
  description?: string | null;
  prompt: string;
  code?: string | null;
  files?: Record<string, string>;
  updatedAt: string;
  createdAt: string;
}

export function Projects() {
  const navigate = useNavigate();
  const { isSignedIn, isLoaded, user } = useUser();
  const [projects, setProjects] = useState<SavedProjectRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userId = user?.id;

  // Wait for Clerk to load before redirecting; prevents false redirect to home
  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) navigate('/');
  }, [isLoaded, isSignedIn, navigate]);

  useEffect(() => {
    if (!userId) return;

    const fetchProjects = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get(`${API_URL}/projects?userId=${userId}`);
        setProjects(response.data || []);
      } catch (fetchError) {
        console.error('Failed to load projects:', fetchError);
        setError('We could not load your projects. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [userId]);

  const handleOpenProject = (project: SavedProjectRecord) => {
    if (!project?.id) {
      return;
    }

    sessionStorage.setItem('appia:selectedProject', JSON.stringify(project));
    navigate(`/builder?projectId=${project.id}`);
  };

  const formattedProjects = useMemo(() => {
    return projects.map((project) => ({
      ...project,
      displayUpdatedAt: project.updatedAt
        ? new Date(project.updatedAt).toLocaleString()
        : 'Unknown date'
    }));
  }, [projects]);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200">
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            ← Back
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white text-gray-900 rounded-lg flex items-center justify-center font-bold">
              A
            </div>
            <h1 className="text-xl font-semibold">My Projects</h1>
          </div>
        </div>
        {user && (
          <div className="text-sm text-gray-400">
            Signed in as{' '}
            <span className="text-white">
              {user.firstName || user.emailAddresses[0]?.emailAddress}
            </span>
          </div>
        )}
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        {loading && (
          <div className="text-center text-gray-400">Loading your projects...</div>
        )}

        {error && <div className="text-center text-red-400 mb-6">{error}</div>}

        {!loading && !error && formattedProjects.length === 0 && (
          <div className="text-center text-gray-400">
            You have no saved projects yet. Generate a site in the builder and save it to see it here.
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {formattedProjects.map((project) => (
            <button
              key={project.id}
              onClick={() => handleOpenProject(project)}
              className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-left hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/10 transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-white truncate">
                  {project.name || 'Untitled Project'}
                </h2>
                <span className="text-xs text-gray-500 whitespace-nowrap ml-3">
                  {project.displayUpdatedAt}
                </span>
              </div>
              <p className="text-sm text-gray-400 mb-4 line-clamp-3">
                {project.description || project.prompt || 'No description provided.'}
              </p>
              <div className="text-sm text-blue-400 font-medium">Continue →</div>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
