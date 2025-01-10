import React, { createContext, useEffect, useState } from 'react';
import { NaturalFlow } from '../types/consciousness';
import { createEmptyNaturalFlow } from '../factories/flow';

export const FlowContext = createContext<NaturalFlow | null>(null);

interface FlowProviderProps {
  children: React.ReactNode;
}

export const FlowProvider: React.FC<FlowProviderProps> = ({ children }) => {
  const [flow] = useState(() => createEmptyNaturalFlow());

  useEffect(() => {
    // Initialize natural flow patterns
    return () => {
      // Cleanup subscriptions
      if (flow) {
        (flow as any).dispose?.();
      }
    };
  }, [flow]);

  return (
    <FlowContext.Provider value={flow}>
      {children}
    </FlowContext.Provider>
  );
}; 