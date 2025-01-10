import { useState, useEffect } from 'react';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  FlowState,
  FlowMetrics,
  BaseMetrics,
  Protection,
  Pattern
} from '../types/base';

interface AutonomicMetrics {
  confidence: number;
  pattern_resonance: number;
  flow_protection: number;
  mode: 'active' | 'passive' | 'protective';
}

interface AutonomicDevelopmentState {
  flowState: {
    depth: number;
    resonance: number;
    protection: {
      level: number;
      type: 'natural' | 'enhanced' | 'autonomous';
    };
  };
  patternMetrics: {
    coherence: number;
    resonance: number;
    evolution: number;
    quality: number;
  };
  energyState: {
    current: number;
    efficiency: number;
    phase: 'charging' | 'discharging' | 'stable';
  };
  autonomicMetrics: AutonomicMetrics;
}

export const useAutonomicDevelopment = () => {
  const [state, setState] = useState<AutonomicDevelopmentState>({
    flowState: {
      depth: 0,
      resonance: 0,
      protection: {
        level: 0,
        type: 'natural'
      }
    },
    patternMetrics: {
      coherence: 0,
      resonance: 0,
      evolution: 0,
      quality: 0
    },
    energyState: {
      current: 0,
      efficiency: 0,
      phase: 'stable'
    },
    autonomicMetrics: {
      confidence: 0,
      pattern_resonance: 0,
      flow_protection: 0,
      mode: 'passive'
    }
  });

  const defaultBaseMetrics: BaseMetrics = {
    intensity: 0,
    coherence: 0,
    resonance: 0,
    presence: 0,
    harmony: 0,
    rhythm: 0
  };

  const defaultFlowMetrics: FlowMetrics = {
    ...defaultBaseMetrics,
    depth: 0,
    clarity: 0,
    stability: 0,
    focus: 0,
    energy: 0,
    quality: 0
  };

  const [flowState$] = useState(() => new BehaviorSubject<FlowState>({
    id: 'initial',
    type: 'natural',
    metrics: defaultFlowMetrics,
    protection: {
      level: 0,
      type: 'natural',
      strength: 0,
      resilience: 0,
      adaptability: 0,
      field: {
        center: { x: 0, y: 0, z: 0 },
        radius: 0,
        strength: 0,
        coherence: 0,
        stability: 0,
        waves: []
      },
      natural: true
    },
    patterns: [],
    timestamp: Date.now()
  }));

  const [protection$] = useState(() => new BehaviorSubject<Protection>({
    level: 0,
    type: 'natural',
    strength: 0,
    resilience: 0,
    adaptability: 0,
    field: {
      center: { x: 0, y: 0, z: 0 },
      radius: 0,
      strength: 0,
      coherence: 0,
      stability: 0,
      waves: []
    },
    natural: true
  }));

  const [patterns$] = useState(() => new BehaviorSubject<Pattern[]>([]));

  useEffect(() => {
    const subscription = combineLatest([
      flowState$,
      protection$,
      patterns$
    ]).pipe(
      map(([flowState, protection, patterns]) => {
        const patternMetrics = patterns.reduce(
          (acc, pattern) => ({
            coherence: acc.coherence + (pattern.evolution.metrics?.coherence ?? 0) / patterns.length,
            resonance: acc.resonance + (pattern.evolution.metrics?.stability ?? 0) / patterns.length,
            evolution: acc.evolution + (pattern.evolution.stage) / patterns.length,
            quality: acc.quality + (pattern.evolution.metrics?.stability ?? 0) / patterns.length
          }),
          { coherence: 0, resonance: 0, evolution: 0, quality: 0 }
        );

        const newState: AutonomicDevelopmentState = {
          flowState: {
            depth: flowState.metrics.depth,
            resonance: flowState.metrics.resonance,
            protection: {
              level: protection.level,
              type: protection.type
            }
          },
          patternMetrics,
          energyState: {
            current: flowState.metrics.energy,
            efficiency: flowState.metrics.quality,
            phase: flowState.metrics.energy > 0.8 ? 'charging' : 
                  flowState.metrics.energy < 0.2 ? 'discharging' : 'stable'
          },
          autonomicMetrics: {
            confidence: flowState.metrics.stability,
            pattern_resonance: patternMetrics.resonance,
            flow_protection: protection.level,
            mode: protection.type === 'autonomous' ? 'active' : 
                 protection.type === 'enhanced' ? 'protective' : 'passive'
          }
        };

        return newState;
      })
    ).subscribe(setState);

    return () => subscription.unsubscribe();
  }, [flowState$, protection$, patterns$]);

  return {
    state,
    flowState$,
    protection$,
    patterns$
  };
}; 