export interface ContextPoint {
  id: string;
  timestamp: Date;
  type: string;
  value: any;
  metadata?: Record<string, any>;
} 