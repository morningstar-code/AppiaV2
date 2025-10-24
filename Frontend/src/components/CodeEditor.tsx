import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FileText, Save, Copy, Download, Check } from 'lucide-react';
import Editor from '@monaco-editor/react';

interface CodeEditorProps {
  file: {
    name: string;
    type: 'file' | 'folder';
    content?: string;
    path: string;
  } | null;
  onUpdateFile?: (file: { name: string; content: string; path: string }) => void;
}

export function CodeEditor({ file, onUpdateFile }: CodeEditorProps) {
  const [content, setContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const editorRef = useRef<any>(null);

  useEffect(() => {
    if (file && file.type === 'file') {
      setContent(file.content || '');
    } else {
      setContent('');
    }
  }, [file]);

  const handleSave = () => {
    if (file && onUpdateFile) {
      onUpdateFile({
        name: file.name,
        content,
        path: file.path
      });
    }
    setIsEditing(false);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
  };

  const getLanguage = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'tsx':
      case 'ts':
        return 'typescript';
      case 'jsx':
      case 'js':
        return 'javascript';
      case 'css':
        return 'css';
      case 'html':
        return 'html';
      case 'json':
        return 'json';
      case 'md':
        return 'markdown';
      default:
        return 'text';
    }
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'tsx':
      case 'ts':
      case 'jsx':
      case 'js':
        return '🔷';
      case 'css':
        return '🎨';
      case 'html':
        return '🌐';
      case 'json':
        return '📄';
      case 'md':
        return '📝';
      default:
        return '📄';
    }
  };

  if (!file) {
    return (
      <div className="h-full flex items-center justify-center bg-[#0B0D0E]">
        <div className="text-center text-gray-400">
          <div className="mb-6 text-gray-600">
            <svg className="w-20 h-20 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-200 mb-2">No file selected</h3>
          <p className="text-sm text-gray-500">Select a file to view or edit its contents</p>
        </div>
      </div>
    );
  }

  if (file.type === 'folder') {
    return (
      <div className="h-full flex items-center justify-center bg-[#0B0D0E]">
        <div className="text-center text-gray-400">
          <div className="mb-6 text-gray-600">
            <svg className="w-20 h-20 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-200 mb-2">Folder selected</h3>
          <p className="text-sm text-gray-500">Select a file to view its contents</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#0B0D0E]">
      {/* Header - Modern ChatGPT-style */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-gradient-to-r from-[#0B0D0E] to-[#0F1215]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center border border-blue-500/20">
            <span className="text-lg">{getFileIcon(file.name)}</span>
          </div>
          <div>
            <h3 className="text-white font-medium text-sm">{file.name}</h3>
            <p className="text-xs text-gray-500">{file.path}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="group relative px-3 py-1.5 flex items-center gap-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-all duration-200 border border-white/5"
            title="Copy content"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">Copy</span>
              </>
            )}
          </button>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-3 py-1.5 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-all duration-200 shadow-lg shadow-blue-500/20"
          >
            {isEditing ? '👁️ View' : '✏️ Edit'}
          </button>
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1 overflow-hidden">
        {isEditing ? (
          <div className="h-full flex flex-col">
            <Editor
              height="100%"
              language={getLanguage(file.name)}
              value={content}
              onChange={(value) => setContent(value || '')}
              onMount={handleEditorDidMount}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                wordWrap: 'on',
                padding: { top: 16, bottom: 16 },
                fontFamily: '"SF Mono", Monaco, Menlo, "Ubuntu Mono", Consolas, monospace',
                cursorBlinking: 'smooth',
                cursorSmoothCaretAnimation: 'on',
                smoothScrolling: true,
                contextmenu: true,
                fontLigatures: true,
                renderLineHighlight: 'all',
                selectOnLineNumbers: true,
                roundedSelection: true,
                readOnly: false,
                cursorStyle: 'line',
                suggest: {
                  showKeywords: true,
                  showSnippets: true,
                }
              }}
            />
            <div className="px-4 py-3 border-t border-white/5 bg-[#0B0D0E] flex items-center justify-between">
              <p className="text-xs text-gray-500">Press Cmd+S to save</p>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg transition-all duration-200 shadow-lg shadow-emerald-500/20"
              >
                💾 Save Changes
              </button>
            </div>
          </div>
        ) : (
          <div className="h-full">
            <Editor
              height="100%"
              language={getLanguage(file.name)}
              value={content || '// File is empty'}
              theme="vs-dark"
              options={{
                readOnly: true,
                minimap: { enabled: false },
                fontSize: 13,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                wordWrap: 'on',
                padding: { top: 16, bottom: 16 },
                fontFamily: '"SF Mono", Monaco, Menlo, "Ubuntu Mono", Consolas, monospace',
                contextmenu: false,
                fontLigatures: true,
                renderLineHighlight: 'none',
                scrollbar: {
                  vertical: 'auto',
                  horizontal: 'auto',
                  verticalScrollbarSize: 10,
                  horizontalScrollbarSize: 10,
                }
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}