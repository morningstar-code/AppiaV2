import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  actionsCount?: number;
}

interface ChatHistoryProps {
  messages: ChatMessage[];
  actionsCount?: number;
}

export function ChatHistory({ messages, actionsCount }: ChatHistoryProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatMessage = (content: string) => {
    // Clean up AI responses to be more conversational
    return content
      .replace(/<boltArtifact[^>]*>/gi, '')
      .replace(/<\/boltArtifact>/gi, '')
      .replace(/<boltAction[^>]*>/gi, '')
      .replace(/<\/boltAction>/gi, '')
      .trim();
  };

  return (
    <div className="p-4 space-y-4 overflow-x-hidden">
      {/* Welcome message */}
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
              <p>I'll help you build amazing websites! Just describe what you want to create and I'll make it happen. 🚀</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Chat messages */}
      {messages.map((message, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className={`flex items-start space-x-3 ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}
        >
          {message.role === 'assistant' && (
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-bold">A</span>
            </div>
          )}
          
          <div className={`flex-1 max-w-[85%] ${message.role === 'user' ? 'flex justify-end' : ''}`}>
            <div className={`rounded-lg p-3 break-words ${
              message.role === 'user' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-800 text-gray-200'
            }`}>
              <p className="text-sm leading-relaxed break-words">
                {message.role === 'assistant' ? formatMessage(message.content) : message.content}
              </p>
            </div>
            
            {/* Actions summary for assistant messages */}
            {message.role === 'assistant' && message.actionsCount && message.actionsCount > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-2 text-xs text-gray-500 flex items-center space-x-2"
              >
                <span>{message.actionsCount} actions taken</span>
                <span>•</span>
                <span>{message.timestamp.toLocaleTimeString()}</span>
              </motion.div>
            )}
          </div>
        </motion.div>
      ))}

      <div ref={messagesEndRef} />
    </div>
  );
}
