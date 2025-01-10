import React, { createContext, useRef } from 'react';
import { PatternManager } from '../autonomic/PatternManager';
import { PatternManager as IPatternManager } from '../types/autonomic';
import { usePatternLibrary } from '../hooks/usePatternLibrary';

export const PatternManagerContext = createContext<IPatternManager | null>(null);

interface Props {
  children: React.ReactNode;
}

export function PatternManagerProvider({ children }: Props) {
  const library = usePatternLibrary();
  const managerRef = useRef<IPatternManager>(new PatternManager(library));

  return (
    <PatternManagerContext.Provider value={managerRef.current}>
      {children}
    </PatternManagerContext.Provider>
  );
} 