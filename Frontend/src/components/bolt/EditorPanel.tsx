import React, { useState } from 'react';
import { Folder, File, ChevronRight, ChevronDown, X, FileCode } from 'lucide-react';
import { CodeEditor } from '../CodeEditor';
import { FileNode } from '../../hooks/useFileSystem';

interface EditorPanelProps {
  files: FileNode[];
  selectedFile: FileNode | null;
  onFileSelect: (file: FileNode) => void;
  onFileUpdate: (path: string, content: string) => void;
}

export const EditorPanel: React.FC<EditorPanelProps> = ({ files, selectedFile, onFileSelect, onFileUpdate }) => {
  const [openTabs, setOpenTabs] = useState<FileNode[]>([]);
  const [showFilePanel, setShowFilePanel] = useState(true);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['/']));

  // DON'T auto-select first file - let user click to open
  // This prevents code viewer from auto-opening

  // When a file is selected, open it in a tab
  React.useEffect(() => {
    if (selectedFile && !openTabs.find(t => t.path === selectedFile.path)) {
      setOpenTabs(prev => [...prev, selectedFile]);
    }
  }, [selectedFile]);

  const handleFileClick = (file: FileNode) => {
    onFileSelect(file);
    if (!openTabs.find(t => t.path === file.path)) {
      setOpenTabs(prev => [...prev, file]);
    }
  };

  const handleTabClose = (e: React.MouseEvent, file: FileNode) => {
    e.stopPropagation();
    const newTabs = openTabs.filter(t => t.path !== file.path);
    setOpenTabs(newTabs);
    if (selectedFile?.path === file.path && newTabs.length > 0) {
      onFileSelect(newTabs[newTabs.length - 1]);
    }
  };

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

  const handleCloseEditor = () => {
    setOpenTabs([]);
    onFileSelect(null as any); // Clear selection
  };

  return (
    <div className="h-full flex overflow-hidden bg-[#1E1E1E]">
      {/* File Tree Sidebar - ALWAYS VISIBLE */}
      <div className="flex-1 flex overflow-hidden">
        {showFilePanel && (
        <div className="w-56 border-r border-[#27272A] bg-[#18181B] flex flex-col flex-shrink-0">
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
                    onClick={() => handleFileClick(file)}
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
        )}

        {/* Editor Area */}
        <div className="flex-1 flex flex-col bg-[#1E1E1E] overflow-hidden">
          {/* File Tabs with toggle and close buttons */}
          <div className="h-10 border-b border-[#27272A] flex items-center bg-[#18181B] overflow-x-auto" style={{ scrollbarWidth: 'thin' }}>
            <button
              onClick={() => setShowFilePanel(!showFilePanel)}
              className="px-3 h-full border-r border-[#27272A] hover:bg-[#27272A] transition-colors flex items-center gap-1.5"
              title="Toggle file panel"
            >
              {showFilePanel ? <ChevronDown className="w-3.5 h-3.5 text-gray-400" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-400" />}
            </button>
            
            <button
              onClick={handleCloseEditor}
              className="px-3 h-full border-r border-[#27272A] hover:bg-[#27272A] transition-colors flex items-center gap-1.5 text-red-400 hover:text-red-300"
              title="Close editor"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            
            {openTabs.length > 0 && openTabs.map(tab => (
            <button
              key={tab.path}
              onClick={() => onFileSelect(tab)}
              className={`h-full px-3 flex items-center gap-2 border-r border-[#27272A] text-xs whitespace-nowrap ${
                selectedFile?.path === tab.path
                  ? 'bg-[#1E1E1E] text-white'
                  : 'bg-[#18181B] text-gray-400 hover:text-gray-200'
              }`}
            >
              <span>{getFileIcon(tab.name)}</span>
              <span>{tab.name}</span>
              <X
                onClick={(e) => handleTabClose(e, tab)}
                className="w-3 h-3 hover:bg-[#3F3F46] rounded"
              />
            </button>
          ))}
          </div>

          {/* Monaco Editor */}
          <div className="flex-1 overflow-hidden">
            {selectedFile ? (
              <CodeEditor
                file={selectedFile}
                onUpdateFile={(file) => onFileUpdate(file.path, file.content || '')}
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-500">
                <FileCode className="w-16 h-16 mb-4 opacity-30" />
                <p className="text-sm mb-2">No file selected</p>
                <p className="text-xs text-gray-600">Select a file from the FILES panel</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
