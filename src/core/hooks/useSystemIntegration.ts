import { useState, useCallback, useEffect } from 'react';
import { BehaviorSubject } from 'rxjs';
import { Field, FlowState } from '../types/base';
import { ConsciousnessState } from '../types/consciousness';
import { Energy, EnergyMetrics } from '../energy/types';
import { SystemIntegration, IntegrationState } from '../integration/SystemIntegration';

export const useSystemIntegration = () => {
  const [integration] = useState(() => new SystemIntegration());
  const [state, setState] = useState<IntegrationState>({
    isInitialized: false,
    isStable: false,
    systemHealth: 0,
    activeSubsystems: []
  });

  useEffect(() => {
    const subscription = (integration.getState() as BehaviorSubject<IntegrationState>)
      .subscribe(newState => setState(newState));
    return () => subscription.unsubscribe();
  }, [integration]);

  const initialize = useCallback(() => {
    integration.initialize();
  }, [integration]);

  const shutdown = useCallback(() => {
    integration.shutdown();
  }, [integration]);

  const updateField = useCallback((field: Field) => {
    integration.updateField(field);
  }, [integration]);

  const updateEnergy = useCallback((energy: Energy, metrics: EnergyMetrics) => {
    integration.updateEnergy(energy, metrics);
  }, [integration]);

  const updateConsciousness = useCallback((consciousness: ConsciousnessState) => {
    integration.updateConsciousness(consciousness);
  }, [integration]);

  const handleStateTransition = useCallback((newState: FlowState) => {
    integration.handleStateTransition(newState);
  }, [integration]);

  const handleSystemBreach = useCallback((severity: number, source: string) => {
    integration.handleSystemBreach(severity, source);
  }, [integration]);

  return {
    state,
    initialize,
    shutdown,
    updateField,
    updateEnergy,
    updateConsciousness,
    handleStateTransition,
    handleSystemBreach
  };
}; 