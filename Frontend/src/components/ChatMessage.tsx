import React from "react";
import { ChatMsg } from "../types/chat";

export default function ChatMessage({ id, role, text, imageUrls = [], tokens }: ChatMsg) {
  const isUser = role === "user";
  const isAssistant = role === "assistant";
  
  return (
    <div className="flex items-start gap-3 mb-4">
      {/* Avatar */}
      {isAssistant && (
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-white text-sm font-bold">A</span>
        </div>
      )}
      
      {/* Message Bubble */}
      <div className="flex-1">
        <div
          className={`px-4 py-3 rounded-lg max-w-[85%] ${
            isUser ? "bg-blue-600 text-white ml-auto" : "bg-gray-800 text-gray-100"
          }`}
        >
          <div className="whitespace-pre-wrap">{text}</div>
          {!!imageUrls.length && (
            <div className="mt-2 flex gap-2">
              {imageUrls.slice(0, 3).map((url) => (
                <img
                  key={url}
                  src={url}
                  className="h-10 w-10 rounded object-cover ring-1 ring-white/10"
                  crossOrigin="anonymous"
                  referrerPolicy="no-referrer"
                />
              ))}
            </div>
          )}
        </div>
        
        {/* Token Usage - Only show for assistant messages */}
        {isAssistant && tokens && (
          <div className="mt-1.5 flex items-center gap-2 text-[11px] text-gray-500 ml-1">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500/60"></span>
              {tokens.input} in
            </span>
            <span className="text-gray-600">•</span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500/60"></span>
              {tokens.output} out
            </span>
          </div>
        )}
      </div>
      
      {/* User Avatar Placeholder */}
      {isUser && (
        <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-white text-sm font-bold">U</span>
        </div>
      )}
    </div>
  );
}
