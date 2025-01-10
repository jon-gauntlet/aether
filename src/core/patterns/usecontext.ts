import { useState, useEffect } from 'react';
import { DevelopmentContext } from '../types/development';

export function useContext() {
  const [context, setContext] = useState<DevelopmentContext>({
    current: '',
    depth: 0,
    patterns: [],
    protection: 0,
    protectedPatterns: [],
    protectedStates: []
  });

  async function updateContext(): Promise<DevelopmentContext> {
    // Implement context update logic
    return context;
  }

  async function addPattern(pattern: string) {
    setContext(current => ({
      ...current,
      patterns: [...current.patterns, pattern]
    }));
  }

  async function protectPattern(pattern: string) {
    setContext(current => ({
      ...current,
      protectedPatterns: [...current.protectedPatterns, pattern],
      protection: Math.min(1, current.protection + 0.1)
    }));
  }

  async function protectState(state: string) {
    setContext(current => ({
      ...current,
      protectedStates: [...current.protectedStates, state],
      protection: Math.min(1, current.protection + 0.1)
    }));
  }

  async function deepen() {
    setContext(current => ({
      ...current,
      depth: Math.min(1, current.depth + 0.1)
    }));
  }

  const isDeep = context.depth > 0.7;
  const isProtected = context.protection > 0.7;
  const hasPatterns = context.patterns.length > 0;

  return {
    context,
    updateContext,
    addPattern,
    protectPattern,
    protectState,
    deepen,
    isDeep,
    isProtected,
    hasPatterns
  };
} 