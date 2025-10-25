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
    <div className="h-full flex flex-col bg-[#18181B]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-6 scroll-smooth" style={{ scrollbarWidth: 'thin', scrollbarColor: '#3F3F46 #18181B' }}>
        {messages.length === 0 && (
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 bg-gradient-to-br from-purple-500 to-blue-500 rounded-md flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">A</span>
            </div>
            <div className="flex-1">
              <div className="text-xs text-gray-400 mb-1.5 font-semibold">Appia</div>
              <div className="text-sm text-gray-300 leading-relaxed">
                Hi! I'm Appia. Describe what you want to build and I'll create it for you.
              </div>
            </div>
          </div>
        )}
        
        {messages.map((message) => (
          <div key={message.id} className="flex items-start gap-3">
            {message.role === 'assistant' ? (
              <>
                <div className="w-7 h-7 bg-gradient-to-br from-purple-500 to-blue-500 rounded-md flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">A</span>
                </div>
                <div className="flex-1">
                  <div className="text-xs text-gray-400 mb-1.5 font-semibold">Appia</div>
                  <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {message.text}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="w-7 h-7 bg-[#3F3F46] rounded-md flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">Y</span>
                </div>
                <div className="flex-1">
                  <div className="text-xs text-gray-400 mb-1.5 font-semibold">You</div>
                  <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {message.text}
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
        
        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 bg-gradient-to-br from-purple-500 to-blue-500 rounded-md flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">A</span>
            </div>
            <div className="flex-1">
              <div className="text-xs text-gray-400 mb-1.5 font-semibold">Appia</div>
              <div className="flex space-x-1.5">
                <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Token Counter */}
      <div className="px-4 py-2 border-t border-[#27272A] bg-[#18181B] text-xs text-gray-400">
        91K daily tokens remaining. <span className="text-blue-400 cursor-pointer hover:underline">Switch to Pro for 33x more usage</span>
      </div>

      {/* Input */}
      <div className="p-4 bg-[#18181B]">
        <div className="relative">
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
            placeholder="Let's build..."
            disabled={isLoading}
            className="w-full bg-[#27272A] border border-[#3F3F46] rounded-lg pl-4 pr-12 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#3B82F6] resize-none min-h-[48px] max-h-[120px]"
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={!messageText.trim() || isLoading}
            className="absolute right-3 bottom-3 p-1.5 bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-md transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        
        {/* Bottom Buttons */}
        <div className="mt-3 flex items-center gap-2">
          <button className="p-2 hover:bg-[#27272A] rounded-md transition-colors text-gray-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <button className="px-3 py-1.5 text-xs text-gray-400 hover:bg-[#27272A] rounded-md transition-colors flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Select
          </button>
          <button className="px-3 py-1.5 text-xs text-gray-400 hover:bg-[#27272A] rounded-md transition-colors flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Plan
          </button>
        </div>
      </div>
    </div>
  );
};
