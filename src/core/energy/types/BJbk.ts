import { useState, useEffect, useCallback } from 'react';
import { SystemIntegration, IntegrationState } from '../integration/SystemIntegration';
import { Field, FlowState } from '../types/base';
import { ConsciousnessState } from '../types/consciousness';
import { Energy, EnergyMetrics } from '../energy/types';

interface SystemIntegrationHookState extends IntegrationState {
  isReady: boolean;
  lastUpdate: number;
}

export const useSystemIntegration = () => {
  const [state, setState] = useState<SystemIntegrationHookState>({
    isInitialized: false,
    isStable: false,
    systemHealth: 0,
    activeSubsystems: [],
    isReady: false,
    lastUpdate: Date.now()
  });

  const integration = new SystemIntegration();

  const initialize = useCallback(() => {
    integration.initialize();
    setState(prev => ({
      ...prev,
      isReady: true,
      lastUpdate: Date.now()
    }));
  }, []);

  const shutdown = useCallback(() => {
    integration.shutdown();
    setState(prev => ({
      ...prev,
      isReady: false,
      lastUpdate: Date.now()
    }));
  }, []);

  const updateField = useCallback((field: Field) => {
    if (!state.isReady) return;
    integration.updateField(field);
    setState(prev => ({ ...prev, lastUpdate: Date.now() }));
  }, [state.isReady]);

  const updateEnergy = useCallback((energy: Energy, metrics: EnergyMetrics) => {
    if (!state.isReady) return;
    integration.updateEnergy(energy, metrics);
    setState(prev => ({ ...prev, lastUpdate: Date.now() }));
  }, [state.isReady]);

  const updateConsciousness = useCallback((consciousness: ConsciousnessState) => {
    if (!state.isReady) return;
    integration.updateConsciousness(consciousness);
    setState(prev => ({ ...prev, lastUpdate: Date.now() }));
  }, [state.isReady]);

  const handleStateTransition = useCallback((newState: FlowState) => {
    if (!state.isReady) return;
    integration.handleStateTransition(newState);
    setState(prev => ({ ...prev, lastUpdate: Date.now() }));
  }, [state.isReady]);

  const handleSystemBreach = useCallback((severity: number, source: string) => {
    if (!state.isReady) return;
    integration.handleSystemBreach(severity, source);
    setState(prev => ({ ...prev, lastUpdate: Date.now() }));
  }, [state.isReady]);

  useEffect(() => {
    const subscription = integration.getState().subscribe(integrationState => {
      setState(prev => ({
        ...prev,
        ...integrationState,
        lastUpdate: Date.now()
      }));
    });

    return () => subscription.unsubscribe();
  }, []);

  return {
    ...state,
    initialize,
    shutdown,
    updateField,
    updateEnergy,
    updateConsciousness,
    handleStateTransition,
    handleSystemBreach
  };
}; 