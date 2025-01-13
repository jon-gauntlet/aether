import { Timestamp } from 'firebase/firestore';

export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  FILE = 'FILE',
  SYSTEM = 'SYSTEM'
}

export interface Message {
  id: string;
  content: string;
  type: MessageType;
  timestamp: Date | null;
  attachments: string[];
}

export interface ChatState {
  messages: Message[];
  loading: boolean;
  error: Error | null;
}

export interface Channel {
  id: string;
  name: string;
  description?: string;
  members: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}