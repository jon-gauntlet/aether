import { useEffect, useState, useCallback } from 'react';
import { FlowSpace, FlowPattern, FlowType, FlowContext } from './FlowSpace';
import { Space } from './FlowSpace';

interface Flow {
  state: Space;
  items: FlowPattern[];
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
      (data: { state: Space; flows: FlowPattern[] }) => {
        setState(data.state);
        setItems(data.flows);
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

export type { Flow, FlowPattern, FlowType, FlowContext };
