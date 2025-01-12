import { useState, useCallback, useEffect } from 'react';
import { BehaviorSubject } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { FlowState } from '../types/base';
import { Energy, EnergyMetrics } from '../energy/types';
import {
  PatternState,
  EnergyPattern,
  PatternMatch,
  PatternEvolution,
  PatternStorage,
  PatternContext
} from './types';

const PATTERN_STORAGE_KEY = 'energy_patterns';
const MIN_CONFIDENCE_THRESHOLD = 0.7;
const MIN_STABILITY_THRESHOLD = 0.6;
const MAX_PATTERN_HISTORY = 100;

const patterns$ = new BehaviorSubject<PatternStorage>({
  patterns: [],
  lastUpdate: new Date(),
  version: 1
});

export const usePattern = () => {
  const [activePattern, setActivePattern] = useState<EnergyPattern | null>(null);
  const [patternHistory, setPatternHistory] = useState<PatternEvolution[]>([]);

  // Load patterns from storage
  useEffect(() => {
    const storedPatterns = localStorage.getItem(PATTERN_STORAGE_KEY);
    if (storedPatterns) {
      const storage: PatternStorage = JSON.parse(storedPatterns);
      patterns$.next(storage);
    }
  }, []);

  // Save patterns to storage
  const persistPatterns = useCallback((storage: PatternStorage) => {
    localStorage.setItem(PATTERN_STORAGE_KEY, JSON.stringify(storage));
    patterns$.next(storage);
  }, []);

  const createPattern = useCallback((
    flowState: FlowState,
    energy: Energy,
    metrics: EnergyMetrics,
    context: Partial<PatternContext> = {}
  ): EnergyPattern => {
    const pattern: EnergyPattern = {
      id: uuidv4(),
      state: PatternState.EVOLVING,
      flowState,
      energyLevels: { ...energy },
      metrics: { ...metrics },
      context: {
        timestamp: new Date(),
        duration: 0,
        tags: [],
        triggers: [],
        notes: '',
        ...context
      },
      evolution: {
        version: 1,
        history: []
      }
    };

    const storage = patterns$.getValue();
    persistPatterns({
      ...storage,
      patterns: [...storage.patterns, pattern],
      lastUpdate: new Date()
    });

    return pattern;
  }, [persistPatterns]);

  const findMatchingPattern = useCallback((
    flowState: FlowState,
    energy: Energy,
    context: Partial<PatternContext> = {}
  ): PatternMatch | null => {
    const storage = patterns$.getValue();
    const matches = storage.patterns
      .filter(p => p.state !== PatternState.PROTECTED)
      .map(pattern => {
        const energyMatch = Object.entries(energy).every(
          ([key, value]) => Math.abs(pattern.energyLevels[key] - value) < 0.2
        );

        const contextMatch = context.tags?.every(
          tag => pattern.context.tags.includes(tag)
        ) ?? true;

        const confidence = energyMatch && contextMatch ? 0.8 : 0;

        return {
          pattern,
          confidence,
          predictedEnergy: pattern.energyLevels,
          estimatedDuration: pattern.context.duration
        };
      })
      .filter(match => match.confidence > MIN_CONFIDENCE_THRESHOLD)
      .sort((a, b) => b.confidence - a.confidence);

    return matches[0] || null;
  }, []);

  const evolvePattern = useCallback((
    pattern: EnergyPattern,
    changes: Partial<EnergyPattern>,
    success: boolean
  ): EnergyPattern => {
    const evolution: PatternEvolution = {
      pattern: { ...pattern },
      changes,
      fitness: success ? 1 : 0,
      generation: pattern.evolution.history.length + 1
    };

    const updatedPattern: EnergyPattern = {
      ...pattern,
      ...changes,
      state: success ? PatternState.STABLE : PatternState.EVOLVING,
      evolution: {
        version: pattern.evolution.version + 1,
        history: [
          ...pattern.evolution.history,
          {
            timestamp: new Date(),
            changes,
            success
          }
        ].slice(-MAX_PATTERN_HISTORY)
      }
    };

    const storage = patterns$.getValue();
    const updatedPatterns = storage.patterns.map(p =>
      p.id === pattern.id ? updatedPattern : p
    );

    persistPatterns({
      ...storage,
      patterns: updatedPatterns,
      lastUpdate: new Date()
    });

    setPatternHistory(prev => [...prev, evolution].slice(-MAX_PATTERN_HISTORY));
    return updatedPattern;
  }, [persistPatterns]);

  const protectPattern = useCallback((pattern: EnergyPattern): void => {
    const updatedPattern = {
      ...pattern,
      state: PatternState.PROTECTED
    };

    const storage = patterns$.getValue();
    const updatedPatterns = storage.patterns.map(p =>
      p.id === pattern.id ? updatedPattern : p
    );

    persistPatterns({
      ...storage,
      patterns: updatedPatterns,
      lastUpdate: new Date()
    });
  }, [persistPatterns]);

  const clearUnstablePatterns = useCallback((): void => {
    const storage = patterns$.getValue();
    const stablePatterns = storage.patterns.filter(
      p => p.state === PatternState.STABLE || p.state === PatternState.PROTECTED
    );

    persistPatterns({
      ...storage,
      patterns: stablePatterns,
      lastUpdate: new Date()
    });
  }, [persistPatterns]);

  return {
    activePattern,
    patternHistory,
    createPattern,
    findMatchingPattern,
    evolvePattern,
    protectPattern,
    clearUnstablePatterns
  };
}; 