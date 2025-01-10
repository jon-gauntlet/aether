import { useState, useEffect } from 'react';
import { Flow, FlowType, FlowTransition } from '../types/flow';
import { FlowEngine } from '../experience/FlowEngine';

const flowEngines = new Map<string, FlowEngine>();

export function useFlow(id: string = 'default') {
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
      sustainability: 1,
      depth: 1,
      harmony: 1
    },
    protection: {
      level: 1,
      type: 'natural',
      strength: 1
    }
  });

  // Initialize or get existing FlowEngine
  const [stream] = useState(() => {
    if (!flowEngines.has(id)) {
      flowEngines.set(id, new FlowEngine(id));
    }
    return flowEngines.get(id)!;
  });

  async function measureFlow(): Promise<Flow> {
    return stream.measure();
  }

  async function transition(to: FlowType, trigger: string): Promise<FlowTransition> {
    const transition = await stream.transition(to, trigger);
    setFlow(current => ({
      ...current,
      state: to,
      metrics: {
        ...current.metrics,
        coherence: Math.min(1, current.metrics.coherence + 0.1)
      }
    }));
    return transition;
  }

  function setMode(mode: FlowType) {
    stream.setMode(mode);
    setFlow(current => ({
      ...current,
      state: mode
    }));
  }

  async function deepen() {
    await stream.deepen();
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
    await stream.protect();
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
    const subscription = stream.observe().subscribe(updatedFlow => {
      setFlow(updatedFlow);
    });

    return () => subscription.unsubscribe();
  }, [stream]);

  const isDeep = flow.context.depth > 0.7;
  const isProtected = flow.state === 'protected';
  const isCoherent = flow.metrics.coherence > 0.7;

  return {
    flow,
    stream,
    measureFlow,
    transition,
    setMode,
    deepen,
    protect,
    isDeep,
    isProtected,
    isCoherent
  };
}