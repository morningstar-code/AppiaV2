export type Attachment = {
  id: string;
  url: string;
  name: string;
  type: string;
  size: number;
};

export type ChatMsg = {
  id: string;
  role: "user" | "assistant";
  text: string;
  imageUrls?: string[];         // keep URLs only
  tokens?: { input: number; output: number; total?: number };
};

