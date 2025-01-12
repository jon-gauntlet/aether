import type { Field, Resonance } from '../types/base';

export function calculateFieldResonance(field: Field, targetField: Field): number {
  const resonanceMatch = compareResonance(field.resonance, targetField.resonance);
  const protectionMatch = compareProtection(field.protection, targetField.protection);
  const metricsMatch = compareMetrics(field.metrics, targetField.metrics);
  
  return (resonanceMatch * 0.4 + protectionMatch * 0.3 + metricsMatch * 0.3);
}

function compareResonance(a: Resonance, b: Resonance): number {
  const frequencyMatch = 1 - Math.abs(a.frequency - b.frequency) / Math.max(a.frequency, b.frequency);
  const amplitudeMatch = 1 - Math.abs(a.amplitude - b.amplitude) / Math.max(a.amplitude, b.amplitude);
  const phaseMatch = Math.cos(Math.abs(a.phase - b.phase));
  const coherenceMatch = 1 - Math.abs(a.coherence - b.coherence);
  const harmonyMatch = 1 - Math.abs(a.harmony - b.harmony);
  const stabilityMatch = 1 - Math.abs(a.stability - b.stability);
  
  // Compare harmonics arrays
  const harmonicsMatch = a.harmonics.length === b.harmonics.length ?
    a.harmonics.reduce((match, harmonic, i) => 
      match + (1 - Math.abs(harmonic - b.harmonics[i]) / Math.max(harmonic, b.harmonics[i])), 0) / a.harmonics.length
    : 0;

  return (
    frequencyMatch * 0.2 +
    amplitudeMatch * 0.2 +
    phaseMatch * 0.1 +
    coherenceMatch * 0.15 +
    harmonyMatch * 0.15 +
    stabilityMatch * 0.1 +
    harmonicsMatch * 0.1
  );
}

function compareProtection(a: Field['protection'], b: Field['protection']): number {
  const adaptabilityMatch = 1 - Math.abs(a.adaptability - b.adaptability);
  const stabilityMatch = 1 - Math.abs(a.stability - b.stability);
  const integrityMatch = 1 - Math.abs(a.integrity - b.integrity);
  const shieldsMatch = 1 - Math.abs(a.shields - b.shields);
  const resilienceMatch = 1 - Math.abs(a.resilience - b.resilience);
  const recoveryMatch = 1 - Math.abs(a.recovery - b.recovery);
  const strengthMatch = 1 - Math.abs(a.strength - b.strength);
  const levelMatch = 1 - Math.abs(a.level - b.level);
  const typeMatch = a.type === b.type ? 1 : 0;

  return (
    adaptabilityMatch * 0.1 +
    stabilityMatch * 0.1 +
    integrityMatch * 0.1 +
    shieldsMatch * 0.15 +
    resilienceMatch * 0.15 +
    recoveryMatch * 0.1 +
    strengthMatch * 0.1 +
    levelMatch * 0.1 +
    typeMatch * 0.1
  );
}

function compareMetrics(a: Field['metrics'], b: Field['metrics']): number {
  const velocityMatch = 1 - Math.abs(a.velocity - b.velocity);
  const focusMatch = 1 - Math.abs(a.focus - b.focus);
  const energyMatch = 1 - Math.abs(a.energy - b.energy);
  const intensityMatch = 1 - Math.abs(a.intensity - b.intensity);
  const stabilityMatch = 1 - Math.abs(a.stability - b.stability);
  const coherenceMatch = 1 - Math.abs(a.coherence - b.coherence);
  const flowMatch = 1 - Math.abs(a.flow - b.flow);
  const conductivityMatch = 1 - Math.abs(a.conductivity - b.conductivity);
  const qualityMatch = 1 - Math.abs(a.quality - b.quality);

  return (
    velocityMatch * 0.1 +
    focusMatch * 0.1 +
    energyMatch * 0.1 +
    intensityMatch * 0.1 +
    stabilityMatch * 0.15 +
    coherenceMatch * 0.15 +
    flowMatch * 0.1 +
    conductivityMatch * 0.1 +
    qualityMatch * 0.1
  );
}

export function calculateFieldStrength(field: Field): number {
  const { energy, flow, coherence } = field.metrics;
  const avgEnergy = (energy + flow + coherence) / 3;

  const resonanceFactor = Math.cos(field.resonance.phase) * 
    field.resonance.amplitude * 
    field.resonance.stability * 
    (field.resonance.harmonics.length > 0 ? 
      field.resonance.harmonics.reduce((sum, h) => sum + h, 0) / field.resonance.harmonics.length : 
      1);
  const protectionFactor = field.protection.shields * field.protection.adaptability;

  return (
    (avgEnergy * 0.4 + resonanceFactor * 0.4 + protectionFactor * 0.2) * field.strength
  );
}

export function calculateFieldInterference(field1: Field, field2: Field): number {
  const resonanceInterference = 
    Math.sin(field1.resonance.phase - field2.resonance.phase) *
    Math.min(field1.resonance.amplitude, field2.resonance.amplitude) *
    Math.min(field1.resonance.stability, field2.resonance.stability) *
    (field1.resonance.harmonics.length > 0 && field2.resonance.harmonics.length > 0 ?
      Math.min(
        field1.resonance.harmonics.reduce((sum, h) => sum + h, 0) / field1.resonance.harmonics.length,
        field2.resonance.harmonics.reduce((sum, h) => sum + h, 0) / field2.resonance.harmonics.length
      ) : 1);

  const protectionInterference = 
    Math.min(field1.protection.shields, field2.protection.shields) *
    Math.min(field1.protection.resilience, field2.protection.resilience) *
    Math.min(field1.protection.adaptability, field2.protection.adaptability);

  return (resonanceInterference + protectionInterference) / 2;
}

export function harmonizeField(field: Field, targetField: Field): Partial<Field> {
  const phaseAdjustment = Math.sin(targetField.resonance.phase - field.resonance.phase) * 0.1;
  const amplitudeAdjustment = (targetField.resonance.amplitude - field.resonance.amplitude) * 0.1;
  const frequencyAdjustment = (targetField.resonance.frequency - field.resonance.frequency) * 0.1;
  const stabilityAdjustment = (targetField.resonance.stability - field.resonance.stability) * 0.1;

  // Calculate harmonics adjustments
  const harmonicsAdjustment = targetField.resonance.harmonics.map((targetHarmonic, i) => {
    const currentHarmonic = field.resonance.harmonics[i] || 0;
    return currentHarmonic + (targetHarmonic - currentHarmonic) * 0.1;
  });

  return {
    resonance: {
      phase: field.resonance.phase + phaseAdjustment,
      amplitude: field.resonance.amplitude + amplitudeAdjustment,
      frequency: field.resonance.frequency + frequencyAdjustment,
      coherence: field.resonance.coherence,
      harmony: field.resonance.harmony,
      stability: field.resonance.stability + stabilityAdjustment,
      harmonics: harmonicsAdjustment
    }
  };
}

export function calculateFieldConductivity(field: Field): number {
  return Math.min(
    field.protection.shields,
    field.protection.resilience,
    field.flowMetrics.conductivity
  );
}

export function enhanceFieldProtection(field: Field, adjustment: number): Partial<Field> {
  return {
    protection: {
      ...field.protection,
      shields: Math.min(1, field.protection.shields + adjustment),
      resilience: Math.min(1, field.protection.resilience + adjustment),
      adaptability: Math.min(1, field.protection.adaptability + adjustment),
      stability: Math.min(1, field.protection.stability + adjustment),
      integrity: Math.min(1, field.protection.integrity + adjustment)
    },
    flowMetrics: {
      ...field.flowMetrics,
      conductivity: Math.min(1, field.flowMetrics.conductivity + adjustment)
    }
  };
} 