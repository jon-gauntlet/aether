import type { Observable } from 'rxjs';
import type { 
  BaseState, 
  FlowState, 
  FlowMetrics, 
  Protection, 
  Resonance, 
  NaturalPattern, 
  Nullable, 
  Optional, 
  SystemUpdate 
} from './base';

import { 
  isFlowMetrics, 
  isProtection, 
  isNaturalPattern 
} from './base';

// Flow state values
export const FLOW_STATES = {
  RESTING: 'resting',
  PREPARING: 'preparing',
  FLOW: 'flow',
  RECOVERY: 'recovery',
  PROTECTED: 'protected',
  DISRUPTED: 'disrupted'
} as const;

export type FlowStateType = typeof FLOW_STATES[keyof typeof FLOW_STATES];

export interface FlowProtection {
  [key: string]: any;
}

export interface FlowOption {
  [key: string]: any;
}

// Validation utilities
export const isValidHistory = (history: any): boolean => {
  if (!history || typeof history !== 'object') {
    return false;
  }
  return (
    'transitions' in history && 
    'patterns' in history && 
    'metrics' in history && 
    Array.isArray(history.transitions)
  );
};

export const validateFlowTransition = (transition: any): boolean => {
  if (!isFlowTransition(transition)) {
    return false;
  }
  return true;
};

export const validateFlowMetrics = (metrics: any): boolean => {
  if (!isFlowMetrics(metrics)) {
    return false;
  }
  return true;
};