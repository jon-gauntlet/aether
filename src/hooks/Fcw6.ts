import { useEffect, useState, useCallback } from 'react';
import { combineLatest, Subscription, firstValueFrom } from 'rxjs';
import { AutonomicDevelopmentProps, AutonomicState } from '../types/autonomic';
import { NaturalFlowType, FlowState, FlowMetrics, BaseMetrics, Protection } from '../types/base';
import { ContextState, DevelopmentContext } from '../types/context';
import { EnergyState, EnergyMetrics } from '../types/energy';
import { PredictiveValidation } from '../autonomic/PredictiveValidation';

const NATURAL_RATIOS = {
  GOLDEN: 0.618033988749895,
  SILVER: 0.414213562373095,
  BRONZE: 0.302775637731995
};

const initialMetrics: FlowMetrics = {
  depth: 0.5,
  clarity: 0.5,
  stability: 0.5,
  focus: 0.5,
  energy: 0.5,
  quality: 0.5,
  intensity: 0.5,
  coherence: 0.5,
  resonance: 0.5,
  presence: 0.5,
  harmony: 0.5,
  rhythm: 0.5
};

const initialProtection: Protection = {
  level: 0.5,
  type: 'natural',
  strength: 0.5
};

export function useAutonomicDevelopment(props: AutonomicDevelopmentProps) {
  const [state, setState] = useState<AutonomicState>(initialState);
  const [developmentContext, setDevelopmentContext] = useState<DevelopmentContext>({
    phase: 'initialization',
    metrics: {
      coherence: 0.5,
      stability: 0.5,
      quality: 0.5,
      depth: 0.5,
      presence: 0.5
    },
    patterns: []
  });

  const predictiveValidation = new PredictiveValidation(props.autonomic, props.energy);

  const updateFlowState = useCallback(async (flowState: FlowState) => {
    const autonomicState = await firstValueFrom(props.autonomic.observeState());
    if (!autonomicState) return;

    const energyState = await firstValueFrom(props.energy.observeEnergy());
    if (!energyState) return;

    const validation = await predictiveValidation.validateState({
      flow: flowState,
      metrics: {
        coherence: autonomicState.resonance,
        stability: autonomicState.protection.strength,
        quality: autonomicState.flow.quality
      },
      spaces: ['development']
    });

    if (validation.isValid) {
      const newMetrics: FlowMetrics = {
        ...flowState.metrics,
        coherence: validation.coherence || flowState.metrics.coherence,
        focus: validation.focusMetrics?.intensity || flowState.metrics.focus,
        quality: validation.focusMetrics?.quality || flowState.metrics.quality
      };

      const newFlowState: FlowState = {
        ...flowState,
        metrics: newMetrics,
        protection: flowState.protection
      };

      setState(prev => ({
        ...prev,
        flow: newFlowState
      }));

      setDevelopmentContext(prev => ({
        ...prev,
        metrics: {
          ...prev.metrics,
          coherence: validation.coherence || prev.metrics.coherence,
          stability: energyState.protection?.strength || prev.metrics.stability,
          quality: validation.focusMetrics?.quality || prev.metrics.quality
        }
      }));
    }
  }, [props.autonomic, props.energy, predictiveValidation]);

  const optimizeFlowState = useCallback(async () => {
    const currentState = await firstValueFrom(props.autonomic.observeState());
    if (!currentState) return;

    const energyState = await firstValueFrom(props.energy.observeEnergy());
    if (!energyState) return;

    const optimalMetrics: FlowMetrics = {
      focus: currentState.flow.quality * NATURAL_RATIOS.GOLDEN,
      presence: currentState.presence * NATURAL_RATIOS.GOLDEN,
      coherence: currentState.resonance * NATURAL_RATIOS.SILVER,
      stability: energyState.protection?.strength * NATURAL_RATIOS.BRONZE || 0.5,
      depth: currentState.depth * NATURAL_RATIOS.GOLDEN,
      clarity: currentState.flow.quality * NATURAL_RATIOS.SILVER,
      energy: energyState.energy?.current * NATURAL_RATIOS.GOLDEN || 0.5,
      quality: currentState.flow.quality * NATURAL_RATIOS.SILVER,
      intensity: currentState.flow.quality * NATURAL_RATIOS.SILVER,
      resonance: currentState.resonance * NATURAL_RATIOS.GOLDEN,
      harmony: currentState.flow.harmony * NATURAL_RATIOS.SILVER,
      rhythm: 0.8 * NATURAL_RATIOS.BRONZE
    };

    const optimalFlow: FlowState = {
      id: `flow-${Date.now()}`,
      type: 'natural',
      metrics: optimalMetrics,
      protection: {
        level: currentState.protection.strength,
        type: currentState.protection.natural ? 'natural' : 'enhanced',
        strength: currentState.protection.strength
      },
      timestamp: Date.now()
    };

    await updateFlowState(optimalFlow);
  }, [props.autonomic, props.energy, updateFlowState]);

  useEffect(() => {
    const subscriptions: Subscription[] = [];

    const flowSub = combineLatest([
      props.autonomic.observeState(),
      props.energy.observeEnergy()
    ]).subscribe(async ([autonomicState, energyState]) => {
      if (autonomicState && energyState) {
        await optimizeFlowState();
      }
    });

    subscriptions.push(flowSub);

    return () => {
      subscriptions.forEach(sub => sub.unsubscribe());
    };
  }, [props.autonomic, props.energy, optimizeFlowState]);

  return {
    state,
    developmentContext,
    updateFlowState,
    optimizeFlowState
  };
} 