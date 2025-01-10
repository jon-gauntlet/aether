import { useCallback, useMemo } from 'react';
import { FlowEngine } from '../experience/FlowEngine';
import { FlowType } from '../types/flow';

const engines = new Map<string, FlowEngine>();

export function useFlow(id: string) {
  const engine = useMemo(() => {
    if (!engines.has(id)) {
      engines.set(id, new FlowEngine());
    }
    return engines.get(id)!;
  }, [id]);

  const updatePresence = useCallback(
    (type: string) => {
      engine.notice(id, type);
    },
    [engine, id]
  );

  const setMode = useCallback(
    (mode: FlowType) => {
      engine.setMode(mode);
    },
    [engine]
  );

  return {
    engine,
    updatePresence,
    setMode
  };
}