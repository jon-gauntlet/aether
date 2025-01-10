import { useState, useEffect } from 'react';
import { Flow, FlowEngine, PresenceType, Stream } from '../experience/flow';

const flowEngine = new FlowEngine();

export function useFlow(): Flow {
  const [stream, setStream] = useState<Stream | undefined>(undefined);
  const [otherStreams, setOtherStreams] = useState<Stream[]>([]);
  const [metrics, setMetrics] = useState<Flow['metrics']>({
    depth: 0,
    harmony: 0,
    energy: 0,
    focus: 0
  });
  const [flows, setFlows] = useState<string[]>([]);

  useEffect(() => {
    const id = `flow_${Date.now()}`;
    const subscription = flowEngine.observe(id).subscribe(
      (newStream) => setStream(newStream || undefined)
    );
    return () => subscription.unsubscribe();
  }, []);

  const enter = (type: string) => {
    // Implementation for entering a flow state
  };

  const observe = (id: string) => flowEngine.observe(id);

  const observeDepth = () => flowEngine.observeResonance();
  const observeEnergy = () => flowEngine.observeResonance();
  const observeFocus = () => flowEngine.observeResonance();

  const notice = (id: string) => flowEngine.notice(id);

  const updatePresence = (type: PresenceType) => {
    if (stream) {
      flowEngine.notice(stream.id, type);
    }
  };

  return {
    stream,
    otherStreams,
    metrics,
    isDeep: metrics.depth > 0.7,
    isHarmonious: metrics.harmony > 0.7,
    flows,
    enter,
    observe,
    observeDepth,
    observeEnergy,
    observeFocus,
    notice,
    updatePresence
  };
} 