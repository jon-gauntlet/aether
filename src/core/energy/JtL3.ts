import { useEffect, useMemo } from 'react';
import { useStore } from 'zustand';
import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { map, distinctUntilChanged, debounceTime } from 'rxjs/operators';
import { FlowStateGuardian } from '../core/flow/FlowStateGuardian';
import { PatternCoherence } from '../core/patterns/PatternCoherence';
import { EnergySystem } from '../core/energy/EnergySystem';
import { Autonomic } from '../core/autonomic/Autonomic';

interface AutonomicState {
  flowState: {
    depth: number;
    resonance: number;
    protection: {
      level: number;
      type: 'soft' | 'medium' | 'hard';
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
  autonomicMetrics: {
    confidence: number;
    pattern_resonance: number;
    flow_protection: number;
    mode: 'active' | 'passive' | 'protective';
  };
}

// Singleton instances
const flowGuardian = new FlowStateGuardian();
const patternSystem = new PatternCoherence();
const energySystem = new EnergySystem();
const autonomic = new Autonomic();

// State observables
const state$ = new BehaviorSubject<AutonomicState>({
  flowState: {
    depth: 0.5,
    resonance: 0.5,
    protection: {
      level: 0.5,
      type: 'soft'
    }
  },
  patternMetrics: {
    coherence: 0.5,
    resonance: 0.5,
    evolution: 0.5,
    quality: 0.5
  },
  energyState: {
    current: 1,
    efficiency: 1,
    phase: 'stable'
  },
  autonomicMetrics: {
    confidence: 0.5,
    pattern_resonance: 0.5,
    flow_protection: 0,
    mode: 'active'
  }
});

// Initialize context and protection
const flowContext = flowGuardian.createContext();
const energyContext = energySystem.createState();

export const useAutonomicDevelopment = () => {
  useEffect(() => {
    // Combine all system observables
    const subscription = combineLatest([
      flowGuardian.observeContext(flowContext),
      flowGuardian.observeProtection(flowContext),
      patternSystem.observePatterns(flowContext),
      energySystem.observeState(energyContext),
      autonomic.observeAutonomicState()
    ]).pipe(
      debounceTime(100),
      map(([flowCtx, protection, patterns, energy, autonomicState]) => {
        if (!flowCtx || !protection) return state$.value;

        const patternMetrics = patterns.reduce(
          (acc, p) => ({
            coherence: acc.coherence + (p.metrics.coherence.current / patterns.length),
            resonance: acc.resonance + (p.metrics.stability.current / patterns.length),
            evolution: acc.evolution + (p.metrics.evolution.current / patterns.length),
            quality: acc.quality + (p.metrics.quality / patterns.length)
          }),
          { coherence: 0, resonance: 0, evolution: 0, quality: 0 }
        );

        return {
          flowState: {
            depth: flowCtx.depth,
            resonance: flowCtx.metrics.coherence,
            protection: {
              level: protection.level,
              type: protection.type
            }
          },
          patternMetrics,
          energyState: {
            current: energy?.current ?? 1,
            efficiency: energy?.efficiency ?? 1,
            phase: energy?.phase ?? 'stable'
          },
          autonomicMetrics: autonomicState
        };
      }),
      distinctUntilChanged((prev, curr) => 
        JSON.stringify(prev) === JSON.stringify(curr)
      )
    ).subscribe(state$);

    return () => subscription.unsubscribe();
  }, []);

  return useMemo(() => state$.value, [state$.value]);
}; 