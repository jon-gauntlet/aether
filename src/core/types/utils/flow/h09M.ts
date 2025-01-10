import { Resonance } from './consciousness';

export type PresenceType = 'deep' | 'steady' | 'flowing';

export type Stream = {
  id: string;
  type: PresenceType;
  metrics: {
    depth: number;
    harmony: number;
    energy: number;
    presence: number;
    resonance: number;
    coherence: number;
    rhythm: number;
  };
  resonance: Resonance;
  timestamp: number;
