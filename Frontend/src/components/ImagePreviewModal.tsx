import React, { useEffect } from "react";

export default function ImagePreviewModal({ url, onClose }: { url?: string; onClose: () => void }) {
  if (!url) return null;

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm grid place-items-center" 
      onClick={onClose}
    >
      <img
        src={url}
        className="max-h-[90vh] max-w-[90vw] rounded-lg shadow-xl"
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
        onClick={(e) => e.stopPropagation()}
      />
      <button
        className="absolute top-4 right-4 px-3 py-1 rounded-md bg-white/10 text-white hover:bg-white/20"
        onClick={onClose}
      >
        Close
      </button>
    </div>
  );
}

