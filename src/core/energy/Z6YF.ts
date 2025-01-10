import { useContext } from 'react';
import { createContext } from 'react';
import { EnergySystem } from '../energy/EnergySystem';

export const EnergySystemContext = createContext<EnergySystem | null>(null);

export function useEnergySystem(): EnergySystem {
  const context = useContext(EnergySystemContext);
  
  if (!context) {
    throw new Error('useEnergySystem must be used within an EnergySystemProvider');
  }
  
  return context;
} 