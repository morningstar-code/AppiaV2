import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { BuilderLayout } from '../components/BuilderLayout';
import { PreviewFrame } from '../components/PreviewFrame';
import { FilesDrawer } from '../components/FilesDrawer';
import { CodeEditor } from '../components/CodeEditor';
import { CommandPalette } from '../components/CommandPalette';
import { PublishModal } from '../components/PublishModal';
import { ChatRail } from '../components/ChatRail';
import { FileItem, EnhancedChatMessage } from '../types/index';
import { sendChatMessage } from '../services/api';
import { API_URL } from '../config';
import { useWebContainer } from '../hooks/useWebContainer';
import { useAppContext } from '../context/AppContext';

export const NewBuilder: React.FC = () => {
  let auth, isSignedIn, user;
  try {
    auth = useAuth();
    isSignedIn = auth?.isSignedIn;
    user = (auth as any)?.user;
  } catch (e) {
    // Clerk not configured, continue without auth
    isSignedIn = false;
    user = null;
  }
  const { prompt: initialPrompt } = useAppContext();

  const [chatMessages, setChatMessages] = useState<Array<{
    id: string;
    role: 'user' | 'assistant';
    text: string;
    imageUrls?: string[];
    tokens?: { input: number; output: number };
  }>>([]);
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [files, setFiles] = useState<any[]>([]);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState('');
  const [deviceFrame, setDeviceFrame] = useState<'Desktop' | 'iPad' | 'iPhone 16'>('Desktop');
  const [zoomLevel, setZoomLevel] = useState(80);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [showFileModal, setShowFileModal] = useState(false);
  const hasAutoPrompted = useRef(false);


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

      // Prepare request data
      const requestData: any = {
        userText: message.text,
        language: 'react',
        userId: user?.id || 'anonymous',
        messages: chatMessages, // Pass conversation history for agent memory
        projectId: 'current-project'
      };

      if (message.imageUrls && message.imageUrls.length > 0) {
        requestData.imageUrl = message.imageUrls[0];
      }
      
      const response = await sendChatMessage(requestData);

      if (response.status === 200) {
        
        // Extract clean conversational text without any XML artifacts
        let conversationalText = response.data.response || '';
        
        // Extract text that appears BEFORE any XML tags
        const beforeArtifact = conversationalText.split(/<boltArtifact/)[0];
        
        // If there's substantial text before the artifact, use that
        if (beforeArtifact && beforeArtifact.trim().length > 10) {
          conversationalText = beforeArtifact.trim();
        } else {
          // Otherwise, remove all XML completely
          conversationalText = conversationalText
            .replace(/<boltArtifact[^>]*>[\s\S]*?<\/boltArtifact>/gi, '')
            .replace(/<boltAction[^>]*>[\s\S]*?<\/boltAction>/gi, '')
            .replace(/<bolt[A-Za-z]*[^>]*>[\s\S]*?<\/bolt[A-Za-z]*>/gi, '')
            .replace(/```[a-z]*\n[\s\S]*?```/g, '') // Remove code blocks too
            .trim();
          
          // If still empty or too short, use a nice default
          if (!conversationalText || conversationalText.length < 5) {
            conversationalText = "✨ Created! Check the preview above.";
          }
        }
        
        // Final cleanup
        conversationalText = conversationalText
          .replace(/\n{3,}/g, '\n\n')
          .trim();
        
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

        // Process patches for file updates
        const patch = response.data.patch;

        if (patch && patch.ops && Array.isArray(patch.ops)) {
          const newFiles: any[] = [];
          let htmlContent = '';
          let cssContent = '';
          let jsContent = '';

          // First pass: collect all files
          for (const op of patch.ops) {
            if (op.type === 'editFile' && op.path && op.replace) {
              const fileName = op.path.split('/').pop() || op.path;
              const newFile = {
                name: fileName,
                type: 'file',
                content: op.replace,
                path: op.path,
              };

              // Track HTML, CSS, JS for preview
              if (op.path === 'index.html' || fileName === 'index.html') {
                htmlContent = op.replace;
              } else if (op.path === 'styles.css' || fileName === 'styles.css' || op.path.endsWith('.css')) {
                cssContent = op.replace;
              } else if (op.path === 'script.js' || fileName === 'script.js' || op.path.endsWith('.js')) {
                jsContent = op.replace;
              }

              newFiles.push(newFile);
            }
          }

          // Update files state
          setFiles(newFiles);

          // Create preview for HTML projects
          if (htmlContent) {
            let fullHtml = htmlContent;

            // Inject CSS if present
            if (cssContent) {
              if (fullHtml.includes('</head>')) {
                fullHtml = fullHtml.replace('</head>', `<style>${cssContent}</style></head>`);
              } else {
                fullHtml = `<style>${cssContent}</style>` + fullHtml;
              }
            }

            // Inject JS if present
            if (jsContent) {
              if (fullHtml.includes('</body>')) {
                fullHtml = fullHtml.replace('</body>', `<script>${jsContent}</script></body>`);
              } else {
                fullHtml += `<script>${jsContent}</script>`;
              }
            }

            // Create data URL for iframe preview
            const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(fullHtml)}`;
            setPreviewUrl(dataUrl);
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
            tokensUsed: response.data.usage.totalTokens,
            metadata: {
              inputTokens: response.data.usage.inputTokens,
              outputTokens: response.data.usage.outputTokens,
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

  // Auto-send initial prompt from home page
  useEffect(() => {
    if (initialPrompt && !hasAutoPrompted.current && !loading && chatMessages.length === 0) {
      hasAutoPrompted.current = true;
      handleSendMessage({
        role: 'user',
        text: initialPrompt
      });
    }
  }, [initialPrompt, loading, chatMessages.length]);

  const handlePublish = async () => {
    try {
      const projectId = `project-${Date.now()}`;
          setIsPublished(true);
      setPublishedUrl(`${window.location.origin}/published/${projectId}`);
    } catch (error) {
      console.error('Publish failed:', error);
    }
  };

  const handleDeviceChange = (device: string) => {
    setDeviceFrame(device as 'Desktop' | 'iPad' | 'iPhone 16');
  };

  const handleZoomChange = (zoom: number) => {
    setZoomLevel(zoom);
  };

  const handleFileSelect = (file: any) => {
    setSelectedFile(file);
    setShowFileModal(true);
  };

  return (
    <>
      <BuilderLayout
        chatRail={
          <ChatRail
            messages={chatMessages}
            onSendMessage={handleSendMessage}
            isLoading={loading}
          />
        }
        previewCanvas={
          previewUrl ? (
            <div className="w-full h-full bg-[#0B0D0E] flex items-center justify-center p-8">
              {/* Device frames */}
              {deviceFrame === 'iPhone 16' ? (
                <div
                  className="relative rounded-[48px] bg-black shadow-2xl border-[6px] border-[#1f1f1f]"
                  style={{
                    width: 393,
                    height: 852,
                    transform: `scale(${zoomLevel / 100})`,
                  }}
                >
                  {/* Notch */}
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 w-40 h-7 bg-black rounded-3xl border border-[#1f1f1f]" />
                  {/* Screen */}
                  <div className="absolute inset-[10px] rounded-[40px] overflow-hidden bg-[#111318]">
                    <iframe
                      src={previewUrl}
                      className="w-full h-full border-0 bg-[#111318]"
                      title="Preview"
                      sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                    />
                  </div>
                </div>
              ) : (
                <div 
                  className="bg-[#111318] shadow-2xl rounded-xl overflow-hidden transition-all duration-300 border border-white/10"
                  style={{
                    width: deviceFrame === 'Desktop' ? '100%' : deviceFrame === 'iPad' ? 820 : 1200,
                    height: deviceFrame === 'Desktop' ? '100%' : deviceFrame === 'iPad' ? 1180 : 800,
                    maxWidth: '100%',
                    maxHeight: '100%',
                    transform: `scale(${zoomLevel / 100})`
                  }}
                >
                  <iframe
                    src={previewUrl}
                    className="w-full h-full border-0 bg-[#111318]"
                    title="Preview"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">⚡</div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">Ready to build</h3>
                <p className="text-sm text-gray-500">Start a conversation to create your project</p>
              </div>
            </div>
          )
        }
        filesDrawer={
          <FilesDrawer
            files={files}
            onFileSelect={handleFileSelect}
            onClose={() => {}}
          />
        }
        commandPalette={
          <CommandPalette
            onClose={() => {}}
            onFileSelect={() => {}}
            onDeviceChange={handleDeviceChange}
            onToggleFiles={() => {}}
          />
        }
        onPublishClick={() => setShowPublishModal(true)}
        onDeviceChange={handleDeviceChange}
        onZoomChange={handleZoomChange}
        zoomLevel={zoomLevel}
      />
      
      <PublishModal
        isOpen={showPublishModal}
        onClose={() => setShowPublishModal(false)}
        onPublish={handlePublish}
        isPublished={isPublished}
        publishedUrl={publishedUrl}
        files={files.reduce((acc, file) => {
          acc[file.path] = file.content || '';
          return acc;
        }, {} as Record<string, string>)}
      />

      {/* File Content Modal */}
      {showFileModal && selectedFile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#1A1D23] rounded-lg w-[80vw] h-[80vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h3 className="text-white text-lg font-medium">{selectedFile.name}</h3>
              <button
                onClick={() => setShowFileModal(false)}
                className="text-gray-400 hover:text-white text-xl"
              >
                ×
              </button>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-auto p-4">
              <pre className="text-gray-300 text-sm whitespace-pre-wrap font-mono">
                {selectedFile.content || 'No content available'}
              </pre>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
