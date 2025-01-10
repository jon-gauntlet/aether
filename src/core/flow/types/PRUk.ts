import { Field } from './space';
import { FlowState } from './flow';

// Protection level enumeration
export enum ProtectionLevel {
  None = 0,
  Low = 1,
  Medium = 2,
  High = 3,
  Maximum = 4
}

// Protection state interface
export interface ProtectionState {
  level: ProtectionLevel;
  active: boolean;
  field?: Field;
  timestamp: string;
}

// Protection configuration
export interface ProtectionConfig {
  autoActivate: boolean;
  threshold: number;
  recovery: {
    rate: number;
    delay: number;
  };
  fields: {
    strength: number;
    radius: number;
  };
}

// Protection event
export interface ProtectionEvent {
  id: string;
  type: 'breach' | 'recovery' | 'strengthen' | 'weaken';
  timestamp: string;
  level: ProtectionLevel;
  flowState: FlowState;
  duration?: number;
}

// Protection metrics
export interface ProtectionMetrics {
  uptime: number;
  breaches: number;
  recoveries: number;
  averageStrength: number;
  stability: number;
}

// Type guards
export const isProtectionState = (state: any): state is ProtectionState => {
  return (
    typeof state === 'object' &&
    typeof state.level === 'number' &&
    typeof state.active === 'boolean' &&
    typeof state.timestamp === 'string' &&
    (!state.field || typeof state.field === 'object')
  );
};

export const isProtectionEvent = (event: any): event is ProtectionEvent => {
  return (
    typeof event === 'object' &&
    typeof event.id === 'string' &&
    ['breach', 'recovery', 'strengthen', 'weaken'].includes(event.type) &&
    typeof event.timestamp === 'string' &&
    typeof event.level === 'number'
  );
}; 