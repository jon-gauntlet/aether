import { useState, useEffect, useCallback } from 'react';
import { Field, FlowState } from '../types/base';
import { ConsciousnessState } from '../types/consciousness';
import { validateAutonomicAction, ActionType, ValidationResult } from './AutonomicValidation';
import { PatternSystem, Pattern, PatternMatch } from './PatternSystem';

interface AutonomicMetrics {
  autonomyScore: number;
  patternStrength: number;
  adaptability: number;
  stability: number;
}

interface AutonomicAction {
  type: ActionType;
  field: Field;
  consciousness: ConsciousnessState;
}

export const useAutonomic = (field: Field, consciousness: ConsciousnessState) => {
  const [isActive, setIsActive] = useState(false);
  const [currentState, setCurrentState] = useState(consciousness.currentState);
  const [activePatterns, setActivePatterns] = useState<PatternMatch[]>([]);
  const [patternHistory, setPatternHistory] = useState<string[]>([]);
  const [metrics, setMetrics] = useState<AutonomicMetrics>({
    autonomyScore: 0.7,
    patternStrength: 0,
    adaptability: 0.8,
    stability: 0.9
  });

  const patternSystem = new PatternSystem();

  const activate = useCallback(() => {
    setIsActive(true);
    updateMetrics();
  }, []);

  const detectPatterns = useCallback(() => {
    const matches = patternSystem.findMatches(field, consciousness);
    setActivePatterns(matches);
    updateMetrics();
  }, [field, consciousness]);

  const validateAction = useCallback((action: AutonomicAction): ValidationResult => {
    return validateAutonomicAction(action);
  }, []);

  const updateMetrics = useCallback(() => {
    const autonomyScore = isActive ? 0.8 : 0.3;
    const patternStrength = activePatterns.reduce((sum, p) => sum + p.confidence, 0) / Math.max(1, activePatterns.length);
    
    setMetrics({
      autonomyScore,
      patternStrength,
      adaptability: field.protection.adaptability,
      stability: consciousness.flowSpace.stability
    });
  }, [isActive, activePatterns, field, consciousness]);

  const transitionTo = useCallback((newState: FlowState) => {
    const validation = validateAutonomicAction({
      type: ActionType.FORCE_TRANSITION,
      field,
      consciousness
    });

    if (validation.isValid) {
      setCurrentState(newState);
      updateMetrics();
    }
  }, [field, consciousness]);

  const recordPattern = useCallback((patternId: string) => {
    setPatternHistory(prev => [...prev, patternId]);
  }, []);

  const initiateRecovery = useCallback(() => {
    const validation = validateAutonomicAction({
      type: ActionType.INITIATE_RECOVERY,
      field,
      consciousness
    });

    if (validation.isValid) {
      setCurrentState(FlowState.RECOVERING);
      updateMetrics();
    }
  }, [field, consciousness]);

  useEffect(() => {
    if (isActive) {
      detectPatterns();
    }
  }, [isActive, field, consciousness, detectPatterns]);

  return {
    isActive,
    currentState,
    activePatterns,
    patternHistory,
    metrics,
    activate,
    detectPatterns,
    validateAction,
    updateMetrics,
    transitionTo,
    recordPattern,
    initiateRecovery
  };
}; 