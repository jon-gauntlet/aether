import { useState, useEffect, useCallback } from 'react';
import { useEnergy } from '../energy/useEnergy';
import { useFlow } from '../flow/useFlow';
import { usePattern } from '../pattern/usePattern';
import { useField } from '../fields/useField';
import { Field, FlowState } from '../types/base';
import { ConsciousnessState } from '../types/consciousness';
import { FieldSystem } from '../fields/FieldSystem';
import { MetricsSystem } from '../metrics/MetricsSystem';
import { ProtectionSystem } from '../protection/ProtectionSystem';
import { ContextSystem } from '../context/ContextSystem';
import { BehaviorSubject } from 'rxjs';

interface AutonomicState {
  isActive: boolean;
  isProtected: boolean;
  isStable: boolean;
  efficiency: number;
}

export const useAutonomicDevelopment = (
  field: Field,
  consciousness: ConsciousnessState
) => {
  const [state, setState] = useState<AutonomicState>({
    isActive: false,
    isProtected: true,
    isStable: true,
    efficiency: 0.8
  });

  const energy = useEnergy();
  const flow = useFlow();
  const pattern = usePattern();
  const fieldHook = useField(field);

  const fieldSystem = new FieldSystem();
  const metricsSystem = new MetricsSystem();
  const protectionSystem = new ProtectionSystem();
  const contextSystem = new ContextSystem();

  const activate = useCallback(() => {
    setState(prev => ({ ...prev, isActive: true }));
    contextSystem.startTracking();
  }, []);

  const deactivate = useCallback(() => {
    setState(prev => ({ ...prev, isActive: false }));
    contextSystem.stopTracking();
  }, []);

  const updateSystems = useCallback(() => {
    if (!state.isActive) return;

    // Update field system
    fieldSystem.updateField(field.id, {
      strength: field.strength * energy.flowEfficiency,
      resonance: {
        ...field.resonance,
        amplitude: field.resonance.amplitude * flow.metrics.efficiency
      }
    });

    // Update protection system
    protectionSystem.updateProtection(field, consciousness);
    const protectionState = (protectionSystem.getState() as BehaviorSubject<ProtectionState>).getValue();
    
    // Update metrics
    metricsSystem.updateEnergyMetrics(energy.energy, energy.metrics);
    metricsSystem.updateFlowMetrics(
      flow.currentState,
      flow.metrics.efficiency,
      flow.metrics.duration,
      flow.metrics.transitions
    );
    metricsSystem.updateFieldMetrics(field);
    metricsSystem.updateConsciousnessMetrics(consciousness);

    // Update context
    contextSystem.updateContext(
      flow.currentState,
      energy.energy,
      energy.metrics,
      field,
      consciousness,
      {
        patternCount: pattern.activePattern ? 1 : 0,
        protectionLevel: protectionState.shields
      }
    );

    // Update state
    setState(prev => ({
      ...prev,
      isProtected: protectionState.isProtected,
      isStable: (fieldSystem.getFieldState() as BehaviorSubject<FieldState>).getValue().isStable,
      efficiency: (metricsSystem.getMetrics() as BehaviorSubject<SystemMetrics>).getValue().energy.efficiency
    }));
  }, [
    state.isActive,
    field,
    consciousness,
    energy,
    flow,
    pattern
  ]);

  const optimizePerformance = useCallback(() => {
    if (!state.isActive || !state.isProtected) return;

    // Optimize flow state
    if (energy.flowEfficiency > 0.8 && flow.metrics.efficiency > 0.7) {
      flow.optimize(FlowState.FLOW);
    }

    // Evolve pattern if active
    if (pattern.activePattern) {
      pattern.evolvePattern(pattern.activePattern, {
        energyLevels: energy.energy,
        metrics: energy.metrics
      }, true);
    }

    // Adapt protection
    protectionSystem.adapt(field);

    updateSystems();
  }, [
    state.isActive,
    state.isProtected,
    field,
    energy,
    flow,
    pattern,
    updateSystems
  ]);

  const handleBreach = useCallback((severity: number, source: string) => {
    protectionSystem.handleBreach(severity, source);
    
    if (severity > 0.7) {
      deactivate();
      flow.transitionTo(FlowState.RECOVERING);
    }
  }, [deactivate, flow]);

  useEffect(() => {
    if (state.isActive) {
      const updateInterval = setInterval(updateSystems, 1000);
      const optimizeInterval = setInterval(optimizePerformance, 5000);

      return () => {
        clearInterval(updateInterval);
        clearInterval(optimizeInterval);
      };
    }
  }, [state.isActive, updateSystems, optimizePerformance]);

  return {
    ...state,
    activate,
    deactivate,
    updateSystems,
    optimizePerformance,
    handleBreach
  };
}; 