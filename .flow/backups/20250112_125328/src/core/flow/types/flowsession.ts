export type FlowLevel = 'low' | 'medium' | 'high';

export interface FlowSession {
  id: string;
  state: FlowState;
  level: FlowLevel;
  startTime: string;
  endTime?: string;
  isProtected?: boolean;
  metrics: {
    duration: number;
    intensity: number;
    quality: number;
  };
  patterns: string[];
}

export type FlowState = 'rest' | 'flow' | 'focus' | 'deep'; 