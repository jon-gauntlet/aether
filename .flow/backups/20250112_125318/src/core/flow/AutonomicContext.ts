import { useState, useEffect, useCallback, useMemo } from 'react';
import { AutonomicDevelopment, AutonomicState } from '../core/autonomic/AutonomicDevelopment';
import { PatternCoherence } from '../core/patterns/PatternCoherence';
import { EnergySystem } from '../core/energy/EnergySystem';
import { useFlowState } from './useFlowState';

export interface AutonomicContext {
  state: AutonomicState | undefined;
  metrics: {
    focus: number;
    quality: number;
    efficiency: number;
  };
  actions: {
    startSession: () => void;
    endSession: () => void;
    pauseSession: () => void;
    resumeSession: () => void;
  };
  status: {
    isActive: boolean;
    isPaused: boolean;
    currentPhase: AutonomicState['recoveryPhase'];
  };
}

export const useAutonomicDevelopment = (contextId: string): AutonomicContext => {
  const [autonomicId, setAutonomicId] = useState<string>();
  const [state, setState] = useState<AutonomicState>();
  
  const flowState = useFlowState(contextId);
  
  const systems = useMemo(() => ({
    autonomic: new AutonomicDevelopment(new PatternCoherence()),
    energy: new EnergySystem()
  }), []);

  useEffect(() => {
    if (!autonomicId) return;

    const subscription = systems.autonomic
      .observeState(autonomicId)
      .subscribe(newState => {
        if (newState) setState(newState);
      });

    return () => subscription.unsubscribe();
  }, [autonomicId, systems.autonomic]);

  const startSession = useCallback(() => {
    const energyState = systems.energy.createState();
    const id = systems.autonomic.createAutonomicState(contextId, energyState);
    setAutonomicId(id);
  }, [contextId, systems]);

  const endSession = useCallback(() => {
    setAutonomicId(undefined);
    setState(undefined);
  }, []);

  const pauseSession = useCallback(() => {
    if (!state) return;
    systems.energy.pause(state.energyState);
  }, [state, systems.energy]);

  const resumeSession = useCallback(() => {
    if (!state) return;
    systems.energy.resume(state.energyState);
  }, [state, systems.energy]);

  const metrics = useMemo(() => ({
    focus: state?.metrics.sustainedFocus ?? 0,
    quality: state?.metrics.patternQuality ?? 0,
    efficiency: state?.metrics.energyEfficiency ?? 0
  }), [state]);

  const status = useMemo(() => ({
    isActive: !!state,
    isPaused: state?.energyState.phase === 'stable',
    currentPhase: state?.recoveryPhase ?? 'active'
  }), [state]);

  const actions = useMemo(() => ({
    startSession,
    endSession,
    pauseSession,
    resumeSession
  }), [startSession, endSession, pauseSession, resumeSession]);

  return {
    state,
    metrics,
    actions,
    status
  };
}; 