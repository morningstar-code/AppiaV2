import React from "react";
import { ChatMsg } from "../types/chat";

export default function ChatMessage({ id, role, text, imageUrls = [], tokens }: ChatMsg) {
  const isUser = role === "user";
  const isAssistant = role === "assistant";
  
  return (
    <div className="flex items-start gap-4 w-full">
      {/* Avatar */}
      {isAssistant && (
        <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20">
          <span className="text-white text-sm font-bold">A</span>
        </div>
      )}
      
      {/* Message Content - Full width conversational style */}
      <div className="flex-1 min-w-0">
        <div className={`${
          isUser ? "ml-auto max-w-[80%]" : "max-w-full"
        }`}>
          <div
            className={`rounded-2xl px-5 py-3.5 ${
              isUser 
                ? "bg-blue-600 text-white ml-auto" 
                : "bg-[#2A2D35] text-gray-100"
            }`}
          >
            <div className="whitespace-pre-wrap text-[15px] leading-relaxed">{text}</div>
            {!!imageUrls.length && (
              <div className="mt-3 flex gap-2">
                {imageUrls.slice(0, 3).map((url) => (
                  <img
                    key={url}
                    src={url}
                    className="h-12 w-12 rounded-lg object-cover ring-1 ring-white/10"
                    crossOrigin="anonymous"
                    referrerPolicy="no-referrer"
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* User Avatar */}
      {isUser && (
        <div className="w-9 h-9 bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-white text-sm font-bold">U</span>
        </div>
      )}
    </div>
  );
}
