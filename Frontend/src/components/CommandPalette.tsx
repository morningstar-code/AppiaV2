import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  File, 
  Folder, 
  Settings, 
  Upload, 
  Monitor, 
  Tablet, 
  Smartphone,
  ChevronRight,
  Clock,
  Zap
} from 'lucide-react';

interface Command {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  action: () => void;
  category: 'actions' | 'files' | 'devices' | 'recent';
}

interface CommandPaletteProps {
  onClose: () => void;
  onFileSelect?: (file: string) => void;
  onDeviceChange?: (device: string) => void;
  onToggleFiles?: () => void;
}

export function CommandPalette({ 
  onClose, 
  onFileSelect, 
  onDeviceChange, 
  onToggleFiles 
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands: Command[] = [
    // Quick Actions
    {
      id: 'create-file',
      title: 'Create file',
      description: 'Create a new file in the project',
      icon: <File className="w-4 h-4" />,
      action: () => {
        console.log('Create file');
        onClose();
      },
      category: 'actions'
    },
    {
      id: 'create-folder',
      title: 'Create folder',
      description: 'Create a new folder in the project',
      icon: <Folder className="w-4 h-4" />,
      action: () => {
        console.log('Create folder');
        onClose();
      },
      category: 'actions'
    },
    {
      id: 'toggle-files',
      title: 'Toggle files drawer',
      description: 'Show or hide the files drawer',
      icon: <Folder className="w-4 h-4" />,
      action: () => {
        onToggleFiles?.();
        onClose();
      },
      category: 'actions'
    },
    {
      id: 'publish',
      title: 'Publish project',
      description: 'Deploy your project to production',
      icon: <Upload className="w-4 h-4" />,
      action: () => {
        console.log('Publish project');
        onClose();
      },
      category: 'actions'
    },

    // Device Frames
    {
      id: 'device-iphone',
      title: 'iPhone 16',
      description: 'Switch to iPhone 16 device frame',
      icon: <Smartphone className="w-4 h-4" />,
      action: () => {
        onDeviceChange?.('iPhone 16');
        onClose();
      },
      category: 'devices'
    },
    {
      id: 'device-ipad',
      title: 'iPad',
      description: 'Switch to iPad device frame',
      icon: <Tablet className="w-4 h-4" />,
      action: () => {
        onDeviceChange?.('iPad');
        onClose();
      },
      category: 'devices'
    },
    {
      id: 'device-desktop',
      title: 'Desktop',
      description: 'Switch to desktop view',
      icon: <Monitor className="w-4 h-4" />,
      action: () => {
        onDeviceChange?.('Desktop');
        onClose();
      },
      category: 'devices'
    },

    // Recent Files
    {
      id: 'file-index',
      title: 'index.html',
      description: 'Open index.html',
      icon: <File className="w-4 h-4" />,
      action: () => {
        onFileSelect?.('index.html');
        onClose();
      },
      category: 'recent'
    },
    {
      id: 'file-app',
      title: 'App.tsx',
      description: 'Open App.tsx',
      icon: <File className="w-4 h-4" />,
      action: () => {
        onFileSelect?.('App.tsx');
        onClose();
      },
      category: 'recent'
    },
    {
      id: 'file-styles',
      title: 'styles.css',
      description: 'Open styles.css',
      icon: <File className="w-4 h-4" />,
      action: () => {
        onFileSelect?.('styles.css');
        onClose();
      },
      category: 'recent'
    }
  ];

  const filteredCommands = query
    ? commands.filter(cmd => 
        cmd.title.toLowerCase().includes(query.toLowerCase()) ||
        cmd.description.toLowerCase().includes(query.toLowerCase())
      )
    : commands;

  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) {
      acc[cmd.category] = [];
    }
    acc[cmd.category].push(cmd);
    return acc;
  }, {} as Record<string, Command[]>);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredCommands.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : filteredCommands.length - 1
        );
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [filteredCommands, selectedIndex]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'actions':
        return <Zap className="w-3 h-3" />;
      case 'devices':
        return <Monitor className="w-3 h-3" />;
      case 'recent':
        return <Clock className="w-3 h-3" />;
      default:
        return <File className="w-3 h-3" />;
    }
  };

  const getCategoryTitle = (category: string) => {
    switch (category) {
      case 'actions':
        return 'Quick Actions';
      case 'devices':
        return 'Device Frames';
      case 'recent':
        return 'Recent Files';
      default:
        return 'Files';
    }
  };

  let currentIndex = 0;

  return (
    <div className="p-4">
      {/* Search Input */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search commands..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-[#1A1D23] border border-white/10 rounded-md pl-10 pr-3 py-3 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-white/20"
        />
      </div>

      {/* Commands List */}
      <div className="max-h-96 overflow-y-auto">
        {Object.entries(groupedCommands).map(([category, categoryCommands]) => (
          <div key={category} className="mb-4">
            <div className="flex items-center gap-2 px-3 py-2 text-xs text-gray-400 font-medium">
              {getCategoryIcon(category)}
              {getCategoryTitle(category)}
            </div>
            
            <div className="space-y-1">
              {categoryCommands.map((command) => {
                const isSelected = currentIndex === selectedIndex;
                currentIndex++;
                
                return (
                  <motion.button
                    key={command.id}
                    onClick={command.action}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors ${
                      isSelected
                        ? 'bg-white/10 text-white'
                        : 'text-gray-300 hover:bg-white/5 hover:text-white'
                    }`}
                    whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                  >
                    <div className="text-gray-400">
                      {command.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {command.title}
                      </div>
                      <div className="text-xs text-gray-400 truncate">
                        {command.description}
                      </div>
                    </div>
                    {isSelected && (
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-white/5">
        <div className="flex items-center gap-4 text-xs text-gray-400">
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-xs">↑↓</kbd>
            <span>navigate</span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-xs">↵</kbd>
            <span>select</span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-xs">esc</kbd>
            <span>close</span>
          </div>
        </div>
      </div>
    </div>
  );
}

