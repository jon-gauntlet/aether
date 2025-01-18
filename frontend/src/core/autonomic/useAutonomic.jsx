import React, { useEffect, useRef, useState } from 'react';
import { BehaviorSubject } from 'rxjs';
import { AutonomicSystem } from './index';
import { useDeployment } from '../protection/DeployGuard';

/**
 * @typedef {Object} Field
 * @property {string} id
 * @property {string} type
 * @property {number} level
 * @property {boolean} isActive
 */

/**
 * @typedef {Object} Consciousness
 * @property {string} id
 * @property {number} awarenessLevel
 * @property {boolean} isCoherent
 */

const DEFAULT_FIELD = {
  id: 'default',
  type: 'energy',
  level: 70,
  isActive: true
};

const DEFAULT_CONSCIOUSNESS = {
  id: 'default',
  awarenessLevel: 80,
  isCoherent: true
};

/**
 * Validates field state updates
 * @param {Partial<Field>} updates
 * @returns {boolean}
 */
function validateFieldUpdates(updates) {
  if ('level' in updates && (updates.level < 0 || updates.level > 100)) {
    return false;
  }
  if ('type' in updates && typeof updates.type !== 'string') {
    return false;
  }
  return true;
}

/**
 * Validates consciousness state updates
 * @param {Partial<Consciousness>} updates
 * @returns {boolean}
 */
function validateConsciousnessUpdates(updates) {
  if ('awarenessLevel' in updates && (updates.awarenessLevel < 0 || updates.awarenessLevel > 100)) {
    return false;
  }
  return true;
}

/**
 * Safely calls a system method, handling any errors
 * @template T
 * @param {Function} method The system method to call
 * @param {T} args The arguments to pass to the method
 * @returns {void}
 */
function safeSystemCall(method, ...args) {
  try {
    if (method) {
      method(...args);
    }
  } catch (error) {
    console.warn('System method error:', error);
  }
}

/**
 * Hook for managing autonomic system state
 * @param {AutonomicSystem} [system] Optional autonomic system instance
 * @param {Object} [props]
 * @param {Partial<Field>} [props.field]
 * @param {Partial<Consciousness>} [props.consciousness]
 * @returns {Object} Autonomic system controls and state
 */
export function useAutonomic(system, props = {}) {
  /** @type {import('react').MutableRefObject<AutonomicSystem|undefined>} */
  const systemRef = useRef(system);
  const [fieldState, setFieldState] = useState({
    ...DEFAULT_FIELD,
    ...props.field
  });
  const [consciousnessState, setConsciousnessState] = useState({
    ...DEFAULT_CONSCIOUSNESS,
    ...props.consciousness
  });
  const [isActive, setIsActive] = useState(false);
  const { isProtected } = useDeployment();

  useEffect(() => {
    if (!systemRef.current) {
      systemRef.current = new AutonomicSystem();
    }

    const subscription = systemRef.current.observeFlow().subscribe(state => {
      if (state.field) {
        setFieldState(prev => ({ ...prev, ...state.field }));
      }
      if (state.consciousness) {
        setConsciousnessState(prev => ({ ...prev, ...state.consciousness }));
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const updateFieldState = (updates) => {
    if (!validateFieldUpdates(updates)) {
      console.warn('Invalid field state update:', updates);
      return;
    }

    setFieldState(prev => ({ ...prev, ...updates }));
    safeSystemCall(systemRef.current?.updateField, updates);
  };

  const updateConsciousnessState = (updates) => {
    if (!validateConsciousnessUpdates(updates)) {
      console.warn('Invalid consciousness state update:', updates);
      return;
    }

    setConsciousnessState(prev => ({ ...prev, ...updates }));
    safeSystemCall(systemRef.current?.updateConsciousness, updates);
  };

  const activateAutonomic = () => {
    setIsActive(true);
    safeSystemCall(systemRef.current?.activate);
  };

  const synchronize = () => {
    safeSystemCall(
      systemRef.current?.synchronize,
      fieldState,
      consciousnessState
    );
  };

  return {
    fieldState,
    consciousnessState,
    isActive,
    updateFieldState,
    updateConsciousnessState,
    activateAutonomic,
    synchronize
  };
} 