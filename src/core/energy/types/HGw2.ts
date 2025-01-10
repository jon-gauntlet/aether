import { useEffect, useRef, useState } from 'react';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import {
  AutonomicFlow,
  AutonomicState,
  Context,
  Energy,
  UseAutonomicDevelopment
} from '../types/autonomic';

const DEFAULT_STATE: AutonomicState = {
  context: {
    current: '',
    depth: 0,
    patterns: []
  },
  energy: {
    level: 1,
    type: 'steady',
    flow: 'natural'
  },
  protection: {
    depth: 0,
    patterns: [],
    states: []
  }
};

export function useAutonomicDevelopment(): UseAutonomicDevelopment {
  const [state, setState] = useState<AutonomicState>(DEFAULT_STATE);
  const flow$ = useRef(new Subject<AutonomicFlow>()).current;

  useEffect(() => {
    const subscription = flow$
      .pipe(
        debounceTime(100),
        distinctUntilChanged((prev, curr) => {
          return (
            prev.context.current === curr.context.current &&
            prev.energy.level === curr.energy.level &&
            prev.energy.type === curr.energy.type &&
            prev.energy.flow === curr.energy.flow &&
            prev.protection.depth === curr.protection.depth
          );
        })
      )
      .subscribe((flow) => {
        setState((prevState) => ({
          ...prevState,
          context: {
            ...prevState.context,
            ...flow.context
          },
          energy: {
            ...prevState.energy,
            ...flow.energy
          },
          protection: {
            ...prevState.protection,
            ...flow.protection
          }
        }));
      });

    return () => subscription.unsubscribe();
  }, [flow$]);

  const updateFlow = (flow: Partial<AutonomicFlow>) => {
    flow$.next({
      context: {
        ...state.context,
        ...(flow.context || {})
      },
      energy: {
        ...state.energy,
        ...(flow.energy || {})
      },
      protection: {
        ...state.protection,
        ...(flow.protection || {})
      }
    });
  };

  const protect = (pattern: string) => {
    if (!state.protection.patterns.includes(pattern)) {
      updateFlow({
        protection: {
          ...state.protection,
          patterns: [...state.protection.patterns, pattern],
          depth: Math.min(1, state.protection.depth + 0.1)
        }
      });
    }
  };

  const unprotect = (pattern: string) => {
    if (state.protection.patterns.includes(pattern)) {
      updateFlow({
        protection: {
          ...state.protection,
          patterns: state.protection.patterns.filter((p) => p !== pattern),
          depth: Math.max(0, state.protection.depth - 0.1)
        }
      });
    }
  };

  const setEnergy = (energy: Partial<Energy>) => {
    updateFlow({
      energy: {
        ...state.energy,
        ...energy
      }
    });
  };

  const setContext = (context: Partial<Context>) => {
    updateFlow({
      context: {
        ...state.context,
        ...context
      }
    });
  };

  return {
    state,
    flow$,
    updateFlow,
    protect,
    unprotect,
    setEnergy,
    setContext
  };
} 