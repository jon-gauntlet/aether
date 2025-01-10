import { useContext } from 'react';
import { FlowContext } from '../providers/FlowProvider';
import { FlowState, FlowLevel } from '../types/flow';

export const useFlowState = () => {
  const context = useContext(FlowContext);

  if (!context) {
    throw new Error('useFlowState must be used within a FlowProvider');
  }

  const { 
    currentFlow, 
    flowLevel,
    setFlow,
    setFlowLevel,
    protectFlow,
    releaseFlow
  } = context;

  return {
    currentFlow,
    flowLevel,
    setFlow,
    setFlowLevel,
    protectFlow,
    releaseFlow
  };
}; 