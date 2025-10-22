import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { ChatHistory } from '../components/ChatHistory.tsx';
import { FileExplorer } from '../components/FileExplorer';
import { TabView } from '../components/TabView.tsx';
import { CodeEditor } from '../components/CodeEditor.tsx';
import { PreviewFrame } from '../components/PreviewFrame';
import { ProjectSettings } from '../components/ProjectSettings';
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
  const {
    prompt,
    setLoading: setContextLoading,
    currentStep,
    setCurrentStep,
  } = useAppContext();
  const [userPrompt, setPrompt] = useState('');
  const [chatMessages, setChatMessages] = useState<
    { role: 'user' | 'assistant'; content: string; timestamp: Date; actionsCount?: number }[]
  >([]);
  const [usageData, setUsageData] = useState<any>(null);
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

  const [steps, setSteps] = useState<Step[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [savedProjects, setSavedProjects] = useState<any[]>([]);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showProjectSettings, setShowProjectSettings] = useState(false);
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
        const initialUserMessage = {
          role: 'user' as const,
            content: prompt,
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
               const aiResponse = {
                 role: 'assistant' as const,
                 content: chatResponse.data.response,
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

  const handleSendMessage = async () => {
    if (!userPrompt.trim()) return;

    const newUserMessage = {
      role: 'user' as const,
      content: userPrompt,
      timestamp: new Date()
    };

    setChatMessages((prev) => [...prev, newUserMessage]);
    setPrompt('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/chat`, {
        messages: [...chatMessages.map(msg => ({ role: msg.role, content: msg.content })), { role: 'user', content: userPrompt }],
        userId: user?.id,
        language: 'react'
      });

      // Check if the response contains steps in XML format
      const newSteps = parseXml(response.data.response).map((x: any) => ({
        ...x,
        status: 'pending' as StepStatus,
      }));

      const assistantMessage = {
        role: 'assistant' as const,
        content: response.data.response,
        timestamp: new Date(),
        actionsCount: newSteps.length
      };

      setChatMessages((prev) => [...prev, assistantMessage]);

      if (newSteps.length > 0) {
        setSteps((prevSteps) => [...prevSteps, ...newSteps]);
      }

      // Update usage data after AI interaction
      if (user?.id) {
        // Track usage
        try {
          const tokensUsed = Math.ceil(userPrompt.length / 4);
          console.log('📈 Tracking usage:', {
            userId: user.id,
            actionType: 'chat_generation',
            tokensUsed,
            prompt: userPrompt.substring(0, 50) + '...'
          });
          
          const usageResponse = await axios.post(`${API_URL}/usage`, {
            userId: user.id,
            actionType: 'chat_generation',
            tokensUsed,
            metadata: { prompt: userPrompt.substring(0, 100) }
          });
          
          console.log('✅ Usage tracked successfully:', usageResponse.data);
        } catch (usageError) {
          console.error('❌ Usage tracking failed:', usageError);
        }
        
        // Save prompt
        try {
          await axios.post(`${API_URL}/prompts`, {
            userId: user.id,
            prompt: userPrompt,
            language: 'react'
          });
        } catch (promptError) {
          console.warn('Prompt saving failed:', promptError);
        }
        
        fetchUsageData();
        
        // Auto-save project after AI response
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
          console.log('Project auto-saved after AI response');
        } catch (saveError) {
          console.error('Failed to auto-save project:', saveError);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (webcontainer && !templateSet) {
      init();
    }
  }, [webcontainer, templateSet]);

  // Load saved projects and usage data when user is authenticated
  useEffect(() => {
    if (isSignedIn && user?.id) {
      fetchSavedProjects();
      fetchUsageData();
    }
  }, [isSignedIn, user?.id]);

  // Fetch usage data for token display
  const fetchUsageData = async () => {
    if (!user?.id) return;

    try {
      console.log('🔍 Fetching usage data for user:', user.id);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(`${API_URL}/usage?userId=${user.id}`, {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      clearTimeout(timeoutId);
      
      console.log('📊 Usage API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Usage data received:', data);
        setUsageData(data);
      } else {
        console.error('❌ Usage API error:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('❌ Error details:', errorText);
      }
    } catch (error) {
      console.error('❌ Usage data fetch failed:', error);
      // Don't set default data, let it show loading
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
          <button className="text-gray-300 hover:text-white transition-colors">
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
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors">
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
          <div className="border-t border-gray-800 p-4 flex-shrink-0">
            <div className="text-xs text-gray-500 mb-2">
              {usageData ? 
                `${usageData.remainingTokens?.toLocaleString() || '0'} monthly tokens remaining` : 
                'Loading usage...'
              }
            </div>
            <div className="text-xs text-blue-400 hover:text-blue-300 cursor-pointer">
              Switch to Pro for 33x more usage
                  </div>
                </div>

          {/* Chat Input - Fixed at very bottom */}
          <div className="border-t border-gray-800 p-4 flex-shrink-0">
                    <div className="space-y-3">
                      <div className="relative">
                        <textarea
                          value={userPrompt}
                          onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Let's build"
                  className="w-full p-3 bg-gray-800 text-gray-200 rounded-lg border border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none placeholder-gray-500 text-sm h-16"
                  disabled={loading}
                        ></textarea>
                        <button
                          onClick={handleSendMessage}
                  disabled={userPrompt.trim().length === 0 || loading}
                          className="absolute right-3 bottom-3 p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-full transition-colors"
                        >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                          <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
              
              {/* Bolt-style buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <button className="text-xs text-gray-400 hover:text-gray-300 px-2 py-1 rounded">
                    + Select
                  </button>
                  <button className="text-xs text-gray-400 hover:text-gray-300 px-2 py-1 rounded">
                    Plan
                  </button>
                </div>
              </div>
            </div>
          </div>
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
    </div>
  );
}
