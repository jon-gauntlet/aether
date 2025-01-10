import { BehaviorSubject, Observable } from 'rxjs';
import { FlowState, FlowMetrics, NaturalFlow } from '../types/base';
import { createEmptyNaturalFlow } from '../factories/flow';

export function evolveFlow(current: FlowState, target: FlowState): FlowState {
  const metrics: FlowMetrics = {
    depth: calculateNextValue(current.metrics.depth, target.metrics.depth),
    harmony: calculateNextValue(current.metrics.harmony, target.metrics.harmony),
    energy: calculateNextValue(current.metrics.energy, target.metrics.energy),
    presence: calculateNextValue(current.metrics.presence, target.metrics.presence),
    resonance: calculateNextValue(current.metrics.resonance, target.metrics.resonance),
    coherence: calculateNextValue(current.metrics.coherence, target.metrics.coherence),
    rhythm: calculateNextValue(current.metrics.rhythm, target.metrics.rhythm)
  };

  return {
    ...metrics,
    metrics,
    observeDepth: () => new BehaviorSubject(metrics.depth).asObservable(),
    observeEnergy: () => new BehaviorSubject(metrics.energy).asObservable(),
    observeFocus: () => new BehaviorSubject((metrics.presence + metrics.coherence) / 2).asObservable()
  };
}

export function enhanceFlow(current: FlowState, intensity: number = 0.1): FlowState {
  const metrics: FlowMetrics = {
    depth: Math.min(1, current.metrics.depth + intensity),
    harmony: Math.min(1, current.metrics.harmony + intensity),
    energy: Math.min(1, current.metrics.energy + intensity),
    presence: Math.min(1, current.metrics.presence + intensity),
    resonance: Math.min(1, current.metrics.resonance + intensity),
    coherence: Math.min(1, current.metrics.coherence + intensity),
    rhythm: Math.min(1, current.metrics.rhythm + intensity)
  };

  return {
    ...metrics,
    metrics,
    observeDepth: () => new BehaviorSubject(metrics.depth).asObservable(),
    observeEnergy: () => new BehaviorSubject(metrics.energy).asObservable(),
    observeFocus: () => new BehaviorSubject((metrics.presence + metrics.coherence) / 2).asObservable()
  };
}

export function harmonizeFlow(source: FlowState, target: FlowState): FlowState {
  const metrics: FlowMetrics = {
    depth: (source.metrics.depth + target.metrics.depth) / 2,
    harmony: (source.metrics.harmony + target.metrics.harmony) / 2,
    energy: (source.metrics.energy + target.metrics.energy) / 2,
    presence: (source.metrics.presence + target.metrics.presence) / 2,
    resonance: (source.metrics.resonance + target.metrics.resonance) / 2,
    coherence: (source.metrics.coherence + target.metrics.coherence) / 2,
    rhythm: (source.metrics.rhythm + target.metrics.rhythm) / 2
  };

  return {
    ...metrics,
    metrics,
    observeDepth: () => new BehaviorSubject(metrics.depth).asObservable(),
    observeEnergy: () => new BehaviorSubject(metrics.energy).asObservable(),
    observeFocus: () => new BehaviorSubject((metrics.presence + metrics.coherence) / 2).asObservable()
  };
}

function calculateNextValue(current: number, target: number): number {
  return current + (target - current) * 0.1;
}