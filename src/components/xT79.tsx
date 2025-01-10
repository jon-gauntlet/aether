import React, { createContext, useState, useCallback } from 'react';
import { FlowState, FlowLevel, FlowContextType, FlowProviderProps } from '../types/flow';

export const FlowContext = createContext<FlowContextType | undefined>(undefined);

export const FlowProvider: React.FC<FlowProviderProps> = ({ children }) => {
  const [currentFlow, setCurrentFlow] = useState<FlowState>('rest');
  const [flowLevel, setCurrentFlowLevel] = useState<FlowLevel>('medium');
  const [isProtected, setIsProtected] = useState(false);

  const setFlow = useCallback((state: FlowState) => {
    if (!isProtected) {
      setCurrentFlow(state);
    }
  }, [isProtected]);

  const setFlowLevel = useCallback((level: FlowLevel) => {
    if (!isProtected) {
      setCurrentFlowLevel(level);
    }
  }, [isProtected]);

  const protectFlow = useCallback(() => {
    setIsProtected(true);
  }, []);

  const releaseFlow = useCallback(() => {
    setIsProtected(false);
  }, []);

  return (
    <FlowContext.Provider
      value={{
        currentFlow,
        flowLevel,
        setFlow,
        setFlowLevel,
        protectFlow,
        releaseFlow
      }}
    >
      {children}
    </FlowContext.Provider>
  );
}; 