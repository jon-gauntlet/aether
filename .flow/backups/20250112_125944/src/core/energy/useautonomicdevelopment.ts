import { useEffect, useState, useCallback } from 'react';
import { Subject, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { Pattern, PatternState } from '../types/patterns/types';
import { FlowState } from '../types/base';
import { 
  AutonomicState,
  DevelopmentPhase,
  AutonomicDevelopmentProps,
  AutonomicDevelopmentHook,
  Flow,
  ContextState
} from '../types/autonomic';

const NATURAL_RATIOS = {
  GOLDEN: 1.618033988749895,
  SILVER: 2.414213562373095,
  BRONZE: 0.302775637731995
};

const INITIAL_STATE: AutonomicState = {
  id: `autonomic-${Date.now()}`,
  type: 'development',
  flow: {
    id: `flow-${Date.now()}`,
    type: 'natural',
    metrics: {
      velocity: 0.5,
      focus: 0.7,
      energy: 0.5
    },
    active: true,
    timestamp: Date.now()
  },
  energy: {
    id: `energy-${Date.now()}`,
    level: 0.5,
    capacity: 1.0,
    focusMultiplier: NATURAL_RATIOS.GOLDEN,
    recoveryEfficiency: NATURAL_RATIOS.SILVER,
    sustainedDuration: 0,
    developmentPhase: DevelopmentPhase.CONFIGURATION
  },
  context: {
    id: `context-${Date.now()}`,
    flow: {
      id: `context-flow-${Date.now()}`,
      type: 'natural',
      metrics: {
        velocity: 0.5,
        focus: 0.7,
        energy: 0.5
      },
      active: true,
      timestamp: Date.now()
    },
    metrics: {
      velocity: 0.5,
      focus: 0.7,
      energy: 0.5,
      coherence: 0.8,
      resonance: 0.6,
      stability: 0.9,
      adaptability: 0.7,
      resilience: 0.8
    },
    protection: {
      level: 0.5,
      type: 'natural',
      shields: 3
    },
    timestamp: Date.now()
  },
  protection: {
    level: 0.5,
    type: 'natural',
    shields: 3
  },
  resonance: {
    primary: {
      frequency: 0.5,
      amplitude: 0.7,
      phase: 0
    },
    harmonics: [],
    frequency: 0.5,
    amplitude: 0.7,
    phase: 0,
    coherence: 0.8,
    harmony: 0.6
  },
  patterns: [],
  timestamp: Date.now()
};

export function useAutonomicDevelopment(
  props: AutonomicDevelopmentProps
): AutonomicDevelopmentHook {
  const [state, setState] = useState<AutonomicState>(INITIAL_STATE);
  const [patterns, setPatterns] = useState<Pattern[]>([]);

  const evolvePattern = useCallback((pattern: Pattern) => {
    const energyLevel = pattern.energyLevel * NATURAL_RATIOS.GOLDEN;
    const successRate = pattern.successRate * NATURAL_RATIOS.SILVER;
    
    return {
      ...pattern,
      energyLevel: Math.min(1, energyLevel),
      successRate: Math.min(1, successRate),
      states: [...pattern.states, PatternState.EVOLVING]
    };
  }, []);

  const protectPattern = useCallback((pattern: Pattern) => {
    if (pattern.successRate > 0.8 && pattern.energyLevel > 0.7) {
      return {
        ...pattern,
        states: [...pattern.states, PatternState.PROTECTED]
      };
    }
    return pattern;
  }, []);

  useEffect(() => {
    const subscription = combineLatest([
      props.autonomic.state$,
      props.energy.state$
    ]).pipe(
      map(([autonomicState, energyState]) => {
        // Self-Configuration
        if (energyState.developmentPhase === DevelopmentPhase.CONFIGURATION) {
          return {
            ...autonomicState,
            energy: {
              ...energyState,
              focusMultiplier: NATURAL_RATIOS.GOLDEN,
              recoveryEfficiency: NATURAL_RATIOS.SILVER
            }
          };
        }

        // Self-Healing
        if (energyState.level < 0.3 || autonomicState.context.metrics.coherence < 0.5) {
          return {
            ...autonomicState,
            energy: {
              ...energyState,
              developmentPhase: DevelopmentPhase.HEALING,
              recoveryEfficiency: NATURAL_RATIOS.GOLDEN
            }
          };
        }

        // Self-Optimizing
        if (energyState.level > 0.7 && autonomicState.context.metrics.coherence > 0.8) {
          const evolvedPatterns = patterns.map(evolvePattern);
          const protectedPatterns = evolvedPatterns.map(protectPattern);
          
          return {
            ...autonomicState,
            energy: {
              ...energyState,
              developmentPhase: DevelopmentPhase.OPTIMIZATION,
              focusMultiplier: NATURAL_RATIOS.GOLDEN
            },
            patterns: protectedPatterns
          };
        }

        // Self-Protecting
        if (autonomicState.context.metrics.stability < 0.6) {
          return {
            ...autonomicState,
            energy: {
              ...energyState,
              developmentPhase: DevelopmentPhase.PROTECTION
            },
            protection: {
              ...autonomicState.protection,
              level: Math.min(1, autonomicState.protection.level * NATURAL_RATIOS.GOLDEN)
            }
          };
        }

        return autonomicState;
      })
    ).subscribe(nextState => {
      setState(nextState);
    });

    return () => subscription.unsubscribe();
  }, [props.autonomic, props.energy, patterns, evolvePattern, protectPattern]);

  return { 
    state,
    patterns 
  };
} 