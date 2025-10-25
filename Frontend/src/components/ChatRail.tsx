import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Image as ImageIcon, X } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
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
  const { user } = useUser();
  const [messageText, setMessageText] = useState('');
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>();
  const { state, uploadMultiple, reset } = useImageUpload();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Token tracking from database
  const FREE_TIER_LIMIT = 108000;
  const [remainingTokens, setRemainingTokens] = useState(108000);
  const [tokensUsed, setTokensUsed] = useState(0);
  
  // Fetch actual usage from database on mount and after messages
  useEffect(() => {
    const fetchUsage = async () => {
      try {
        // Get userId from Clerk or fallback
        const userId = user?.id || localStorage.getItem('userId') || 'anonymous';
        console.log('🆔 [ChatRail] Fetching usage for userId:', userId);
        
        const response = await fetch(`/api/usage?userId=${userId}`);
        if (response.ok) {
          const data = await response.json();
          console.log('🔵 [ChatRail] Fetched usage from database:', data);
          setTokensUsed(data.tokensUsed || 0);
          setRemainingTokens(data.tokensRemaining || FREE_TIER_LIMIT);
        } else {
          console.warn('⚠️ [ChatRail] Failed to fetch usage, using local calculation');
          // Fallback to local calculation
          const totalUsed = messages.reduce((acc, msg) => {
            if (msg.role === 'assistant' && msg.tokens) {
              const msgTotal = (msg.tokens.input || 0) + (msg.tokens.output || 0) + (msg.tokens.total || 0);
              return acc + msgTotal;
            }
            return acc;
          }, 0);
          setTokensUsed(totalUsed);
          setRemainingTokens(Math.max(0, FREE_TIER_LIMIT - totalUsed));
        }
      } catch (error) {
        console.error('❌ [ChatRail] Error fetching usage:', error);
        // Fallback to local calculation
        const totalUsed = messages.reduce((acc, msg) => {
          if (msg.role === 'assistant' && msg.tokens) {
            const msgTotal = (msg.tokens.input || 0) + (msg.tokens.output || 0) + (msg.tokens.total || 0);
            return acc + msgTotal;
          }
          return acc;
        }, 0);
        setTokensUsed(totalUsed);
        setRemainingTokens(Math.max(0, FREE_TIER_LIMIT - totalUsed));
      }
    };
    
    fetchUsage();
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
    <div className="h-full flex flex-col min-h-0">
      {/* Chat Messages - Full conversational mode */}
      <div 
        className="flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-6 scroll-smooth"
        style={{ 
          minHeight: 0, 
          maxHeight: '100%',
          scrollbarWidth: 'thin',
          scrollbarColor: '#4B5563 transparent'
        }}
      >
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-4 w-full"
          >
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20">
              <span className="text-white text-sm font-bold">A</span>
            </div>
            <div className="flex-1">
              <div className="bg-[#2A2D35] rounded-2xl px-5 py-3.5 text-gray-100 max-w-full">
                <p className="text-[15px] leading-relaxed">I'll help you build amazing websites! Just describe what you want to create and I'll make it happen. 🚀</p>
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
            className="flex items-start gap-4 w-full"
          >
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20">
              <span className="text-white text-sm font-bold">A</span>
            </div>
            <div className="flex-1">
              <div className="bg-[#2A2D35] rounded-2xl px-5 py-3.5 text-gray-100 max-w-full">
                <div className="flex items-center space-x-3">
                  <div className="flex space-x-1.5">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                  <span className="text-sm text-gray-300">Thinking...</span>
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

      {/* Token Usage Tracker - Persistent above input */}
      <div className="px-4 py-3 border-t border-white/5 bg-[#0B0D10] flex-shrink-0">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-gray-400">
            {formatTokens(remainingTokens)} monthly tokens remaining
          </span>
          <a 
            href="#" 
            className="text-blue-500 hover:text-blue-400 transition-colors text-xs"
            onClick={(e) => {
              e.preventDefault();
              alert('Upgrade to Pro for 33x more tokens!');
            }}
          >
            Switch to Pro for 33x more usage
          </a>
        </div>
        
        {/* Progress Bar */}
        <div className="relative w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <div 
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${Math.max(0, tokenPercentage)}%` }}
          />
          {tokenPercentage < 5 && (
            <div className="absolute top-0 right-0 h-full w-1 bg-orange-500 animate-pulse" />
          )}
        </div>
        
        {/* Plan Summary */}
        <div className="mt-2 text-xs text-gray-500">
          Plan: <span className="text-gray-400">free</span> • 
          <span className="text-gray-400">{formatTokens(tokensUsed)} / {formatTokens(FREE_TIER_LIMIT)}</span> tokens used
          {tokenPercentage < 5 && (
            <span className="ml-2 text-orange-400">⚠️ Almost out of tokens</span>
          )}
        </div>
      </div>

      {/* Composer - Always visible at bottom */}
      <div 
        className="px-4 py-4 border-t border-white/10 bg-[#0D0F12] flex-shrink-0"
        onPaste={handlePaste}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <div className="flex items-end gap-2">
          {/* Image Upload Button */}
          <label className="p-2 bg-[#1A1D23] hover:bg-[#22252B] border border-white/10 text-gray-300 rounded-lg cursor-pointer transition-colors flex-shrink-0">
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
            <ImageIcon className="w-5 h-5" />
          </label>

          <div className="relative flex-1">
            <textarea
              ref={textareaRef}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Let's build..."
              disabled={isLoading}
              className="w-full bg-[#1A1D23] border border-white/10 rounded-lg px-3 py-2 pr-12 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-white/20 resize-none max-h-24 min-h-[44px]"
              rows={1}
            />
            
            {/* Send Button */}
            <button
              onClick={handleSend}
              disabled={(!messageText.trim() && pendingAttachments.length === 0) || isLoading}
              className="absolute right-2 bottom-2 p-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
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
