import { useEffect, useState } from 'react';
import { interval } from 'rxjs';
import { AutonomicState } from '../types/autonomic';

const initialState: AutonomicState = {
  energy: {
    type: 'steady',
    level: 0.5,
    flow: 'natural'
  },
  flow: {
    type: 'natural',
    level: 0.5,
    metrics: {
      focus: 0.5,
      presence: 0.5,
      coherence: 0.5
    }
  },
  context: {
    depth: 0.5,
    type: 'development',
    presence: 'neutral'
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

export function useAutonomicSystem() {
  const [state, setState] = useState<AutonomicState>(initialState);

  useEffect(() => {
    const subscription = interval(1000).subscribe(() => {
      setState(prevState => ({
        ...prevState,
        flow: {
          ...prevState.flow,
          level: Math.min(1, prevState.flow.level + 0.1),
          metrics: {
            ...prevState.flow.metrics,
            focus: Math.min(1, prevState.flow.metrics.focus + 0.1),
            presence: Math.min(1, prevState.flow.metrics.presence + 0.1),
            coherence: Math.min(1, prevState.flow.metrics.coherence + 0.1)
          }
        }
      }));
    });

    return () => subscription.unsubscribe();
  }, []);

  return { state };
} 