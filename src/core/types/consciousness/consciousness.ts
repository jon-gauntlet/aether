import { Connection, Space, EnergyState, Protection, NaturalFlow, Resonance } from '../base';

// Extended space types
export interface MindSpace extends Space {
  resonance: Resonance;
  energy: EnergyState;
}

export interface FlowSpace extends Space {
  flow: NaturalFlow;
}

// Consciousness state
export interface ConsciousnessState {
  id: string;
  type: 'individual' | 'collective';
  space: MindSpace;
  spaces: FlowSpace[];
  connections: Connection[];
  resonance: Resonance;
  depth: number;
  protection: Protection;
  energy: EnergyState;
  flow: NaturalFlow;
}

// Default state creator
export const createDefaultConsciousnessState = (): ConsciousnessState => ({
  id: 'default',
  type: 'individual',
  space: {
    resonance: {
      primary: { frequency: 1, amplitude: 0.5, phase: 0 },
      harmonics: [],
      frequency: 1,
      amplitude: 0.5,
      phase: 0,
      coherence: 0.5,
      harmony: 0.5
    },
    energy: {
      mental: 0.5,
      physical: 0.5,
      emotional: 0.5
    }
  },
  spaces: [],
  connections: [],
  resonance: {
    primary: { frequency: 1, amplitude: 0.5, phase: 0 },
    harmonics: [],
    frequency: 1,
    amplitude: 0.5,
    phase: 0,
    coherence: 0.5,
    harmony: 0.5
  },
  depth: 0.5,
  protection: {
    level: 0.5,
    type: 'standard',
    shields: 0.5
  },
  energy: {
    mental: 0.5,
    physical: 0.5,
    emotional: 0.5
  },
  flow: {
    intensity: 0.5,
    stability: 0.5,
    coherence: 0.5,
    energy: 0.5
  }
});

// Thought stream
export interface ThoughtStream {
  id: string;
  type: 'focus' | 'explore' | 'rest' | 'connect';
  state: ConsciousnessState;
}

// Thought evolution
export interface ThoughtEvolution {
  id: string;
  from: ConsciousnessState;
  to: ConsciousnessState;
  depth: number;
}

// Type guards
export const isConsciousnessState = (state: any): state is ConsciousnessState => {
  return (
    typeof state === 'object' &&
    typeof state.id === 'string' &&
    (state.type === 'individual' || state.type === 'collective') &&
    Array.isArray(state.spaces) &&
    Array.isArray(state.connections) &&
    typeof state.depth === 'number'
  );
};

export const isThoughtStream = (stream: any): stream is ThoughtStream => {
  return (
    typeof stream === 'object' &&
    typeof stream.id === 'string' &&
    ['focus', 'explore', 'rest', 'connect'].includes(stream.type) &&
    isConsciousnessState(stream.state)
  );
};

export const isThoughtEvolution = (evolution: any): evolution is ThoughtEvolution => {
  return (
    typeof evolution === 'object' &&
    typeof evolution.id === 'string' &&
    isConsciousnessState(evolution.from) &&
    isConsciousnessState(evolution.to) &&
    typeof evolution.depth === 'number'
  );
};
