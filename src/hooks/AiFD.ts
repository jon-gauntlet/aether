import { useEffect, useState, useCallback } from 'react';
import { combineLatest, Subscription, firstValueFrom } from 'rxjs';
import { AutonomicDevelopmentProps, AutonomicState } from '../types/autonomic';
import { FlowType, FlowState, FlowMetrics } from '../types/flow';
import { ContextState, DevelopmentContext } from '../types/context';
import { EnergyState, EnergyMetrics } from '../types/energy';
import { PredictiveValidation } from '../autonomic/PredictiveValidation';
import { NATURAL_RATIOS } from '../constants/natural';

const initialMetrics: FlowMetrics = {
  focus: 0.5,
  presence: 0.5,
  coherence: 0.5,
  sustainability: 0.5,
  depth: 0.5,
  harmony: 0.5,
  rhythm: 0.5,
  resonance: 0.5,
  intensity: 0.5
};

const initialEnergyMetrics: EnergyMetrics = {
  level: 0.5,
  capacity: 1.0,
  stability: 0.5,
  flow: 0.5,
  coherence: 0.5
};

const initialState: AutonomicState = {
  energy: {
    id: 'initial',
    level: 0.5,
    capacity: 1.0,
    protection: 0.5,
    timestamp: Date.now(),
    resonance: {
      primary: { frequency: 0.5, amplitude: 0.5, phase: 0 },
      harmonics: []
    },
    field: {
      strength: 0.5,
      coherence: 0.5,
      stability: 0.5
    },
    metrics: initialEnergyMetrics
  },
  flow: {
    id: 'initial',
    type: FlowType.NATURAL,
    metrics: initialMetrics,
    timestamp: Date.now()
  },
  context: {
    id: 'initial',
    type: 'development',
    depth: 0.5,
    presence: 'neutral',
    flow: FlowType.NATURAL,
    metrics: {
      depth: 0.5,
      presence: 0.5,
      coherence: 0.5,
      stability: 0.5
    },
    protection: {
      level: 0.5,
      type: 'standard'
    },
    timestamp: Date.now()
  },
  protection: {
    level: 0.5,
    type: 'standard'
  },
  pattern: {
    id: 'default',
    type: 'standard',
    context: ['default'],
    states: ['initial']
  }
};

export function useAutonomicDevelopment(props: AutonomicDevelopmentProps) {
  const [state, setState] = useState<AutonomicState>(initialState);
  const [developmentContext, setDevelopmentContext] = useState<DevelopmentContext>({
    phase: 'initialization',
    metrics: {
      coherence: 0.5,
      stability: 0.5,
      quality: 0.5
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
      const newMetrics = {
        ...flowState.metrics,
        coherence: validation.coherence || flowState.metrics.coherence,
        focus: validation.focusMetrics?.intensity || flowState.metrics.focus,
        quality: validation.focusMetrics?.quality || flowState.metrics.quality
      };

      const newFlowState = {
        ...flowState,
        metrics: newMetrics
      };

      setState(prev => ({
        ...prev,
        flow: newFlowState
      }));

      setDevelopmentContext(prev => ({
        ...prev,
        metrics: {
          coherence: validation.coherence || prev.metrics.coherence,
          stability: energyState.stability || prev.metrics.stability,
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

    const optimalMetrics = {
      focus: currentState.flow.quality * NATURAL_RATIOS.GOLDEN,
      presence: currentState.presence * NATURAL_RATIOS.GOLDEN,
      coherence: currentState.resonance * NATURAL_RATIOS.SILVER,
      sustainability: energyState.stability * NATURAL_RATIOS.BRONZE,
      depth: currentState.depth * NATURAL_RATIOS.GOLDEN,
      harmony: currentState.flow.harmony * NATURAL_RATIOS.SILVER,
      rhythm: 0.8 * NATURAL_RATIOS.BRONZE,
      resonance: currentState.resonance * NATURAL_RATIOS.GOLDEN,
      intensity: currentState.flow.quality * NATURAL_RATIOS.SILVER
    };

    const optimalFlow: FlowState = {
      id: `flow-${Date.now()}`,
      type: FlowType.NATURAL,
      metrics: optimalMetrics,
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