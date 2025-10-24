import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { ChatHistory } from '../components/ChatHistory.tsx';
import ChatMessage from '../components/ChatMessage';
import ChatComposer from '../components/ChatComposer';
import { useImageUpload } from '../hooks/useImageUpload';
import { FileExplorer } from '../components/FileExplorer';
import { TabView } from '../components/TabView.tsx';
import { CodeEditor } from '../components/CodeEditor.tsx';
import { PreviewFrame } from '../components/PreviewFrame';
import { ProjectSettings } from '../components/ProjectSettings';
import { SubscriptionInfo } from '../components/SubscriptionInfo';
import TokenAnalytics from '../components/TokenAnalytics';
import { GitHubConnection } from '../components/GitHubConnection';
import { PublishModal } from '../components/PublishModal';
import { Step, FileItem, StepType } from '../types/index.ts';
import axios from 'axios';
import { API_URL } from '../config.ts';
import { parseXml } from '../steps';
import { useWebContainer } from '../hooks/useWebContainer';
import { Loader } from '../components/Loader.tsx';
import { storageService } from '../services/storage';

import {
  Home,
  PanelRight,
  Send,
  RefreshCw,
  AlertTriangle,
  BoltIcon,
  Download,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { WebContainer } from '@webcontainer/api';
import { downloadProjectAsZip } from '../utils/fileDownloader';
import { useAppContext } from '../context/AppContext';

// Defining the step status type explicitly
type StepStatus = 'pending' | 'in-progress' | 'completed';

export function Builder() {
  const navigate = useNavigate();
  const { user, isSignedIn } = useUser();

  // Redirect to home if not signed in
  useEffect(() => {
    if (!isSignedIn) {
      navigate('/');
    }
  }, [isSignedIn, navigate]);

  // Show loading while checking authentication
  if (!isSignedIn) {
    return (
      <div className="h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-lg">A</span>
          </div>
          <div className="text-white text-lg">Loading...</div>
        </div>
      </div>
    );
  }
  const {
    prompt,
    setLoading: setContextLoading,
    currentStep,
    setCurrentStep,
  } = useAppContext();
  const [userPrompt, setPrompt] = useState('');
  // Image handling is now managed by ChatComposer component
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  // Enhanced message interface with image support
  interface EnhancedChatMessage {
    id: string;
    role: 'user' | 'assistant';
    text: string;  // Changed from content to text to match ChatMsg
    imageUrls?: string[];  // Updated to support multiple images
    timestamp: Date;
    actionsCount?: number;
    tokens?: {  // Changed from tokenUsage to tokens to match ChatMsg
      input: number;
      output: number;
      total?: number;
    };
  }

  const [chatMessages, setChatMessages] = useState<EnhancedChatMessage[]>([]);
  const [usageData, setUsageData] = useState<any>(null);
  const [currentTokenUsage, setCurrentTokenUsage] = useState<{
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [templateSet, setTemplateSet] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const {
    webcontainer,
    error: webContainerError,
    loading: webContainerLoading,
  } = useWebContainer();

  const [activeTab, setActiveTab] = useState<'code' | 'preview'>('code');
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isFileExplorerCollapsed, setFileExplorerCollapsed] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Comprehensive logging functions
  const logAppiaChat = (message: string, data?: any) => {
    console.log(`[AppiaChat] ${message}`, data || '');
  };

  const logAppiaChatError = (message: string, error: any) => {
    console.error(`[AppiaChat] Error: ${message}`, error);
  };

  const logImageHandling = (action: string, data?: any) => {
    console.log(`[AppiaChat] Image ${action}:`, data || '');
  };

  const logTokenUsage = (inputTokens: number, outputTokens: number, totalTokens: number) => {
    console.log(`[AppiaChat] Token usage: ${inputTokens} input / ${outputTokens} output (${totalTokens} total)`);
    setCurrentTokenUsage({ inputTokens, outputTokens, totalTokens });
    
    // Show warning if token usage is high
    if (totalTokens > 10000) {
      console.warn(`[AppiaChat] High token usage detected: ${totalTokens} tokens`);
    }
  };

  const logAIReasoning = (message: string, hasImage: boolean, time: string) => {
    console.log(`[AppiaChat] Request reasoning:`, { message, hasImage, time });
  };

  const [steps, setSteps] = useState<Step[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [savedProjects, setSavedProjects] = useState<any[]>([]);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showProjectSettings, setShowProjectSettings] = useState(false);
  const [showGitHubConnection, setShowGitHubConnection] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [device, setDevice] = useState('iPhone 16');
  const [zoomLevel, setZoomLevel] = useState(100);

  // Process steps to generate files
  useEffect(() => {
    let originalFiles = [...files];
    let updateHappened = false;

    steps
      .filter(({ status }) => status === 'pending')
      .forEach((step) => {
        updateHappened = true;
        if (step?.type === StepType.CreateFile) {
          let parsedPath = step.path?.split('/') ?? []; // ["src", "components", "App.tsx"]
          let currentFileStructure = [...originalFiles]; // {}
          let finalAnswerRef = currentFileStructure;

          let currentFolder = '';
          while (parsedPath.length) {
            currentFolder = `${currentFolder}/${parsedPath[0]}`;
            let currentFolderName = parsedPath[0];
            parsedPath = parsedPath.slice(1);

            if (!parsedPath.length) {
              // final file
              let file = currentFileStructure.find(
                (x) => x.path === currentFolder
              );
              if (!file) {
                currentFileStructure.push({
                  name: currentFolderName,
                  type: 'file',
                  path: currentFolder,
                  content: step.code,
                });
              } else {
                file.content = step.code;
              }
            } else {
              /// in a folder
              let folder = currentFileStructure.find(
                (x) => x.path === currentFolder
              );
              if (!folder) {
                // create the folder
                currentFileStructure.push({
                  name: currentFolderName,
                  type: 'folder',
                  path: currentFolder,
                  children: [],
                });
              }

              currentFileStructure = currentFileStructure.find(
                (x) => x.path === currentFolder
              )!.children!;
            }
          }
          originalFiles = finalAnswerRef;
        }
      });

    if (updateHappened) {
      setFiles(originalFiles);
      setSteps((steps) =>
        steps.map((s: Step) => {
          return {
            ...s,
            status: 'completed' as StepStatus,
          };
        })
      );
    }
  }, [steps]);

  // Update WebContainer when files change
  useEffect(() => {
    if (!webcontainer || files.length === 0) return;

    try {
      (webcontainer as WebContainer).mount(createMountStructure(files));
    } catch (err) {
      console.error('Error mounting files to WebContainer:', err);
    }
  }, [files, webcontainer]);

  const handleFileUpdate = (updatedFile: FileItem) => {
    // Deep clone files to maintain immutability
    const updateFilesRecursively = (
      filesArray: FileItem[],
      fileToUpdate: FileItem
    ): FileItem[] => {
      return filesArray.map((file) => {
        if (file.path === fileToUpdate.path) {
          return fileToUpdate;
        } else if (file.type === 'folder' && file.children) {
          return {
            ...file,
            children: updateFilesRecursively(file.children, fileToUpdate),
          };
        }
        return file;
      });
    };

    const updatedFiles = updateFilesRecursively(files, updatedFile);
    setFiles(updatedFiles);

    // Update file in WebContainer if it's initialized
    if (webcontainer) {
      try {
        (webcontainer as WebContainer).fs.writeFile(
          updatedFile.path.startsWith('/')
            ? updatedFile.path.substring(1)
            : updatedFile.path,
          updatedFile.content || ''
        );
      } catch (err) {
        console.error('Error writing file to WebContainer:', err);
      }
    }
  };

  // Create mount structure for WebContainer
  const createMountStructure = (files: FileItem[]): Record<string, any> => {
    const mountStructure: Record<string, any> = {};

    const processFile = (file: FileItem, isRootFolder: boolean) => {
      if (file.type === 'folder') {
        mountStructure[file.name] = {
          directory: file.children
            ? Object.fromEntries(
                file.children.map((child) => [
                  child.name,
                  processFile(child, false),
                ])
              )
            : {},
        };
      } else if (file.type === 'file') {
        if (isRootFolder) {
          mountStructure[file.name] = {
            file: {
              contents: file.content || '',
            },
          };
        } else {
          return {
            file: {
              contents: file.content || '',
            },
          };
        }
      }

      return mountStructure[file.name];
    };

    files.forEach((file) => processFile(file, true));

    return mountStructure;
  };

  async function init() {
    try {
      setLoading(true);

      // Skip if template is already set
      if (!templateSet) {
        // Get template from backend
        const response = await axios.post(`${API_URL}/template`, {
          prompt,
        });

        const { prompts, uiPrompts } = response.data;

        // Add initial user message to chat
        const initialUserMessage: EnhancedChatMessage = {
          id: `user-${Date.now()}`,
          role: 'user' as const,
          text: prompt,
          timestamp: new Date()
        };
        setChatMessages([initialUserMessage]);

        // Set the initial steps from template
        const initialSteps = parseXml(uiPrompts[0] || '').map((x: any) => ({
          ...x,
          status: 'pending' as StepStatus,
        }));

        setSteps(initialSteps);
        setTemplateSet(true);

        // Send the chat request for full project generation
        const chatResponse = await axios.post(`${API_URL}/chat`, {
          messages: [...prompts, prompt].map((content: string) => ({
            role: 'user',
            content,
          })),
                 userId: user?.id, // For usage tracking
                 language: 'react'
        });

        // Process the steps from the chat response
        const newSteps = parseXml(chatResponse.data.response).map((x: any) => ({
          ...x,
          status: 'pending' as StepStatus,
        }));

        setSteps((prevSteps) => [...prevSteps, ...newSteps]);

               // Add AI response to chat with actions count
               const aiResponse: EnhancedChatMessage = {
                 id: `assistant-${Date.now()}`,
                 role: 'assistant' as const,
                 text: chatResponse.data.response,
                 timestamp: new Date(),
                 actionsCount: newSteps.length
               };
               setChatMessages((prevMessages) => [...prevMessages, aiResponse]);

               // Update usage data after AI interaction
               if (user?.id) {
                 fetchUsageData();
               }

        // Auto-save project to database if user is signed in
        if (isSignedIn && user?.id) {
          try {
            await storageService.saveProjectToCloud({
              id: '',
              name: `Project: ${prompt.substring(0, 50)}`,
              description: prompt,
              language: 'react',
              prompt: prompt,
              code: chatResponse.data.response,
              files: {},
              createdAt: new Date(),
              updatedAt: new Date(),
              isPublic: false
            }, user.id);
            console.log('Project auto-saved successfully');
          } catch (saveError) {
            console.error('Failed to auto-save project:', saveError);
          }
        }
      }

      setLoading(false);
    } catch (error) {
      console.error('Error initializing project:', error);
      setLoading(false);
    }
  }

  const handleRefreshWebContainer = () => {
    window.location.href = '/';
  };

  const handleDownloadProject = async () => {
    if (files.length > 0) {
      setIsDownloading(true);
      try {
        await downloadProjectAsZip(files);
      } catch (error) {
        console.error('Failed to download project:', error);
      } finally {
        setIsDownloading(false);
      }
    }
  };

  const handleSaveProject = async (projectName: string, projectDescription: string) => {
    if (!user?.id) {
      alert('Please sign in to save projects');
      return;
    }

    try {
      const projectData = {
        userId: user.id,
        name: projectName,
        description: projectDescription,
        language: 'react',
        prompt: prompt,
        code: JSON.stringify(files),
        files: files.reduce((acc, file) => {
          if (file.type === 'file') {
            acc[file.path!] = file.content || '';
          }
          return acc;
        }, {} as { [key: string]: string }),
        isPublic: false,
        email: user.emailAddresses[0]?.emailAddress,
        userName: user.firstName || user.emailAddresses[0]?.emailAddress
      };

      const response = await axios.post(`${API_URL}/projects`, projectData);
      console.log('Project saved:', response.data);
      alert('Project saved successfully!');
      setShowProjectModal(false);
      
      // Refresh saved projects
      fetchSavedProjects();
    } catch (error) {
      console.error('Failed to save project:', error);
      alert('Failed to save project');
    }
  };

  const fetchSavedProjects = async () => {
    if (!user?.id) return;

    try {
      const response = await axios.get(`${API_URL}/projects?userId=${user.id}`);
      setSavedProjects(response.data);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    }
  };

  const handleLoadProject = async (project: any) => {
    try {
      // Parse files from the project
      const projectFiles = Object.entries(project.files || {}).map(([path, content]) => ({
        name: path.split('/').pop() || '',
        type: 'file' as const,
        path: path,
        content: content as string,
      }));
      
      setFiles(projectFiles);
      setPrompt(project.prompt);
      alert(`Project "${project.name}" loaded!`);
      setShowProjectModal(false);
    } catch (error) {
      console.error('Failed to load project:', error);
      alert('Failed to load project');
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;

    try {
      await axios.delete(`${API_URL}/projects?projectId=${projectId}`);
      alert('Project deleted successfully!');
      fetchSavedProjects();
    } catch (error) {
      console.error('Failed to delete project:', error);
      alert('Failed to delete project');
    }
  };

  // Image handling is now managed by ChatComposer component

  // Image removal is now handled by ChatComposer component

  // Handle selection mode toggle
  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    if (selectionMode) {
      setSelectedElement(null);
    }
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedElement(null);
    setSelectionMode(false);
  };

  const handleSendMessage = async (message: { role: "user"; text: string; imageUrls?: string[] }) => {
    try {
      if (!message.text.trim() && (!message.imageUrls || message.imageUrls.length === 0)) return;

    // Create message content with selected element context
      let messageContent = message.text;
    if (selectedElement) {
        messageContent = `[Selected element: ${selectedElement}] ${message.text}`;
    }

      // Create enhanced user message with image persistence
      const newUserMessage: EnhancedChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user' as const,
        text: messageContent,
        imageUrls: message.imageUrls || undefined, // Store all images with message
        timestamp: new Date()
      };

      logAppiaChat('Sending prompt', { 
        prompt: messageContent, 
        hasImage: (message.imageUrls && message.imageUrls.length > 0),
        imageCount: message.imageUrls?.length || 0
      });

    setChatMessages((prev) => [...prev, newUserMessage]);
    setPrompt('');
    setLoading(true);

    // Determine model to use
    const isFirstPrompt = chatMessages.length === 0;
    const hasImages = !!(message.imageUrls && message.imageUrls.length > 0);
    const selectedModel = determineModel(messageContent, hasImages, isFirstPrompt);
      
    logAppiaChat('Model selected', { 
      model: selectedModel, 
      isFirstPrompt, 
      hasImages,
      type: selectedModel.includes('haiku') ? 'Fast & Cheap' : 'Powerful & Expensive'
    });
      
    // Add AI reasoning logging
    logAIReasoning(messageContent, hasImages, new Date().toISOString());
      
    // Prepare Bolt-style request data
    const requestData: any = {
      userText: messageContent,
      language: 'react'
    };

    // Add single image URL (first one only for micro-ops)
    if (message.imageUrls && message.imageUrls.length > 0) {
      logImageHandling('sending to API', { 
        count: message.imageUrls.length, 
        urls: message.imageUrls,
        types: message.imageUrls.map(url => url.startsWith('blob:') ? 'BLOB' : 'VERCEL')
      });
      requestData.imageUrl = message.imageUrls[0]; // Single URL only
    } else {
      logAppiaChat('No uploaded image URLs available');
    }

    // Add project summary if available
    if (files.length > 0) {
      const fileNames = files.map(f => f.name).join(', ');
      requestData.summary = `Site has ${fileNames}`;
    }

    console.log('🚀 [ChatRequest] Sending chat request with image URL:', !!requestData.imageUrl);
    console.log('🚀 [ChatRequest] Full request data:', JSON.stringify(requestData, null, 2));
    console.log('🚀 [ChatRequest] Selected model:', selectedModel);
    console.log('🚀 [ChatRequest] Has images:', hasImages);
    console.log('🚀 [ChatRequest] Is first prompt:', isFirstPrompt);
    
    // Create AbortController for this request
    abortControllerRef.current = new AbortController();
    
    try {
      const response = await axios.post(`${API_URL}/chat`, requestData, {
        timeout: 60000, // 60 second timeout for image processing
        headers: {
          'Content-Type': 'application/json'
        },
        signal: abortControllerRef.current.signal // Add abort signal
      });
      
      logAppiaChat('Claude response received', { 
        status: response.status, 
        responseLength: response.data.response?.length || 0,
        hasPatch: !!response.data.patch
      });

      // Track token usage if available
      if (response.data.usage) {
        const { input_tokens, output_tokens } = response.data.usage;
        const totalTokens = input_tokens + output_tokens;
        logTokenUsage(input_tokens, output_tokens, totalTokens);
      }

      // Apply JSON patch if available
      let newSteps: Step[] = [];
      if (response.data.patch && response.data.patch.ops) {
        console.log('📋 [PatchResponse] Applying JSON patch:', response.data.patch.ops.length, 'operations');
        
        // Convert patch operations to steps
        newSteps = response.data.patch.ops.map((op: any, index: number) => ({
          id: index + 1,
          title: `Edit ${op.path}`,
          description: `Replace content in ${op.path}`,
          type: StepType.CreateFile,
        status: 'pending' as StepStatus,
          code: op.replace,
          path: op.path
        }));
      }

      // For Bolt-style responses, use a simple conversational message
      let conversationalPart = "I've made the changes for you!";
      
      // If we have patch operations, be more specific
      if (newSteps.length > 0) {
        conversationalPart = `Applied ${newSteps.length} edit${newSteps.length > 1 ? 's' : ''} to your project.`;
      }

      // Create enhanced assistant message with token usage
      const assistantMessage: EnhancedChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant' as const,
        text: conversationalPart || "I've made the changes for you!",
        timestamp: new Date(),
        actionsCount: newSteps.length,
        tokens: response.data.usage ? {
          input: response.data.usage.input_tokens || 0,
          output: response.data.usage.output_tokens || 0,
          total: (response.data.usage.input_tokens || 0) + (response.data.usage.output_tokens || 0)
        } : undefined
      };

      logAppiaChat('Message rendered successfully', { 
        messageId: assistantMessage.id,
        contentLength: assistantMessage.text.length,
        actionsCount: newSteps.length,
        hasTokenUsage: !!assistantMessage.tokens
      });

      setChatMessages((prev) => {
        const newMessages = [...prev, assistantMessage];
        logAppiaChat('Updated chat messages', { 
          totalCount: newMessages.length,
          lastMessage: newMessages[newMessages.length - 1]?.text.substring(0, 100) + '...'
        });
        return newMessages;
      });

      if (newSteps.length > 0) {
        setSteps((prevSteps) => [...prevSteps, ...newSteps]);
      }

      // Images are now handled by the ChatComposer component
      // No need to clear them here as they're managed separately

      // Update usage data after AI interaction
      if (user?.id) {
        console.log('🔍 Full response data:', response.data);
        console.log('🔍 Response data keys:', Object.keys(response.data));
        console.log('🔍 Usage data in response:', response.data.usage);
        console.log('🔍 Usage data type:', typeof response.data.usage);
        console.log('🔍 Usage data is undefined?', response.data.usage === undefined);
        
        // The usage tracking is now handled in the backend API automatically
        // with real tokens from Claude API response
        if (response.data.usage) {
          console.log('📊 Real usage data from Claude API:', {
            inputTokens: response.data.usage.inputTokens,
            outputTokens: response.data.usage.outputTokens,
            totalTokens: response.data.usage.totalTokens
          });
          
          // Send usage tracking to backend
          try {
            console.log('🚀 Sending usage tracking to backend...');
            const usageResponse = await axios.post(`${API_URL}/usage`, {
              userId: user.id,
              actionType: 'chat_generation',
              tokensUsed: response.data.usage.totalTokens,
              metadata: {
                inputTokens: response.data.usage.inputTokens,
                outputTokens: response.data.usage.outputTokens,
                model: 'claude-sonnet-4'
              }
            });
            console.log('✅ Usage tracked successfully:', usageResponse.data);
          } catch (usageError) {
            console.error('❌ Failed to track usage:', usageError);
          }
        } else {
          console.warn('⚠️ No usage data in response, skipping manual tracking');
        }
        
        // Save prompt (optional, don't block on failure)
        try {
          await axios.post(`${API_URL}/prompts`, {
            userId: user.id,
            prompt: userPrompt,
            language: 'react'
          });
          console.log('✅ Prompt saved successfully');
        } catch (promptError) {
          console.warn('⚠️ Prompt saving failed (non-critical):', promptError);
          // Don't throw - this is not critical for the main functionality
        }
        
        fetchUsageData();
        
        // Auto-save project after AI response (optional, don't block on failure)
        try {
          await storageService.saveProjectToCloud({
            id: '',
            name: `Project: ${userPrompt.substring(0, 50)}`,
            description: userPrompt,
            language: 'react',
            prompt: userPrompt,
            code: response.data.response,
            files: files.reduce((acc, file) => {
              if (file.type === 'file') {
                acc[file.path!] = file.content || '';
              }
              return acc;
            }, {} as { [key: string]: string }),
            createdAt: new Date(),
            updatedAt: new Date(),
            isPublic: false
          }, user.id);
          console.log('✅ Project auto-saved after AI response');
        } catch (saveError) {
          console.warn('⚠️ Auto-save failed (non-critical):', saveError);
          // Don't throw - this is not critical for the main functionality
        }
      }
    } catch (innerError: any) {
      console.error('❌ Inner API call failed:', innerError);
      throw innerError; // Re-throw to be caught by outer catch
    }
    } catch (error: any) {
      console.error('❌ Error sending message:', error);
      
      // Handle different error types
      if (axios.isCancel(error)) {
        console.log('✅ Request cancelled by user');
        // Don't show alert for user cancellation
        return;
      } else if (error.code === 'ECONNABORTED') {
        console.log('🔄 Request timed out');
        alert('Request timed out. Please try again with a smaller image or check your connection.');
      } else if (error.response?.status === 413) {
        alert('Image is too large. Please use an image smaller than 10MB.');
      } else if (error.response?.status >= 500) {
        console.error('🚨 [ChatRequest] Server error:', error.response?.data);
        alert(`Server error: ${error.response?.data?.error || 'Please try again in a moment.'}`);
      } else if (error.response?.status === 400) {
        console.error('🚨 [ChatRequest] Bad request:', error.response?.data);
        alert(`Invalid request: ${error.response?.data?.error || 'Please check your input.'}`);
      } else {
        console.error('🚨 [ChatRequest] Unknown error:', error);
        alert(`Failed to process your request: ${error.message || 'Please try again.'}`);
      }
      
      // Add error message to chat
      const errorMessage: EnhancedChatMessage = {
        id: `assistant-error-${Date.now()}`,
        role: 'assistant' as const,
        text: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date(),
        actionsCount: 0
      };
      setChatMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      abortControllerRef.current = null; // Clean up AbortController
    }
  };

  // Cancel ongoing chat request
  const handleCancelRequest = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      console.log('✅ Chat request cancelled by user');
      setLoading(false);
      
      // Add cancellation message to chat
      const cancelMessage: EnhancedChatMessage = {
        id: `assistant-cancel-${Date.now()}`,
        role: 'assistant' as const,
        text: 'Request cancelled.',
        timestamp: new Date(),
        actionsCount: 0
      };
      setChatMessages((prev) => [...prev, cancelMessage]);
    }
  };

  // Determine which model to use based on prompt complexity (optimized)
  const determineModel = (prompt: string, hasImage: boolean, isFirstPrompt: boolean) => {
    // Always use Sonnet for first prompt (homepage) for best quality
    if (isFirstPrompt) {
      return 'claude-sonnet-4-20250514';
    }
    
    // Use Sonnet for complex requests and images
    if (hasImage) {
      return 'claude-sonnet-4-20250514';
    }
    
    // Analyze prompt complexity
    const heavyKeywords = [
      'create', 'build', 'make', 'generate', 'design', 'implement',
      'app', 'website', 'application', 'dashboard', 'interface',
      'database', 'backend', 'api', 'authentication', 'user management',
      'complex', 'advanced', 'sophisticated', 'comprehensive'
    ];
    
    const promptLower = prompt.toLowerCase();
    const hasHeavyKeywords = heavyKeywords.some(keyword => promptLower.includes(keyword));
    const isLongPrompt = prompt.length > 100;
    const hasMultipleRequests = (prompt.match(/and|also|then|next|additionally/gi) || []).length > 2;
    
    // Use Sonnet for heavy tasks
    if (hasHeavyKeywords || isLongPrompt || hasMultipleRequests) {
      return 'claude-sonnet-4-20250514';
    }
    
    // Use Haiku for light tasks (60-70% cheaper)
    return 'claude-3-haiku-20240307';
  };

  useEffect(() => {
    if (webcontainer && !templateSet) {
      init();
    }
  }, [webcontainer, templateSet]);

  // Load saved projects and usage data when user is authenticated
  useEffect(() => {
    if (isSignedIn && user?.id) {
      setupUserWithFreePlan();
      fetchSavedProjects();
      fetchUsageData();
    }
  }, [isSignedIn, user?.id]);

  // GitHub connection handler
  const handleGitHubConnect = (connected: boolean) => {
    setShowGitHubConnection(false);
    if (connected) {
      console.log('GitHub connected successfully');
    }
  };

  // Publish handler
  const handlePublish = async (options: any) => {
    if (!user?.id) return;

    try {
      const response = await axios.post(`${API_URL}/hosting`, {
        userId: user.id,
        domain: options.domain,
        customDomain: options.customDomain,
        seoBoost: options.seoBoost,
        files: files
      });

      if (response.data.success) {
        setIsPublished(true);
        setPublishedUrl(response.data.hosting.url);
        console.log('Project published successfully:', response.data.hosting);
      }
    } catch (error) {
      console.error('Publish error:', error);
      throw error;
    }
  };

  // Setup user with free plan in Clerk
  const setupUserWithFreePlan = async () => {
    if (!user?.id) return;

    try {
      console.log('🔧 Setting up user with free plan:', user.id);
      await axios.post(`${API_URL}/user-setup`, {
        userId: user.id
      });
      console.log('✅ User set up with free plan successfully');
    } catch (error) {
      console.warn('⚠️ User setup failed (non-critical):', error);
    }
  };

  // Fetch usage data for token display
  const fetchUsageData = async () => {
    if (!user?.id) return;

    try {
      console.log('🔍 Fetching usage data for user:', user.id);
      
      // Use axios instead of fetch for better error handling
      const response = await axios.get(`${API_URL}/usage?userId=${user.id}`, {
        timeout: 15000, // 15 second timeout
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Usage data received:', response.data);
      setUsageData(response.data);
    } catch (error: any) {
      console.error('❌ Usage data fetch failed:', error);
      
      // Set fallback data to prevent UI issues
      setUsageData({
        tier: 'free',
        tokensUsed: 0,
        tokensLimit: 108000,
        tokensRemaining: 108000,
        usagePercentage: 0
      });
      
      // Don't show error to user, just log it
      console.warn('⚠️ Using fallback usage data due to network error');
    }
  };

  return (
    <div className="h-screen bg-gray-950 flex flex-col overflow-hidden">
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center">
            <button
            onClick={() => window.location.href = '/'}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
                   <div className="w-8 h-8 bg-black rounded flex items-center justify-center">
                     <span className="text-white font-bold text-lg">A</span>
                   </div>
            <h1 className="text-xl font-semibold text-white">Appia</h1>
            </button>
          <div className="h-6 mx-4 border-r border-gray-700"></div>
          <h2 className="text-gray-300 hidden sm:block">Website Builder</h2>
        </div>
        <div className="flex items-center gap-4">
          {/* GitHub Icon */}
          <button
            onClick={() => setShowGitHubConnection(true)}
            className="text-gray-300 hover:text-white transition-colors"
            title="Connect to GitHub"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
          </button>
          
          {/* Settings Button */}
          <button
            onClick={() => setShowProjectSettings(true)}
            className="text-gray-300 hover:text-white transition-colors"
            title="Project Settings"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          
          {/* Publish Button */}
          <button 
            onClick={() => setShowPublishModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
          >
            Publish
          </button>
          
          {/* User Avatar (only when signed in) */}
          {isSignedIn && user && (
            <div className="relative">
              <button
                onClick={() => setShowProjectModal(true)}
                className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold hover:opacity-80 transition-opacity"
              >
                {user.firstName?.[0] || user.emailAddresses[0]?.emailAddress[0] || 'U'}
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden h-full">
        {/* Chat Sidebar - Bolt Style */}
        <div className="w-96 bg-gray-900 border-r border-gray-800 flex flex-col h-full">
          {/* Chat History - Scrollable area */}
          <div 
            className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden"
            style={{
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'thin',
              scrollbarColor: '#4B5563 #1F2937'
            }}
          >
            <ChatHistory messages={chatMessages} actionsCount={steps.length} />
                </div>

          {/* Token Usage Display - Fixed at bottom */}
          <SubscriptionInfo usageData={usageData} />
          
          {/* Token Analytics - Show optimization details */}
          {usageData && (
            <TokenAnalytics usageData={usageData} />
          )}

          {/* Chat Input - New Attachment System */}
          <ChatComposer onSend={handleSendMessage} />
        </div>

        {/* File explorer */}
        <motion.div
          className="border-r border-gray-800 bg-gray-900 overflow-hidden flex flex-col"
          animate={{
            width: isFileExplorerCollapsed ? '0' : '16rem',
            opacity: isFileExplorerCollapsed ? 0 : 1,
          }}
          transition={{ duration: 0.3 }}
        >
          <div className="p-4 border-b border-gray-800 flex items-center justify-between">
            <h3 className="text-white font-medium">Files</h3>
            <button
              onClick={() => setFileExplorerCollapsed(!isFileExplorerCollapsed)}
              className="p-1 rounded-lg hover:bg-gray-800 transition-colors md:hidden"
            >
              <PanelRight className="w-4 h-4 text-gray-400" />
            </button>
          </div>
                 <div className="flex-1 overflow-auto overscroll-contain">
            <FileExplorer files={files} onFileSelect={setSelectedFile} />
          </div>
        </motion.div>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-800 bg-gray-900 flex items-center justify-between">
            <TabView activeTab={activeTab} onTabChange={setActiveTab} />
            <div className="flex items-center md:hidden">
              <button
                onClick={() =>
                  setFileExplorerCollapsed(!isFileExplorerCollapsed)
                }
                className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
                title={isFileExplorerCollapsed ? 'Show files' : 'Hide files'}
              >
                <PanelRight
                  className={`w-4 h-4 text-gray-400 ${
                    isFileExplorerCollapsed ? 'rotate-180' : ''
                  }`}
                />
              </button>
              <button
                onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
                className="ml-2 p-2 rounded-lg hover:bg-gray-800 transition-colors"
                title={isSidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}
              >
                <PanelRight
                  className={`w-4 h-4 text-gray-400 ${
                    !isSidebarCollapsed ? 'rotate-180' : ''
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-hidden p-4 bg-gray-950">
            <div className="h-full rounded-lg overflow-hidden border border-gray-800 bg-gray-900 shadow-xl relative">
              <div className="relative h-full">
                {/* Code Editor - Always mounted */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ 
                    opacity: activeTab === 'code' ? 1 : 0,
                    x: activeTab === 'code' ? 0 : -20,
                    pointerEvents: activeTab === 'code' ? 'auto' : 'none'
                  }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="absolute inset-0"
                >
                <CodeEditor
                  file={selectedFile}
                  onUpdateFile={handleFileUpdate}
                />
                </motion.div>

                {/* Preview Frame - Always mounted */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ 
                    opacity: activeTab === 'preview' ? 1 : 0,
                    x: activeTab === 'preview' ? 0 : 20,
                    pointerEvents: activeTab === 'preview' ? 'auto' : 'none'
                  }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="absolute inset-0"
                >
                  {webcontainer ? (
                <PreviewFrame
                  webContainer={webcontainer as WebContainer}
                  files={files}
                      setPreviewUrl={setPreviewUrl}
                      device={device}
                      zoomLevel={zoomLevel}
                      selectionMode={selectionMode}
                      onElementSelect={setSelectedElement}
                />
              ) : webContainerLoading ? (
                <div className="h-full flex items-center justify-center text-gray-400 p-8 text-center">
                  <div>
                    <Loader size="lg" className="mb-4" />
                    <h3 className="text-lg font-medium text-gray-300 mb-2">
                      Initializing WebContainer
                    </h3>
                    <p className="text-gray-500 max-w-md">
                      Setting up the preview environment. This might take a
                      moment...
                    </p>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400 p-8 text-center">
                  <div>
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800 flex items-center justify-center">
                      <AlertTriangle className="w-8 h-8 text-amber-500" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-300 mb-2">
                      WebContainer Error
                    </h3>
                    <p className="text-gray-400 max-w-md mb-6">
                      {webContainerError?.message ||
                        'The WebContainer environment could not be initialized. This may be due to missing browser security headers or lack of browser support.'}
                    </p>
                    <button
                      onClick={handleRefreshWebContainer}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Retry
                    </button>
                  </div>
                </div>
              )}
                </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>

      {/* Made in Appia watermark */}
      <div className="fixed bottom-4 right-4 z-50">
        <div className="bg-black/80 text-white px-3 py-1.5 rounded-md text-xs flex items-center gap-2">
          <div className="w-4 h-4 bg-black rounded flex items-center justify-center">
            <span className="text-white font-bold text-xs">A</span>
          </div>
          <span>Made in Appia</span>
        </div>
      </div>

      {/* Project Save/Load Modal */}
      {showProjectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-white">Save & Load Projects</h3>
              <button
                onClick={() => setShowProjectModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Save New Project */}
            <div className="mb-6">
              <h4 className="text-lg font-medium text-white mb-3">Save Current Project</h4>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                handleSaveProject(
                  formData.get('name') as string,
                  formData.get('description') as string
                );
              }}>
                <div className="space-y-3">
                  <input
                    type="text"
                    name="name"
                    placeholder="Project name"
                    className="w-full p-3 bg-gray-800 text-gray-200 rounded-lg border border-gray-700 focus:border-blue-500 outline-none"
                    required
                  />
                  <textarea
                    name="description"
                    placeholder="Project description"
                    className="w-full p-3 bg-gray-800 text-gray-200 rounded-lg border border-gray-700 focus:border-blue-500 outline-none resize-none"
                    rows={3}
                  />
                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
                  >
                    Save Project
                  </button>
                </div>
              </form>
            </div>

            {/* Load Existing Projects */}
            <div>
              <h4 className="text-lg font-medium text-white mb-3">Load Existing Projects</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {savedProjects.length === 0 ? (
                  <p className="text-gray-400 text-center py-4">No saved projects found</p>
                ) : (
                  savedProjects.map((project) => (
                    <div key={project.id} className="bg-gray-800 rounded-lg p-4 flex justify-between items-center">
                      <div>
                        <h5 className="text-white font-medium">{project.name}</h5>
                        <p className="text-gray-400 text-sm">{project.description}</p>
                        <p className="text-gray-500 text-xs">
                          Created: {new Date(project.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleLoadProject(project)}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                        >
                          Load
                        </button>
                        <button
                          onClick={() => handleDeleteProject(project.id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Project Settings Modal */}
      <ProjectSettings 
        isOpen={showProjectSettings} 
        onClose={() => setShowProjectSettings(false)} 
      />

      {/* GitHub Connection Modal */}
      <GitHubConnection
        isOpen={showGitHubConnection}
        onClose={() => setShowGitHubConnection(false)}
        onConnect={handleGitHubConnect}
      />

      {/* Publish Modal */}
      <PublishModal
        isOpen={showPublishModal}
        onClose={() => setShowPublishModal(false)}
        onPublish={handlePublish}
        isPublished={isPublished}
        publishedUrl={publishedUrl}
      />
    </div>
  );
}