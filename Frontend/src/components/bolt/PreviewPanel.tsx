import React from 'react';
import { RefreshCw, ExternalLink } from 'lucide-react';

interface PreviewPanelProps {
  previewUrl: string;
}

export const PreviewPanel: React.FC<PreviewPanelProps> = ({ previewUrl }) => {
  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="h-10 border-b border-white/10 flex items-center justify-between px-4">
        <span className="text-xs text-gray-400">Preview</span>
        <div className="flex items-center gap-2">
          <button className="p-1.5 hover:bg-white/5 rounded text-gray-400 hover:text-white transition-colors">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button className="p-1.5 hover:bg-white/5 rounded text-gray-400 hover:text-white transition-colors">
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Preview Frame */}
      <div className="flex-1 bg-white">
        {previewUrl ? (
          <iframe
            src={previewUrl}
            className="w-full h-full border-0"
            title="Preview"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
          />
        ) : (
          <div className="h-full flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="text-4xl mb-2">⚡</div>
              <div className="text-sm text-gray-600">Start building to see preview</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
