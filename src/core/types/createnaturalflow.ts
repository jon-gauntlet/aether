import { NaturalFlow, FlowState } from '../types/consciousness';
import { NaturalFlowImpl } from '../experience/NaturalFlow';

export function createNaturalFlow(state: FlowState): NaturalFlow {
  return new NaturalFlowImpl(state);
}

export function createEmptyNaturalFlow(): NaturalFlow {
  return createNaturalFlow({
    presence: 1,
    harmony: 1,
    rhythm: 1,
    resonance: 1,
    coherence: 1
  });
} 