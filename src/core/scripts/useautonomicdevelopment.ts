import { useEffect, useState } from 'react';
import { combineLatest, Subscription } from 'rxjs';
import { AutonomicDevelopmentProps, AutonomicState } from '../types/autonomic';
import { FlowType, FlowState, FlowMetrics } from '../types/flow';
import { ContextState, DevelopmentContext } from '../types/context';
import { PredictiveValidation } from '../autonomic/PredictiveValidation';

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
    }
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
  const [validation] = useState(() => new PredictiveValidation(props.autonomic, props.energy));
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    const subscription = new Subscription();

    // Set development context
    validation.setValidationContext(['development', props.context?.type || 'default']);

    // Subscribe to validation errors
    const validationSub = validation.observeTypeErrors().subscribe(errors => {
      const newErrors = errors.flatMap(e => e.errors);
      setValidationErrors(newErrors);

      // Adjust protection based on errors
      if (newErrors.length > 0) {
        setState(prev => ({
          ...prev,
          protection: {
            ...prev.protection,
            level: Math.min(1, prev.protection.level + 0.2),
            type: 'enhanced'
          }
        }));
      }
    });

    // Subscribe to state changes
    const stateSub = combineLatest([
      props.flow$,
      props.energy$,
      props.context$
    ]).subscribe(([flow, energy, context]) => {
      setState(prevState => {
        const newState = {
          ...prevState,
          flow,
          energy,
          context,
          protection: {
            ...prevState.protection,
            level: flow.type === FlowType.PROTECTED ? 1 : prevState.protection.level
          }
        };

        // Validate state transitions
        if (process.env.NODE_ENV === 'development') {
          validation.validateState(newState);
        }

        return newState;
      });
    });

    subscription.add(validationSub);
    subscription.add(stateSub);

    return () => {
      subscription.unsubscribe();
    };
  }, [props.flow$, props.energy$, props.context$, validation, props.context?.type]);

  return {
    state,
    validationErrors,
    validation,
    isValid: validationErrors.length === 0
  };
} 