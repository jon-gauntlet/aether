import { Field, FlowState } from '../base';

export interface ConsciousnessState {
  currentState: FlowState;
  flowSpace: {
    stability: number;
    coherence: number;
    resonance: number;
  };
  protection: {
    level: number;
    integrity: number;
    adaptability: number;
  };
  metrics: {
    focus: number;
    clarity: number;
    presence: number;
  };
}

export interface FlowSpace {
  watch: () => {
    subscribe: (callback: (data: { 
      state: FlowState;
      flows: FlowPattern[];
    }) => void) => { 
      unsubscribe: () => void;
    };
  };
  join: (type: string, context: any) => Promise<FlowPattern>;
  part: (id: string) => Promise<void>;
}

export interface FlowPattern {
  id: string;
  type: string;
  context: any;
  confidence: number;
  timestamp: number;
}

export const validateConsciousness = (state: ConsciousnessState): boolean => {
  return (
    state.flowSpace.stability >= 0 &&
    state.flowSpace.stability <= 1 &&
    state.flowSpace.coherence >= 0 &&
    state.flowSpace.coherence <= 1 &&
    state.flowSpace.resonance >= 0 &&
    state.protection.level >= 0 &&
    state.protection.level <= 1 &&
    state.protection.integrity >= 0 &&
    state.protection.integrity <= 1 &&
    state.protection.adaptability >= 0 &&
    state.protection.adaptability <= 1 &&
    state.metrics.focus >= 0 &&
    state.metrics.focus <= 1 &&
    state.metrics.clarity >= 0 &&
    state.metrics.clarity <= 1 &&
    state.metrics.presence >= 0 &&
    state.metrics.presence <= 1
  );
};
