import React from 'react';
import { FileEdit, FilePlus, Package, Play, Check } from 'lucide-react';

interface BuildLogProps {
  logs: Array<{
    id: string;
    type: 'read' | 'edit' | 'create' | 'build' | 'install';
    message: string;
    timestamp: Date;
  }>;
}

export const BuildLog: React.FC<BuildLogProps> = ({ logs }) => {
  if (logs.length === 0) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'create': return <FilePlus className="w-3.5 h-3.5" />;
      case 'edit': return <FileEdit className="w-3.5 h-3.5" />;
      case 'install': return <Package className="w-3.5 h-3.5" />;
      case 'build': return <Play className="w-3.5 h-3.5" />;
      default: return <Check className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="border-t border-[#27272A] bg-[#18181B] px-4 py-3">
      <button className="w-full flex items-center justify-between text-xs text-gray-400 mb-3 hover:text-gray-300 transition-colors">
        <span>{logs.length} actions taken</span>
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div className="space-y-2">
        {logs.map((log) => (
          <div key={log.id} className="flex items-center gap-2.5 text-xs text-gray-400">
            <div className="text-green-400">{getIcon(log.type)}</div>
            <span>{log.message}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2.5 text-xs text-green-400">
        <Check className="w-3.5 h-3.5" />
        <span>Build complete</span>
      </div>
    </div>
  );
};
