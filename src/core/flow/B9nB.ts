import { useEffect, useState, useCallback } from 'react';
import { FlowSpace } from '../types/consciousness';
import { Space, FlowArea } from './FlowSpace';
import { FlowPattern, FlowType, FlowContext } from './FlowEngine';

export function useFlow() {
  const [space] = useState(() => new FlowArea());
  const [state, setState] = useState<Space>({
    quiet: true,
    ready: true,
    flowing: false
  });
  const [flows, setFlows] = useState<FlowPattern[]>([]);

  useEffect(() => {
    const sub = space.watch().subscribe(({ state: next, flows }) => {
      setState(next);
      setFlows(flows);
    });
    return () => sub.unsubscribe();
  }, [space]);

  const join = useCallback(
    (type: FlowType, context?: FlowContext) => space.join(type, context),
    [space]
  );

  const part = useCallback(
    (id: string) => space.part(id),
    [space]
  );

  return {
    state,
    flows,
    join,
    part
  };
} 