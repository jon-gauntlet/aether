import { useState, useEffect } from 'react';
import { Subject } from 'rxjs';

interface EnergyState {
  type: 'deep' | 'steady' | 'reflective' | 'analytical';
  flow: 'natural' | 'guided' | 'protected';
  level: number;
}

interface ContextState {
  depth: number;
  patterns: string[];
}

interface ProtectionState {
  depth: number;
  patterns: string[];
  states: string[];
}

interface SystemState {
  energy: EnergyState;
  context: ContextState;
  protection: ProtectionState;
}

interface FlowState {
  energy: {
    level: number;
    type: string;
  };
  context: {
    depth: number;
  };
  protection: {
    depth: number;
  };
}

const initialState: SystemState = {
  energy: {
    type: 'steady',
    flow: 'natural',
    level: 0.7
  },
  context: {
    depth: 0.5,
    patterns: ['Natural Flow', 'Deep Connection']
  },
  protection: {
    depth: 0.6,
    patterns: ['Flow State', 'Focus'],
    states: ['Active', 'Protected']
  }
};

export function useAutonomicSystem() {
  const [state, setState] = useState<SystemState>(initialState);
  const flow$ = new Subject<FlowState>();

  useEffect(() => {
    // Simulate natural flow changes
    const interval = setInterval(() => {
      const newState = {
        ...state,
        energy: {
          ...state.energy,
          level: 0.5 + Math.random() * 0.5
        },
        context: {
          ...state.context,
          depth: 0.3 + Math.random() * 0.7
        },
        protection: {
          ...state.protection,
          depth: 0.4 + Math.random() * 0.6
        }
      };

      setState(newState);
      flow$.next({
        energy: {
          level: newState.energy.level,
          type: newState.energy.type
        },
        context: {
          depth: newState.context.depth
        },
        protection: {
          depth: newState.protection.depth
        }
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [state]);

  return { state, flow$ };
} 