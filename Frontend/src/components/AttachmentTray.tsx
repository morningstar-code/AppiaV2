import React from "react";
import { Attachment } from "../types/chat";

type Props = {
  items: Attachment[];
  onRemove: (id: string) => void;
  onOpen: (url: string) => void;
};

export default function AttachmentTray({ items, onRemove, onOpen }: Props) {
  if (!items.length) return null;
  
  return (
    <div className="w-full px-2 py-2 bg-[#0E1013] border-t border-white/5">
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
        {items.map(item => (
          <div key={item.id} className="relative shrink-0">
            <img
              src={item.url}
              alt={item.name}
              className="h-16 w-16 rounded-md object-cover ring-1 ring-white/10 cursor-zoom-in"
              crossOrigin="anonymous"
              referrerPolicy="no-referrer"
              onClick={() => onOpen(item.url)}
            />
            <button
              aria-label="Remove"
              onClick={() => onRemove(item.id)}
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-black/70 text-white text-xs grid place-content-center hover:bg-black"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

