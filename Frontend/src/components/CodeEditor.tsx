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
  const [saved, setSaved] = useState(false);
  const editorRef = useRef<any>(null);

  useEffect(() => {
    if (file && file.type === 'file') {
      setContent(file.content || '');
      setSaved(false);
    } else {
      setContent('');
    }
  }, [file]);

  // Cmd+S to save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (isEditing) {
          handleSave();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditing, content, file]);

  const handleSave = () => {
    if (file && onUpdateFile) {
      onUpdateFile({
        name: file.name,
        content,
        path: file.path
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;

    // Define custom dark theme
    monaco.editor.defineTheme('bolt-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'C586C0' },
        { token: 'string', foreground: 'CE9178' },
        { token: 'number', foreground: 'B5CEA8' },
        { token: 'type', foreground: '4EC9B0' },
        { token: 'function', foreground: 'DCDCAA' },
        { token: 'variable', foreground: '9CDCFE' },
      ],
      colors: {
        'editor.background': '#0B0D0E',
        'editor.foreground': '#D4D4D4',
        'editor.lineHighlightBackground': '#1A1D23',
        'editorLineNumber.foreground': '#495162',
        'editorLineNumber.activeForeground': '#858585',
        'editor.selectionBackground': '#264F78',
        'editor.inactiveSelectionBackground': '#3A3D41',
        'editorCursor.foreground': '#60A5FA',
        'editor.findMatchBackground': '#515C6A',
        'editor.findMatchHighlightBackground': '#EA5C0055',
        'editorBracketMatch.background': '#0064001a',
        'editorBracketMatch.border': '#888888',
      },
    });
    monaco.editor.setTheme('bolt-dark');
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
      {/* Header - Modern Bolt-style */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#0B0D0E] backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center border border-blue-500/30 shadow-lg shadow-blue-500/10">
            <span className="text-xl">{getFileIcon(file.name)}</span>
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm tracking-tight">{file.name}</h3>
            <p className="text-xs text-gray-400 font-mono">{file.path}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {isEditing && saved && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="text-xs text-emerald-400 flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20"
            >
              <Check className="w-3 h-3" />
              Saved
            </motion.span>
          )}
          <button
            onClick={handleCopy}
            className="group relative px-3 py-1.5 flex items-center gap-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-all duration-200 border border-white/10 hover:border-white/20"
            title="Copy content"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs font-medium">Copied</span>
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
            className="px-3 py-1.5 flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-xs font-medium rounded-lg transition-all duration-200 shadow-lg shadow-blue-500/30"
          >
            {isEditing ? (
              <>
                <span>👁️</span>
                <span>View</span>
              </>
            ) : (
              <>
                <span>✏️</span>
                <span>Edit</span>
              </>
            )}
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
              theme="bolt-dark"
              options={{
                minimap: { enabled: true, scale: 1, showSlider: 'mouseover' },
                fontSize: 14,
                lineHeight: 22,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                wordWrap: 'on',
                padding: { top: 20, bottom: 20 },
                fontFamily: '"JetBrains Mono", "Fira Code", "SF Mono", Monaco, Menlo, Consolas, monospace',
                fontWeight: '400',
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
                cursorWidth: 2,
                bracketPairColorization: { enabled: true },
                guides: {
                  bracketPairs: true,
                  indentation: true,
                },
                suggest: {
                  showKeywords: true,
                  showSnippets: true,
                  preview: true,
                },
                quickSuggestions: {
                  other: true,
                  comments: false,
                  strings: true,
                },
                inlineSuggest: { enabled: true },
                formatOnPaste: true,
                formatOnType: true,
              }}
            />
            <div className="px-4 py-3 border-t border-white/10 bg-[#0B0D0E] backdrop-blur-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <p className="text-xs text-gray-400">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/5 rounded border border-white/10">
                    <span className="font-semibold">⌘ S</span>
                  </span>
                  <span className="ml-2">to save</span>
                </p>
                {content !== file?.content && (
                  <span className="text-xs text-orange-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-pulse"></span>
                    Modified
                  </span>
                )}
              </div>
              <button
                onClick={handleSave}
                disabled={saved}
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 disabled:from-gray-600 disabled:to-gray-700 text-white text-xs font-medium rounded-lg transition-all duration-200 shadow-lg shadow-emerald-500/30 disabled:shadow-none flex items-center gap-2"
              >
                {saved ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Saved</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="h-full">
            <Editor
              height="100%"
              language={getLanguage(file.name)}
              value={content || '// File is empty'}
              theme="bolt-dark"
              options={{
                readOnly: true,
                minimap: { enabled: true, scale: 1, showSlider: 'mouseover' },
                fontSize: 14,
                lineHeight: 22,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                wordWrap: 'on',
                padding: { top: 20, bottom: 20 },
                fontFamily: '"JetBrains Mono", "Fira Code", "SF Mono", Monaco, Menlo, Consolas, monospace',
                fontWeight: '400',
                contextmenu: false,
                fontLigatures: true,
                renderLineHighlight: 'none',
                guides: {
                  bracketPairs: false,
                  indentation: true,
                },
                scrollbar: {
                  vertical: 'auto',
                  horizontal: 'auto',
                  verticalScrollbarSize: 12,
                  horizontalScrollbarSize: 12,
                }
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}