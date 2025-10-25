import React, { useState, useRef, useEffect } from 'react';
import { Send, Image as ImageIcon } from 'lucide-react';

interface ChatPanelProps {
  messages: Array<{
    id: string;
    role: 'user' | 'assistant';
    text: string;
    imageUrls?: string[];
    tokens?: { input: number; output: number };
  }>;
  onSendMessage: (message: { role: 'user'; text: string; imageUrls?: string[] }) => void;
  isLoading?: boolean;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ messages, onSendMessage, isLoading }) => {
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [messageText]);

  const handleSend = () => {
    if (!messageText.trim() || isLoading) return;
    onSendMessage({ role: 'user', text: messageText });
    setMessageText('');
  };

  return (
    <div className="h-full flex flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4 scroll-smooth" style={{ scrollbarWidth: 'thin', scrollbarColor: '#4B5563 transparent' }}>
        {messages.length === 0 && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">B</span>
            </div>
            <div className="flex-1 bg-[#2a2d35] rounded-xl px-4 py-3 text-sm text-gray-200">
              Hi! I'm Bolt. Describe what you want to build and I'll create it for you.
            </div>
          </div>
        )}
        
        {messages.map((message) => (
          <div key={message.id} className={`flex items-start gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
            {message.role === 'assistant' && (
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-bold">B</span>
              </div>
            )}
            <div className={`flex-1 ${message.role === 'user' ? 'bg-blue-600' : 'bg-[#2a2d35]'} rounded-xl px-4 py-3 text-sm text-gray-100 max-w-[85%]`}>
              {message.text}
              {message.tokens && (
                <div className="mt-2 text-xs text-gray-400">
                  {message.tokens.input + message.tokens.output} tokens
                </div>
              )}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">B</span>
            </div>
            <div className="flex-1 bg-[#2a2d35] rounded-xl px-4 py-3">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Describe what you want to build..."
            disabled={isLoading}
            className="flex-1 bg-[#2a2d35] border border-white/10 rounded-lg px-3 py-2 pr-10 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none min-h-[44px] max-h-[120px]"
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={!messageText.trim() || isLoading}
            className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
