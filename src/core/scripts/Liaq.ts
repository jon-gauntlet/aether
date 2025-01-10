import { useEffect, useState, useCallback } from 'react';
import { FlowSpace, Space } from './FlowSpace';
import { FlowPattern, FlowType, FlowContext } from './FlowEngine';

interface Flow {
  // Simple interface
  state: Space;
  items: FlowPattern[];
  
  // Basic actions
  join: (type: FlowType, context?: FlowContext) => Promise<FlowPattern>;
  part: (id: string) => Promise<void>;
}

const space = new FlowSpace();

export function useFlow(context: FlowContext = {}): Flow {
  const [state, setState] = useState<Space>({
    quiet: true,
    ready: true,
    flowing: false
  });
  
  const [items, setItems] = useState<FlowPattern[]>([]);

  useEffect(() => {
    const sub = space.watch().subscribe(
      ({ state: next, flows }) => {
        setState(next);
        setItems(flows);
      }
    );

    return () => sub.unsubscribe();
  }, []);

  const join = useCallback(
    async (type: FlowType, ctx: FlowContext = {}) => {
      return space.join(type, { ...context, ...ctx });
    },
    [context]
  );

  const part = useCallback(
    async (id: string) => {
      await space.part(id);
    },
    []
  );

  return {
    state,
    items,
    join,
    part
  };
} 