import React, { createContext, useContext } from 'react';

interface FlowContextType {
  isInFlow: boolean;
  flowIntensity: number;
  startFlow: () => void;
  endFlow: () => void;
}

const FlowContext = createContext<FlowContextType | undefined>(undefined);

export const useFlow = () => {
  const context = useContext(FlowContext);
  if (!context) {
    throw new Error('useFlow must be used within FlowProvider');
  }
  return context;
};

interface FlowProviderProps {
  children: React.ReactNode;
  value?: FlowContextType;
}

export const FlowProvider: React.FC<FlowProviderProps> = ({ children, value }) => {
  const defaultValue: FlowContextType = value || {
    isInFlow: false,
    flowIntensity: 0,
    startFlow: () => {},
    endFlow: () => {},
  };

  return (
    <FlowContext.Provider value={defaultValue}>
      {children}
    </FlowContext.Provider>
  );
}; 