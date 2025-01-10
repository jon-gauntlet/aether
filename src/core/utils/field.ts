import { Field } from '../types/base';
import { Energy } from '../energy/types';

export function calculateResonance(field: Field, targetField: Field): number {
  const amplitudeDiff = Math.abs(field.resonance.amplitude - targetField.resonance.amplitude);
  const frequencyDiff = Math.abs(field.resonance.frequency - targetField.resonance.frequency);
  const phaseDiff = Math.abs(Math.sin(field.resonance.phase - targetField.resonance.phase));

  return 1 - (amplitudeDiff + frequencyDiff + phaseDiff) / 3;
}

export function calculateFieldStrength(field: Field, energy: Energy): number {
  const avgEnergy = (energy.mental + energy.physical + energy.emotional) / 3;
  const resonanceFactor = Math.cos(field.resonance.phase) * field.resonance.amplitude;
  const protectionFactor = field.protection.shields * field.protection.adaptability;

  return Math.max(0, Math.min(1,
    (avgEnergy * 0.4 + resonanceFactor * 0.4 + protectionFactor * 0.2) * field.strength
  ));
}

export function calculateFieldInteraction(field1: Field, field2: Field): {
  resonance: number;
  interference: number;
  stability: number;
} {
  const resonance = calculateResonance(field1, field2);
  
  const interference = Math.abs(
    Math.sin(field1.resonance.phase - field2.resonance.phase) *
    Math.min(field1.resonance.amplitude, field2.resonance.amplitude)
  );

  const stability = (
    Math.min(field1.protection.shields, field2.protection.shields) *
    Math.min(field1.protection.resilience, field2.protection.resilience) *
    (1 - interference)
  );

  return {
    resonance,
    interference,
    stability
  };
}

export function optimizeFieldResonance(field: Field, targetField: Field): Partial<Field> {
  const currentResonance = calculateResonance(field, targetField);
  
  if (currentResonance > 0.9) return {};

  const phaseAdjustment = Math.sin(targetField.resonance.phase - field.resonance.phase) * 0.1;
  const amplitudeAdjustment = (targetField.resonance.amplitude - field.resonance.amplitude) * 0.1;
  const frequencyAdjustment = (targetField.resonance.frequency - field.resonance.frequency) * 0.1;

  return {
    resonance: {
      phase: field.resonance.phase + phaseAdjustment,
      amplitude: field.resonance.amplitude + amplitudeAdjustment,
      frequency: field.resonance.frequency + frequencyAdjustment
    }
  };
}

export function stabilizeField(field: Field): Partial<Field> {
  const stabilityFactor = Math.min(
    field.protection.shields,
    field.protection.resilience,
    field.flowMetrics.conductivity
  );

  if (stabilityFactor > 0.7) return {};

  const adjustment = (0.8 - stabilityFactor) * 0.2;

  return {
    protection: {
      ...field.protection,
      shields: Math.min(1, field.protection.shields + adjustment),
      resilience: Math.min(1, field.protection.resilience + adjustment)
    },
    flowMetrics: {
      ...field.flowMetrics,
      conductivity: Math.min(1, field.flowMetrics.conductivity + adjustment)
    }
  };
} 