import { ReactNode } from 'react';

export type FlowState = 'focus' | 'flow' | 'rest';
export type FlowLevel = 'low' | 'medium' | 'high';

export interface FlowMetrics {
  duration: number;
  intensity: number;
  quality: number;
}

export interface SessionMetrics {
  totalSessions: number;
  averageQuality: number;
  averageIntensity: number;
  protectedSessions: number;
  qualityScore?: number;
  protectionEfficiency?: number;
}

export interface FlowSession {
  id: string;
  state: FlowState;
  level: FlowLevel;
  startTime: string;
  endTime?: string;
  metrics: FlowMetrics;
  patterns: string[];
  isProtected?: boolean;
}

export interface FlowAnalytics {
  averageFlowDuration: number;
  peakFlowFrequency: number;
  entropyTrend: number;
  sessionHistory: FlowSession[];
  patternCorrelations: Record<string, number>;
  sessionMetrics: SessionMetrics;
}

export interface FlowContextValue {
  state: FlowState;
  level: FlowLevel;
  metrics: FlowMetrics;
  currentSession?: FlowSession;
  isProtected: boolean;
}

export interface FlowProps {
  children: ReactNode;
  initialState?: FlowState;
  initialLevel?: FlowLevel;
}