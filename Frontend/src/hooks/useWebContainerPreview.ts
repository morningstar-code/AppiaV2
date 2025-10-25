import { useEffect, useState, useCallback } from 'react';
import { WebContainer } from '@webcontainer/api';
import { useWebContainer } from './useWebContainer';

interface FileNode {
  name: string;
  type: 'file' | 'folder';
  path: string;
  content?: string;
}

export const useWebContainerPreview = () => {
  const { webcontainer, error: bootError, loading: booting } = useWebContainer();
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [installing, setInstalling] = useState(false);
  const [building, setBuilding] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = useCallback((message: string) => {
    setLogs(prev => [...prev, message]);
    console.log('[WebContainer]', message);
  }, []);

  const mountFiles = useCallback(async (files: FileNode[]) => {
    if (!webcontainer) {
      addLog('WebContainer not ready');
      return;
    }

    try {
      addLog('Mounting files...');
      
      // Build file tree structure
      const fileTree: any = {};
      
      for (const file of files) {
        if (file.type === 'file' && file.content) {
          const parts = file.path.split('/').filter(Boolean);
          let current = fileTree;
          
          for (let i = 0; i < parts.length - 1; i++) {
            if (!current[parts[i]]) {
              current[parts[i]] = { directory: {} };
            }
            current = current[parts[i]].directory;
          }
          
          const fileName = parts[parts.length - 1];
          current[fileName] = {
            file: { contents: file.content }
          };
        }
      }

      // Mount to WebContainer
      await webcontainer.mount(fileTree);
      addLog(`Mounted ${files.length} files`);
      
      return true;
    } catch (error) {
      addLog(`Mount failed: ${error}`);
      return false;
    }
  }, [webcontainer, addLog]);

  const installDependencies = useCallback(async () => {
    if (!webcontainer) return false;

    try {
      setInstalling(true);
      addLog('Installing dependencies...');
      
      const installProcess = await webcontainer.spawn('npm', ['install']);
      
      installProcess.output.pipeTo(new WritableStream({
        write(data) {
          addLog(data);
        }
      }));
      
      const exitCode = await installProcess.exit;
      
      if (exitCode === 0) {
        addLog('Dependencies installed successfully');
        setInstalling(false);
        return true;
      } else {
        addLog(`Install failed with exit code ${exitCode}`);
        setInstalling(false);
        return false;
      }
    } catch (error) {
      addLog(`Install error: ${error}`);
      setInstalling(false);
      return false;
    }
  }, [webcontainer, addLog]);

  const startDevServer = useCallback(async () => {
    if (!webcontainer) return;

    try {
      setBuilding(true);
      addLog('Starting dev server...');
      
      // Check if package.json has a dev script
      const packageJson = await webcontainer.fs.readFile('package.json', 'utf-8');
      const pkg = JSON.parse(packageJson);
      
      if (!pkg.scripts?.dev) {
        addLog('No dev script found, serving static files');
        setBuilding(false);
        
        // For simple HTML projects, use a static server
        const serverProcess = await webcontainer.spawn('npx', ['-y', 'serve', '-p', '3000']);
        
        webcontainer.on('server-ready', (port, url) => {
          addLog(`Server ready at ${url}`);
          setPreviewUrl(url);
        });
        
        return;
      }
      
      // Start dev server
      const devProcess = await webcontainer.spawn('npm', ['run', 'dev']);
      
      devProcess.output.pipeTo(new WritableStream({
        write(data) {
          addLog(data);
        }
      }));
      
      // Listen for server ready
      webcontainer.on('server-ready', (port, url) => {
        addLog(`Dev server ready at ${url}`);
        setPreviewUrl(url);
        setBuilding(false);
      });
      
    } catch (error) {
      addLog(`Server start error: ${error}`);
      setBuilding(false);
    }
  }, [webcontainer, addLog]);

  const buildProject = useCallback(async (files: FileNode[]) => {
    if (!webcontainer) {
      addLog('WebContainer not ready');
      return;
    }

    // Mount files
    const mounted = await mountFiles(files);
    if (!mounted) return;

    // Check if package.json exists
    const hasPackageJson = files.some(f => f.name === 'package.json');
    
    if (hasPackageJson) {
      // Install dependencies
      const installed = await installDependencies();
      if (!installed) return;
      
      // Start dev server
      await startDevServer();
    } else {
      // Simple HTML project - serve directly
      addLog('Serving static HTML...');
      
      // Create a simple server for HTML
      await webcontainer.spawn('npx', ['-y', 'serve', '-p', '3000']);
      
      webcontainer.on('server-ready', (port, url) => {
        addLog(`Static server ready at ${url}`);
        setPreviewUrl(url);
      });
    }
  }, [webcontainer, mountFiles, installDependencies, startDevServer, addLog]);

  return {
    previewUrl,
    buildProject,
    loading: booting || installing || building,
    logs,
    error: bootError,
  };
};
