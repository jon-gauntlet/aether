export interface ContextPoint {
  id: string;
  type: 'insight' | 'question' | 'connection';
  content: string;
  timestamp: number;
  tags?: string[];
  connections?: string[];
} 