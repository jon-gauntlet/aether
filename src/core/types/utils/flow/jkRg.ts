import { NaturalFlow } from './consciousness';

export type PresenceType = 'reading' | 'writing' | 'thinking' | 'listening';
export type FlowState = 'shallow' | 'gathering' | 'deepening' | 'deep' | 'protected';

export interface Stream {
  id: string;
  flow: NaturalFlow;
  
  // Core metrics
  depth: number;
  stillness: number;
  resonance: number;
  presence: number;
  clarity: number;
  
  // Optional properties
  type?: PresenceType;
  lastActivity?: number;
  flowState?: FlowState;
