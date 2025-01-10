import { FlowEngine } from '../experience/FlowEngine';
import { PresenceType } from '../types/stream';

const flowEngines = new Map<string, FlowEngine>();

export function useFlow(id: string) {
  if (!flowEngines.has(id)) {
    flowEngines.set(id, new FlowEngine());
  }
  const engine = flowEngines.get(id)!;
  return {
    stream: engine,
    updatePresence: (type: PresenceType) => {
      engine.notice(id, type);
    },
  };
}