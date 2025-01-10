import { Pattern } from './patterns';

export interface Flow {
  state: string;
  metrics: {
    coherence: number;
    resonance: number;
  };
}

export interface Energy {
  level: number;
  type: string;
}

export interface Context {
  depth: number;
  tags: string[];
}

export interface AutonomicState {
  energy: number;
  context: number;
  protection: number;
  patterns: Pattern[];
}

export interface AutonomicDevelopmentProps {
  flow$: any; // TODO: Type this properly
  energy$: any;
  context$: any;
}

export interface AutonomicDevelopmentHook {
  state: AutonomicState;
} 