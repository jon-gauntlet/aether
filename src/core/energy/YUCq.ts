import { BehaviorSubject, Observable } from 'rxjs';
import { NaturalFlow, Flow, Resonance } from '../types/base';
import { Stream } from '../types/stream';
import { createDefaultField } from '../factories/field';

export function createStream(id: string): Stream {
  const resonance: Resonance = {
    frequency: 0.8,
    amplitude: 0.8,
    harmony: 0.8,
    field: createDefaultField(),
    essence: 0.8
  };

  return {
    id,
    type: 'natural',
    metrics: {
      depth: 0.8,
      harmony: 0.8,
      energy: 0.8,
      presence: 0.8,
      resonance: 0.8,
      coherence: 0.8,
      rhythm: 0.8
    },
    resonance,
    timestamp: Date.now()
  };
}

export { FlowEngine } from './FlowEngine';