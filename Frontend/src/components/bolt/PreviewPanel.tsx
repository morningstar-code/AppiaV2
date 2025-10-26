import React, { useState } from 'react';
import { RefreshCw, ExternalLink, Monitor } from 'lucide-react';

interface PreviewPanelProps {
  previewUrl: string;
}

type DeviceType = 'iphone' | 'ipad' | 'desktop';

const deviceDimensions = {
  iphone: { width: 393, height: 852, label: 'iPhone 16' },
  ipad: { width: 820, height: 1180, label: 'iPad Pro' },
  desktop: { width: 1920, height: 1080, label: 'Desktop' }
};

export const PreviewPanel: React.FC<PreviewPanelProps> = ({ previewUrl }) => {
  const [device, setDevice] = useState<DeviceType>('iphone');
  const [zoom, setZoom] = useState(80);
  const [iframeKey, setIframeKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const currentDevice = deviceDimensions[device];
  const scale = zoom / 100;
  const isDesktop = device === 'desktop';

  const handleRefresh = () => {
    setIframeKey(prev => prev + 1);
  };

  const handleOpenExternal = () => {
    if (previewUrl) {
      window.open(previewUrl, '_blank');
    }
  };

  const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setZoom(Number(e.target.value));
  };

  const handleFullscreen = () => {
    if (!containerRef.current) return;
    
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  // Listen for fullscreen changes
  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <div ref={containerRef} className="h-full flex flex-col bg-[#09090B]">
      {/* Toolbar */}
      <div className="h-10 border-b border-[#27272A] flex items-center justify-between px-4 bg-[#18181B]">
        <div className="flex items-center gap-3">
          <select 
            value={device}
            onChange={(e) => setDevice(e.target.value as DeviceType)}
            className="bg-[#27272A] text-xs text-gray-300 border border-[#3F3F46] rounded px-2 py-1 focus:outline-none focus:border-[#3B82F6] cursor-pointer"
          >
            <option value="iphone">iPhone 16</option>
            <option value="ipad">iPad Pro</option>
            <option value="desktop">Desktop</option>
          </select>
          
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="25"
              max="150"
              value={zoom}
              onChange={handleZoomChange}
              className="w-20 h-1 bg-[#27272A] rounded-lg appearance-none cursor-pointer accent-[#3B82F6]"
              style={{
                background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${((zoom - 25) / 125) * 100}%, #27272A ${((zoom - 25) / 125) * 100}%, #27272A 100%)`
              }}
            />
            <span className="text-xs text-gray-400 w-10">{zoom}%</span>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <button 
            onClick={handleRefresh}
            className="p-1.5 hover:bg-[#27272A] rounded text-gray-400 hover:text-white transition-colors"
            title="Refresh preview"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={handleOpenExternal}
            disabled={!previewUrl}
            className="p-1.5 hover:bg-[#27272A] rounded text-gray-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Open in new tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={handleFullscreen}
            className="p-1.5 hover:bg-[#27272A] rounded text-gray-400 hover:text-white transition-colors"
            title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            <Monitor className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Preview Frame */}
      <div className="flex-1 flex items-center justify-center bg-[#09090B] overflow-auto">
        {previewUrl && previewUrl.includes('snack.expo.dev') ? (
          /* Expo Snack can't be embedded - show message */
          <div className="text-center p-8">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center">
              <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">React Native App Ready!</h3>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              Your Tinder app is ready to preview in Expo Snack.
              Click the button above to open it in a new tab.
            </p>
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all shadow-lg hover:shadow-xl"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Open in Expo Snack
            </a>
            <p className="text-xs text-gray-500 mt-4">
              💡 Scan the QR code with Expo Go app to test on your phone
            </p>
          </div>
        ) : previewUrl ? (
          isDesktop ? (
            /* Desktop: Full-width iframe without device frame */
            <div className="w-full h-full p-4">
              <iframe
                key={iframeKey}
                src={previewUrl}
                className="w-full h-full border-0 bg-white rounded-lg shadow-2xl"
                title="Preview"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                allow="cross-origin-isolated"
              />
            </div>
          ) : (
            /* Mobile: Device frame with bezel */
            <div
              style={{
                width: `${currentDevice.width}px`,
                height: `${currentDevice.height}px`,
                transform: `scale(${scale})`,
                transformOrigin: 'center center',
                transition: 'all 0.3s ease'
              }}
              className={`${
                device === 'iphone' ? 'bg-black rounded-[3rem] shadow-2xl border-[8px] border-[#18181B]' :
                'bg-black rounded-[2rem] shadow-2xl border-[12px] border-[#18181B]'
              } relative overflow-hidden`}
            >
              {/* iPhone Notch */}
              {device === 'iphone' && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-[30px] bg-black rounded-b-3xl z-10" />
              )}
              
              {/* Screen */}
              <div className={`w-full h-full overflow-hidden ${
                device === 'iphone' ? 'rounded-[2.5rem]' : 'rounded-[1.5rem]'
              }`}>
                <iframe
                  key={iframeKey}
                  src={previewUrl}
                  className="w-full h-full border-0 bg-white"
                  title="Preview"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                  allow="cross-origin-isolated"
                />
              </div>
            </div>
          )
        ) : (
          <div className="text-center">
            <div className="text-5xl mb-3">⚡</div>
            <div className="text-sm text-gray-500">Start building to see preview</div>
          </div>
        )}
      </div>
    </div>
  );
};
