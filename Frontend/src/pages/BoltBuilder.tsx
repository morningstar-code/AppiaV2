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
  const [useWebContainer, setUseWebContainer] = useState(true);
  const [expoSnackUrl, setExpoSnackUrl] = useState<string>('');
  const [isReactNativeProject, setIsReactNativeProject] = useState(false);
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
  
  const publishToExpoSnack = async (projectFiles: any[]) => {
    try {
      addBuildLog('build', '📱 Creating Expo Snack URL...');
      
      const snackFiles: Record<string, { type: 'CODE', contents: string }> = {};
      
      projectFiles.forEach(file => {
        if (file.content && !file.path.startsWith('web-preview/')) {
          snackFiles[file.path] = {
            type: 'CODE',
            contents: file.content
          };
        }
      });

      // Ensure required RN deps exist for Snack
      const pkgKey = Object.keys(snackFiles).find(k => k.toLowerCase() === 'package.json');
      if (pkgKey) {
        try {
          const pkg = JSON.parse(snackFiles[pkgKey].contents);
          pkg.dependencies = pkg.dependencies || {};
          const ensure = (name: string, ver: string) => { if (!pkg.dependencies[name]) pkg.dependencies[name] = ver; };
          // React Navigation & peers
          ensure('@react-navigation/native', '^6.1.0');
          ensure('@react-navigation/stack', '^6.3.0');
          ensure('react-native-gesture-handler', '~2.9.0');
          ensure('react-native-reanimated', '~2.14.4');
          ensure('react-native-safe-area-context', '4.5.0');
          ensure('react-native-screens', '~3.20.0');
          // Deck swiper if used
          const usesDeckSwiper = Object.keys(snackFiles).some(k => snackFiles[k].contents?.includes('react-native-deck-swiper'));
          if (usesDeckSwiper) ensure('react-native-deck-swiper', '^2.0.5');
          snackFiles[pkgKey].contents = JSON.stringify(pkg, null, 2);
        } catch {}
      }

      const snackData = {
        name: 'Appia Generated App',
        description: 'Created with Appia Builder',
        sdkVersion: '48.0.0',
        files: snackFiles
      } as any;

      const encoded = encodeURIComponent(JSON.stringify(snackData));
      const snackUrl = `https://snack.expo.dev?data=${encoded}`;
      setExpoSnackUrl(snackUrl);
      addBuildLog('build', `✅ Snack URL ready: ${snackUrl}`);
      return snackUrl;
    } catch (error) {
      console.error('Expo Snack error:', error);
      addBuildLog('build', '❌ Expo Snack error');
    }
    return null;
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
            setIsReactNativeProject(true);
            addBuildLog('build', '📱 React Native/Expo project detected');
            
            // Collect files for Expo Snack
            const projectFiles = patch.ops
              .filter((op: any) => op.type === 'editFile' && op.path && op.replace)
              .map((op: any) => ({
                path: op.path,
                content: op.replace,
                name: op.path.split('/').pop()
              }));
            
            // Publish to Expo Snack for preview
            await publishToExpoSnack(projectFiles);
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
              <span className="text-xs font-medium text-gray-400">{isReactNativeProject ? 'Expo Snack Preview' : 'Preview'}</span>
              <div className="flex items-center gap-2">
                {isReactNativeProject && expoSnackUrl && (
                  <a
                    href={expoSnackUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2 py-1 text-[10px] bg-[#27272A] hover:bg-[#3F3F46] text-gray-300 rounded flex items-center gap-1 transition-colors"
                    title="Open Expo Snack QR Code"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                    QR Code
                  </a>
                )}
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
