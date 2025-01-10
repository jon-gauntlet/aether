import React, { createContext, useEffect, useState } from 'react';
import { Flow } from '../experience/flow';

export const FlowContext = createContext<Flow | null>(null);

interface FlowProviderProps {
  children: React.ReactNode;
}

export const FlowProvider: React.FC<FlowProviderProps> = ({ children }) => {
  const [flow] = useState(() => new Flow());

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