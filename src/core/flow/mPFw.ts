import { useContext } from 'react';
import { FlowContext } from '../context/FlowContext';
import { Flow } from '../types/consciousness';

export function useFlow(): Flow {
  const flow = useContext(FlowContext);
  if (!flow) {
    throw new Error('useFlow must be used within a FlowProvider');
  }
  return flow;
}