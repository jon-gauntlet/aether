import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';
import { useSpaceTransition } from '../hooks/useSpaceTransition';
import { useFlowState } from '../hooks/useFlowState';
import { useProtection } from '../hooks/useProtection';
import { useStatePreservation } from '../hooks/useStatePreservation';
import { SpaceType, SpaceState, SpaceContext as ISpaceContext } from '../types/space/types';
import { FlowState } from '../types/flow/types';
import { ProtectionState } from '../types/protection/protection';

interface SpaceContextValue {
  currentSpace: SpaceState;
  transitionTo: (spaceType: SpaceType) => Promise<boolean>;
  isTransitioning: boolean;
  context: ISpaceContext;
  recoveryPoints: number[];
  restorePoint: (timestamp?: number) => Promise<boolean>;
}

const SpaceContext = createContext<SpaceContextValue | null>(null);

export const useSpace = () => {
  const context = useContext(SpaceContext);
  if (!context) {
    throw new Error('useSpace must be used within a SpaceProvider');
  }
  return context;
};

interface SpaceProviderProps {
  children: React.ReactNode;
  initialSpace?: SpaceType;
}

export const SpaceProvider: React.FC<SpaceProviderProps> = ({
  children,
  initialSpace = 'sanctuary'
}) => {
  const { flowState } = useFlowState();
  const { protection } = useProtection();
  const { transition, startTransition, completeTransition } = useSpaceTransition();
  const { preserveState, restoreState, getRecoveryPoints } = useStatePreservation();

  const [currentSpace, setCurrentSpace] = useState<SpaceState>({
    type: initialSpace,
    active: true,
    flowState: {
      ...flowState,
      protected: false
    } as FlowState,
    protection: {
      active: protection.active,
      metrics: protection.metrics,
      lastCheck: Date.now(),
      violations: protection.violations,
      flowShieldActive: false
    } as ProtectionState,
    lastTransition: Date.now()
  });

  const [context, setContext] = useState<ISpaceContext>({
    type: initialSpace,
    state: currentSpace,
    transitions: [],
    metrics: {
      coherence: 1,
      stability: 1,
      efficiency: 1,
      preservation: 1
    }
  });

  // Auto-preserve state during high coherence periods
  useEffect(() => {
    if (flowState.active && !transition.inProgress) {
      const preserved = preserveState(
        flowState,
        currentSpace,
        {
          active: protection.active,
          metrics: protection.metrics,
          lastCheck: Date.now(),
          violations: protection.violations,
          flowShieldActive: protection.flowShieldActive || false
        }
      );
      if (preserved) {
        setContext(prev => ({
          ...prev,
          metrics: {
            ...prev.metrics,
            preservation: 1
          }
        }));
      }
    }
  }, [flowState, currentSpace, protection, transition.inProgress, preserveState]);

  // Update space state when flow or protection changes
  useEffect(() => {
    setCurrentSpace(prev => ({
      ...prev,
      flowState: {
        ...flowState,
        protected: flowState.active
      } as FlowState,
      protection: {
        active: protection.active,
        metrics: protection.metrics,
        lastCheck: Date.now(),
        violations: protection.violations,
        flowShieldActive: flowState.active
      } as ProtectionState
    }));
  }, [flowState, protection]);

  const restorePoint = useCallback(async (timestamp?: number): Promise<boolean> => {
    const state = restoreState(timestamp);
    if (!state) return false;

    setCurrentSpace(state.spaceState);
    setContext(prev => ({
      ...prev,
      type: state.spaceState.type,
      state: state.spaceState,
      metrics: {
        ...prev.metrics,
        ...state.metrics
      }
    }));

    return true;
  }, [restoreState]);

  const transitionTo = useCallback(async (targetType: SpaceType): Promise<boolean> => {
    if (targetType === currentSpace.type || transition.inProgress) {
      return false;
    }

    // Preserve state before transition
    preserveState(
      flowState,
      currentSpace,
      {
        active: protection.active,
        metrics: protection.metrics,
        lastCheck: Date.now(),
        violations: protection.violations,
        flowShieldActive: protection.flowShieldActive || false
      }
    );

    const success = await startTransition(currentSpace.type, targetType);
    if (!success) {
      return false;
    }

    // Update space state with latest flow and protection states
    setCurrentSpace(prev => ({
      ...prev,
      type: targetType,
      flowState: {
        ...flowState,
        protected: flowState.active
      } as FlowState,
      protection: {
        active: protection.active,
        metrics: protection.metrics,
        lastCheck: Date.now(),
        violations: protection.violations,
        flowShieldActive: flowState.active
      } as ProtectionState,
      lastTransition: Date.now()
    }));

    // Record transition
    setContext(prev => ({
      ...prev,
      type: targetType,
      state: currentSpace,
      transitions: [
        ...prev.transitions,
        {
          from: currentSpace.type,
          to: targetType,
          duration: 0,
          metrics: transition.metrics,
          timestamp: Date.now()
        }
      ]
    }));

    await completeTransition();
    return true;
  }, [currentSpace, flowState, protection, transition, startTransition, completeTransition, preserveState]);

  const value: SpaceContextValue = {
    currentSpace,
    transitionTo,
    isTransitioning: transition.inProgress,
    context,
    recoveryPoints: getRecoveryPoints(),
    restorePoint
  };

  return (
    <SpaceContext.Provider value={value}>
      {children}
    </SpaceContext.Provider>
  );
}; 