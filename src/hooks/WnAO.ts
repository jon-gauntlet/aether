import { useEffect, useState } from 'react';
import { Subject } from 'rxjs';
import { Pattern, PatternState } from '../../types/patterns';
import { 
  Flow, 
  Energy, 
  Context, 
  AutonomicState, 
  AutonomicDevelopmentProps,
  AutonomicDevelopmentHook
} from '../../types/autonomic';

const INITIAL_STATE: AutonomicState = {
  energy: 0.5,
  context: 0,
  protection: 0,
  patterns: []
};

export function useAutonomicDevelopment(
  { flow$, energy$, context$ }: AutonomicDevelopmentProps
): AutonomicDevelopmentHook {
  const [state, setState] = useState<AutonomicState>(INITIAL_STATE);

  useEffect(() => {
    const flowSub = flow$.subscribe((flow: Flow) => {
      setState(current => {
        const energyDelta = (flow.metrics.coherence + flow.metrics.resonance) / 4;
        const contextDelta = flow.metrics.coherence > 0.7 ? 1 : 0;
        const protectionDelta = 
          flow.metrics.coherence > 0.9 && flow.metrics.resonance > 0.9 ? 1 : 0;

        return {
          ...current,
          energy: Math.min(1, Math.max(0, current.energy + energyDelta)),
          context: Math.min(5, Math.max(0, current.context + contextDelta)),
          protection: Math.min(3, Math.max(0, current.protection + protectionDelta))
        };
      });
    });

    const energySub = energy$.subscribe((energy: Energy) => {
      setState(current => ({
        ...current,
        energy: Math.min(1, Math.max(0, energy.level))
      }));
    });

    const contextSub = context$.subscribe((context: Context) => {
      setState(current => {
        // Don't update context if in protected state
        if (current.protection > 0) return current;

        return {
          ...current,
          context: Math.min(5, Math.max(0, context.depth))
        };
      });
    });

    return () => {
      flowSub.unsubscribe();
      energySub.unsubscribe();
      contextSub.unsubscribe();
    };
  }, [flow$, energy$, context$]);

  return { state };
} 