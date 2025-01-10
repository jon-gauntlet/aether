import { Connection, Space } from './consciousness';
import { EnergyState, Protection } from '../energy/types';
import { NaturalFlow, Resonance } from '../flow/types';

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
