import React, { useState } from 'react';
import { Folder, ChevronRight, ChevronDown } from 'lucide-react';
import { FileNode } from '../../hooks/useFileSystem';

interface FilesPanelProps {
  files: FileNode[];
  onFileSelect: (file: FileNode) => void;
  selectedFile?: FileNode | null;
}

export const FilesPanel: React.FC<FilesPanelProps> = ({ files, onFileSelect, selectedFile }) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['/']));

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  // Group files into folder structure
  const buildFileTree = () => {
    const tree: { [key: string]: FileNode[] } = { '/': [] };
    files.forEach(file => {
      const parts = file.path.split('/').filter(Boolean);
      if (parts.length === 1) {
        tree['/'].push(file);
      } else {
        const folder = '/' + parts.slice(0, -1).join('/');
        if (!tree[folder]) tree[folder] = [];
        tree[folder].push(file);
      }
    });
    return tree;
  };

  const fileTree = buildFileTree();
  const folders = Object.keys(fileTree).sort();

  const getFileIcon = (fileName: string) => {
    if (fileName.endsWith('.tsx') || fileName.endsWith('.jsx')) return '⚛️';
    if (fileName.endsWith('.ts') || fileName.endsWith('.js')) return '📜';
    if (fileName.endsWith('.css')) return '🎨';
    if (fileName.endsWith('.html')) return '🌐';
    if (fileName.endsWith('.json')) return '📋';
    return '📄';
  };

  return (
    <div className="h-full w-full bg-[#18181B] flex flex-col">
      <div className="h-10 border-b border-[#27272A] flex items-center px-3 text-xs font-semibold text-gray-400 uppercase">
        Files
      </div>
      <div className="flex-1 overflow-y-auto p-2 text-sm">
        {folders.map(folder => (
          <div key={folder}>
            {folder !== '/' && (
              <button
                onClick={() => toggleFolder(folder)}
                className="w-full flex items-center gap-1.5 px-2 py-1 hover:bg-[#27272A] rounded text-gray-300 transition-colors"
              >
                {expandedFolders.has(folder) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                <Folder className="w-4 h-4 text-blue-400" />
                <span className="text-xs">{folder.split('/').pop()}</span>
              </button>
            )}
            {(folder === '/' || expandedFolders.has(folder)) && fileTree[folder]?.map(file => (
              <button
                key={file.path}
                onClick={() => onFileSelect(file)}
                className={`w-full flex items-center gap-2 px-2 py-1 rounded text-gray-300 transition-colors ${
                  selectedFile?.path === file.path ? 'bg-[#3B82F6] text-white' : 'hover:bg-[#27272A]'
                } ${folder !== '/' ? 'ml-4' : ''}`}
              >
                <span className="text-sm">{getFileIcon(file.name)}</span>
                <span className="text-xs truncate">{file.name}</span>
              </button>
            ))}
          </div>
        ))}
        {files.length === 0 && (
          <div className="text-xs text-gray-500 px-2 py-4">
            No files yet. Start chatting to create files.
          </div>
        )}
      </div>
    </div>
  );
};
