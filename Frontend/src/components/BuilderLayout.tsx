import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Files, 
  Search, 
  Github, 
  Settings, 
  Upload,
  ChevronLeft,
  ChevronRight,
  Monitor,
  Tablet,
  Smartphone,
  RotateCcw,
  RefreshCw,
  ZoomIn,
  ZoomOut
} from 'lucide-react';

interface BuilderLayoutProps {
  chatRail: React.ReactNode;
  previewCanvas: React.ReactNode;
  filesDrawer: React.ReactNode;
  commandPalette: React.ReactNode;
  onPublishClick?: () => void;
  onDeviceChange?: (device: string) => void;
  onZoomChange?: (zoom: number) => void;
  zoomLevel?: number;
}

export function BuilderLayout({ 
  chatRail, 
  previewCanvas, 
  filesDrawer, 
  commandPalette,
  onPublishClick,
  onDeviceChange,
  onZoomChange,
  zoomLevel: externalZoomLevel
}: BuilderLayoutProps) {
  const [filesDrawerOpen, setFilesDrawerOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [chatRailCollapsed, setChatRailCollapsed] = useState(false);
  const [currentPath, setCurrentPath] = useState('/');
  const [deviceFrame, setDeviceFrame] = useState('iPhone 16');
  const [zoomLevel, setZoomLevel] = useState(80);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Files drawer toggle
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        setFilesDrawerOpen(!filesDrawerOpen);
      }
      
      // Command palette toggle
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }
      
      // Chat rail toggle
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        setChatRailCollapsed(!chatRailCollapsed);
      }
      
      // Focus chat input
      if (e.shiftKey && e.key === '/') {
        e.preventDefault();
        const chatInput = document.querySelector('textarea[placeholder*="prompt"], input[placeholder*="prompt"]') as HTMLInputElement;
        chatInput?.focus();
      }
      
      // Device frame shortcuts
      if ((e.metaKey || e.ctrlKey) && e.key >= '1' && e.key <= '4') {
        e.preventDefault();
        const devices = ['iPhone 16', 'iPad', 'Desktop', 'iPhone 16'];
        setDeviceFrame(devices[parseInt(e.key) - 1]);
      }
      
      // Close modals with Escape
      if (e.key === 'Escape') {
        setFilesDrawerOpen(false);
        setCommandPaletteOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [filesDrawerOpen, commandPaletteOpen, chatRailCollapsed]);

  return (
    <div className="h-screen bg-[#0D0F12] flex flex-col overflow-hidden">
      {/* Top Toolbar */}
      <div className="h-12 bg-[#0D0F12] border-b border-white/5 flex items-center justify-between px-4 flex-shrink-0">
        {/* Left: Appia badge + title */}
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded flex items-center justify-center">
            <span className="text-white text-xs font-bold">A</span>
          </div>
          <span className="text-white text-sm font-medium">Builder</span>
        </div>

        {/* Center: Address bar */}
        <div className="flex-1 max-w-md mx-8">
          <div className="bg-[#1A1D23] border border-white/10 rounded-md px-3 py-1.5 text-xs text-gray-300">
            {currentPath}
          </div>
        </div>

        {/* Right: Icon buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setFilesDrawerOpen(!filesDrawerOpen)}
            className="p-2 rounded-md hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
            title="Files (Cmd/Ctrl+B)"
          >
            <Files className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setCommandPaletteOpen(!commandPaletteOpen)}
            className="p-2 rounded-md hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
            title="Search (Cmd/Ctrl+K)"
          >
            <Search className="w-4 h-4" />
          </button>
          
          <button
            className="p-2 rounded-md hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
            title="GitHub"
          >
            <Github className="w-4 h-4" />
          </button>
          
          <button
            className="p-2 rounded-md hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
          
          <button 
            onClick={onPublishClick}
            className="ml-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
          >
            Publish
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Rail */}
        <AnimatePresence>
          {!chatRailCollapsed && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 360, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-[#0D0F12] border-r border-white/5 flex flex-col"
            >
              {chatRail}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Preview Canvas */}
        <div className="flex-1 flex flex-col bg-[#0D0F12]">
          {/* Canvas Toolbar */}
          <div className="h-10 bg-[#0D0F12] border-b border-white/5 flex items-center justify-between px-4">
            {/* Device Frame Switcher */}
            <div className="flex items-center gap-2">
              <select
                value={deviceFrame}
                onChange={(e) => {
                  setDeviceFrame(e.target.value);
                  onDeviceChange?.(e.target.value);
                }}
                className="bg-[#1A1D23] border border-white/10 rounded text-xs text-gray-300 px-2 py-1"
              >
                <option value="iPhone 16">iPhone 16</option>
                <option value="iPad">iPad</option>
                <option value="Desktop">Desktop</option>
              </select>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-2">
              <button className="p-1.5 rounded hover:bg-white/5 text-gray-400 hover:text-white">
                <RotateCcw className="w-3 h-3" />
              </button>
              <button className="p-1.5 rounded hover:bg-white/5 text-gray-400 hover:text-white">
                <RefreshCw className="w-3 h-3" />
              </button>
              <button 
                onClick={() => {
                  const newZoom = Math.max(50, (externalZoomLevel || zoomLevel) - 10);
                  setZoomLevel(newZoom);
                  onZoomChange?.(newZoom);
                }}
                className="p-1.5 rounded hover:bg-white/5 text-gray-400 hover:text-white"
              >
                <ZoomOut className="w-3 h-3" />
              </button>
              <span className="text-xs text-gray-400 min-w-[3rem] text-center">
                {externalZoomLevel || zoomLevel}%
              </span>
              <button 
                onClick={() => {
                  const newZoom = Math.min(200, (externalZoomLevel || zoomLevel) + 10);
                  setZoomLevel(newZoom);
                  onZoomChange?.(newZoom);
                }}
                className="p-1.5 rounded hover:bg-white/5 text-gray-400 hover:text-white"
              >
                <ZoomIn className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Canvas Content */}
          <div className="flex-1 relative">
            {previewCanvas}
          </div>
        </div>
      </div>

      {/* Slide-over Files Drawer */}
      <AnimatePresence>
        {filesDrawerOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-y-0 right-0 w-[420px] bg-[#0D0F12] border-l border-white/5 z-50 flex flex-col"
            style={{ top: '48px' }} // Below toolbar
          >
            {filesDrawer}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Command Palette Overlay */}
      <AnimatePresence>
        {commandPaletteOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-20"
            onClick={() => setCommandPaletteOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="bg-[#0D0F12] border border-white/10 rounded-lg shadow-xl w-full max-w-2xl mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              {commandPalette}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop for drawer */}
      <AnimatePresence>
        {filesDrawerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 z-40"
            onClick={() => setFilesDrawerOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
