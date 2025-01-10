import { Observable } from 'rxjs';
import { FlowType, PresenceType } from './flow';

export interface AutonomicMetrics {
  focus: number;
  presence: number;
  coherence: number;
}

export interface AutonomicFlow {
  type: FlowType;
  level: number;
  metrics: AutonomicMetrics;
}

export interface AutonomicEnergy {
  type: string;
  level: number;
  flow: string;
}

export interface AutonomicContext {
  depth: number;
  type: string;
  presence: PresenceType;
}

export interface AutonomicProtection {
  level: number;
  type: string;
}

export interface AutonomicPattern {
  id: string;
  type: string;
  context: string[];
  states: string[];
}

export interface AutonomicState {
  energy: AutonomicEnergy;
  flow: AutonomicFlow;
  context: AutonomicContext;
  protection: AutonomicProtection;
  pattern: AutonomicPattern;
}

export interface AutonomicDevelopmentProps {
  flow$: Observable<AutonomicFlow>;
  energy$: Observable<AutonomicEnergy>;
  context$: Observable<AutonomicContext>;
} 