import React, { useState } from 'react';
import { X, Github, ExternalLink } from 'lucide-react';

interface GitHubConnectionProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (connected: boolean) => void;
}

export function GitHubConnection({ isOpen, onClose, onConnect }: GitHubConnectionProps) {
  const [isConnecting, setIsConnecting] = useState(false);

  if (!isOpen) return null;

  const handleGitHubConnect = async () => {
    setIsConnecting(true);
    try {
      // Redirect to GitHub OAuth
      const clientId = process.env.REACT_APP_GITHUB_CLIENT_ID || 'your-github-client-id';
      const redirectUri = encodeURIComponent(`${window.location.origin}/auth/github/callback`);
      const scope = encodeURIComponent('repo,user:email');
      
      window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${Date.now()}`;
    } catch (error) {
      console.error('GitHub connection error:', error);
      setIsConnecting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg w-full max-w-md p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-6 bg-gray-800 rounded-full flex items-center justify-center">
            <Github className="w-8 h-8 text-white" />
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-2">Connect to GitHub</h2>
          <p className="text-gray-400 mb-8">
            To get started, log in to GitHub with your account or create one.
          </p>

          <button
            onClick={handleGitHubConnect}
            disabled={isConnecting}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            {isConnecting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Connecting...
              </>
            ) : (
              <>
                <Github className="w-5 h-5" />
                Log in to GitHub
              </>
            )}
          </button>

          <div className="mt-6 text-sm text-gray-500">
            <p className="flex items-center justify-center gap-2 mb-2">
              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
              Not owned or operated by GitHub
            </p>
            <p className="flex items-center justify-center gap-2 mb-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              Created 2 years ago
            </p>
            <p className="flex items-center justify-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              More than 1K GitHub users
            </p>
          </div>

          <div className="mt-6">
            <a
              href="https://docs.github.com/en/developers/apps/building-oauth-apps"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 text-sm flex items-center justify-center gap-1"
            >
              Learn more about OAuth
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

