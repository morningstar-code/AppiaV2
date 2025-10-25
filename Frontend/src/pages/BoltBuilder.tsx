import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { FileItem, EnhancedChatMessage } from '../types/index';
import { sendChatMessage } from '../services/api';
import { API_URL } from '../config';
import { useAppContext } from '../context/AppContext';
import { ChatPanel } from '../components/bolt/ChatPanel';
import { EditorPanel } from '../components/bolt/EditorPanel';
import { PreviewPanel } from '../components/bolt/PreviewPanel';
import { BuildLog } from '../components/bolt/BuildLog';
import { useFileSystem } from '../hooks/useFileSystem';
import { usePersistence } from '../hooks/usePersistence';
import { useWebContainerPreview } from '../hooks/useWebContainerPreview';

export const BoltBuilder: React.FC = () => {
  let auth, isSignedIn, user;
  try {
    auth = useAuth();
    isSignedIn = auth?.isSignedIn;
    user = (auth as any)?.user;
  } catch (e) {
    isSignedIn = false;
    user = null;
  }
  
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
    const session = loadSession();
    if (session) {
      setChatMessages(session.messages || []);
      // Restore files
    }
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
        userId: user?.id || 'anonymous',
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
          
          addBuildLog('build', 'Built the project');
          
          // Build with WebContainer if enabled
          if (useWebContainer && patch.ops.length > 0) {
            const allFiles = files.map(f => ({
              name: f.name,
              type: f.type as 'file' | 'folder',
              path: f.path,
              content: f.content
            }));
            
            buildProject(allFiles);
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
                userId: user?.id || 'anonymous',
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

      {/* Main 2-column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Chat + Build Logs */}
        <div className="w-[360px] flex flex-col border-r border-[#27272A] bg-[#18181B] flex-shrink-0">
          <div className="flex-1 overflow-hidden">
            <ChatPanel 
              messages={chatMessages}
              onSendMessage={handleSendMessage}
              isLoading={loading}
            />
          </div>
          <BuildLog logs={buildLogs} />
        </div>
        
        {/* Right Panel - Code Tab + Preview */}
        <div className="flex-1 flex flex-col bg-[#09090B] overflow-hidden">
          {/* Icon Tab Bar - Bolt Style */}
          <div className="h-14 bg-[#18181B] border-b border-[#27272A] flex items-center justify-center gap-2">
            <button className="w-12 h-12 bg-[#27272A] hover:bg-[#3F3F46] rounded-xl flex items-center justify-center text-blue-400 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
            <button className="w-12 h-12 bg-transparent hover:bg-[#27272A] rounded-xl flex items-center justify-center text-gray-400 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </button>
            <button className="w-12 h-12 bg-transparent hover:bg-[#27272A] rounded-xl flex items-center justify-center text-gray-400 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
              </svg>
            </button>
            <button className="w-12 h-12 bg-transparent hover:bg-[#27272A] rounded-xl flex items-center justify-center text-gray-400 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
          
          {/* Code Tab Label */}
          <div className="h-10 bg-[#18181B] border-b border-[#27272A] flex items-center px-4">
            <button className="px-3 py-1.5 bg-[#3B82F6] text-white text-xs font-medium rounded-md flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              <span>Code</span>
            </button>
          </div>
          
          {/* Content Area - Split View */}
          <div className="flex-1 flex overflow-hidden">
            {/* Editor Section (Left Half) */}
            <div className="flex-1 flex flex-col border-r border-[#27272A] bg-[#09090B]">
              <EditorPanel
                files={files}
                selectedFile={selectedFile}
                onFileSelect={selectFile}
                onFileUpdate={handleFileUpdate}
              />
            </div>
            
            {/* Preview Section (Right Half) */}
            <div className="flex-1 flex flex-col bg-[#09090B]">
              <PreviewPanel previewUrl={webContainerUrl || previewUrl} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
