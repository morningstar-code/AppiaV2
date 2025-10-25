import React, { useState, useEffect } from 'react';
import { FileEdit, FilePlus, Package, Play, Check, ChevronDown, ChevronUp, Terminal } from 'lucide-react';

interface BuildLogProps {
  logs: Array<{
    id: string;
    type: 'read' | 'edit' | 'create' | 'build' | 'install';
    message: string;
    timestamp: Date;
  }>;
  terminalOutput?: string[];
}

export const BuildLog: React.FC<BuildLogProps> = ({ logs, terminalOutput = [] }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [visibleLogs, setVisibleLogs] = useState<typeof logs>([]);

  // Animate logs appearing one by one
  useEffect(() => {
    if (logs.length > visibleLogs.length) {
      const timer = setTimeout(() => {
        setVisibleLogs(logs.slice(0, visibleLogs.length + 1));
      }, 100);
      return () => clearTimeout(timer);
    } else if (logs.length < visibleLogs.length) {
      setVisibleLogs(logs);
    }
  }, [logs, visibleLogs.length]);

  if (logs.length === 0 && terminalOutput.length === 0) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'create': return <FilePlus className="w-3.5 h-3.5" />;
      case 'edit': return <FileEdit className="w-3.5 h-3.5" />;
      case 'install': return <Package className="w-3.5 h-3.5" />;
      case 'build': return <Play className="w-3.5 h-3.5" />;
      default: return <Check className="w-3.5 h-3.5" />;
    }
  };

  const isComplete = logs.length > 0 && visibleLogs.length === logs.length;

  return (
    <div className="border-t border-[#27272A] bg-[#18181B] flex-shrink-0">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 text-xs text-gray-400 hover:text-gray-300 transition-colors"
      >
        <span className="font-semibold">
          {logs.length} action{logs.length !== 1 ? 's' : ''} taken
          {isComplete && <span className="ml-2 text-green-400">✓</span>}
        </span>
        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>
      
      {isExpanded && (
        <div className="px-4 pb-3 max-h-64 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#3F3F46 #18181B' }}>
          <div className="space-y-1.5">
            {visibleLogs.map((log, index) => (
              <div 
                key={log.id} 
                className="flex items-center gap-2.5 text-xs text-gray-400 animate-in fade-in slide-in-from-left-2 duration-200"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="text-green-400">{getIcon(log.type)}</div>
                <span className="font-mono">{log.message}</span>
              </div>
            ))}
          </div>

          {/* Terminal Output */}
          {terminalOutput.length > 0 && (
            <div className="mt-3 pt-3 border-t border-[#27272A]">
              <div className="flex items-center gap-2 mb-2 text-xs text-gray-500">
                <Terminal className="w-3.5 h-3.5" />
                <span>Terminal Output</span>
              </div>
              <div className="bg-black/40 rounded p-2 space-y-0.5 max-h-40 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#3F3F46 #000' }}>
                {terminalOutput.map((line, i) => (
                  <div key={i} className="text-[10px] text-gray-400 font-mono">
                    {line}
                  </div>
                ))}
              </div>
            </div>
          )}

          {isComplete && (
            <div className="mt-3 pt-3 border-t border-[#27272A] flex items-center gap-2.5 text-xs text-green-400 animate-in fade-in duration-300">
              <Check className="w-3.5 h-3.5" />
              <span className="font-semibold">Build complete</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
