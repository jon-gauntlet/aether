import { useEffect, useState } from 'react';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { map, distinctUntilChanged, debounceTime } from 'rxjs/operators';
import { FlowStateGuardian } from '../../flow/FlowStateGuardian';
import { PatternCoherence } from '../../pattern/PatternCoherence';
import { Autonomic } from '../../autonomic/Autonomic';
import type { AutonomicState as AutoState } from '../../autonomic/Autonomic';
import type { 
  EnergyState, 
  NaturalFlowType, 
  FlowContext,
  FlowProtection,
  AutonomicMetrics,
  FlowState,
  AutonomicState
} from '../../types/base';

interface Pattern {
  metrics: {
    coherence: { current: number };
    stability: { current: number };
    evolution: { current: number };
    quality: number;
  };
}

// Singleton instances
const flowGuardian = new FlowStateGuardian();
const patternSystem = new PatternCoherence();
const autonomic = new Autonomic();

// State observables
const state$ = new BehaviorSubject<AutonomicState>({
  flowState: {
    depth: 0,
    resonance: 0,
    protection: {
      level: 0,
      type: 'passive'
    },
    current: 'RESTING'
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
    phase: 'resting',
    mental: 0,
    physical: 0,
    emotional: 0,
    stability: 0,
    resonance: 0,
    flow: 0
  },
  autonomicMetrics: {
    confidence: 0,
    pattern_resonance: 0,
    flow_protection: 0,
    mode: 'passive',
    stability: 0,
    coherence: 0,
    evolution: 0
  }
});

// Initialize context and protection
const contextId = flowGuardian.createContext();
const initialEnergyState: EnergyState = {
  current: 0,
  efficiency: 0,
  phase: 'resting',
  mental: 0,
  physical: 0,
  emotional: 0,
  stability: 0,
  resonance: 0,
  flow: 0
};

// Helper function to convert AutoState to AutonomicMetrics
const convertToAutonomicMetrics = (state: AutoState): AutonomicMetrics => ({
  confidence: state.confidence,
  pattern_resonance: state.pattern_resonance,
  flow_protection: state.flow_protection,
  mode: state.mode,
  stability: 0, // Default values since AutoState doesn't have these
  coherence: 0,
  evolution: 0
});

export const useAutonomicDevelopment = () => {
  const [currentMode, setMode] = useState<NaturalFlowType>('NATURAL');

  useEffect(() => {
    flowGuardian.setMode(contextId, currentMode);
  }, [currentMode]);

  useEffect(() => {
    const subscription = combineLatest([
      flowGuardian.observeContext(contextId),
      flowGuardian.observeProtection(contextId),
      patternSystem.observePatterns(contextId),
      new BehaviorSubject<EnergyState>(initialEnergyState),
      autonomic.observeAutonomicState()
    ]).pipe(
      debounceTime(100),
      map(([flowCtx, protection, patterns, energy, autonomicState]) => {
        if (!flowCtx || !protection || !patterns) return state$.value;

        const patternMetrics = patterns.reduce(
          (acc: { coherence: number; resonance: number; evolution: number; quality: number }, p: Pattern) => ({
            coherence: acc.coherence + (p.metrics.coherence.current / patterns.length),
            resonance: acc.resonance + (p.metrics.stability.current / patterns.length),
            evolution: acc.evolution + (p.metrics.evolution.current / patterns.length),
            quality: acc.quality + (p.metrics.quality / patterns.length)
          }),
          { coherence: 0, resonance: 0, evolution: 0, quality: 0 }
        );

        const protectionState = protection as FlowProtection;
        const flowState = flowCtx as FlowContext;
        const flowStateValue: FlowState = flowState.type === 'PROTECTED' ? 'PROTECTED' : 'FLOW';

        const newState: AutonomicState = {
          flowState: {
            depth: flowState.metrics.stability,
            resonance: flowState.metrics.coherence,
            protection: {
              level: protectionState.level,
              type: protectionState.type
            },
            current: flowStateValue
          },
          patternMetrics,
          energyState: {
            ...energy,
            phase: energy.phase || 'resting',
            stability: energy.stability || 0,
            resonance: energy.resonance || 0,
            flow: energy.flow || 0
          },
          autonomicMetrics: convertToAutonomicMetrics(autonomicState)
        };

        return newState;
      }),
      distinctUntilChanged((prev, curr) => 
        JSON.stringify(prev) === JSON.stringify(curr)
      )
    ).subscribe(state => state$.next(state));

    return () => subscription.unsubscribe();
  }, []);

  return {
    flowState: {
      depth: 0,
      resonance: 0,
      protection: {
        level: 0,
        type: 'passive'
      },
      current: 'RESTING'
    },
    patternMetrics: {
      coherence: 0,
      resonance: 0,
      evolution: 0,
      quality: 0
    },
    energyState: initialEnergyState,
    autonomicMetrics: {
      confidence: 0,
      pattern_resonance: 0,
      flow_protection: 0,
      mode: 'passive',
      stability: 0,
      coherence: 0,
      evolution: 0
    }
  };
}