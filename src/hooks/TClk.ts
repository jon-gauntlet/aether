import { useContext } from 'react';
import { AutonomicContext } from '../context/AutonomicContext';
import { AutonomicSystem } from '../types/autonomic';

export function useAutonomicSystem(): AutonomicSystem {
  const system = useContext(AutonomicContext);
  if (!system) {
    throw new Error('useAutonomicSystem must be used within an AutonomicProvider');
  }
  return system;
} 