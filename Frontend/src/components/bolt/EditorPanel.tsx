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
  // Auto-select first file if none selected
  React.useEffect(() => {
    if (files.length > 0 && !selectedFile) {
      onFileSelect(files[0]);
    }
  }, [files, selectedFile, onFileSelect]);

  return (
    <div className="h-full flex flex-col bg-[#09090B]">
      {/* Code Editor - Full height, no file tree visible */}
      <div className="flex-1 overflow-hidden">
        {selectedFile ? (
          <CodeEditor
            file={selectedFile}
            onUpdateFile={(file) => onFileUpdate(file.path, file.content)}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500 text-sm">
            {files.length === 0 ? 'No files yet' : 'Loading...'}
          </div>
        )}
      </div>
    </div>
  );
};
