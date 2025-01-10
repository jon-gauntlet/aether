import { useContext } from 'react';
import { Flow } from '../experience/flow';
import { FlowContext } from '../context/FlowContext';

export function useFlow(): Flow {
  const flow = useContext(FlowContext);
  if (!flow) {
    throw new Error('useFlow must be used within a FlowProvider');
  }
  return flow;
} 