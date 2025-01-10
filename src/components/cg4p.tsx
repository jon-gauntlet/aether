import React from 'react';
import { PatternLibraryProvider } from '../context/PatternLibraryContext';
import { PatternManagerProvider } from '../context/PatternManagerContext';
import { AutonomicProvider } from '../context/AutonomicContext';

interface Props {
  children: React.ReactNode;
}

export function AutonomicRoot({ children }: Props) {
  return (
    <PatternLibraryProvider>
      <PatternManagerProvider>
        <AutonomicProvider>
          {children}
        </AutonomicProvider>
      </PatternManagerProvider>
    </PatternLibraryProvider>
  );
} 