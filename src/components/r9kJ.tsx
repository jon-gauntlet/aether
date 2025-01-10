import React, { createContext, useEffect, useState } from 'react';
import { NaturalFlow } from '../experience/NaturalFlow';

export const FlowContext = createContext<NaturalFlow | null>(null);

interface FlowProviderProps {
  children: React.ReactNode;
}

export const FlowProvider: React.FC<FlowProviderProps> = ({ children }) => {
  const [flow] = useState(() => new NaturalFlow());

  useEffect(() => {
    // Initialize natural flow patterns
    return () => {
      // Cleanup natural cycles
    };
  }, []);

  return (
    <FlowContext.Provider value={flow}>
      {children}
    </FlowContext.Provider>
  );
}; 