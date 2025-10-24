import React, { useState, useRef } from "react";
import { useImageUpload } from "../hooks/useImageUpload";
import { Attachment } from "../types/chat";
import AttachmentTray from "./AttachmentTray";

type Msg = {
  role: "user";
  text: string;
  imageUrls?: string[];
};

export default function ChatComposer({
  onSend,
}: {
  onSend: (msg: Omit<Msg, "id">) => Promise<void> | void;
}) {
  const [text, setText] = useState("");
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>();
  const { state, uploadMultiple, reset } = useImageUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    const attachments = await uploadMultiple([file]);
    if (attachments.length > 0) {
      setPendingAttachments(prev => [...prev, ...attachments]);
    }
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const attachments = await uploadMultiple(files);
      if (attachments.length > 0) {
        setPendingAttachments(prev => [...prev, ...attachments]);
      }
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  function onPaste(e: React.ClipboardEvent<HTMLDivElement>) {
    const items = e.clipboardData?.items ?? [];
    const files: File[] = [];
    
    for (const item of items) {
      const file = item.kind === "file" ? item.getAsFile() : null;
      if (file && file.type.startsWith("image/")) {
        files.push(file);
      }
    }
    
    if (files.length > 0) {
      uploadMultiple(files).then(attachments => {
        if (attachments.length > 0) {
          setPendingAttachments(prev => [...prev, ...attachments]);
        }
      });
    }
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith("image/")
    );
    
    if (files.length > 0) {
      uploadMultiple(files).then(attachments => {
        if (attachments.length > 0) {
          setPendingAttachments(prev => [...prev, ...attachments]);
        }
      });
    }
  }

  function removeAttachment(id: string) {
    setPendingAttachments(prev => prev.filter(att => att.id !== id));
  }

  function openPreview(url: string) {
    setPreviewUrl(url);
  }

  function closePreview() {
    setPreviewUrl(undefined);
  }

  async function submit() {
    if (!text.trim() && pendingAttachments.length === 0) return;
    
    const imageUrls = pendingAttachments.map(att => att.url);
    
    console.log("[AppiaChat] Sending prompt:", { text, hasImages: imageUrls.length > 0 });
    await onSend({ role: "user", text, imageUrls });

    setText("");
    setPendingAttachments([]);
    reset();
  }

  return (
    <>
      <div 
        className="w-full border-t border-white/5 bg-[#0B0C0F]"
        onPaste={onPaste}
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <AttachmentTray 
          items={pendingAttachments}
          onRemove={removeAttachment}
          onOpen={openPreview}
        />
        
        <div className="p-3">
          <div className="flex items-center gap-2">
            <label className="cursor-pointer px-3 py-2 bg-[#14161A] rounded-lg text-sm text-gray-200 hover:bg-[#1a1d23]">
              + Image
              <input 
                ref={fileInputRef}
                type="file" 
                accept="image/*" 
                multiple
                className="hidden" 
                onChange={onFile} 
              />
            </label>

            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type your prompt…"
              className="flex-1 bg-[#14161A] text-white rounded-lg px-3 py-2 outline-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
            />

            <button
              onClick={submit}
              disabled={!text.trim() && pendingAttachments.length === 0}
              className="px-4 py-2 bg-[#2E6CFB] hover:bg-[#2357c7] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white text-sm"
            >
              Send
            </button>
          </div>

          {state.status === "uploading" && (
            <div className="mt-2 text-xs text-gray-400">
              Uploading {state.count}/{state.total} images...
            </div>
          )}

          {state.status === "error" && (
            <div className="mt-2 text-xs text-red-400">
              {state.message}
            </div>
          )}
        </div>
      </div>

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
    </>
  );
}