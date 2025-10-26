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

  const installDependencies = useCallback(async (inWebPreview: boolean) => {
    if (!webcontainer) return false;

    try {
      setInstalling(true);
      addLog('Installing dependencies...');
      
      const installProcess = inWebPreview
        ? await webcontainer.spawn('sh', ['-c', 'cd web-preview && npm install --silent --no-audit --no-fund'])
        : await webcontainer.spawn('npm', ['install', '--silent', '--no-audit', '--no-fund']);
      
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
        
        // Fallback: sanitize web-preview to a minimal RN-web Vite app and retry once
        if (inWebPreview) {
          addLog('Attempting fallback: rewrite web-preview to minimal RN-web setup...');
          try {
            const minimalPkg = JSON.stringify({
              name: 'rn-web-app',
              version: '1.0.0',
              type: 'module',
              scripts: { dev: 'vite', build: 'vite build', preview: 'vite preview' },
              dependencies: { react: '^18.2.0', 'react-dom': '^18.2.0', 'react-native-web': '^0.19.10' },
              devDependencies: { '@vitejs/plugin-react': '^4.2.0', vite: '^5.0.0', typescript: '^5.3.0' }
            }, null, 2);
            await webcontainer.fs.writeFile('web-preview/package.json', minimalPkg);
            const viteCfg = "import { defineConfig } from 'vite';\nimport react from '@vitejs/plugin-react';\nexport default defineConfig({ plugins:[react()], resolve:{ alias:{ 'react-native':'react-native-web' } } });\n";
            await webcontainer.fs.writeFile('web-preview/vite.config.ts', viteCfg);
            // Ensure index entry
            const indexTsx = "import { createRoot } from 'react-dom/client';\nimport { AppRegistry } from 'react-native-web';\nimport App from './App';\nAppRegistry.registerComponent('App', () => App);\nconst root = document.getElementById('root');\nif (root) { const { element, getStyleElement } = AppRegistry.getApplication('App'); if (getStyleElement) document.head.appendChild(getStyleElement()); createRoot(root).render(element); }\n";
            await webcontainer.fs.writeFile('web-preview/src/index.tsx', indexTsx);
            
            addLog('Fallback files written. Retrying npm install...');
            const retry = await webcontainer.spawn('sh', ['-c', 'cd web-preview && npm install --silent --no-audit --no-fund']);
            retry.output.pipeTo(new WritableStream({ write(data){ addLog(data); } }));
            const retryCode = await retry.exit;
            if (retryCode === 0) {
              addLog('Fallback install succeeded');
              setInstalling(false);
              return true;
            }
            addLog(`Fallback install failed with exit code ${retryCode}`);
          } catch (e) {
            addLog(`Fallback rewrite error: ${e}`);
          }
        }
        setInstalling(false);
        return false;
      }
    } catch (error) {
      addLog(`Install error: ${error}`);
      setInstalling(false);
      return false;
    }
  }, [webcontainer, addLog]);

  const startDevServer = useCallback(async (inWebPreview: boolean) => {
    if (!webcontainer) return;

    try {
      setBuilding(true);
      addLog('Starting dev server...');
      
      // Listen for server ready FIRST
      webcontainer.on('server-ready', (port, url) => {
        addLog(`✅ Server ready at ${url}`);
        console.log('WebContainer URL:', url);
        setPreviewUrl(url);
        setBuilding(false);
      });
      
      // Check for dev script in proper location
      try {
        const pkgPath = inWebPreview ? 'web-preview/package.json' : 'package.json';
        const packageJson = await webcontainer.fs.readFile(pkgPath, 'utf-8');
        const pkg = JSON.parse(packageJson);
        
        if (pkg.scripts?.dev) {
          addLog('Starting npm run dev...');
          const devProcess = inWebPreview
            ? await webcontainer.spawn('sh', ['-c', 'cd web-preview && npm run dev'])
            : await webcontainer.spawn('npm', ['run', 'dev']);
          
          devProcess.output.pipeTo(new WritableStream({
            write(data) {
              addLog(data);
            }
          }));
        } else {
          addLog('No dev script, using static server...');
          await webcontainer.spawn('npx', ['-y', 'serve', '-p', '3000']);
        }
      } catch (err) {
        // No package.json, serve static HTML
        addLog('No package.json, serving static files...');
        await webcontainer.spawn('npx', ['-y', 'serve', '-p', '3000']);
      }
      
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

    // Detect web-preview structure
    const inWebPreview = files.some(f => f.path === 'web-preview/package.json');

    // Check if package.json exists
    const hasPackageJson = files.some(f => f.name === 'package.json' || f.path === 'web-preview/package.json');
    
    if (hasPackageJson) {
      // Install dependencies
      const installed = await installDependencies(inWebPreview);
      if (!installed) return;
      
      // Start dev server
      await startDevServer(inWebPreview);
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
