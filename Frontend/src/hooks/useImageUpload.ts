import { useState, useCallback } from "react";
import { Attachment } from "../types/chat";

export type UploadState =
  | { status: "idle" }
  | { status: "uploading"; count: number; total: number }
  | { status: "done"; attachments: Attachment[] }
  | { status: "error"; message: string };

const MAX_MB = 8;
const ACCEPTED = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const MAX_ATTACHMENTS = 10;

export function useImageUpload() {
  const [state, setState] = useState<UploadState>({ status: "idle" });

  const validate = (file: File) => {
    if (!ACCEPTED.includes(file.type)) return "Unsupported file type";
    if (file.size > MAX_MB * 1024 * 1024) return `File too large (>${MAX_MB}MB)`;
    return null;
  };

  const uploadSingle = useCallback(async (file: File): Promise<Attachment | null> => {
    const err = validate(file);
    if (err) {
      console.warn("[AppiaChat] File validation failed:", err);
      return null;
    }

    try {
      const form = new FormData();
      form.append("file", file);

      console.log("[AppiaChat] Image upload start:", file.name);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
      const { url } = await res.json();

      console.log("[AppiaChat] Image upload success:", url);
      
      return {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        url,
        name: file.name,
        type: file.type,
        size: file.size
      };
    } catch (e) {
      console.error("[AppiaChat] Upload error:", e);
      return null;
    }
  }, []);

  const uploadMultiple = useCallback(async (files: File[]) => {
    const validFiles = files.slice(0, MAX_ATTACHMENTS);
    if (validFiles.length < files.length) {
      console.warn(`[AppiaChat] Limited to ${MAX_ATTACHMENTS} attachments`);
    }

    setState({ status: "uploading", count: 0, total: validFiles.length });

    const attachments: Attachment[] = [];
    
    for (let i = 0; i < validFiles.length; i++) {
      const attachment = await uploadSingle(validFiles[i]);
      if (attachment) {
        attachments.push(attachment);
      }
      setState({ status: "uploading", count: i + 1, total: validFiles.length });
    }

    if (attachments.length > 0) {
      setState({ status: "done", attachments });
    } else {
      setState({ status: "error", message: "No files uploaded successfully" });
    }

    return attachments;
  }, [uploadSingle]);

  const reset = () => setState({ status: "idle" });

  return { state, uploadMultiple, reset };
}
