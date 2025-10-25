import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  File, 
  Folder, 
  FolderOpen, 
  Plus, 
  Search, 
  ChevronRight, 
  ChevronDown,
  MoreHorizontal,
  FileText,
  Code,
  Image,
  Settings
} from 'lucide-react';
import { FileItem } from '../types/index';

interface FilesDrawerProps {
  files: FileItem[];
  onFileSelect: (file: FileItem) => void;
  onClose: () => void;
}

export function FilesDrawer({ files, onFileSelect, onClose }: FilesDrawerProps) {
  const [activeTab, setActiveTab] = useState<'files' | 'search'>('files');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['src', 'public']));
  
  // Debug logging
  console.log('[FilesDrawer] Received files:', files.length, files);

  const toggleFolder = (folderName: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderName)) {
      newExpanded.delete(folderName);
    } else {
      newExpanded.add(folderName);
    }
    setExpandedFolders(newExpanded);
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'tsx':
      case 'ts':
      case 'js':
      case 'jsx':
        return <Code className="w-4 h-4 text-blue-400" />;
      case 'css':
      case 'scss':
        return <FileText className="w-4 h-4 text-pink-400" />;
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'svg':
        return <Image className="w-4 h-4 text-green-400" />;
      case 'json':
      case 'md':
      case 'txt':
        return <FileText className="w-4 h-4 text-gray-400" />;
      default:
        return <File className="w-4 h-4 text-gray-400" />;
    }
  };

  const renderFileTree = (items: FileItem[], level = 0) => {
    return items.map((item, index) => (
      <div key={`${item.name}-${index}`}>
        <div
          className={`flex items-center gap-2 py-1 px-2 hover:bg-white/5 cursor-pointer text-sm group ${
            level > 0 ? 'ml-4' : ''
          }`}
          onClick={() => {
            console.log('🚨 [FilesDrawer] File/folder clicked:', item);
            if (item.type === 'folder') {
              toggleFolder(item.name);
            } else {
              console.log('🚨 [FilesDrawer] Calling onFileSelect with:', item);
              onFileSelect(item);
            }
          }}
        >
          {item.type === 'folder' ? (
            <>
              {expandedFolders.has(item.name) ? (
                <ChevronDown className="w-3 h-3 text-gray-400" />
              ) : (
                <ChevronRight className="w-3 h-3 text-gray-400" />
              )}
              {expandedFolders.has(item.name) ? (
                <FolderOpen className="w-4 h-4 text-blue-400" />
              ) : (
                <Folder className="w-4 h-4 text-blue-400" />
              )}
            </>
          ) : (
            <>
              <div className="w-3 h-3" /> {/* Spacer for alignment */}
              {getFileIcon(item.name)}
            </>
          )}
          <span className="text-gray-300 text-xs">{item.name}</span>
          <div className="flex-1" />
          <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded">
            <MoreHorizontal className="w-3 h-3 text-gray-400" />
          </button>
        </div>
        
        {item.type === 'folder' && expandedFolders.has(item.name) && item.children && (
          <div className="ml-4">
            {renderFileTree(item.children, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  const filteredFiles = searchQuery 
    ? files.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.children && item.children.some(child => 
          child.name.toLowerCase().includes(searchQuery.toLowerCase())
        ))
      )
    : files;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white text-sm font-medium">Files</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-3">
          <button
            onClick={() => setActiveTab('files')}
            className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
              activeTab === 'files'
                ? 'bg-white/10 text-white'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Files
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
              activeTab === 'search'
                ? 'bg-white/10 text-white'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Search
          </button>
        </div>

        {/* Search */}
        {activeTab === 'search' && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1A1D23] border border-white/10 rounded-md pl-8 pr-3 py-2 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-white/20"
            />
          </div>
        )}
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto p-2">
        {activeTab === 'files' ? (
          <div className="space-y-1">
            {files.length > 0 ? (
              renderFileTree(files)
            ) : (
              <div className="text-center py-8 text-gray-400 text-xs">
                <div className="text-4xl mb-3">📁</div>
                <div>No files yet</div>
                <div className="text-xs mt-2 text-gray-500">Files will appear here after generation</div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-1">
            {filteredFiles.length > 0 ? (
              renderFileTree(filteredFiles)
            ) : (
              <div className="text-center py-8 text-gray-400 text-xs">
                {searchQuery ? 'No files found' : 'No files to display'}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-white/5">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-400 rounded-full" />
            <span>Build: OK</span>
          </div>
          <div className="flex-1" />
          <button className="p-1 hover:bg-white/10 rounded">
            <Plus className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
