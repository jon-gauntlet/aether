import { useContext } from 'react';
import { EnergySystemContext } from '../context/EnergySystemContext';
import { EnergySystem } from '../energy/EnergySystem';

export function useEnergySystem(): EnergySystem {
  const context = useContext(EnergySystemContext);
  
  if (!context) {
    throw new Error('useEnergySystem must be used within an EnergySystemProvider');
  }
  
  return context as EnergySystem;
} 