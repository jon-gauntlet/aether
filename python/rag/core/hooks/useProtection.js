/**
 * @typedef {Object} ProtectionMetrics
 * @property {number} stability
 * @property {number} resilience
 * @property {number} integrity
 * @property {number} immunity
 */

/**
 * @typedef {Object} ProtectionState
 * @property {boolean} active
 * @property {ProtectionMetrics} metrics
 * @property {number} lastCheck
 * @property {number} violations
 * @property {boolean} flowShieldActive
 */

import { useState, useCallback, useEffect } from 'react';

export const DEFAULT_METRICS = {
  stability: 0.9,
  resilience: 0.85,
  integrity: 0.9,
  immunity: 0.85
};

export const FLOW_SHIELD_BONUS = 0.15;
export const MIN_SAFE_LEVEL = 0.7;
export const CRITICAL_THRESHOLD = 0.5;

/**
 * Hook for managing protection state
 * @param {Partial<ProtectionState>} [initialState] - Initial protection state
 * @returns {Object} Protection state and methods
 */
export const useProtection = (initialState) => {
  const [protection, setProtection] = useState({
    active: true,
    metrics: DEFAULT_METRICS,
    lastCheck: Date.now(),
    violations: 0,
    flowShieldActive: false,
    ...initialState
  });

  const checkHealth = useCallback(() => {
    const now = Date.now();
    const timeSinceCheck = now - protection.lastCheck;
    
    const degradeFactor = Math.min(timeSinceCheck / (360 * 60 * 1000), 0.02);
    
    const baseLevel = protection.flowShieldActive ? FLOW_SHIELD_BONUS : 0;
    
    const updatedMetrics = {
      stability: Math.max(MIN_SAFE_LEVEL, protection.metrics.stability * (1 - degradeFactor) + baseLevel),
      resilience: Math.max(MIN_SAFE_LEVEL, protection.metrics.resilience * (1 - degradeFactor) + baseLevel),
      integrity: Math.max(MIN_SAFE_LEVEL, protection.metrics.integrity * (1 - degradeFactor) + baseLevel),
      immunity: Math.max(MIN_SAFE_LEVEL, protection.metrics.immunity * (1 - degradeFactor) + baseLevel)
    };

    if (Object.values(updatedMetrics).some(metric => metric < CRITICAL_THRESHOLD)) {
      return reinforce(0.2);
    }

    setProtection(prev => ({
      ...prev,
      metrics: updatedMetrics,
      lastCheck: now
    }));

    return updatedMetrics;
  }, [protection]);

  /**
   * Reinforce protection metrics
   * @param {number} amount - Amount to reinforce by
   * @returns {ProtectionMetrics} Updated metrics
   */
  const reinforce = useCallback((amount) => {
    const updatedMetrics = {
      stability: Math.min(1, protection.metrics.stability + amount),
      resilience: Math.min(1, protection.metrics.resilience + amount),
      integrity: Math.min(1, protection.metrics.integrity + amount),
      immunity: Math.min(1, protection.metrics.immunity + amount)
    };

    setProtection(prev => ({
      ...prev,
      metrics: updatedMetrics,
      lastCheck: Date.now()
    }));

    return updatedMetrics;
  }, [protection]);

  const activateFlowShield = useCallback(() => {
    setProtection(prev => ({
      ...prev,
      flowShieldActive: true,
      metrics: {
        stability: Math.min(1, prev.metrics.stability + FLOW_SHIELD_BONUS),
        resilience: Math.min(1, prev.metrics.resilience + FLOW_SHIELD_BONUS),
        integrity: Math.min(1, prev.metrics.integrity + FLOW_SHIELD_BONUS),
        immunity: Math.min(1, prev.metrics.immunity + FLOW_SHIELD_BONUS)
      }
    }));
  }, []);

  const deactivateFlowShield = useCallback(() => {
    setProtection(prev => ({
      ...prev,
      flowShieldActive: false,
      metrics: {
        stability: Math.max(MIN_SAFE_LEVEL, prev.metrics.stability - FLOW_SHIELD_BONUS),
        resilience: Math.max(MIN_SAFE_LEVEL, prev.metrics.resilience - FLOW_SHIELD_BONUS),
        integrity: Math.max(MIN_SAFE_LEVEL, prev.metrics.integrity - FLOW_SHIELD_BONUS),
        immunity: Math.max(MIN_SAFE_LEVEL, prev.metrics.immunity - FLOW_SHIELD_BONUS)
      }
    }));
  }, []);

  // Auto-check health every 5 minutes
  useEffect(() => {
    const healthCheck = setInterval(checkHealth, 5 * 60 * 1000);
    return () => clearInterval(healthCheck);
  }, [checkHealth]);

  return {
    protection,
    checkHealth,
    reinforce,
    activateFlowShield,
    deactivateFlowShield
  };
}; 