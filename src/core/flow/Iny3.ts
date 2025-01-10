import { useState, useEffect } from 'react';
import { Flow, FlowState, FlowTransition } from '../types/flow';

export function useFlow() {
  const [flow, setFlow] = useState<Flow>({
    state: 'natural',
    context: {
      type: 'development',
      depth: 1,
      duration: 0
    },
    metrics: {
      focus: 1,
      presence: 1,
      coherence: 1,
      sustainability: 1
    },
    protection: {
      level: 1,
      type: 'natural',
      strength: 1
    }
  });

  async function measureFlow(): Promise<Flow> {
    // Implement flow measurement
    return flow;
  }

  async function transition(to: string, trigger: string) {
    const transition: FlowTransition = {
      from: flow.state,
      to,
      trigger,
      quality: flow.metrics.coherence
    };

    setFlow(current => ({
      ...current,
      state: to as Flow['state'],
      metrics: {
        ...current.metrics,
        coherence: Math.min(1, current.metrics.coherence + 0.1)
      }
    }));

    return transition;
  }

  async function deepen() {
    setFlow(current => ({
      ...current,
      context: {
        ...current.context,
        depth: Math.min(1, current.context.depth + 0.1)
      },
      metrics: {
        ...current.metrics,
        focus: Math.min(1, current.metrics.focus + 0.1),
        presence: Math.min(1, current.metrics.presence + 0.1)
      }
    }));
  }

  async function protect() {
    setFlow(current => ({
      ...current,
      state: 'protected',
      protection: {
        ...current.protection,
        level: Math.min(1, current.protection.level + 0.2),
        strength: Math.min(1, current.protection.strength + 0.1)
      }
    }));
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setFlow(current => ({
        ...current,
        context: {
          ...current.context,
          duration: current.context.duration + 1
        }
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const isDeep = flow.context.depth > 0.7;
  const isProtected = flow.state === 'protected';
  const isCoherent = flow.metrics.coherence > 0.7;

  return {
    flow,
    measureFlow,
    transition,
    deepen,
    protect,
    isDeep,
    isProtected,
    isCoherent
  };
}