import { FlowState, FlowMetrics, Protection, Resonance, Pattern, DevelopmentPhase } from './base';
import { Observable } from 'rxjs';

export interface AutonomicState {
  id: string;
  type: string;
  flow: FlowState;
  energy: EnhancedEnergyState;
  context: ContextState;
  protection: Protection;
  resonance: Resonance;
  patterns: Pattern[];
  timestamp: number;
}

export interface EnhancedEnergyState {
  id: string;
  level: number;
  capacity: number;
  focusMultiplier: number;
  recoveryEfficiency: number;
  sustainedDuration: number;
  developmentPhase: DevelopmentPhase;
}

export interface ContextState {
  id: string;
  flow: FlowState;
  metrics: ContextMetrics;
  protection: Protection;
  timestamp: number;
}

export interface ContextMetrics extends FlowMetrics {
  stability: number;
  adaptability: number;
  resilience: number;
}

export interface AutonomicSystem {
  state$: Observable<AutonomicState>;
  updateState(state: Partial<AutonomicState>): void;
  validateState(state: Partial<AutonomicState>): Promise<boolean>;
  predictState(context: string[]): Promise<AutonomicState>;
}

export interface EnergySystem {
  state$: Observable<EnhancedEnergyState>;
  updateState(state: Partial<EnhancedEnergyState>): void;
  validateState(state: Partial<EnhancedEnergyState>): Promise<boolean>;
  predictState(context: string[]): Promise<EnhancedEnergyState>;
}

export interface TypeValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export interface ValidationPattern {
  context: string[];
  signature: string[];
  depth: number;
  strength: number;
  developmentPhase: DevelopmentPhase;
}

export interface AutonomicDevelopmentProps {
  autonomic: AutonomicSystem;
  energy: EnergySystem;
} // Merged from 1_autonomicstate.ts
import { Observable } from 'rxjs';
import { FlowState } from './flow';
import { EnergyState } from './energy';
import { ContextState } from './context';
import { AutonomicSystem } from '../autonomic/Autonomic';
import { EnergySystem } from '../energy/EnergySystem';

export interface AutonomicState {
  energy: EnergyState;
  flow: FlowState;
  context: ContextState;
  protection: {
    level: number;
    type: string;
  };
  pattern: {
    id: string;
    type: string;
    context: string[];
    states: string[];
  };
}

export interface AutonomicDevelopmentProps {
  flow$: Observable<FlowState>;
  energy$: Observable<EnergyState>;
  context$: Observable<ContextState>;
  autonomic: AutonomicSystem;
  energy: EnergySystem;
  context?: {
    type: string;
  };
} // Merged from 2_autonomicstate.ts
import { useState, useCallback, useEffect } from 'react';
import { usePattern } from './usePattern';
import { useEnergy } from '../energy/useEnergy';
import { Pattern } from './types';
import { Context, ContextType } from '../context/types';
import { Energy, EnergyType, FlowState as EnergyFlowState } from '../energy/types';
import { Flow, FlowStateType } from '../flow/types';

export interface AutonomicState {
  inFlow: boolean;
  energyLevel: number;
  hasActivePattern: boolean;
  learningCount: number;
  lastInsight?: string;
  currentPattern?: Pattern;
}

interface UseAutonomicOptions {
  task: string;
  energyType?: EnergyType;
  onStateChange?: (state: AutonomicState) => void;
  onLowEnergy?: () => void;
  onCriticalEnergy?: () => void;
}

export function useAutonomic({
  task,
  energyType = EnergyType.Mental,
  onStateChange,
  onLowEnergy,
  onCriticalEnergy
}: UseAutonomicOptions) {
  // Create context
  const context: Context = {
    id: `task-${task}`,
    type: ContextType.Development,
    depth: 1,
    children: [],
    meta: {
      created: new Date(),
      lastAccessed: new Date(),
      accessCount: 0,
      importance: 1,
      tags: ['development', 'task', task]
    },
    data: { task }
  };

  // Use energy system
  const {
    energy,
    enterFlow,
    exitFlow,
    rest,
    boost,
    isLow,
    isCritical,
    inFlow
  } = useEnergy(energyType);

  // Create flow state
  const flow: Flow = {
    state: FlowStateType.Focused,
    context: {
      task,
      goal: 'Complete task with pattern guidance',
      constraints: [],
      resources: []
    },
    duration: 0,
    meta: {
      started: new Date(),
      lastTransition: new Date(),
      transitions: [],
      metrics: {
        productivity: 1,
        quality: 1,
        energy: 1,
        satisfaction: 1
      }
    }
  };

  // Use pattern system
  const {
    pattern,
    isLoading: patternLoading,
    error: patternError,
    recordLearning,
    getContextHistory
  } = usePattern(context, energy, flow);

  // Track state
  const [state, setState] = useState<AutonomicState>({
    inFlow: false,
    energyLevel: 100,
    hasActivePattern: false,
    learningCount: 0
  });

  // Update state when components change
  useEffect(() => {
    const newState: AutonomicState = {
      inFlow,
      energyLevel: energy.current,
      hasActivePattern: !!pattern,
      learningCount: pattern?.meta.learnings.length || 0,
      lastInsight: pattern?.meta.learnings[pattern.meta.learnings.length - 1]?.insight,
      currentPattern: pattern || undefined
    };

    setState(newState);
    if (onStateChange) {
      onStateChange(newState);
    }
  }, [inFlow, energy.current, pattern, onStateChange]);

  // Handle energy states
  useEffect(() => {
    if (isLow && onLowEnergy) {
      onLowEnergy();
    }
    if (isCritical && onCriticalEnergy) {
      onCriticalEnergy();
    }
  }, [isLow, isCritical, onLowEnergy, onCriticalEnergy]);

  // Record success
  const recordSuccess = useCallback(async () => {
    if (pattern) {
      const evolvedPattern = await recordLearning('Pattern applied successfully');
      return evolvedPattern;
    }
  }, [pattern, recordLearning]);

  // Record improvement needed
  const recordImprovement = useCallback(async (details: string) => {
    if (pattern) {
      const evolvedPattern = await recordLearning(`Pattern needs improvement: ${details}`);
      return evolvedPattern;
    }
  }, [pattern, recordLearning]);

  // Handle flow state changes
  const handleFlowStart = useCallback((trigger: string) => {
    enterFlow(trigger);
  }, [enterFlow]);

  const handleFlowEnd = useCallback((reason: string) => {
    exitFlow(reason);
  }, [exitFlow]);

  return {
    state,
    energy,
    pattern,
    isLoading: patternLoading,
    error: patternError,
    actions: {
      enterFlow: handleFlowStart,
      exitFlow: handleFlowEnd,
      rest,
      boost,
      recordSuccess,
      recordImprovement
    },
    history: {
      getContextHistory,
      getLearnings: () => pattern?.meta.learnings || []
    }
  };
} // Merged from 1_autonomicstate.ts
import { Observable } from 'rxjs';
import { FlowState } from './flow';
import { EnergyState } from './energy';
import { ContextState } from './context';
import { AutonomicSystem } from '../autonomic/Autonomic';
import { EnergySystem } from '../energy/EnergySystem';

export interface AutonomicState {
  energy: EnergyState;
  flow: FlowState;
  context: ContextState;
  protection: {
    level: number;
    type: string;
  };
  pattern: {
    id: string;
    type: string;
    context: string[];
    states: string[];
  };
}

export interface AutonomicDevelopmentProps {
  flow$: Observable<FlowState>;
  energy$: Observable<EnergyState>;
  context$: Observable<ContextState>;
  autonomic: AutonomicSystem;
  energy: EnergySystem;
  context?: {
    type: string;
  };
} // Merged from 2_autonomicstate.ts
import { useState, useCallback, useEffect } from 'react';
import { usePattern } from './usePattern';
import { useEnergy } from '../energy/useEnergy';
import { Pattern } from './types';
import { Context, ContextType } from '../context/types';
import { Energy, EnergyType, FlowState as EnergyFlowState } from '../energy/types';
import { Flow, FlowStateType } from '../flow/types';

export interface AutonomicState {
  inFlow: boolean;
  energyLevel: number;
  hasActivePattern: boolean;
  learningCount: number;
  lastInsight?: string;
  currentPattern?: Pattern;
}

interface UseAutonomicOptions {
  task: string;
  energyType?: EnergyType;
  onStateChange?: (state: AutonomicState) => void;
  onLowEnergy?: () => void;
  onCriticalEnergy?: () => void;
}

export function useAutonomic({
  task,
  energyType = EnergyType.Mental,
  onStateChange,
  onLowEnergy,
  onCriticalEnergy
}: UseAutonomicOptions) {
  // Create context
  const context: Context = {
    id: `task-${task}`,
    type: ContextType.Development,
    depth: 1,
    children: [],
    meta: {
      created: new Date(),
      lastAccessed: new Date(),
      accessCount: 0,
      importance: 1,
      tags: ['development', 'task', task]
    },
    data: { task }
  };

  // Use energy system
  const {
    energy,
    enterFlow,
    exitFlow,
    rest,
    boost,
    isLow,
    isCritical,
    inFlow
  } = useEnergy(energyType);

  // Create flow state
  const flow: Flow = {
    state: FlowStateType.Focused,
    context: {
      task,
      goal: 'Complete task with pattern guidance',
      constraints: [],
      resources: []
    },
    duration: 0,
    meta: {
      started: new Date(),
      lastTransition: new Date(),
      transitions: [],
      metrics: {
        productivity: 1,
        quality: 1,
        energy: 1,
        satisfaction: 1
      }
    }
  };

  // Use pattern system
  const {
    pattern,
    isLoading: patternLoading,
    error: patternError,
    recordLearning,
    getContextHistory
  } = usePattern(context, energy, flow);

  // Track state
  const [state, setState] = useState<AutonomicState>({
    inFlow: false,
    energyLevel: 100,
    hasActivePattern: false,
    learningCount: 0
  });

  // Update state when components change
  useEffect(() => {
    const newState: AutonomicState = {
      inFlow,
      energyLevel: energy.current,
      hasActivePattern: !!pattern,
      learningCount: pattern?.meta.learnings.length || 0,
      lastInsight: pattern?.meta.learnings[pattern.meta.learnings.length - 1]?.insight,
      currentPattern: pattern || undefined
    };

    setState(newState);
    if (onStateChange) {
      onStateChange(newState);
    }
  }, [inFlow, energy.current, pattern, onStateChange]);

  // Handle energy states
  useEffect(() => {
    if (isLow && onLowEnergy) {
      onLowEnergy();
    }
    if (isCritical && onCriticalEnergy) {
      onCriticalEnergy();
    }
  }, [isLow, isCritical, onLowEnergy, onCriticalEnergy]);

  // Record success
  const recordSuccess = useCallback(async () => {
    if (pattern) {
      const evolvedPattern = await recordLearning('Pattern applied successfully');
      return evolvedPattern;
    }
  }, [pattern, recordLearning]);

  // Record improvement needed
  const recordImprovement = useCallback(async (details: string) => {
    if (pattern) {
      const evolvedPattern = await recordLearning(`Pattern needs improvement: ${details}`);
      return evolvedPattern;
    }
  }, [pattern, recordLearning]);

  // Handle flow state changes
  const handleFlowStart = useCallback((trigger: string) => {
    enterFlow(trigger);
  }, [enterFlow]);

  const handleFlowEnd = useCallback((reason: string) => {
    exitFlow(reason);
  }, [exitFlow]);

  return {
    state,
    energy,
    pattern,
    isLoading: patternLoading,
    error: patternError,
    actions: {
      enterFlow: handleFlowStart,
      exitFlow: handleFlowEnd,
      rest,
      boost,
      recordSuccess,
      recordImprovement
    },
    history: {
      getContextHistory,
      getLearnings: () => pattern?.meta.learnings || []
    }
  };
} 