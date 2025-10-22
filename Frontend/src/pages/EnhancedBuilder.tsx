import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StepsList } from '../components/StepsList.tsx';
import { EnhancedFileExplorer } from '../components/EnhancedFileExplorer';
import { TabView } from '../components/TabView.tsx';
import { CodeEditor } from '../components/CodeEditor.tsx';
import { PreviewFrame } from '../components/PreviewFrame';
import { LanguageSelector } from '../components/LanguageSelector';
import { ProjectManager } from '../components/ProjectManager';
import { AuthModal } from '../components/AuthModal';
import { Step, FileItem, StepType } from '../types/index.ts';
import axios from 'axios';
import { API_URL } from '../config.ts';
import { parseXml } from '../steps';
import { useWebContainer } from '../hooks/useWebContainer';
import { Loader } from '../components/Loader.tsx';
import { storageService, SavedProject, User } from '../services/storage';

import {
  Home,
  PanelRight,
  Send,
  RefreshCw,
  AlertTriangle,
  Download,
  User as UserIcon,
  LogOut,
  Settings
} from 'lucide-react';
import { motion } from 'framer-motion';
import { WebContainer } from '@webcontainer/api';
import { downloadProjectAsZip } from '../utils/fileDownloader';
import { useAppContext } from '../context/AppContext';

type StepStatus = 'pending' | 'in-progress' | 'completed';

export function EnhancedBuilder() {
  const navigate = useNavigate();
  const {
    prompt,
    setLoading: setContextLoading,
    currentStep,
    setCurrentStep,
  } = useAppContext();
  
  // State management
  const [userPrompt, setPrompt] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('react');
  const [user, setUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [llmMessages, setLlmMessages] = useState<
    { role: 'user' | 'assistant'; content: string }[]
  >([]);
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
  const [filesMap, setFilesMap] = useState<{ [key: string]: string }>({});

  // Initialize user on component mount
  useEffect(() => {
    const currentUser = storageService.getCurrentUser();
    setUser(currentUser);
  }, []);

  // Process steps to generate files
  useEffect(() => {
    let originalFiles = [...files];
    let updateHappened = false;

    steps
      .filter(({ status }) => status === 'pending')
      .forEach((step) => {
        updateHappened = true;
        if (step?.type === StepType.CreateFile) {
          let parsedPath = step.path?.split('/') ?? [];
          let currentFileStructure = [...originalFiles];
          let finalAnswerRef = currentFileStructure;

          let currentFolder = '';
          while (parsedPath.length) {
            currentFolder = `${currentFolder}/${parsedPath[0]}`;
            let currentFolderName = parsedPath[0];
            parsedPath = parsedPath.slice(1);

            if (!parsedPath.length) {
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
              let folder = currentFileStructure.find(
                (x) => x.path === currentFolder
              );
              if (!folder) {
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

    // Update files map
    const newFilesMap = { ...filesMap };
    newFilesMap[updatedFile.path] = updatedFile.content || '';
    setFilesMap(newFilesMap);

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

  const handleFilesUpdate = (newFiles: { [key: string]: string }) => {
    setFilesMap(newFiles);
  };

  const handleLoadProject = (project: SavedProject) => {
    // Convert saved project to current format
    const projectFiles: FileItem[] = [];
    
    Object.entries(project.files).forEach(([path, content]) => {
      const parts = path.split('/');
      const name = parts[parts.length - 1];
      const isFile = parts.length > 1;
      
      projectFiles.push({
        name,
        type: isFile ? 'file' : 'folder',
        path,
        content: isFile ? content : undefined,
        children: isFile ? undefined : []
      });
    });

    setFiles(projectFiles);
    setSelectedLanguage(project.language);
    setPrompt(project.prompt);
  };

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

      if (!templateSet) {
        const response = await axios.post(`${API_URL}/template`, {
          prompt: `${prompt} (Language: ${selectedLanguage})`,
        });

        const { prompts, uiPrompts } = response.data;

        setLlmMessages([
          {
            role: 'user',
            content: prompt,
          },
        ]);

        const initialSteps = parseXml(uiPrompts[0] || '').map((x: any) => ({
          ...x,
          status: 'pending' as StepStatus,
        }));

        setSteps(initialSteps);
        setTemplateSet(true);

        const chatResponse = await axios.post(`${API_URL}/chat`, {
          messages: [...prompts, prompt].map((content: string) => ({
            role: 'user',
            content,
          })),
        });

        const newSteps = parseXml(chatResponse.data.response).map((x: any) => ({
          ...x,
          status: 'pending' as StepStatus,
        }));

        setSteps((prevSteps) => [...prevSteps, ...newSteps]);

        setLlmMessages((prevMessages) => [
          ...prevMessages,
          { role: 'assistant', content: chatResponse.data.response },
        ]);
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

  const handleSendMessage = async () => {
    if (!userPrompt.trim()) return;

    const newUserMessage = {
      role: 'user' as const,
      content: userPrompt,
    };

    setLlmMessages([...llmMessages, newUserMessage]);
    setPrompt('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/chat`, {
        messages: [...llmMessages, newUserMessage],
      });

      const assistantMessage = {
        role: 'assistant' as const,
        content: response.data.response,
      };

      setLlmMessages([...llmMessages, newUserMessage, assistantMessage]);

      const newSteps = parseXml(response.data.response).map((x: any) => ({
        ...x,
        status: 'pending' as StepStatus,
      }));

      if (newSteps.length > 0) {
        setSteps((prevSteps) => [...prevSteps, ...newSteps]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    storageService.clearUser();
    storageService.clearAuthToken();
    setUser(null);
  };

  useEffect(() => {
    if (webcontainer && !templateSet) {
      init();
    }
  }, [webcontainer, templateSet]);

  const currentProject = {
    name: 'Untitled Project',
    description: 'Generated with AppiaV2',
    language: selectedLanguage,
    prompt: prompt,
    code: files.find(f => f.type === 'file')?.content || '',
    files: filesMap
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={() => window.location.href = '/'}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <img 
              src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTMgMkwzIDEzTDEyIDEzTDExIDIyTDIxIDExTDEyIDExTDEzIDJaIiBzdHJva2U9IiM2MEE1RkEiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiAvPjwvc3ZnPg==" 
              alt="AppiaV2 Logo" 
              className="w-6 h-6 relative z-10" 
            />
            <h1 className="text-xl font-semibold text-white">AppiaV2</h1>
          </button>
          <div className="h-6 mx-4 border-r border-gray-700"></div>
          <h2 className="text-gray-300 hidden sm:block">AI Website Builder</h2>
        </div>
        
        <div className="flex items-center gap-4">
          <LanguageSelector
            selectedLanguage={selectedLanguage}
            onLanguageChange={setSelectedLanguage}
          />
          
          <ProjectManager
            currentProject={currentProject}
            onLoadProject={handleLoadProject}
            user={user}
          />
          
          <button
            onClick={handleDownloadProject}
            disabled={isDownloading || files.length === 0}
            className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors mr-4 bg-gray-800 px-3 py-1.5 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            title="Download project as ZIP"
          >
            {isDownloading ? (
              <>
                <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
                <span className="hidden sm:inline">Downloading...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Download ZIP</span>
              </>
            )}
          </button>
          
          {user ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 text-gray-300">
                <UserIcon className="w-4 h-4" />
                <span className="hidden sm:inline">{user.name}</span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-white transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <UserIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Sign In</span>
            </button>
          )}
          
          <a
            href="/"
            className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
          >
            <Home className="w-5 h-5" />
            <span className="hidden sm:inline">Home</span>
          </a>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <motion.div
          className="bg-gray-900 border-r border-gray-800 overflow-hidden"
          animate={{
            width: isSidebarCollapsed ? '3rem' : '25rem',
          }}
          initial={false}
          transition={{ duration: 0.3 }}
        >
          <div className="flex h-full">
            <div className="p-2 bg-gray-900 border-r border-gray-800 flex flex-col items-center">
              <button
                onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
                className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
                title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                <PanelRight
                  className={`w-5 h-5 text-gray-400 transition-transform ${
                    isSidebarCollapsed ? 'rotate-180' : ''
                  }`}
                />
              </button>
            </div>

            {!isSidebarCollapsed && (
              <div className="flex-1 overflow-hidden flex flex-col">
                <div className="border-b border-gray-800 p-4">
                  <h3 className="text-white font-medium mb-1">Your Prompt</h3>
                  <p className="text-sm text-gray-400 line-clamp-2">{prompt}</p>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                  <h3 className="text-white font-medium mb-4">Build Steps</h3>
                  <div className="max-h-full overflow-y-auto">
                    <StepsList
                      steps={steps}
                      currentStep={currentStep}
                      onStepClick={setCurrentStep}
                    />
                  </div>
                </div>

                <div className="border-t border-gray-800 p-4">
                  {loading || !templateSet ? (
                    <Loader />
                  ) : (
                    <div className="space-y-3">
                      <h3 className="text-white font-medium">
                        Add Instructions
                      </h3>
                      <div className="relative">
                        <textarea
                          value={userPrompt}
                          onChange={(e) => setPrompt(e.target.value)}
                          placeholder="Add more instructions or modifications..."
                          className="w-full p-3 bg-gray-800 text-gray-200 rounded-lg border border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none placeholder-gray-500 text-sm h-20"
                        ></textarea>
                        <button
                          onClick={handleSendMessage}
                          disabled={userPrompt.trim().length === 0}
                          className="absolute right-3 bottom-3 p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-full transition-colors"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>

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
          <div className="flex-1 overflow-auto">
            <EnhancedFileExplorer
              files={filesMap}
              onFileChange={(path, content) => {
                const newFilesMap = { ...filesMap, [path]: content };
                setFilesMap(newFilesMap);
              }}
              onFileSelect={(path) => {
                const file = files.find(f => f.path === path);
                setSelectedFile(file || null);
              }}
              selectedFile={selectedFile?.path || ''}
              onFilesUpdate={handleFilesUpdate}
            />
          </div>
        </motion.div>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-800 bg-gray-900 flex items-center justify-between">
            <TabView activeTab={activeTab} onTabChange={setActiveTab} />
            <div className="flex items-center md:hidden">
              <button
                onClick={() => setFileExplorerCollapsed(!isFileExplorerCollapsed)}
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
            <div className="h-full rounded-lg overflow-hidden border border-gray-800 bg-gray-900 shadow-xl">
              {activeTab === 'code' ? (
                <CodeEditor
                  file={selectedFile}
                  onUpdateFile={handleFileUpdate}
                />
              ) : webcontainer ? (
                <PreviewFrame
                  webContainer={webcontainer as WebContainer}
                  files={files}
                />
              ) : webContainerLoading ? (
                <div className="h-full flex items-center justify-center text-gray-400 p-8 text-center">
                  <div>
                    <Loader size="lg" className="mb-4" />
                    <h3 className="text-lg font-medium text-gray-300 mb-2">
                      Initializing WebContainer
                    </h3>
                    <p className="text-gray-500 max-w-md">
                      Setting up the preview environment. This might take a moment...
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
            </div>
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onLogin={(user) => {
          setUser(user);
          setShowAuthModal(false);
        }}
      />
    </div>
  );
}
