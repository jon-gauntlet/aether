import React, { createContext, useRef } from 'react';
import { AutonomicSystem } from '../autonomic/AutonomicSystem';
import { AutonomicSystem as IAutonomicSystem } from '../types/autonomic';
import { usePatternManager } from '../hooks/usePatternManager';

export const AutonomicContext = createContext<IAutonomicSystem | null>(null);

interface Props {
  children: React.ReactNode;
}

export function AutonomicProvider({ children }: Props) {
  const patterns = usePatternManager();
  const systemRef = useRef<IAutonomicSystem>(new AutonomicSystem(patterns));

  return (
    <AutonomicContext.Provider value={systemRef.current}>
      {children}
    </AutonomicContext.Provider>
  );
} 