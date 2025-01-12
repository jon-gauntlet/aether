import { useContext } from 'react';
import { createContext } from 'react';
import { FlowState, FlowTransition } from '../types/flow/types';
import { ProtectionState } from '../types/protection/protection';

export interface EnergySystem {
  flowState: FlowState | null;
  transitions: FlowTransition[];
  protection: ProtectionState | null;
}

export const EnergySystemContext = createContext<EnergySystem | null>(null);

export function useEnergySystem(): EnergySystem {
  const context = useContext(EnergySystemContext);
  
  if (!context) {
    throw new Error('useEnergySystem must be used within an EnergySystemProvider');
  }
  
  return context;
} 