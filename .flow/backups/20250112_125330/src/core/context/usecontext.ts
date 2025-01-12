import { useEffect, useState } from 'react';
import { Context, ContextState } from './Context';

const globalContext = new Context(
  'aether-context',
  'system',
  'Welcome to Aether'
);

export function useContext() {
  const [state, setState] = useState<ContextState>(globalContext.getCurrentState());

  useEffect(() => {
    const subscription = globalContext.observeContext().subscribe(setState);
    return () => subscription.unsubscribe();
  }, []);

  return {
    id: state.id,
    type: state.type,
    content: state.content,
    metadata: state.metadata,
    lastModified: state.lastModified,
    updateContent: (content: string) => globalContext.updateContent(content),
    updateType: (type: ContextState['type']) => globalContext.updateType(type),
    updateMetadata: (metadata: Record<string, any>) => 
      globalContext.updateMetadata(metadata),
    clearMetadata: () => globalContext.clearMetadata(),
    touch: () => globalContext.touch()
  };
} 