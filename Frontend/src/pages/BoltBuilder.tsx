import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { FileItem, EnhancedChatMessage } from '../types/index';
import { sendChatMessage } from '../services/api';
import { API_URL } from '../config';
import { useAppContext } from '../context/AppContext';
import { ChatPanel } from '../components/bolt/ChatPanel';
import { EditorPanel } from '../components/bolt/EditorPanel';
import { FilesPanel } from '../components/bolt/FilesPanel';
import { PreviewPanel } from '../components/bolt/PreviewPanel';
import { BuildLog } from '../components/bolt/BuildLog';
import { useFileSystem } from '../hooks/useFileSystem';
import { usePersistence } from '../hooks/usePersistence';
import { useWebContainerPreview } from '../hooks/useWebContainerPreview';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { ResizablePanel } from '../components/ResizablePanel';

export const BoltBuilder: React.FC = () => {
  // Import useUser from Clerk for proper user ID retrieval
  const { user } = useAuth() as any;
  const isSignedIn = !!user;
  
  // Get or create persistent user ID
  const getUserId = () => {
    if (user?.id) {
      // Store Clerk user ID in localStorage for persistence
      localStorage.setItem('userId', user.id);
      return user.id;
    }
    // Fallback to localStorage or create anonymous ID
    let userId = localStorage.getItem('userId');
    if (!userId) {
      userId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('userId', userId);
    }
    return userId;
  };
  
  const { prompt: initialPrompt } = useAppContext();
  const { files, addFile, updateFile, deleteFile, selectFile, selectedFile } = useFileSystem();
  const { saveSession, loadSession } = usePersistence();
  const { previewUrl: webContainerUrl, buildProject, loading: webContainerLoading, logs: webContainerLogs } = useWebContainerPreview();
  
  const [chatMessages, setChatMessages] = useState<Array<{
    id: string;
    role: 'user' | 'assistant';
    text: string;
    imageUrls?: string[];
    tokens?: { input: number; output: number };
  }>>([]);
  
  const [buildLogs, setBuildLogs] = useState<Array<{
    id: string;
    type: 'read' | 'edit' | 'create' | 'build' | 'install';
    message: string;
    timestamp: Date;
  }>>([]);
  
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [useWebContainer, setUseWebContainer] = useState(true); // ENABLED with credentialless COEP
  const hasAutoPrompted = useRef(false);
  
  // Load persisted session
  useEffect(() => {
    const loadData = async () => {
      const session = await loadSession();
      if (session) {
        setChatMessages(session.messages || []);
        // Restore files
        if (session.files && session.files.length > 0) {
          session.files.forEach((file: any) => addFile(file));
        }
      }
    };
    loadData();
  }, []);
  
  // Persist session on changes
  useEffect(() => {
    saveSession({ messages: chatMessages, files });
  }, [chatMessages, files]);
  
  const addBuildLog = (type: 'read' | 'edit' | 'create' | 'build' | 'install', message: string) => {
    setBuildLogs(prev => [...prev, {
      id: Date.now().toString(),
      type,
      message,
      timestamp: new Date()
    }]);
  };
  
  const handleSendMessage = async (message: { role: 'user'; text: string; imageUrls?: string[] }) => {
    try {
      const newUserMessage = {
        id: Date.now().toString(),
        role: 'user' as const,
        text: message.text,
        imageUrls: message.imageUrls,
      };
      
      setChatMessages((prev) => [...prev, newUserMessage]);
      setLoading(true);
      setBuildLogs([]);
      
      const requestData: any = {
        userText: message.text,
        language: 'react',
        userId: getUserId(),
        messages: chatMessages,
        projectId: 'current-project'
      };
      
      if (message.imageUrls && message.imageUrls.length > 0) {
        requestData.imageUrl = message.imageUrls[0];
      }
      
      const response = await sendChatMessage(requestData);
      
      if (response.status === 200) {
        // Extract conversational text
        let conversationalText = response.data.response || '';
        const beforeArtifact = conversationalText.split(/<boltArtifact/)[0];
        
        if (beforeArtifact && beforeArtifact.trim().length > 10) {
          conversationalText = beforeArtifact.trim();
        } else {
          conversationalText = conversationalText
            .replace(/<boltArtifact[^>]*>[\s\S]*?<\/boltArtifact>/gi, '')
            .replace(/<boltAction[^>]*>[\s\S]*?<\/boltAction>/gi, '')
            .replace(/<bolt[A-Za-z]*[^>]*>[\s\S]*?<\/bolt[A-Za-z]*>/gi, '')
            .replace(/```[a-z]*\n[\s\S]*?```/g, '')
            .trim();
          
          if (!conversationalText || conversationalText.length < 5) {
            conversationalText = "✨ Done!";
          }
        }
        
        const aiMessage = {
          id: Date.now().toString(),
          role: 'assistant' as const,
          text: conversationalText,
          tokens: response.data.usage ? {
            input: response.data.usage.input_tokens || 0,
            output: response.data.usage.output_tokens || 0
          } : undefined
        };
        
        setChatMessages((prev) => [...prev, aiMessage]);
        
        // Process file changes with build logs
        const patch = response.data.patch;
        
        if (patch && patch.ops && Array.isArray(patch.ops)) {
          let htmlContent = '';
          let cssContent = '';
          let jsContent = '';
          
          for (const op of patch.ops) {
            if (op.type === 'editFile' && op.path && op.replace) {
              const fileName = op.path.split('/').pop() || op.path;
              
              // Add build log
              const existingFile = files.find(f => f.path === op.path);
              if (existingFile) {
                addBuildLog('edit', `Edited ${fileName}`);
              } else {
                addBuildLog('create', `Created ${fileName}`);
              }
              
              // Add or update file
              addFile({
                name: fileName,
                type: 'file',
                content: op.replace,
                path: op.path,
              });
              
              // Track HTML, CSS, JS
              if (op.path === 'index.html' || fileName === 'index.html') {
                htmlContent = op.replace;
              } else if (op.path.endsWith('.css')) {
                cssContent = op.replace;
              } else if (op.path.endsWith('.js')) {
                jsContent = op.replace;
              }
            }
          }
          
          addBuildLog('build', 'Building project...');
          
          // Check if this is a React Native/Expo project
          const isReactNative = patch.ops.some((op: any) => 
            op.path === 'app.json' || 
            op.path === 'App.tsx' ||
            (op.replace && (op.replace.includes('react-native') || op.replace.includes('expo')))
          );
          
          if (isReactNative) {
            addBuildLog('build', '⚠️ React Native/Expo detected - WebContainer not supported');
            addBuildLog('build', '📱 Use Expo Go app to preview on mobile');
            addBuildLog('build', '🔗 Or deploy to Expo Snack for browser preview');
          } else if (useWebContainer && patch.ops.length > 0) {
            // Use setTimeout to ensure state has updated before building
            setTimeout(() => {
              const allFiles: any[] = [];
              
              // Collect ALL files including newly created ones
              for (const op of patch.ops) {
                if (op.type === 'editFile' && op.path && op.replace) {
                  allFiles.push({
                    name: op.path.split('/').pop() || op.path,
                    type: 'file' as const,
                    path: op.path,
                    content: op.replace
                  });
                }
              }
              
              // Merge with existing files
              files.forEach(f => {
                if (!allFiles.find(af => af.path === f.path)) {
                  allFiles.push({
                    name: f.name,
                    type: f.type as 'file' | 'folder',
                    path: f.path,
                    content: f.content
                  });
                }
              });
              
              if (allFiles.length > 0) {
                console.log('🚀 Building with', allFiles.length, 'files');
                buildProject(allFiles);
              }
            }, 100);
          } else {
            // Fallback to static preview
            if (htmlContent) {
              let fullHtml = htmlContent;
              
              if (cssContent) {
                if (fullHtml.includes('</head>')) {
                  fullHtml = fullHtml.replace('</head>', `<style>${cssContent}</style></head>`);
                } else {
                  fullHtml = `<style>${cssContent}</style>` + fullHtml;
                }
              }
              
              if (jsContent) {
                if (fullHtml.includes('</body>')) {
                  fullHtml = fullHtml.replace('</body>', `<script>${jsContent}</script></body>`);
                } else {
                  fullHtml += `<script>${jsContent}</script>`;
                }
              }
              
              const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(fullHtml)}`;
              setPreviewUrl(dataUrl);
            }
          }
        }
        
        // Track usage
        if (response.data.usage) {
          try {
            await fetch(`${API_URL}/usage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: getUserId(),
                actionType: 'chat_generation',
                tokensUsed: response.data.usage.input_tokens + response.data.usage.output_tokens,
                metadata: {
                  inputTokens: response.data.usage.input_tokens,
                  outputTokens: response.data.usage.output_tokens,
                  model: 'claude-3-haiku-20240307'
                }
              }),
            });
          } catch (err) {
            console.error('Usage tracking failed:', err);
          }
        }
      }
    } catch (error: any) {
      console.error('❌ Error:', error.message);
      const errorMessage = {
        id: Date.now().toString(),
        role: 'assistant' as const,
        text: 'Sorry, something went wrong. Please try again.',
      };
      setChatMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };
  
  // Auto-send initial prompt
  useEffect(() => {
    if (initialPrompt && !hasAutoPrompted.current && !loading && chatMessages.length === 0) {
      hasAutoPrompted.current = true;
      handleSendMessage({
        role: 'user',
        text: initialPrompt
      });
    }
  }, [initialPrompt, loading, chatMessages.length]);
  
  const handleFileUpdate = (path: string, content: string) => {
    updateFile(path, content);
    addBuildLog('edit', `Edited ${path.split('/').pop()}`);
  };

  const handleRebuild = useCallback(() => {
    if (files.length > 0) {
      setBuildLogs([]);
      addBuildLog('build', 'Rebuilding project...');
      const allFiles = files.map(f => ({
        name: f.name,
        type: f.type as 'file' | 'folder',
        path: f.path,
        content: f.content
      }));
      buildProject(allFiles);
    }
  }, [files, buildProject]);

  const handleClearChat = useCallback(() => {
    setChatMessages([]);
    setBuildLogs([]);
  }, []);

  const handleSaveFile = useCallback(() => {
    if (selectedFile) {
      console.log('✅ File saved:', selectedFile.path);
      // Auto-saved in real-time via Monaco
    }
  }, [selectedFile]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onBuild: handleRebuild,
    onClearChat: handleClearChat,
    onSave: handleSaveFile,
  });
  
  return (
    <div className="h-screen overflow-hidden bg-[#18181B] text-gray-100 flex flex-col">
      {/* Top Header Bar */}
      <div className="h-12 bg-[#18181B] border-b border-[#27272A] flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-gradient-to-br from-purple-500 to-blue-500 rounded-md flex items-center justify-center">
            <span className="text-white text-sm font-bold">A</span>
          </div>
          <span className="text-white text-sm font-medium">Appia Builder</span>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 bg-white text-black text-sm font-medium rounded-md hover:bg-gray-200 transition-colors">
            Publish
          </button>
        </div>
      </div>

      {/* Main 3-pane Resizable Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Chat + Build Logs (Resizable) */}
        <ResizablePanel 
          defaultWidth={360} 
          minWidth={280} 
          maxWidth={600}
          side="left"
          className="flex flex-col border-r border-[#27272A] bg-[#18181B]"
        >
          <div className="flex-1 overflow-hidden">
            <ChatPanel 
              messages={chatMessages}
              onSendMessage={handleSendMessage}
              isLoading={loading}
            />
          </div>
          <BuildLog logs={buildLogs} terminalOutput={webContainerLogs} />
        </ResizablePanel>
        
        {/* Middle + Right Panel - Files/Editor + Preview (Resizable Split) */}
        <div className="flex-1 flex bg-[#09090B] overflow-hidden">
          {/* Show standalone Files panel when no file selected, or Editor with embedded files panel when file is selected */}
          {!selectedFile ? (
            <ResizablePanel
              defaultWidth={280}
              minWidth={200}
              maxWidth={500}
              side="left"
              className="border-r border-[#27272A]"
            >
              <FilesPanel
                files={files}
                onFileSelect={selectFile}
                selectedFile={selectedFile}
              />
            </ResizablePanel>
          ) : (
            <ResizablePanel
              defaultWidth={window.innerWidth * 0.35}
              minWidth={450}
              maxWidth={window.innerWidth * 0.65}
              side="left"
              className="border-r border-[#27272A]"
            >
              <EditorPanel
                files={files}
                selectedFile={selectedFile}
                onFileSelect={selectFile}
                onFileUpdate={handleFileUpdate}
                onCloseEditor={() => selectFile(null)}
              />
            </ResizablePanel>
          )}
          
          {/* Preview Panel - Auto-expands when editor is hidden */}
          <div className="flex-1 flex flex-col">
            <div className="h-10 bg-[#18181B] border-b border-[#27272A] flex items-center px-4 justify-between">
              <span className="text-xs font-medium text-gray-400">Preview</span>
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleRebuild}
                  className="px-2 py-1 text-[10px] bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded flex items-center gap-1 transition-colors"
                  title="⌘+Enter to rebuild"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Rebuild
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <PreviewPanel previewUrl={webContainerUrl || previewUrl} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
