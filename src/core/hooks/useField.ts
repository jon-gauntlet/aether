import { useState, useCallback, useEffect } from 'react';
import { Field } from '../types/base';
import { Energy } from '../energy/types';

export const useField = (initialField: Field) => {
  const [field, setField] = useState<Field>(initialField);
  const [isStable, setIsStable] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const updateField = useCallback((updates: Partial<Field>) => {
    setField(prev => {
      const next = { ...prev, ...updates };
      
      // Check stability after update
      const stabilityFactors = [
        Math.abs(next.resonance.amplitude - prev.resonance.amplitude) < 0.2,
        Math.abs(next.resonance.frequency - prev.resonance.frequency) < 0.2,
        next.protection.shields > 0.3,
        next.flowMetrics.conductivity > 0.3
      ];
      
      const newStability = stabilityFactors.filter(Boolean).length / stabilityFactors.length;
      setIsStable(newStability > 0.7);
      
      setLastUpdate(new Date());
      return next;
    });
  }, []);

  const updateEnergy = useCallback((energy: Energy) => {
    updateField({
      energy,
      flowMetrics: {
        ...field.flowMetrics,
        conductivity: calculateConductivity(energy, field)
      }
    });
  }, [field, updateField]);

  const updateResonance = useCallback((
    amplitude?: number,
    frequency?: number,
    phase?: number
  ) => {
    updateField({
      resonance: {
        ...field.resonance,
        ...(amplitude !== undefined && { amplitude }),
        ...(frequency !== undefined && { frequency }),
        ...(phase !== undefined && { phase })
      }
    });
  }, [field, updateField]);

  const updateProtection = useCallback((
    shields?: number,
    resilience?: number,
    recovery?: number,
    adaptability?: number
  ) => {
    updateField({
      protection: {
        ...field.protection,
        ...(shields !== undefined && { shields }),
        ...(resilience !== undefined && { resilience }),
        ...(recovery !== undefined && { recovery }),
        ...(adaptability !== undefined && { adaptability })
      }
    });
  }, [field, updateField]);

  const reset = useCallback(() => {
    setField(initialField);
    setIsStable(true);
    setLastUpdate(new Date());
  }, [initialField]);

  // Auto-stabilize field if unstable
  useEffect(() => {
    if (!isStable) {
      const stabilizeInterval = setInterval(() => {
        updateField({
          resonance: {
            ...field.resonance,
            amplitude: field.resonance.amplitude * 0.95 + initialField.resonance.amplitude * 0.05,
            frequency: field.resonance.frequency * 0.95 + initialField.resonance.frequency * 0.05
          },
          protection: {
            ...field.protection,
            shields: field.protection.shields * 0.95 + initialField.protection.shields * 0.05
          },
          flowMetrics: {
            ...field.flowMetrics,
            conductivity: field.flowMetrics.conductivity * 0.95 + initialField.flowMetrics.conductivity * 0.05
          }
        });
      }, 1000);

      return () => clearInterval(stabilizeInterval);
    }
  }, [field, initialField, isStable, updateField]);

  return {
    field,
    isStable,
    lastUpdate,
    updateField,
    updateEnergy,
    updateResonance,
    updateProtection,
    reset
  };
};

function calculateConductivity(energy: Energy, field: Field): number {
  const avgEnergy = (energy.mental + energy.physical + energy.emotional) / 3;
  const resonanceFactor = Math.cos(field.resonance.phase) * field.resonance.amplitude;
  const protectionFactor = field.protection.shields * field.protection.adaptability;
  
  return Math.max(0, Math.min(1,
    (avgEnergy * 0.4 + resonanceFactor * 0.4 + protectionFactor * 0.2) * field.strength
  ));
} 