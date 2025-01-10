import { FlowEngine } from '../experience/FlowEngine';
import { NaturalFlowType } from '../types/base';
import { PresenceType } from '../types/stream';

const flowEngines = new Map<string, FlowEngine>();

export function useFlow(id: string) {
  if (!flowEngines.has(id)) {
    const engine = new FlowEngine();
    engine.add(id, []); // Initialize the stream for this ID
    flowEngines.set(id, engine);
  }
  const engine = flowEngines.get(id)!;

  return {
    stream: engine,
    updatePresence: (type: PresenceType) => {
      const now = Date.now();
      engine.notice(id, type);
      engine.timestamp = now + 1;
    },
    setMode: (mode: NaturalFlowType) => {
      engine.setMode(mode);
    },
  };
}