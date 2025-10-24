import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Monitor, 
  Tablet, 
  Smartphone, 
  RotateCcw, 
  RefreshCw, 
  ZoomIn, 
  ZoomOut,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { CodeEditor } from './CodeEditor';

interface PreviewCanvasProps {
  url: string;
  deviceFrame: string;
  zoomLevel: number;
  selectedFile?: {
    name: string;
    type: 'file' | 'folder';
    content?: string;
    path: string;
  } | null;
  onDeviceChange: (device: string) => void;
  onZoomChange: (zoom: number) => void;
  onReload: () => void;
  onRotate: () => void;
  onUpdateFile?: (file: { name: string; content: string; path: string }) => void;
  onClearSelection?: () => void;
}

export function PreviewCanvas({ 
  url, 
  deviceFrame, 
  zoomLevel, 
  selectedFile,
  onDeviceChange, 
  onZoomChange, 
  onReload, 
  onRotate,
  onUpdateFile,
  onClearSelection
}: PreviewCanvasProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const deviceConfigs = {
    'iPhone 16': {
      width: 393,
      height: 852,
      icon: <Smartphone className="w-4 h-4" />,
      label: 'iPhone 16'
    },
    'iPad': {
      width: 820,
      height: 1180,
      icon: <Tablet className="w-4 h-4" />,
      label: 'iPad'
    },
    'Desktop': {
      width: 1200,
      height: 800,
      icon: <Monitor className="w-4 h-4" />,
      label: 'Desktop'
    }
  };

  const currentDevice = deviceConfigs[deviceFrame as keyof typeof deviceConfigs] || deviceConfigs['iPhone 16'];

  const handleZoomIn = () => {
    onZoomChange(Math.min(125, zoomLevel + 10));
  };

  const handleZoomOut = () => {
    onZoomChange(Math.max(50, zoomLevel - 10));
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const deviceStyles = {
    width: `${currentDevice.width * (zoomLevel / 100)}px`,
    height: `${currentDevice.height * (zoomLevel / 100)}px`,
    maxWidth: '100%',
    maxHeight: '100%'
  };

  // Show code editor if a file is selected
  if (selectedFile) {
    return (
      <div className="h-full flex flex-col">
        {/* Canvas Toolbar */}
        <div className="h-10 bg-[#0D0F12] border-b border-white/5 flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Code Editor</span>
            <button
              onClick={() => {
                // Clear selected file to go back to preview
                if (onClearSelection) {
                  onClearSelection();
                }
              }}
              className="ml-4 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-md transition-colors"
            >
              ← Back to Preview
            </button>
          </div>
        </div>
        
        {/* Code Editor */}
        <div className="flex-1">
          <CodeEditor file={selectedFile} onUpdateFile={onUpdateFile} />
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 ${
      isFullscreen ? 'fixed inset-0 z-40' : ''
    }`}>
      {/* Device Frame */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="relative bg-white rounded-2xl shadow-2xl overflow-hidden"
        style={deviceStyles}
      >
        {/* Device Header (for mobile frames) */}
        {deviceFrame !== 'Desktop' && (
          <div className="absolute top-0 left-0 right-0 h-6 bg-black rounded-t-2xl flex items-center justify-center z-10">
            <div className="w-16 h-1 bg-gray-600 rounded-full" />
          </div>
        )}

        {/* Preview Content */}
        <iframe
          ref={iframeRef}
          src={url}
          className="w-full h-full border-0"
          style={{
            borderRadius: deviceFrame === 'Desktop' ? '8px' : '0',
            marginTop: deviceFrame !== 'Desktop' ? '24px' : '0',
            height: deviceFrame !== 'Desktop' ? 'calc(100% - 24px)' : '100%'
          }}
          title="Site Preview"
          sandbox="allow-scripts allow-same-origin"
          allow="accelerometer; camera; encrypted-media; geolocation; gyroscope; microphone; midi; payment; usb; xr-spatial-tracking"
        />

        {/* Device Controls Overlay */}
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 hover:opacity-100 transition-opacity">
          <button
            onClick={onReload}
            className="p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-md transition-colors"
            title="Reload"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
          <button
            onClick={onRotate}
            className="p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-md transition-colors"
            title="Rotate"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </motion.div>

      {/* Canvas Controls */}
      <div className="absolute top-4 left-4 flex items-center gap-2">
        {/* Device Frame Selector */}
        <div className="flex items-center gap-1 bg-black/50 backdrop-blur-sm rounded-lg p-1">
          {Object.entries(deviceConfigs).map(([device, config]) => (
            <button
              key={device}
              onClick={() => onDeviceChange(device)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs transition-colors ${
                deviceFrame === device
                  ? 'bg-white/20 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              {config.icon}
              <span className="hidden sm:inline">{config.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Zoom Controls */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <div className="flex items-center gap-1 bg-black/50 backdrop-blur-sm rounded-lg p-1">
          <button
            onClick={handleZoomOut}
            disabled={zoomLevel <= 50}
            className="p-1.5 text-gray-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ZoomOut className="w-3 h-3" />
          </button>
          <span className="px-2 py-1 text-xs text-white min-w-[3rem] text-center">
            {zoomLevel}%
          </span>
          <button
            onClick={handleZoomIn}
            disabled={zoomLevel >= 125}
            className="p-1.5 text-gray-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ZoomIn className="w-3 h-3" />
          </button>
        </div>

        <button
          onClick={toggleFullscreen}
          className="p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-md transition-colors"
          title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        >
          {isFullscreen ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
        </button>
      </div>

      {/* Loading State */}
      {!url && (
        <div className="text-center text-gray-400">
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Monitor className="w-8 h-8 text-gray-600" />
          </div>
          <p className="text-sm">No preview available</p>
          <p className="text-xs text-gray-500 mt-1">Start building to see your project</p>
        </div>
      )}
    </div>
  );
}
