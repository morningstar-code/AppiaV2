import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import ChatMessage from './ChatMessage';
import { ChatMsg } from '../types/chat';

interface ChatHistoryProps {
  messages: ChatMsg[];
  actionsCount?: number;
}

export function ChatHistory({ messages, actionsCount }: ChatHistoryProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatMessage = (content: string) => {
    const trimmedContent = content.trim();
    if (!trimmedContent) {
      return '';
    }

    // Appia responses place conversational text before the artifact block.
    const artifactIndex = trimmedContent.indexOf('<appiaArtifact');
    if (artifactIndex !== -1) {
      return trimmedContent.slice(0, artifactIndex).trim();
    }

    return trimmedContent;
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
          key={message.id || index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <ChatMessage
            id={message.id}
            role={message.role}
            text={message.role === 'assistant' ? formatMessage(message.text) : message.text}
            imageUrls={message.imageUrls}
            tokens={message.tokens}
          />
        </motion.div>
      ))}

      <div ref={messagesEndRef} />
    </div>
  );
}
