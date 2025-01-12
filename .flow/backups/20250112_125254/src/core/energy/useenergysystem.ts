import { useContext } from 'react';
import { EnergySystemContext } from '../context/EnergySystemContext';
import { EnergySystem } from '../energy/EnergySystem';

export function useEnergySystem(): EnergySystem {
  const context = useContext(EnergySystemContext);
  
  if (!context) {
    throw new Error('useEnergySystem must be used within an EnergySystemProvider');
  }
  
  return context as EnergySystem;
} // Merged from 1_useenergysystem.ts
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
} // Merged from 1_useenergysystem.ts
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