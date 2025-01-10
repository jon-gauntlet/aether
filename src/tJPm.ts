import { BehaviorSubject, Observable } from 'rxjs';
import { FlowState, FlowMetrics, NaturalFlow } from '../types/base';

export function createEmptyNaturalFlow(): NaturalFlow {
  const metrics: FlowMetrics = {
    depth: 0.8,
    harmony: 0.8,
    energy: 0.8,
    presence: 0.8,
    resonance: 0.8,
    coherence: 0.8,
    rhythm: 0.8
  };

  return {
    type: 'natural',
    metrics,
    depth: metrics.depth,
    harmony: metrics.harmony,
    energy: metrics.energy,
    presence: metrics.presence,
    resonance: metrics.resonance,
    coherence: metrics.coherence,
    rhythm: metrics.rhythm,
    timestamp: Date.now(),
    observeDepth: () => new BehaviorSubject(metrics.depth).asObservable(),
    observeEnergy: () => new BehaviorSubject(metrics.energy).asObservable(),
    observeFocus: () => new BehaviorSubject((metrics.presence + metrics.coherence) / 2).asObservable()
  };
}

export function createFlowState(metrics: FlowMetrics): FlowState {
  return {
    ...metrics,
    metrics,
    observeDepth: () => new BehaviorSubject(metrics.depth).asObservable(),
    observeEnergy: () => new BehaviorSubject(metrics.energy).asObservable(),
    observeFocus: () => new BehaviorSubject((metrics.presence + metrics.coherence) / 2).asObservable()
  };
}