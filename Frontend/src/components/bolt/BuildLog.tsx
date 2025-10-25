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
    <div className="border-t border-white/10 bg-[#1a1d23] p-4">
      <div className="text-xs text-gray-400 mb-2">{logs.length} actions taken</div>
      <div className="space-y-1.5">
        {logs.map((log) => (
          <div key={log.id} className="flex items-center gap-2 text-xs text-gray-300">
            <div className="text-green-400">{getIcon(log.type)}</div>
            <span>{log.message}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs text-green-400">
        <Check className="w-3.5 h-3.5" />
        <span>Build complete</span>
      </div>
    </div>
  );
};
