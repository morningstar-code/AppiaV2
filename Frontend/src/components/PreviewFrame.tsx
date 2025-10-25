import { WebContainer } from '@webcontainer/api';
import { useEffect, useState, useRef, memo } from 'react';
import { cn } from '../utils/cn';
import { RefreshCw, AlertOctagon, Maximize, Minimize, ExternalLink, ChevronDown, Monitor, Smartphone, Tablet } from 'lucide-react';

interface PreviewFrameProps {
  files: any[];
  webContainer: WebContainer;
  setPreviewUrl?: (url: string) => void;
  device?: string;
  zoomLevel?: number;
  selectionMode?: boolean;
  onElementSelect?: (element: string) => void;
}

const PreviewFrame = memo(function PreviewFrame({ files, webContainer, setPreviewUrl, device = 'iPhone 16', zoomLevel = 100, selectionMode = false, onElementSelect }: PreviewFrameProps) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentDevice, setCurrentDevice] = useState(device);
  const [currentZoom, setCurrentZoom] = useState(zoomLevel);
  const previewRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const hasStarted = useRef(false);

  // Device presets like Appia
  const devicePresets = {
    'iPhone 16': { width: 393, height: 852, name: 'iPhone 16' },
    'iPhone 15': { width: 393, height: 852, name: 'iPhone 15' },
    'iPhone 14': { width: 390, height: 844, name: 'iPhone 14' },
    'Pixel 9': { width: 412, height: 915, name: 'Pixel 9' },
    'Galaxy 24': { width: 412, height: 915, name: 'Galaxy 24' },
    'iPad Air': { width: 820, height: 1180, name: 'iPad Air' },
    'iPad Mini': { width: 744, height: 1133, name: 'iPad Mini' },
    'Desktop': { width: '100%', height: '100%', name: 'Desktop' }
  };

  const selectedDevice = devicePresets[currentDevice as keyof typeof devicePresets] || devicePresets['iPhone 16'];

  // Control functions
  const handleRefresh = () => {
    if (iframeRef.current && iframeRef.current.src) {
      iframeRef.current.src = iframeRef.current.src;
    }
  };

  const handleZoomIn = () => {
    setCurrentZoom(prev => Math.min(prev + 10, 200));
  };

  const handleZoomOut = () => {
    setCurrentZoom(prev => Math.max(prev - 10, 50));
  };

  const handleFullscreen = async () => {
    if (!document.fullscreenElement) {
      try {
        await previewRef.current?.requestFullscreen();
        setIsFullscreen(true);
      } catch (err) {
        console.error('Error entering fullscreen:', err);
      }
    } else {
      try {
        await document.exitFullscreen();
        setIsFullscreen(false);
      } catch (err) {
        console.error('Error exiting fullscreen:', err);
      }
    }
  };

  const handleOpenInNewTab = () => {
    if (url) {
      window.open(url, '_blank');
    }
  };

  async function startDevServer() {
    console.log('🚀 [PreviewFrame] Starting dev server...');
    console.log('📁 [PreviewFrame] Files count:', files.length);
    
    try {
      setLoading(true);
      setError(null);
      
      // Listen for server-ready event
      console.log('👂 [PreviewFrame] Setting up server-ready listener...');
      webContainer.on('server-ready', (port, serverUrl) => {
        console.log(`🎉 [PreviewFrame] Server ready at ${serverUrl} (port ${port})`);
        setUrl(serverUrl);
        if (setPreviewUrl) {
          setPreviewUrl(serverUrl);
        }
        setLoading(false);
      });
      
      console.log('📦 [PreviewFrame] Running npm install with improved strategy...');
      
      // Install dependencies with better error handling
      try {
        console.log('🔄 [PreviewFrame] Starting npm install...');
      const installProcess = await webContainer.spawn('npm', ['install']);
      
      installProcess.output.pipeTo(
        new WritableStream({
          write(data) {
              // Show install progress
              if (data.includes('added') || data.includes('removed') || data.includes('error') || data.includes('warn')) {
                console.log(`[npm install]: ${data}`);
              }
          },
        })
      );

      // Wait for install to complete
      const installExitCode = await installProcess.exit;
        console.log(`✅ [PreviewFrame] npm install completed with exit code: ${installExitCode}`);
      
      if (installExitCode !== 0) {
          console.warn('⚠️  [PreviewFrame] npm install had issues, but continuing...');
        }
        
      } catch (installErr) {
        console.warn('⚠️  [PreviewFrame] npm install failed, but continuing:', installErr);
      }
      
      console.log('🏃 [PreviewFrame] Starting dev server with improved strategy...');
      
      // Strategy 1: Try npm run dev first
      try {
        console.log('🔄 [PreviewFrame] Attempting npm run dev...');
        const devProcess = await webContainer.spawn('npm', ['run', 'dev', '--', '--host']);
        
        devProcess.output.pipeTo(
          new WritableStream({
            write(data) {
              console.log(`[npm run dev]: ${data}`);
            },
          })
        );
        
        console.log('✅ [PreviewFrame] npm run dev process started');
      } catch (devErr) {
        console.warn('⚠️  [PreviewFrame] npm run dev failed, trying npx vite...');
        
        // Strategy 2: Try npx vite
        try {
          const viteProcess = await webContainer.spawn('npx', ['vite', '--host']);
          
          viteProcess.output.pipeTo(
            new WritableStream({
              write(data) {
                console.log(`[npx vite]: ${data}`);
              },
            })
          );
          
          console.log('✅ [PreviewFrame] npx vite started');
        } catch (npxErr) {
          console.warn('⚠️  [PreviewFrame] npx vite failed, trying direct vite...');
          
          // Strategy 3: Try direct vite command
          try {
            const directViteProcess = await webContainer.spawn('vite', ['--host']);
            
            directViteProcess.output.pipeTo(
              new WritableStream({
                write(data) {
                  console.log(`[direct vite]: ${data}`);
                },
              })
            );
            
            console.log('✅ [PreviewFrame] Direct vite started');
          } catch (directErr) {
            console.error('❌ [PreviewFrame] All vite strategies failed:', directErr);
            
            // Strategy 4: Try with different shell
            try {
              console.log('🔄 [PreviewFrame] Trying with bash shell...');
              const bashProcess = await webContainer.spawn('bash', ['-c', 'npx vite --host']);
              
              bashProcess.output.pipeTo(
                new WritableStream({
                  write(data) {
                    console.log(`[bash vite]: ${data}`);
                  },
                })
              );
              
              console.log('✅ [PreviewFrame] Bash vite started');
            } catch (bashErr) {
              console.error('❌ [PreviewFrame] Bash strategy also failed:', bashErr);
              throw new Error('All development server strategies failed');
            }
          }
        }
      }
      
    } catch (err) {
      console.error('❌ [PreviewFrame] Preview initialization error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      
      if (errorMessage.includes('SharedArrayBuffer') || errorMessage.includes('crossOriginIsolated')) {
        setError(
          'This browser requires cross-origin isolation for the preview. Try restarting the dev server with "npm run dev" or try another browser.'
        );
      } else {
        setError(`Failed to initialize preview environment: ${errorMessage}`);
      }
      
      setLoading(false);
    }
  }

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    startDevServer();
  };

  // Inject selection script into iframe
  const injectSelectionScript = () => {
    console.log('🔍 [Selector] injectSelectionScript called');
    console.log('🔍 [Selector] iframeRef.current:', !!iframeRef.current);
    console.log('🔍 [Selector] selectionMode:', selectionMode);
    console.log('🔍 [Selector] iframe src:', iframeRef.current?.src);
    
    if (!iframeRef.current || !selectionMode) {
      console.log('⚠️ [Selector] Cannot inject script - iframe or selection mode not ready');
      return;
    }
    
    try {
      const iframeWindow = iframeRef.current.contentWindow;
      if (!iframeWindow) {
        console.log('⚠️ [Selector] No iframe window available');
        return;
      }

      console.log('🧹 [Selector] Removing existing selection script');
      // Remove existing script if any
      const existingScript = iframeWindow.document.getElementById('appia-selection-script');
      if (existingScript) {
        existingScript.remove();
        console.log('✅ [Selector] Existing script removed');
      } else {
        console.log('ℹ️ [Selector] No existing script found');
      }

      console.log('📝 [Selector] Creating new selection script');
      // Create and inject new script
      const script = iframeWindow.document.createElement('script');
      script.id = 'appia-selection-script';
      script.textContent = `
        (function() {
          let isSelecting = false;
          console.log('🎯 [AppiaIframe] Appia selection script loaded');
          
          function handleElementClick(e) {
            console.log('🖱️ [AppiaIframe] Element clicked, isSelecting:', isSelecting);
            console.log('🖱️ [AppiaIframe] Target element:', e.target.tagName, e.target.id, e.target.className);
            if (!isSelecting) return;
            
            e.preventDefault();
            e.stopPropagation();
            
            const target = e.target;
            let elementInfo = {
              tagName: target.tagName.toLowerCase(),
              id: target.id || '',
              className: target.className || '',
              textContent: target.textContent?.substring(0, 50) || ''
            };
            
            console.log('📋 [AppiaIframe] Element info:', JSON.stringify(elementInfo));
            
            // Create a more descriptive identifier
            let identifier = elementInfo.tagName;
            if (elementInfo.id) {
              identifier += '#' + elementInfo.id;
            } else if (elementInfo.className) {
              const firstClass = elementInfo.className.split(' ')[0];
              if (firstClass) {
                identifier += '.' + firstClass;
              }
            }
            
            console.log('🏷️ [AppiaIframe] Element identifier:', identifier);
            
            // Send message to parent
            if (window.parent) {
              console.log('📤 [AppiaIframe] Sending message to parent: APPIA_ELEMENT_SELECTED');
              window.parent.postMessage({
                type: 'APPIA_ELEMENT_SELECTED',
                element: identifier,
                details: elementInfo
              }, '*');
            } else {
              console.log('⚠️ [AppiaIframe] No parent window available');
            }
          }
          
          // Listen for selection mode changes
          window.addEventListener('message', function(event) {
            console.log('📨 [AppiaIframe] Received message from parent:', event.data);
            if (event.data && event.data.type === 'APPIA_SELECTION_MODE') {
              isSelecting = event.data.enabled;
              console.log('🎯 [AppiaIframe] Selection mode set to:', isSelecting);
              document.body.style.cursor = isSelecting ? 'crosshair' : 'default';
              
              if (isSelecting) {
                console.log('➕ [AppiaIframe] Adding click listener');
                document.addEventListener('click', handleElementClick, true);
              } else {
                console.log('➖ [AppiaIframe] Removing click listener');
                document.removeEventListener('click', handleElementClick, true);
              }
            }
          });
          
          // Initial setup
          if (window.parent) {
            console.log('📤 [AppiaIframe] Sending APPIA_IFRAME_READY to parent');
            window.parent.postMessage({
              type: 'APPIA_IFRAME_READY'
            }, '*');
          }
        })();
      `;
      
      iframeWindow.document.head.appendChild(script);
      console.log('✅ [Selector] Selection script injected into iframe head');
    } catch (error) {
      console.error('❌ [Selector] Failed to inject selection script:', error);
    }
  };

  // Listen for messages from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      console.log('📨 [PreviewFrame] Received message:', event.data);
      console.log('📨 [PreviewFrame] Message source:', event.source);
      console.log('📨 [PreviewFrame] Iframe contentWindow:', iframeRef.current?.contentWindow);
      console.log('📨 [PreviewFrame] Source matches iframe:', event.source === iframeRef.current?.contentWindow);
      
      if (event.source !== iframeRef.current?.contentWindow) {
        console.log('⚠️ [PreviewFrame] Message not from our iframe, ignoring');
        return;
      }
      
      if (event.data?.type === 'APPIA_ELEMENT_SELECTED' && onElementSelect) {
        console.log('🎯 [PreviewFrame] Element selected:', event.data.element);
        console.log('🎯 [PreviewFrame] Element details:', event.data.details);
        onElementSelect(event.data.element);
      } else if (event.data?.type === 'APPIA_IFRAME_READY') {
        console.log('✅ [PreviewFrame] Iframe ready message received');
      } else {
        console.log('ℹ️ [PreviewFrame] Unknown message type:', event.data?.type);
      }
    };

    console.log('📨 [PreviewFrame] Adding message listener');
    window.addEventListener('message', handleMessage);
    return () => {
      console.log('📨 [PreviewFrame] Removing message listener');
      window.removeEventListener('message', handleMessage);
    };
  }, [onElementSelect]);

  // Handle selection mode changes
  useEffect(() => {
    console.log('🎯 [PreviewFrame] Selection mode changed:', selectionMode, 'URL:', url);
    console.log('🎯 [PreviewFrame] Iframe ref:', !!iframeRef.current);
    console.log('🎯 [PreviewFrame] Iframe contentWindow:', !!iframeRef.current?.contentWindow);
    
    if (iframeRef.current?.contentWindow && url) {
      console.log('📤 [PreviewFrame] Sending selection mode message to iframe');
      
      // Wait for iframe to be fully loaded
      const enableSelection = () => {
        if (iframeRef.current?.contentWindow) {
          console.log('✉️ [PreviewFrame] PostMessage: APPIA_SELECTION_MODE, enabled:', selectionMode);
          iframeRef.current.contentWindow.postMessage({
            type: 'APPIA_SELECTION_MODE',
            enabled: selectionMode
          }, '*');
          
          if (selectionMode) {
            console.log('💉 [PreviewFrame] Selection mode active, injecting script');
            injectSelectionScript();
          }
        } else {
          console.log('⚠️ [PreviewFrame] Iframe contentWindow not available');
        }
      };
      
      // Try immediately first
      console.log('⏰ [PreviewFrame] Trying enableSelection immediately');
      enableSelection();
      
      // Also try after a delay to ensure iframe is ready
      if (selectionMode) {
        setTimeout(() => {
          console.log('⏰ [PreviewFrame] Trying enableSelection after 500ms');
          enableSelection();
        }, 500);
        setTimeout(() => {
          console.log('⏰ [PreviewFrame] Trying enableSelection after 1000ms');
          enableSelection();
        }, 1000);
      }
    } else {
      console.log('⚠️ [PreviewFrame] Cannot enable selection - iframe not ready or no URL');
    }
  }, [selectionMode, url]);

  useEffect(() => {
    console.log('🔄 [PreviewFrame] useEffect triggered');
    console.log('  - Files length:', files.length);
    console.log('  - WebContainer:', webContainer ? 'Yes' : 'No');
    console.log('  - Current URL:', url);
    console.log('  - Has started:', hasStarted.current);
    
    // Only start if we have files, webContainer, no URL yet, and haven't started
    if (files.length > 0 && webContainer && !url && !hasStarted.current) {
      console.log('✨ [PreviewFrame] Conditions met, starting server...');
      hasStarted.current = true;
      startDevServer();
    } else {
      console.log('⏭️  [PreviewFrame] Skipping - already has URL or no files or already started');
    }
  }, [files.length, webContainer, retryCount]); // Removed 'url' from dependencies

  // Add iframe load event listener for selection mode
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleIframeLoad = () => {
      console.log('🔄 Iframe loaded, checking selection mode:', selectionMode);
      if (selectionMode && iframe.contentWindow) {
        console.log('💉 Iframe loaded and selection mode active, injecting script');
        setTimeout(() => {
          injectSelectionScript();
          iframe.contentWindow?.postMessage({
            type: 'APPIA_SELECTION_MODE',
            enabled: true
          }, '*');
        }, 100);
      }
    };

    iframe.addEventListener('load', handleIframeLoad);
    return () => iframe.removeEventListener('load', handleIframeLoad);
  }, [selectionMode]);

  // Force selection script injection when selection mode is enabled
  useEffect(() => {
    if (selectionMode && iframeRef.current?.contentWindow && url) {
      console.log('🎯 Selection mode enabled, forcing script injection');
      const forceInjection = () => {
        if (iframeRef.current?.contentWindow) {
          console.log('💉 Force injecting selection script');
          injectSelectionScript();
          iframeRef.current.contentWindow.postMessage({
            type: 'APPIA_SELECTION_MODE',
            enabled: true
          }, '*');
        }
      };
      
      // Try multiple times to ensure it works
      forceInjection();
      setTimeout(forceInjection, 200);
      setTimeout(forceInjection, 500);
      setTimeout(forceInjection, 1000);
    }
  }, [selectionMode, url]);

  return (
    <div ref={previewRef} className={`h-full flex flex-col bg-gray-950 rounded-lg overflow-hidden border ${selectionMode ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-gray-800'}`}>
      {/* Appia-style Preview Toolbar */}
      <div className="flex items-center justify-between bg-gray-900 border-b border-gray-800 px-4 py-2">
        {/* Left side - Device selector and zoom */}
        <div className="flex items-center gap-3">
          {/* Device Selector */}
          <div className="relative">
            <select
              value={currentDevice}
              onChange={(e) => setCurrentDevice(e.target.value)}
              className="bg-gray-800 text-gray-300 text-sm rounded-md px-3 py-1.5 pr-8 focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none"
            >
              {Object.keys(devicePresets).map(deviceName => (
                <option key={deviceName} value={deviceName}>{deviceName}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center bg-gray-800 rounded-md">
            <button
              onClick={handleZoomOut}
              className="p-1.5 text-gray-400 hover:text-white transition-colors rounded-l-md"
              title="Zoom out"
            >
              <span className="text-sm">−</span>
            </button>
            <span className="text-sm text-gray-200 px-2 min-w-[3rem] text-center">{currentZoom}%</span>
            <button
              onClick={handleZoomIn}
              className="p-1.5 text-gray-400 hover:text-white transition-colors rounded-r-md"
              title="Zoom in"
            >
              <span className="text-sm">+</span>
            </button>
          </div>
        </div>

        {/* Right side - Action buttons */}
        <div className="flex items-center gap-2">
          {/* Selection Mode Indicator */}
          {selectionMode && (
            <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/20 text-blue-300 rounded-md text-sm">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              Selection Mode Active
            </div>
          )}
          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            className="p-1.5 text-gray-400 hover:text-white transition-colors rounded-md hover:bg-gray-800"
            title="Refresh preview"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Open in new tab */}
          {url && (
            <button
              onClick={handleOpenInNewTab}
              className="p-1.5 text-gray-400 hover:text-white transition-colors rounded-md hover:bg-gray-800"
              title="Open preview in separate tab"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          )}

          {/* Fullscreen Toggle */}
          <button
            onClick={handleFullscreen}
            className="p-1.5 text-gray-400 hover:text-white transition-colors rounded-md hover:bg-gray-800"
            title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Preview Content Area */}
      <div 
        className="flex-1 flex items-center justify-center overflow-auto bg-gray-950 scroll-smooth" 
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#4B5563 #1F2937',
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain'
        }}
      >
      {loading && (
        <div className="text-center p-6 flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
          <p className="text-gray-300 font-medium">Setting up preview environment...</p>
          <p className="text-sm text-gray-500">This might take a moment</p>
        </div>
      )}
      
      {error && (
        <div className="text-center p-6 bg-red-950/20 rounded-lg border border-red-900/50 max-w-md">
          <AlertOctagon className="h-10 w-10 text-red-500 mx-auto mb-4" />
          <h3 className="text-red-400 font-medium text-lg mb-2">Preview Error</h3>
          <p className="text-gray-300 mb-4">{error}</p>
          <button 
            onClick={handleRetry}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-900/30 hover:bg-red-900/50 text-gray-200 rounded-md transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      )}
      
      {url && !loading && !error && (
          <div className="flex items-center justify-center w-full h-full p-4">
            <div
              className="relative transition-all duration-300 ease-in-out"
              style={{
                transform: `scale(${currentZoom / 100})`,
                transformOrigin: 'center center',
              }}
            >
              {/* Device Frame */}
              <div
                className="relative"
                style={{
                  width: selectedDevice.width === '100%' ? '100%' : `${selectedDevice.width}px`,
                  height: selectedDevice.height === '100%' ? '100%' : `${selectedDevice.height}px`,
                  background: currentDevice === 'Desktop' ? 'none' : 'linear-gradient(145deg, #2a2a2a, #1a1a1a)',
                  borderRadius: currentDevice === 'Desktop' ? '8px' : '40px',
                  boxShadow: currentDevice === 'Desktop' ? 'none' : '0 20px 60px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                  border: currentDevice === 'Desktop' ? 'none' : '2px solid #333',
                }}
              >
                {/* Screen Area - Perfect fit like Appia */}
                <div
                  className="absolute bg-white overflow-auto scroll-smooth"
                  style={{
                    top: currentDevice === 'Desktop' ? '0' : '20px',
                    left: currentDevice === 'Desktop' ? '0' : '20px',
                    right: currentDevice === 'Desktop' ? '0' : '20px',
                    bottom: currentDevice === 'Desktop' ? '0' : '60px',
                    borderRadius: currentDevice === 'Desktop' ? '8px' : '25px',
                    WebkitOverflowScrolling: 'touch',
                    overscrollBehavior: 'contain'
                  }}
                >
        <iframe 
                    ref={iframeRef}
          src={url || undefined} 
                    className="w-full h-full border-0"
                    style={{
                      borderRadius: currentDevice === 'Desktop' ? '8px' : '25px',
                      display: 'block',
                      cursor: selectionMode ? 'crosshair' : 'default'
                    }}
          title="Site Preview"
          sandbox="allow-scripts allow-same-origin"
          allow="accelerometer; camera; encrypted-media; geolocation; gyroscope; microphone; midi; payment; usb; xr-spatial-tracking"
                    onLoad={() => {
                      console.log('🔄 [PreviewFrame] Iframe loaded successfully');
                      if (selectionMode && iframeRef.current) {
                        injectSelectionScript();
                      }
                    }}
                    onError={() => {
                      console.error('❌ [PreviewFrame] Iframe failed to load');
                      // Try to use data URL fallback if available
                      if ((window as any).fallbackDataUrl && setPreviewUrl) {
                        console.log('🔄 [PreviewFrame] Using data URL fallback');
                        setPreviewUrl((window as any).fallbackDataUrl);
                      }
                    }}
                  />
                  
                  {/* Selection Overlay */}
                  {selectionMode && (
                    <div 
                      className="absolute inset-0 bg-blue-500/10 border-2 border-blue-500 border-dashed pointer-events-none"
                      style={{
                        borderRadius: currentDevice === 'Desktop' ? '8px' : '25px',
                      }}
                    >
                      <div className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium">
                        Click to select element
                      </div>
                    </div>
                  )}
                </div>

                {/* Device-specific elements */}
                {currentDevice !== 'Desktop' && (
                  <>
                    {/* Home Indicator */}
                    <div
                      className="absolute bg-gray-600 rounded-full"
                      style={{
                        bottom: '15px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '134px',
                        height: '5px',
                      }}
                    />
                    
                    {/* Dynamic Island (for newer iPhones) */}
                    {(currentDevice === 'iPhone 16' || currentDevice === 'iPhone 15') && (
                      <div
                        className="absolute bg-black rounded-full"
                        style={{
                          top: '8px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: '126px',
                          height: '37px',
                        }}
                      >
                        <div
                          className="absolute bg-gray-400 rounded-full"
                          style={{
                            top: '50%',
                            right: '8px',
                            transform: 'translateY(-50%)',
                            width: '6px',
                            height: '6px',
                          }}
                        />
                      </div>
                    )}
                    
                    {/* Notch (for older iPhones) */}
                    {currentDevice === 'iPhone 14' && (
                      <div
                        className="absolute bg-black rounded-b-lg"
                        style={{
                          top: '0',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: '150px',
                          height: '30px',
                        }}
                      />
                    )}
                    
                    {/* Side Buttons */}
                    <div
                      className="absolute bg-gray-700 rounded-sm"
                      style={{
                        left: '-2px',
                        top: '80px',
                        width: '3px',
                        height: '40px',
                      }}
                    />
                    <div
                      className="absolute bg-gray-700 rounded-sm"
                      style={{
                        left: '-2px',
                        top: '130px',
                        width: '3px',
                        height: '20px',
                      }}
                    />
                    <div
                      className="absolute bg-gray-700 rounded-sm"
                      style={{
                        left: '-2px',
                        top: '160px',
                        width: '3px',
                        height: '20px',
                      }}
                    />
                    <div
                      className="absolute bg-gray-700 rounded-sm"
                      style={{
                        right: '-2px',
                        top: '120px',
                        width: '3px',
                        height: '50px',
                      }}
                    />
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export { PreviewFrame };
