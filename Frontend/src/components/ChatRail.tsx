import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Image as ImageIcon, X } from 'lucide-react';
import ChatMessage from './ChatMessage';
import AttachmentTray from './AttachmentTray';
import { useImageUpload } from '../hooks/useImageUpload';
import { Attachment } from '../types/chat';

interface ChatRailProps {
  messages: Array<{
    id: string;
    role: 'user' | 'assistant';
    text: string;
    imageUrls?: string[];
    tokens?: { input: number; output: number; total?: number };
  }>;
  onSendMessage: (message: { role: 'user'; text: string; imageUrls?: string[] }) => void;
  isLoading?: boolean;
}

export function ChatRail({ messages, onSendMessage, isLoading }: ChatRailProps) {
  const [messageText, setMessageText] = useState('');
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>();
  const { state, uploadMultiple, reset } = useImageUpload();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Token tracking (108K free tier limit)
  const FREE_TIER_LIMIT = 108000;
  const [remainingTokens, setRemainingTokens] = useState(FREE_TIER_LIMIT);
  
  // Calculate remaining tokens based on messages
  useEffect(() => {
    const totalUsed = messages.reduce((acc, msg) => {
      if (msg.tokens) {
        return acc + msg.tokens.input + msg.tokens.output;
      }
      return acc;
    }, 0);
    setRemainingTokens(Math.max(0, FREE_TIER_LIMIT - totalUsed));
  }, [messages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea with minimum height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.max(textareaRef.current.scrollHeight, 44); // Minimum 44px
      textareaRef.current.style.height = `${Math.min(newHeight, 96)}px`;
    }
  }, [messageText]);

  const handleFileSelect = async (files: File[]) => {
    const attachments = await uploadMultiple(files);
    if (attachments.length > 0) {
      setPendingAttachments(prev => [...prev, ...attachments]);
    }
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items ?? [];
    const files: File[] = [];
    
    for (const item of items) {
      const file = item.kind === 'file' ? item.getAsFile() : null;
      if (file && file.type.startsWith('image/')) {
        files.push(file);
      }
    }
    
    if (files.length > 0) {
      await handleFileSelect(files);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    );
    
    if (files.length > 0) {
      await handleFileSelect(files);
    }
  };

  const removeAttachment = (id: string) => {
    setPendingAttachments(prev => prev.filter(att => att.id !== id));
  };

  const openPreview = (url: string) => {
    setPreviewUrl(url);
  };

  const closePreview = () => {
    setPreviewUrl(undefined);
  };

  const handleSend = () => {
    if (!messageText.trim() && pendingAttachments.length === 0) return;
    
    const imageUrls = pendingAttachments.map(att => att.url);
    
    onSendMessage({
      role: 'user',
      text: messageText,
      imageUrls: imageUrls.length > 0 ? imageUrls : undefined
    });

    setMessageText('');
    setPendingAttachments([]);
    reset();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Format token count with K suffix
  const formatTokens = (tokens: number) => {
    if (tokens >= 1000) {
      return `${(tokens / 1000).toFixed(1)}K`;
    }
    return tokens.toString();
  };
  
  // Calculate percentage for progress indicator
  const tokenPercentage = (remainingTokens / FREE_TIER_LIMIT) * 100;
  
  return (
    <div className="h-full flex flex-col">
      {/* Token Counter Banner - Exact match to image */}
      <div className="bg-[#0D0F12] border-b border-white/5 px-3 py-2.5 flex-shrink-0">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400">
            {formatTokens(remainingTokens)} daily tokens remaining.
          </span>
          <div className="flex items-center gap-2">
            <a 
              href="#" 
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              Switch to Pro for 33x more usage
            </a>
            <button className="text-gray-500 hover:text-gray-300 transition-colors p-0.5">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        {/* Progress bar */}
        <div className="mt-2 w-full bg-gray-800/50 rounded-full h-1 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-blue-500 via-blue-600 to-purple-600 h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${tokenPercentage}%` }}
          />
        </div>
      </div>
      
      {/* Chat Messages - Fixed scrolling */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4" style={{ minHeight: 0 }}>
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start space-x-3"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-bold">A</span>
            </div>
            <div className="flex-1">
              <div className="bg-gray-800 rounded-lg p-3 text-gray-200">
                <p className="text-sm">I'll help you build amazing websites! Just describe what you want to create and I'll make it happen. 🚀</p>
              </div>
            </div>
          </motion.div>
        )}

        {messages.map((message, index) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <ChatMessage
              id={message.id}
              role={message.role}
              text={message.text}
              imageUrls={message.imageUrls}
              tokens={message.tokens}
            />
          </motion.div>
        ))}

        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start space-x-3"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-bold">A</span>
            </div>
            <div className="flex-1">
              <div className="bg-gray-800 rounded-lg p-3 text-gray-200">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                  <span className="text-sm text-gray-400">Thinking...</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Attachment Tray */}
      <AttachmentTray
        items={pendingAttachments}
        onRemove={removeAttachment}
        onOpen={openPreview}
      />

      {/* Composer */}
      <div 
        className="p-4 border-t border-white/5"
        onPaste={handlePaste}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Let's build..."
            disabled={isLoading}
            className="w-full bg-[#1A1D23] border border-white/10 rounded-lg px-3 py-2 pr-20 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-white/20 resize-none max-h-24 min-h-[44px]"
            rows={1}
          />
          
          {/* Image Upload Button */}
          <label className="absolute left-3 bottom-2.5 p-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded cursor-pointer transition-colors">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                if (files.length > 0) {
                  handleFileSelect(files);
                }
                // Reset input
                e.target.value = '';
              }}
              className="hidden"
            />
            <ImageIcon className="w-4 h-4" />
          </label>

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={(!messageText.trim() && pendingAttachments.length === 0) || isLoading}
            className="absolute right-3 bottom-2.5 p-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        {/* Upload Status */}
        {state.status === 'uploading' && (
          <div className="mt-2 text-xs text-gray-400">
            Uploading {state.count}/{state.total} images...
          </div>
        )}

        {state.status === 'error' && (
          <div className="mt-2 text-xs text-red-400">
            {state.message}
          </div>
        )}
      </div>

      {/* Image Preview Modal */}
      {previewUrl && (
        <div 
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm grid place-items-center" 
          onClick={closePreview}
        >
          <img
            src={previewUrl}
            className="max-h-[90vh] max-w-[90vw] rounded-lg shadow-xl"
            crossOrigin="anonymous"
            referrerPolicy="no-referrer"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            className="absolute top-4 right-4 px-3 py-1 rounded-md bg-white/10 text-white hover:bg-white/20"
            onClick={closePreview}
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}
