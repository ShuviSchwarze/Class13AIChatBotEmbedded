import { DocumentSource } from "./document";

export interface Message {
  id: string;
  type: "user" | "bot";
  content: string;
  loading?: boolean;
  timestamp: Date;
  file?: {
    name: string;
    size: number;
    type: string;
  };
  sources?: DocumentSource[];
  audio?: string; // Added audio property for audio playback
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  lastMessage: string;
  timestamp: Date;
}
