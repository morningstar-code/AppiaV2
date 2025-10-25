import React, { useState } from 'react';
import { Folder, File, ChevronRight, ChevronDown } from 'lucide-react';
import { CodeEditor } from '../CodeEditor';
import { FileNode } from '../../hooks/useFileSystem';

interface EditorPanelProps {
  files: FileNode[];
  selectedFile: FileNode | null;
  onFileSelect: (file: FileNode) => void;
  onFileUpdate: (path: string, content: string) => void;
}

export const EditorPanel: React.FC<EditorPanelProps> = ({ files, selectedFile, onFileSelect, onFileUpdate }) => {
  return (
    <div className="h-full flex flex-col">
      {/* File Tree */}
      <div className="h-48 border-b border-white/10 overflow-y-auto p-2">
        <div className="text-xs font-semibold text-gray-400 mb-2 px-2">FILES</div>
        {files.length === 0 ? (
          <div className="text-xs text-gray-500 px-2">No files yet</div>
        ) : (
          <div className="space-y-0.5">
            {files.map((file) => (
              <button
                key={file.path}
                onClick={() => onFileSelect(file)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs hover:bg-white/5 transition-colors ${
                  selectedFile?.path === file.path ? 'bg-blue-600/20 text-blue-400' : 'text-gray-300'
                }`}
              >
                <File className="w-3.5 h-3.5" />
                <span className="truncate">{file.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Code Editor */}
      <div className="flex-1 overflow-hidden">
        {selectedFile ? (
          <CodeEditor
            file={selectedFile}
            onUpdateFile={(file) => onFileUpdate(file.path, file.content)}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500 text-sm">
            Select a file to view
          </div>
        )}
      </div>
    </div>
  );
};
