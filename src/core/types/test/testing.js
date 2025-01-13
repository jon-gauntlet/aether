import { Field, FlowState } from './base';
import { ConsciousnessState } from './consciousness';

export const createMockField = (): Field => ({
  id: '1',
  name: 'Test Field',
  strength: 0.8,
  resonance: {
    frequency: 1.0,
    amplitude: 0.7,
    phase: 0,
    harmonics: [1.0, 2.0]
  },
  protection: {
    shields: 0.9,
    recovery: 0.8,
    resilience: 0.7,
    adaptability: 0.6
  },
  flowMetrics: {
    velocity: 0.8,
    momentum: 0.7,
    resistance: 0.2,
    conductivity: 0.9
  },
  naturalFlow: {
    direction: 1,
    intensity: 0.8,
    stability: 0.7,
    sustainability: 0.9
  }
});

export const createMockConsciousness = (): ConsciousnessState => {
  const mockField = createMockField();
  return {
    currentState: FlowState.FLOW,
    fields: [mockField],
    flowSpace: {
      dimensions: 3,
      capacity: 100,
      utilization: 0.5,
      stability: 0.8,
      fields: [mockField],
      boundaries: []
    },
    lastTransition: Date.now(),
    stateHistory: [FlowState.FOCUS, FlowState.FLOW],
    metrics: {
      clarity: 0.8,
      depth: 0.7,
      coherence: 0.9,
      integration: 0.8,
      flexibility: 0.7
    }
  };
};
