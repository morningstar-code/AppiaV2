import { useState, useCallback } from 'react';

export interface FileNode {
  name: string;
  type: 'file' | 'folder';
  path: string;
  content?: string;
  children?: FileNode[];
}

export const useFileSystem = () => {
  const [files, setFiles] = useState<FileNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);

  const addFile = useCallback((file: FileNode) => {
    setFiles(prev => {
      const existing = prev.find(f => f.path === file.path);
      if (existing) {
        return prev.map(f => f.path === file.path ? file : f);
      }
      return [...prev, file];
    });
  }, []);

  const updateFile = useCallback((path: string, content: string) => {
    setFiles(prev => prev.map(f => 
      f.path === path ? { ...f, content } : f
    ));
    
    if (selectedFile?.path === path) {
      setSelectedFile(prev => prev ? { ...prev, content } : null);
    }
  }, [selectedFile]);

  const deleteFile = useCallback((path: string) => {
    setFiles(prev => prev.filter(f => f.path !== path));
    if (selectedFile?.path === path) {
      setSelectedFile(null);
    }
  }, [selectedFile]);

  const selectFile = useCallback((file: FileNode) => {
    setSelectedFile(file);
  }, []);

  return {
    files,
    selectedFile,
    addFile,
    updateFile,
    deleteFile,
    selectFile,
  };
};
