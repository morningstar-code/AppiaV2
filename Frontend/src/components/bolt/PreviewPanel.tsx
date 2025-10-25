import React from 'react';
import { RefreshCw, ExternalLink } from 'lucide-react';

interface PreviewPanelProps {
  previewUrl: string;
}

export const PreviewPanel: React.FC<PreviewPanelProps> = ({ previewUrl }) => {
  return (
    <div className="h-full flex flex-col bg-[#09090B]">
      {/* Toolbar */}
      <div className="h-10 border-b border-[#27272A] flex items-center justify-between px-4 bg-[#18181B]">
        <div className="flex items-center gap-3">
          <select className="bg-transparent text-xs text-gray-400 border-none focus:outline-none cursor-pointer">
            <option>iPhone 16</option>
            <option>Desktop</option>
            <option>iPad</option>
          </select>
          <span className="text-xs text-gray-500">80 %</span>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-1.5 hover:bg-[#27272A] rounded text-gray-400 hover:text-white transition-colors">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button className="p-1.5 hover:bg-[#27272A] rounded text-gray-400 hover:text-white transition-colors">
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Preview Frame */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[#09090B]">
        {previewUrl ? (
          <div className="w-[393px] h-[852px] bg-black rounded-[3rem] shadow-2xl border-[8px] border-[#18181B] relative overflow-hidden">
            {/* iPhone Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-[30px] bg-black rounded-b-3xl z-10" />
            {/* Screen */}
            <div className="w-full h-full rounded-[2.5rem] overflow-hidden">
              <iframe
                src={previewUrl}
                className="w-full h-full border-0 bg-white"
                title="Preview"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                allow="cross-origin-isolated"
              />
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="text-5xl mb-3">⚡</div>
            <div className="text-sm text-gray-500">Start building to see preview</div>
          </div>
        )}
      </div>
    </div>
  );
};
