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

/**
 * Hook for managing autonomic system state
 * @param {Object} props
 * @param {Field} [props.field]
 * @param {Consciousness} [props.consciousness]
 * @returns {Object} Autonomic system controls and state
 */
export function useAutonomic(props = {}) {
  /** @type {import('react').MutableRefObject<AutonomicSystem|undefined>} */
  const systemRef = useRef();
  const [field, setField] = useState(props.field || {
    id: 'default',
    type: 'energy',
    level: 70,
    isActive: true
  });
  const [consciousness, setConsciousness] = useState(props.consciousness || {
    id: 'default',
    awarenessLevel: 80,
    isCoherent: true
  });
  const [isActive, setIsActive] = useState(true);
  const { isProtected } = useDeployment();

  useEffect(() => {
    if (!systemRef.current) {
      systemRef.current = new AutonomicSystem();
    }

    const subscription = systemRef.current.observeFlow().subscribe(state => {
      if (state) {
        setField(prev => ({
          ...prev,
          level: state.metrics.energy * 100
        }));
        setConsciousness(prev => ({
          ...prev,
          awarenessLevel: state.metrics.presence * 100
        }));
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const system = systemRef.current;
    if (!system || !isProtected) return;

    const interval = setInterval(() => {
      system.maintainHarmony();
    }, 1618); // Golden ratio in ms

    return () => clearInterval(interval);
  }, [isProtected]);

  const updateField = (updates) => {
    setField(prev => ({ ...prev, ...updates }));
  };

  const updateConsciousness = (updates) => {
    setConsciousness(prev => ({ ...prev, ...updates }));
  };

  const synchronize = () => {
    const targetLevel = consciousness.awarenessLevel;
    updateField({ level: targetLevel });
  };

  return {
    field,
    consciousness,
    isActive,
    updateField,
    updateConsciousness,
    setActive: setIsActive,
    synchronize
  };
} 