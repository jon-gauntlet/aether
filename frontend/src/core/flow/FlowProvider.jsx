import React, { createContext, useContext } from 'react';

/**
 * @typedef {Object} FlowContextType
 * @property {boolean} isInFlow - Whether the user is currently in flow state
 * @property {number} flowIntensity - The intensity of the current flow state (0-100)
 * @property {Function} startFlow - Function to start flow state
 * @property {Function} endFlow - Function to end flow state
 * @property {Function} updateFlowIntensity - Function to update flow intensity
 */

const FlowContext = createContext(/** @type {FlowContextType} */ ({
  isInFlow: false,
  flowIntensity: 0,
  startFlow: () => {},
  endFlow: () => {},
  updateFlowIntensity: () => {}
}));

export const FlowProvider = ({ children }) => {
  const [isInFlow, setIsInFlow] = React.useState(false);
  const [flowIntensity, setFlowIntensity] = React.useState(0);

  const startFlow = React.useCallback(() => {
    setIsInFlow(true);
  }, []);

  const endFlow = React.useCallback(() => {
    setIsInFlow(false);
    setFlowIntensity(0);
  }, []);

  const updateFlowIntensity = React.useCallback((intensity) => {
    setFlowIntensity(Math.max(0, Math.min(100, intensity)));
  }, []);

  const value = React.useMemo(() => ({
    isInFlow,
    flowIntensity,
    startFlow,
    endFlow,
    updateFlowIntensity
  }), [isInFlow, flowIntensity, startFlow, endFlow, updateFlowIntensity]);

  return (
    <FlowContext.Provider value={value}>
      {children}
    </FlowContext.Provider>
  );
};

export const useFlow = () => {
  const context = useContext(FlowContext);
  if (context === undefined) {
    throw new Error('useFlow must be used within a FlowProvider');
  }
  return context;
}; 