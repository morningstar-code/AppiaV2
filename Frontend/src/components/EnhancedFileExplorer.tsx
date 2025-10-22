import React, { useState, useEffect } from 'react';
import { 
  File, 
  Folder, 
  FolderOpen, 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  X,
  Eye,
  Code,
  Image,
  FileText
} from 'lucide-react';

interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  content?: string;
  children?: FileNode[];
  isOpen?: boolean;
  isEditing?: boolean;
}

interface EnhancedFileExplorerProps {
  files: { [key: string]: string };
  onFileChange: (path: string, content: string) => void;
  onFileSelect: (path: string) => void;
  selectedFile: string;
  onFilesUpdate: (files: { [key: string]: string }) => void;
}

const getFileIcon = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase();
  
  switch (ext) {
    case 'js':
    case 'jsx':
    case 'ts':
    case 'tsx':
      return <Code className="w-4 h-4 text-blue-500" />;
    case 'css':
    case 'scss':
    case 'sass':
      return <FileText className="w-4 h-4 text-pink-500" />;
    case 'html':
    case 'htm':
      return <FileText className="w-4 h-4 text-orange-500" />;
    case 'json':
      return <FileText className="w-4 h-4 text-yellow-500" />;
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'svg':
      return <Image className="w-4 h-4 text-green-500" />;
    default:
      return <File className="w-4 h-4 text-gray-500" />;
  }
};

export const EnhancedFileExplorer: React.FC<EnhancedFileExplorerProps> = ({
  files,
  onFileChange,
  onFileSelect,
  selectedFile,
  onFilesUpdate
}) => {
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [editingFile, setEditingFile] = useState<string | null>(null);
  const [newFileName, setNewFileName] = useState('');

  useEffect(() => {
    const tree = buildFileTree(files);
    setFileTree(tree);
  }, [files]);

  const buildFileTree = (files: { [key: string]: string }): FileNode[] => {
    const tree: FileNode[] = [];
    const pathMap = new Map<string, FileNode>();

    // Create root structure
    Object.keys(files).forEach(filePath => {
      const parts = filePath.split('/');
      let currentPath = '';
      
      parts.forEach((part, index) => {
        const parentPath = currentPath;
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        
        if (!pathMap.has(currentPath)) {
          const isFile = index === parts.length - 1;
          const node: FileNode = {
            id: currentPath,
            name: part,
            type: isFile ? 'file' : 'folder',
            content: isFile ? files[filePath] : undefined,
            children: isFile ? undefined : [],
            isOpen: expandedFolders.has(currentPath)
          };
          
          pathMap.set(currentPath, node);
          
          if (parentPath && pathMap.has(parentPath)) {
            pathMap.get(parentPath)!.children!.push(node);
          } else {
            tree.push(node);
          }
        }
      });
    });

    return tree;
  };

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  const addNewFile = (parentPath: string = '') => {
    const fileName = prompt('Enter file name:');
    if (!fileName) return;
    
    const fullPath = parentPath ? `${parentPath}/${fileName}` : fileName;
    const newFiles = { ...files, [fullPath]: '' };
    onFilesUpdate(newFiles);
  };

  const addNewFolder = (parentPath: string = '') => {
    const folderName = prompt('Enter folder name:');
    if (!folderName) return;
    
    // Create a placeholder file in the folder
    const fullPath = parentPath ? `${parentPath}/${folderName}/index.js` : `${folderName}/index.js`;
    const newFiles = { ...files, [fullPath]: '// New folder' };
    onFilesUpdate(newFiles);
  };

  const deleteFile = (filePath: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return;
    
    const newFiles = { ...files };
    delete newFiles[filePath];
    onFilesUpdate(newFiles);
    
    if (selectedFile === filePath) {
      onFileSelect('');
    }
  };

  const renameFile = (oldPath: string, newName: string) => {
    const parts = oldPath.split('/');
    parts[parts.length - 1] = newName;
    const newPath = parts.join('/');
    
    const newFiles = { ...files };
    newFiles[newPath] = newFiles[oldPath];
    delete newFiles[oldPath];
    onFilesUpdate(newFiles);
    
    if (selectedFile === oldPath) {
      onFileSelect(newPath);
    }
  };

  const renderFileNode = (node: FileNode, depth: number = 0) => {
    const isExpanded = expandedFolders.has(node.id);
    const isSelected = selectedFile === node.id;
    const isEditing = editingFile === node.id;

    return (
      <div key={node.id} className="select-none">
        <div
          className={`flex items-center gap-2 px-2 py-1 hover:bg-gray-100 cursor-pointer rounded ${
            isSelected ? 'bg-blue-100 text-blue-700' : ''
          }`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
        >
          {node.type === 'folder' ? (
            <button
              onClick={() => toggleFolder(node.id)}
              className="flex items-center gap-2 flex-1 text-left"
            >
              {isExpanded ? (
                <FolderOpen className="w-4 h-4 text-blue-500" />
              ) : (
                <Folder className="w-4 h-4 text-blue-500" />
              )}
              <span className="font-medium">{node.name}</span>
            </button>
          ) : (
            <button
              onClick={() => onFileSelect(node.id)}
              className="flex items-center gap-2 flex-1 text-left"
            >
              {getFileIcon(node.name)}
              <span>{node.name}</span>
            </button>
          )}

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
            {node.type === 'folder' ? (
              <>
                <button
                  onClick={() => addNewFile(node.id)}
                  className="p-1 hover:bg-gray-200 rounded"
                  title="Add file"
                >
                  <Plus className="w-3 h-3" />
                </button>
                <button
                  onClick={() => addNewFolder(node.id)}
                  className="p-1 hover:bg-gray-200 rounded"
                  title="Add folder"
                >
                  <Folder className="w-3 h-3" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setEditingFile(node.id)}
                  className="p-1 hover:bg-gray-200 rounded"
                  title="Rename"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
                <button
                  onClick={() => deleteFile(node.id)}
                  className="p-1 hover:bg-red-200 rounded text-red-600"
                  title="Delete"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </>
            )}
          </div>
        </div>

        {isEditing && (
          <div className="flex items-center gap-2 px-2 py-1" style={{ paddingLeft: `${depth * 16 + 24}px` }}>
            <input
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
              autoFocus
            />
            <button
              onClick={() => {
                if (newFileName) {
                  renameFile(node.id, newFileName);
                  setEditingFile(null);
                  setNewFileName('');
                }
              }}
              className="p-1 hover:bg-green-200 rounded text-green-600"
            >
              <Save className="w-3 h-3" />
            </button>
            <button
              onClick={() => {
                setEditingFile(null);
                setNewFileName('');
              }}
              className="p-1 hover:bg-gray-200 rounded"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {node.type === 'folder' && isExpanded && node.children && (
          <div>
            {node.children.map(child => renderFileNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-3 border-b">
        <h3 className="font-semibold text-gray-700">Files</h3>
        <div className="flex gap-2">
          <button
            onClick={() => addNewFile()}
            className="p-1 hover:bg-gray-200 rounded"
            title="Add file"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={() => addNewFolder()}
            className="p-1 hover:bg-gray-200 rounded"
            title="Add folder"
          >
            <Folder className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {fileTree.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <File className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p>No files yet</p>
            <p className="text-sm">Create your first file to get started</p>
          </div>
        ) : (
          <div className="group">
            {fileTree.map(node => renderFileNode(node))}
          </div>
        )}
      </div>
    </div>
  );
};
