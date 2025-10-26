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
import { useSearchParams } from 'react-router-dom';

// Helper: Convert flat file list to tree structure
const buildFileTree = (flatFiles: any[]): FileItem[] => {
  const root: Map<string, FileItem> = new Map();
  
  flatFiles.forEach(file => {
    const pathParts = file.path.split('/');
    let currentLevel = root;
    
    pathParts.forEach((part: string, index: number) => {
      const isFile = index === pathParts.length - 1;
      const fullPath = pathParts.slice(0, index + 1).join('/');
      
      if (!currentLevel.has(part)) {
        const item: FileItem = {
          name: part,
          type: isFile ? 'file' : 'folder',
          path: fullPath,
          content: isFile ? file.content : undefined,
          children: isFile ? undefined : []
        };
        currentLevel.set(part, item);
      }
      
      if (!isFile) {
        const folder = currentLevel.get(part)!;
        if (!folder.children) folder.children = [];
        const childrenMap = new Map<string, FileItem>();
        folder.children.forEach(c => childrenMap.set(c.name, c));
        currentLevel = childrenMap;
      }
    });
  });
  
  return Array.from(root.values());
};

export const NewBuilder: React.FC = () => {
  let auth, isSignedIn, user;
  try {
    auth = useAuth();
    isSignedIn = auth?.isSignedIn;
    user = (auth as any)?.user;
    console.log('🔐 [Auth] Signed in:', isSignedIn);
    console.log('🔐 [Auth] User ID:', user?.id);
    console.log('🔐 [Auth] User object:', user);
  } catch (e) {
    // Clerk not configured, continue without auth
    console.warn('⚠️ [Auth] Clerk not configured:', e);
    isSignedIn = false;
    user = null;
  }
  const { prompt: initialPrompt } = useAppContext();
  const { webcontainer, loading: wcLoading, error: wcError } = useWebContainer();
  const [searchParams] = useSearchParams();

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
  const [buildStatus, setBuildStatus] = useState<'idle' | 'installing' | 'building' | 'ready' | 'error'>('idle');
  const [expoSnackUrl, setExpoSnackUrl] = useState<string>('');
  const [isReactNativeProject, setIsReactNativeProject] = useState(false);
  const [projectSaved, setProjectSaved] = useState(false);
  const [loadedProject, setLoadedProject] = useState(false);
  
  // Load existing project if projectId is in URL
  useEffect(() => {
    const projectId = searchParams.get('projectId');
    if (projectId && !loadedProject) {
      const loadProject = async () => {
        try {
          console.log('[ProjectLoader] Loading project:', projectId);
          const cachedProject = sessionStorage.getItem('appia:selectedProject');
          
          if (cachedProject) {
            const project = JSON.parse(cachedProject);
            if (project.files) {
              const restoredFiles = Object.entries(project.files).map(([path, content]) => ({
                name: path.split('/').pop(),
                type: 'file',
                path,
                content: content as string
              }));
              setFiles(restoredFiles);
            }
            if (project.prompt) {
              setChatMessages([{ id: '1', role: 'user', text: project.prompt }]);
            }
            setLoadedProject(true);
            setProjectSaved(true);
            console.log('✅ [ProjectLoader] Loaded from cache');
          }
        } catch (error) {
          console.error('❌ [ProjectLoader] Error:', error);
        }
      };
      loadProject();
    }
  }, [searchParams, loadedProject]);
  
  // Auto-save project when files are generated
  useEffect(() => {
    // Only save once when files are first created
    if (files.length > 0 && !projectSaved && user?.id && chatMessages.length > 0) {
      const saveProject = async () => {
        try {
          console.log('[AutoSave] Saving project...');
          
          const firstUserMessage = chatMessages.find(m => m.role === 'user');
          const projectName = firstUserMessage?.text.slice(0, 50) || `Project ${new Date().toLocaleDateString()}`;
          
          const projectData = {
            userId: user.id,
            name: projectName,
            description: firstUserMessage?.text || 'Generated project',
            language: 'react',
            prompt: firstUserMessage?.text || '',
            code: JSON.stringify(files),
            files: files.reduce((acc: Record<string, string>, f) => {
              acc[f.path] = f.content || '';
              return acc;
            }, {}),
            isPublic: false
          };
          
          const response = await fetch(`${API_URL}/projects`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(projectData)
          });
          
          if (response.ok) {
            console.log('✅ [AutoSave] Project saved successfully');
            setProjectSaved(true);
          } else {
            console.error('❌ [AutoSave] Failed to save:', response.status);
          }
        } catch (error) {
          console.error('❌ [AutoSave] Error:', error);
        }
      };
      
      // Save after a short delay to ensure all files are processed
      const timer = setTimeout(saveProject, 2000);
      return () => clearTimeout(timer);
    }
  }, [files, projectSaved, user, chatMessages]);
  
  // Debug: Monitor files state
  useEffect(() => {
    console.log('[🔴 FILES STATE CHANGED]', files.length, 'files');
    console.log('Files array:', files);
    console.log('Files paths:', files.map(f => f.path));
    if (files.length > 0) {
      console.log('🎉 [FILES] Have files! Building tree...');
      const tree = buildFileTree(files);
      console.log('🌳 [FILES] Tree structure:', tree);
    } else {
      console.log('⚠️ [FILES] No files in state yet');
    }
  }, [files]);

  // Publish to Expo Snack for real mobile preview
  const publishToExpoSnack = async (files: any[]) => {
    try {
      console.log('📱 [Expo Snack] Creating Snack URL...');
      
      // Expo Snack uses URL parameters to create snacks
      // Format: https://snack.expo.dev/?name=MyApp&files={encoded}
      
      const snackFiles: Record<string, { contents: string; type: 'CODE' }> = {};
      
      files.forEach(file => {
        // Only include React Native files, not web-preview
        if (!file.path.includes('web-preview/')) {
          snackFiles[file.path] = {
            contents: file.content || '',
            type: 'CODE'
          };
        }
      });
      
      console.log(`📱 [Expo Snack] Creating snack with ${Object.keys(snackFiles).length} files`);
      
      // Ensure RN deps (navigation, deck-swiper) exist in package.json
      const pkgKey = Object.keys(snackFiles).find(k => k.toLowerCase() === 'package.json');
      if (pkgKey) {
        try {
          const pkg = JSON.parse(snackFiles[pkgKey].contents);
          pkg.dependencies = pkg.dependencies || {};
          const ensure = (name: string, ver: string) => { if (!pkg.dependencies[name]) pkg.dependencies[name] = ver; };
          ensure('@react-navigation/native', '^6.1.0');
          ensure('@react-navigation/stack', '^6.3.0');
          ensure('react-native-gesture-handler', '~2.9.0');
          ensure('react-native-reanimated', '~2.14.4');
          ensure('react-native-safe-area-context', '4.5.0');
          ensure('react-native-screens', '~3.20.0');
          const usesDeckSwiper = Object.keys(snackFiles).some(k => snackFiles[k].contents?.includes('react-native-deck-swiper'));
          if (usesDeckSwiper) ensure('react-native-deck-swiper', '^2.0.5');
          snackFiles[pkgKey].contents = JSON.stringify(pkg, null, 2);
        } catch {}
      }

      // Create URL with encoded files
      const snackData = {
        name: 'Appia Generated App',
        description: 'Created with Appia Builder',
        sdkVersion: '48.0.0',
        files: snackFiles
      };
      
      // Encode data for URL
      const encodedData = encodeURIComponent(JSON.stringify(snackData));
      const snackUrl = `https://snack.expo.dev?data=${encodedData}`;
      
      setExpoSnackUrl(snackUrl);
      console.log('✅ [Expo Snack] Snack URL created:', snackUrl);
      return snackUrl;
    } catch (error) {
      console.error('❌ [Expo Snack] Error:', error);
    }
    return null;
  };

  // Write files to WebContainer and trigger build
  const writeFilesToWebContainer = async (files: any[]) => {
    console.log('🔵 [writeFilesToWebContainer] CALLED with', files.length, 'files');
    console.log('🔵 [writeFilesToWebContainer] File paths:', files.map(f => f.path));
    
    if (!webcontainer) {
      console.error('❌ [WebContainer] Not ready yet');
      return;
    }

    try {
      console.log(`✅ [WebContainer] WebContainer is ready. Writing ${files.length} files...`);
      
      // Check if this is a React Native/Expo project (NOT compatible with WebContainer)
      const isReactNative = files.some(f => 
        (f.path === 'app.json' || f.name === 'app.json') ||
        (f.content && f.content.includes('react-native')) ||
        (f.content && f.content.includes('expo'))
      );
      
      if (isReactNative) {
        console.log('⚠️ [WebContainer] React Native/Expo detected - WebContainer cannot run native apps');
        console.log('💡 [WebContainer] Looking for web-preview folder instead...');
        console.log('💡 [WebContainer] Total files received:', files.length);
        console.log('💡 [WebContainer] All file paths:', files.map(f => f.path));
        
        // Only process web-preview files for React Native projects
        const webPreviewFiles = files.filter(f => f.path.includes('web-preview/'));
        console.log('🔍 [WebContainer] Found', webPreviewFiles.length, 'web-preview files');
        console.log('🔍 [WebContainer] web-preview file paths:', webPreviewFiles.map(f => f.path));
        
        if (webPreviewFiles.length === 0) {
          console.error('❌ [WebContainer] NO WEB-PREVIEW FILES FOUND!');
          console.log('❌ [WebContainer] No web-preview folder found. React Native requires web-preview for browser display.');
          setBuildStatus('error');
          // Set helpful error message in preview
          const errorHtml = `
            <!DOCTYPE html>
            <html><head><meta charset="utf-8"><style>
              body { margin: 0; display: flex; align-items: center; justify-content: center; 
                     min-height: 100vh; font-family: system-ui; background: #0f172a; color: white; }
              .container { text-align: center; padding: 2rem; }
              h1 { font-size: 3rem; margin-bottom: 1rem; }
              p { color: #94a3b8; line-height: 1.6; }
            </style></head><body>
              <div class="container">
                <h1>📱</h1>
                <h2>React Native Project Detected</h2>
                <p>This is a native mobile app that cannot run in the browser.</p>
                <p>The AI should generate a web-preview folder for browser testing.</p>
                <p>Try scanning the QR code with Expo Go app for mobile preview.</p>
              </div>
            </body></html>
          `;
          setPreviewUrl(`data:text/html;charset=utf-8,${encodeURIComponent(errorHtml)}`);
          return;
        }
        
        // Use only web-preview files - keep folder structure intact!
        files = webPreviewFiles;
        console.log(`[WebContainer] Using ${files.length} web-preview files`);
        
        // Set working directory to web-preview for WebContainer commands
        // This way npm commands will run inside web-preview folder
      }
      
      // Write all files to WebContainer
      for (const file of files) {
        await webcontainer.fs.writeFile(file.path, file.content || '');
        console.log(`[WebContainer] ✅ Wrote ${file.path}`);
      }

      // Check if this is a web project with package.json
      const hasPackageJson = files.some(f => 
        f.path === 'package.json' || 
        f.name === 'package.json' ||
        f.path === 'web-preview/package.json'
      );
      
      if (hasPackageJson) {
        console.log('[WebContainer] Detected Node project, running npm install...');
        setBuildStatus('installing');
        
        // Check if we're in web-preview folder structure
        const inWebPreview = files.some(f => f.path.startsWith('web-preview/'));
        
        // Install dependencies
        let installProcess;
        if (inWebPreview) {
          // Use shell to cd into web-preview directory
          installProcess = await webcontainer.spawn('sh', ['-c', 'cd web-preview && npm install']);
        } else {
          installProcess = await webcontainer.spawn('npm', ['install']);
        }
        installProcess.output.pipeTo(new WritableStream({
          write(data) {
            console.log('[npm install]', data);
          }
        }));
        
        const installExitCode = await installProcess.exit;
        
        if (installExitCode !== 0) {
          console.error('[WebContainer] npm install failed');
          setBuildStatus('error');
          return;
        }
        
        console.log('[WebContainer] ✅ Dependencies installed');
        
        // Start dev server
        setBuildStatus('building');
        console.log('[WebContainer] Starting dev server...');
        
        let devProcess;
        if (inWebPreview) {
          devProcess = await webcontainer.spawn('sh', ['-c', 'cd web-preview && npm run dev']);
        } else {
          devProcess = await webcontainer.spawn('npm', ['run', 'dev']);
        }
        
        devProcess.output.pipeTo(new WritableStream({
          write(data) {
            console.log('[npm run dev]', data);
          }
        }));
        
        // Wait for server to be ready
        webcontainer.on('server-ready', (port, url) => {
          console.log(`[WebContainer] 🚀 Server ready at ${url}`);
          setPreviewUrl(url);
          setBuildStatus('ready');
        });
      } else {
        // Static HTML files - start simple HTTP server
        console.log('[WebContainer] Static HTML project detected, starting HTTP server...');
        setBuildStatus('building');
        
        // Start Python HTTP server (available in WebContainer)
        const serverProcess = await webcontainer.spawn('python3', ['-m', 'http.server', '3000']);
        
        serverProcess.output.pipeTo(new WritableStream({
          write(data) {
            console.log('[http.server]', data);
          }
        }));
        
        // Wait for server to be ready
        webcontainer.on('server-ready', (port, url) => {
          console.log(`[WebContainer] 🚀 Static server ready at ${url}`);
          setPreviewUrl(url);
          setBuildStatus('ready');
        });
      }
    } catch (error) {
      console.error('[WebContainer] Error writing files:', error);
      setBuildStatus('error');
    }
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

      // Create placeholder for streaming AI response
      const aiMessageId = Date.now().toString();
      const placeholderAiMessage = {
        id: aiMessageId,
        role: 'assistant' as const,
        text: '',
      };
      setChatMessages((prev) => [...prev, placeholderAiMessage]);

      // Prepare request data
      const userId = user?.id || 'anonymous';
      console.log('🎫 [Request] User ID being sent:', userId);
      console.log('🎫 [Request] User object available:', !!user);
      
      const requestData: any = {
        userText: message.text,
        language: 'react',
        userId: userId,
        messages: chatMessages, // Pass conversation history for agent memory
        projectId: 'current-project'
      };

      if (message.imageUrls && message.imageUrls.length > 0) {
        requestData.imageUrl = message.imageUrls[0];
      }
      
      // Stream response chunks as they arrive
      let fullResponse = '';
      const response = await sendChatMessage(requestData, (chunk) => {
        fullResponse += chunk;
        // Update AI message in real-time
        setChatMessages((prev) => 
          prev.map(msg => 
            msg.id === aiMessageId 
              ? { ...msg, text: fullResponse }
              : msg
          )
        );
      });

      if (response.status === 200) {
        console.log('[Token Data] Response usage:', response.data.usage);
        console.log('[Token Data] Input tokens:', response.data.usage?.input_tokens);
        console.log('[Token Data] Output tokens:', response.data.usage?.output_tokens);
        
        // Extract clean conversational text without any XML artifacts
        let conversationalText = response.data.response || fullResponse;
        
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
        
        // Update the existing AI message with cleaned text and tokens (don't create a new one)
        setChatMessages((prev) => 
          prev.map(msg => 
            msg.id === aiMessageId 
              ? { 
                  ...msg, 
                  text: conversationalText,
                  tokens: response.data.usage ? {
                    input: response.data.usage.input_tokens || 0,
                    output: response.data.usage.output_tokens || 0
                  } : undefined
                }
              : msg
          )
        );

        // Process patches for file updates
        const patch = response.data.patch;
        
        console.log('🔴 [PATCH DEBUG] response.data:', response.data);
        console.log('🔴 [PATCH DEBUG] patch exists:', !!patch);
        console.log('🔴 [PATCH DEBUG] patch value:', patch);
        console.log('🔴 [PATCH DEBUG] patch.ops exists:', patch && !!patch.ops);
        console.log('🔴 [PATCH DEBUG] patch.ops length:', patch && patch.ops && patch.ops.length);

        if (patch && patch.ops && Array.isArray(patch.ops)) {
          console.log('✅ [PATCH] Processing', patch.ops.length, 'operations');
          const newFiles: any[] = [];
          let htmlContent = '';
          let cssContent = '';
          let jsContent = '';

          // First pass: collect all files
          for (const op of patch.ops) {
            console.log('📄 [PATCH] Processing op:', op.type, op.path);
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

          // Update files state - accumulate files from all interactions
          console.log(`[File Processing] 📁 Created ${newFiles.length} files:`, newFiles.map(f => f.path));
          console.log('[File Processing] Files data:', JSON.stringify(newFiles, null, 2));
          console.log('[File Processing] BEFORE setFiles - current files count:', files.length);
          
          // Merge with existing files, replacing duplicates by path
          setFiles(prevFiles => {
            const fileMap = new Map();
            
            // Add existing files
            prevFiles.forEach(f => fileMap.set(f.path, f));
            
            // Add/update with new files
            newFiles.forEach(f => fileMap.set(f.path, f));
            
            const mergedFiles = Array.from(fileMap.values());
            console.log('[File Processing] 🔄 Merged files count:', mergedFiles.length);
            return mergedFiles;
          });
          
          console.log('[File Processing] ✅ setFiles called with merge logic');
          
          // Check if React Native project
          const isRN = newFiles.some(f => 
            f.path === 'app.json' || f.name === 'app.json' ||
            (f.content && (f.content.includes('react-native') || f.content.includes('expo')))
          );
          setIsReactNativeProject(isRN);
          
          if (isRN) {
            // For React Native: Build web-preview in WebContainer + Publish to Expo Snack
            console.log('📱 [File Processing] React Native project detected');
            console.log('📱 [File Processing] About to call writeFilesToWebContainer with', newFiles.length, 'files');
            console.log('📱 [File Processing] newFiles:', newFiles.map(f => f.path));
            
            // FIRST: Build web-preview in WebContainer for instant browser view
            console.log('📱 [File Processing] CALLING writeFilesToWebContainer NOW...');
            await writeFilesToWebContainer(newFiles);
            console.log('📱 [File Processing] writeFilesToWebContainer COMPLETED');
            
            // THEN: Create Expo Snack URL for real device preview (non-blocking)
            publishToExpoSnack(newFiles).then(url => {
              if (url) {
                console.log('✅ [Expo Snack] Snack URL ready:', url);
                console.log('📱 [Expo Snack] Open this URL or scan QR code with Expo Go app');
              }
            }).catch(err => {
              console.warn('⚠️ [Expo Snack] Could not create snack URL:', err);
            });
          } else {
            // Check if simple HTML project (no package.json)
            const hasPackageJson = newFiles.some(f => f.path === 'package.json' || f.name === 'package.json');
            
            if (hasPackageJson) {
              // Complex web project with dependencies - use WebContainer
              console.log('[File Processing] 📦 Complex web project - using WebContainer...');
              await writeFilesToWebContainer(newFiles);
            } else {
              // Simple HTML project - skip WebContainer, use data URL (instant preview)
              console.log('[File Processing] 📄 Simple HTML project - using instant data URL preview...');
              // Data URL creation happens below, no need for WebContainer
            }
          }

          // Create instant preview for simple HTML projects (no build needed)
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
            setBuildStatus('ready');
          }
        }

        // Track usage - log token consumption to backend
        if (response.data.usage) {
          const totalTokens = response.data.usage.totalTokens || 
                            (response.data.usage.input_tokens + response.data.usage.output_tokens) || 0;
          
          console.log(`📊 [Token Tracking] Total tokens used: ${totalTokens}`);
          console.log(`📊 [Token Tracking] User ID for tracking:`, userId);
          console.log(`📊 [Token Tracking] Input: ${response.data.usage.input_tokens}, Output: ${response.data.usage.output_tokens}`);
          
          try {
            const usagePayload = {
              userId: userId,
              actionType: 'chat_generation',
              tokensUsed: totalTokens,
              metadata: {
                inputTokens: response.data.usage.input_tokens || response.data.usage.inputTokens || 0,
                outputTokens: response.data.usage.output_tokens || response.data.usage.outputTokens || 0,
                model: 'claude-3-haiku-20240307'
              }
            };
            console.log(`📊 [Token Tracking] Sending payload:`, usagePayload);
            
            const usageResponse = await fetch(`${API_URL}/usage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(usagePayload),
            });
            
            if (usageResponse.ok) {
              const usageData = await usageResponse.json();
              console.log('✅ [Token Tracking] Usage logged successfully:', usageData);
            } else {
              console.error('❌ [Token Tracking] Failed with status:', usageResponse.status);
              const errorText = await usageResponse.text();
              console.error('❌ [Token Tracking] Error response:', errorText);
            }
          } catch (err) {
            console.error('❌ [Token Tracking] Exception:', err);
          }
        } else {
          console.warn('⚠️ [Token Tracking] No usage data in response!');
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

  const handlePublish = async (options: any) => {
    try {
      const userId = user?.id || 'anonymous';
      const projectName = `appia-project-${Date.now()}`;
      
      // Convert files array to Record<string, string> for API
      const filesRecord = files.reduce((acc, file) => {
        acc[file.path] = file.content || '';
        return acc;
      }, {} as Record<string, string>);
      
      // Call backend publish API
      const response = await fetch(`${API_URL}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          projectName,
          files: filesRecord,
          framework: 'react'
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Published successfully:', data);
        
        setIsPublished(true);
        setPublishedUrl(data.url);
        
        return data; // Return deployment info
      } else {
        const error = await response.json();
        console.error('❌ Publish failed:', error);
        throw new Error(error.error || 'Deployment failed');
      }
    } catch (error) {
      console.error('Publish failed:', error);
      throw error;
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
            <div className="w-full h-full bg-[#0B0D0E] flex items-center justify-center p-8 relative">
              {/* Expo Snack button for mobile apps */}
              {expoSnackUrl && isReactNativeProject && (
                <div className="absolute top-4 right-4 z-10">
                  <a
                    href={expoSnackUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-lg"
                  >
                    <span>📱</span>
                    <span>Test on Device</span>
                  </a>
                </div>
              )}
              
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
                {buildStatus === 'installing' ? (
                  <>
                    <div className="text-6xl mb-4">📦</div>
                    <h3 className="text-lg font-medium text-gray-700 mb-2">Installing dependencies...</h3>
                    <p className="text-sm text-gray-500">Running npm install</p>
                  </>
                ) : buildStatus === 'building' ? (
                  <>
                    <div className="text-6xl mb-4">🔨</div>
                    <h3 className="text-lg font-medium text-gray-700 mb-2">Building project...</h3>
                    <p className="text-sm text-gray-500">Starting dev server</p>
                  </>
                ) : buildStatus === 'error' ? (
                  <>
                    <div className="text-6xl mb-4">❌</div>
                    <h3 className="text-lg font-medium text-red-600 mb-2">Build failed</h3>
                    <p className="text-sm text-gray-500">Check console for details</p>
                  </>
                ) : (
                  <>
                    <div className="text-6xl mb-4">⚡</div>
                    <h3 className="text-lg font-medium text-gray-700 mb-2">Ready to build</h3>
                    <p className="text-sm text-gray-500">Start a conversation to create your project</p>
                  </>
                )}
              </div>
            </div>
          )
        }
        filesDrawer={
          <FilesDrawer
            files={buildFileTree(files)}
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
