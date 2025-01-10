import { useEffect, useState } from 'react';
import { FlowEngine } from '../experience/FlowEngine';
import { Flow, FlowType, PresenceType } from '../types/flow';
import { BehaviorSubject } from 'rxjs';

const flowEngines = new Map<string, FlowEngine>();

export interface UseFlowResult {
  stream: Flow;
  setMode: (mode: FlowType) => void;
  updatePresence: (presence: PresenceType) => void;
  measure: () => Promise<Flow>;
  protect: () => Promise<void>;
  deepen: () => Promise<void>;
}

export function useFlow(id: string): UseFlowResult {
  const [engine] = useState(() => {
    if (!flowEngines.has(id)) {
      flowEngines.set(id, new FlowEngine(id));
    }
    return flowEngines.get(id)!;
  });

  const [stream, setStream] = useState<Flow>({
    id,
    state: 'natural',
    metrics: {
      focus: 1,
      presence: 1,
      coherence: 1,
      sustainability: 1,
      depth: 1,
      harmony: 1
    },
    context: {
      depth: 1,
      type: 'natural',
      presence: 'neutral'
    },
    protection: {
      level: 1,
      type: 'natural'
    }
  });

  useEffect(() => {
    const subscription = engine.observe().subscribe(flow => {
      setStream(flow);
    });

    return () => subscription.unsubscribe();
  }, [engine]);

  const setMode = (mode: FlowType) => {
    engine.setMode(mode);
  };

  const updatePresence = (presence: PresenceType) => {
    engine.updatePresence(presence);
  };

  const measure = async () => {
    return engine.measure();
  };

  const protect = async () => {
    await engine.protect();
  };

  const deepen = async () => {
    await engine.deepen();
  };

  return {
    stream,
    setMode,
    updatePresence,
    measure,
    protect,
    deepen
  };
}