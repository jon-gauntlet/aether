import { useEffect, useState } from 'react';
import { combineLatest, Subscription } from 'rxjs';
import { AutonomicDevelopmentProps, AutonomicState } from '../types/autonomic';
import { FlowType } from '../types/flow';

const initialState: AutonomicState = {
  energy: {
    type: 'steady',
    level: 0.5,
    flow: 'natural'
  },
  flow: {
    type: FlowType.NATURAL,
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

export function useAutonomicDevelopment(props: AutonomicDevelopmentProps) {
  const [state, setState] = useState<AutonomicState>(initialState);

  useEffect(() => {
    const subscription = new Subscription();

    const combinedSub = combineLatest([
      props.flow$,
      props.energy$,
      props.context$
    ]).subscribe(([flow, energy, context]) => {
      setState(prevState => ({
        ...prevState,
        flow,
        energy,
        context,
        protection: {
          ...prevState.protection,
          level: flow.type === FlowType.PROTECTED ? 1 : prevState.protection.level
        }
      }));
    });

    subscription.add(combinedSub);

    return () => {
      subscription.unsubscribe();
    };
  }, [props.flow$, props.energy$, props.context$]);

  return { state };
