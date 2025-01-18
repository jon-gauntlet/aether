/**
 * @typedef {import('../types/base').Field} Field
 * @typedef {import('../types/base').Resonance} Resonance
 */

/**
 * Calculates the resonance between two fields
 * @param {Field} field - The source field
 * @param {Field} targetField - The target field
 * @returns {number} The resonance value between 0 and 1
 */
export function calculateFieldResonance(field, targetField) {
  const resonanceMatch = compareResonance(field.resonance, targetField.resonance);
  const protectionMatch = compareProtection(field.protection, targetField.protection);
  const metricsMatch = compareMetrics(field.metrics, targetField.metrics);
  
  return (resonanceMatch * 0.4 + protectionMatch * 0.3 + metricsMatch * 0.3);
}

/**
 * Compares two resonance objects
 * @param {Resonance} a - First resonance object
 * @param {Resonance} b - Second resonance object
 * @returns {number} The resonance match value between 0 and 1
 */
function compareResonance(a, b) {
  const frequencyMatch = 1 - Math.abs(a.primary.frequency - b.primary.frequency) / Math.max(a.primary.frequency, b.primary.frequency);
  const amplitudeMatch = 1 - Math.abs(a.primary.amplitude - b.primary.amplitude) / Math.max(a.primary.amplitude, b.primary.amplitude);
  const phaseMatch = (Math.cos(Math.abs(a.primary.phase - b.primary.phase)) + 1) / 2;
  const coherenceMatch = 1 - Math.abs(a.coherence - b.coherence);
  const stabilityMatch = 1 - Math.abs(a.stability - b.stability);
  
  // Compare harmonics arrays if they exist
  const harmonicsMatch = (a.harmonics && b.harmonics && a.harmonics.length === b.harmonics.length) ?
    a.harmonics.reduce((match, harmonic, i) => 
      match + (1 - Math.abs(harmonic.frequency - b.harmonics[i].frequency) / Math.max(harmonic.frequency, b.harmonics[i].frequency)), 0) / Math.max(1, a.harmonics.length)
    : 1;

  return (
    frequencyMatch * 0.3 +
    amplitudeMatch * 0.3 +
    phaseMatch * 0.2 +
    coherenceMatch * 0.1 +
    stabilityMatch * 0.1
  );
}

/**
 * Compares two protection objects
 * @param {Field['protection']} a - First protection object
 * @param {Field['protection']} b - Second protection object
 * @returns {number} The protection match value between 0 and 1
 */
function compareProtection(a, b) {
  const adaptabilityMatch = 1 - Math.abs(a.adaptability - b.adaptability);
  const resilienceMatch = 1 - Math.abs(a.resilience - b.resilience);
  const strengthMatch = 1 - Math.abs(a.strength - b.strength);
  const levelMatch = 1 - Math.abs(a.level - b.level);
  const typeMatch = a.type === b.type ? 1 : 0;

  return (
    adaptabilityMatch * 0.25 +
    resilienceMatch * 0.25 +
    strengthMatch * 0.2 +
    levelMatch * 0.2 +
    typeMatch * 0.1
  );
}

/**
 * Compares two metrics objects
 * @param {Field['metrics']} a - First metrics object
 * @param {Field['metrics']} b - Second metrics object
 * @returns {number} The metrics match value between 0 and 1
 */
function compareMetrics(a, b) {
  const stabilityMatch = 1 - Math.abs(a.stability - b.stability);
  const coherenceMatch = 1 - Math.abs(a.coherence - b.coherence);
  const resonanceMatch = 1 - Math.abs(a.resonance - b.resonance);
  const qualityMatch = 1 - Math.abs(a.quality - b.quality);

  return (
    stabilityMatch * 0.3 +
    coherenceMatch * 0.3 +
    resonanceMatch * 0.2 +
    qualityMatch * 0.2
  );
}

/**
 * Calculates the strength of a field
 * @param {Field} field - The field to calculate strength for
 * @returns {number} The field strength value
 */
export function calculateFieldStrength(field) {
  const avgMetrics = (field.metrics.coherence + field.metrics.resonance + field.metrics.quality) / 3;

  const resonanceFactor = Math.cos(field.resonance.primary.phase) * 
    field.resonance.primary.amplitude * 
    field.resonance.stability * 
    (field.resonance.harmonics.length > 0 ? 
      field.resonance.harmonics.reduce((sum, h) => sum + h.amplitude, 0) / field.resonance.harmonics.length : 
      1);
  const protectionFactor = field.protection.strength * field.protection.adaptability;

  return avgMetrics * 0.4 + resonanceFactor * 0.4 + protectionFactor * 0.2;
}

/**
 * Calculates the interference between two fields
 * @param {Field} field1 - First field
 * @param {Field} field2 - Second field
 * @returns {number} The interference value between the fields
 */
export function calculateFieldInterference(field1, field2) {
  const resonanceInterference = 
    Math.sin(field1.resonance.primary.phase - field2.resonance.primary.phase) *
    Math.min(field1.resonance.primary.amplitude, field2.resonance.primary.amplitude) *
    Math.min(field1.resonance.stability, field2.resonance.stability) *
    (field1.resonance.harmonics.length > 0 && field2.resonance.harmonics.length > 0 ?
      Math.min(
        field1.resonance.harmonics.reduce((sum, h) => sum + h.amplitude, 0) / field1.resonance.harmonics.length,
        field2.resonance.harmonics.reduce((sum, h) => sum + h.amplitude, 0) / field2.resonance.harmonics.length
      ) : 1);

  const protectionInterference = 
    Math.min(field1.protection.strength, field2.protection.strength) *
    Math.min(field1.protection.resilience, field2.protection.resilience) *
    Math.min(field1.protection.adaptability, field2.protection.adaptability);

  return (resonanceInterference + protectionInterference) / 2;
}

/**
 * Harmonizes a field with a target field
 * @param {Field} field - The field to harmonize
 * @param {Field} targetField - The target field to harmonize with
 * @returns {Partial<Field>} The harmonized field properties
 */
export function harmonizeField(field, targetField) {
  const phaseAdjustment = Math.sin(targetField.resonance.primary.phase - field.resonance.primary.phase) * 0.1;
  const amplitudeAdjustment = (targetField.resonance.primary.amplitude - field.resonance.primary.amplitude) * 0.1;
  const frequencyAdjustment = (targetField.resonance.primary.frequency - field.resonance.primary.frequency) * 0.1;
  const stabilityAdjustment = (targetField.resonance.stability - field.resonance.stability) * 0.1;

  // Calculate harmonics adjustments
  const harmonicsAdjustment = targetField.resonance.harmonics.map((targetHarmonic, i) => {
    const currentHarmonic = field.resonance.harmonics[i] || { frequency: 0, amplitude: 0, phase: 0 };
    return {
      frequency: currentHarmonic.frequency + (targetHarmonic.frequency - currentHarmonic.frequency) * 0.1,
      amplitude: currentHarmonic.amplitude + (targetHarmonic.amplitude - currentHarmonic.amplitude) * 0.1,
      phase: currentHarmonic.phase + (targetHarmonic.phase - currentHarmonic.phase) * 0.1
    };
  });

  return {
    resonance: {
      primary: {
        phase: field.resonance.primary.phase + phaseAdjustment,
        amplitude: field.resonance.primary.amplitude + amplitudeAdjustment,
        frequency: field.resonance.primary.frequency + frequencyAdjustment
      },
      coherence: field.resonance.coherence,
      stability: field.resonance.stability + stabilityAdjustment,
      harmonics: harmonicsAdjustment
    }
  };
}

/**
 * Calculates the conductivity of a field
 * @param {Field} field - The field to calculate conductivity for
 * @returns {number} The field conductivity value
 */
export function calculateFieldConductivity(field) {
  return Math.min(
    field.protection.strength,
    field.protection.resilience,
    field.flowMetrics.conductivity
  );
}

/**
 * Enhances the protection of a field
 * @param {Field} field - The field to enhance
 * @param {number} adjustment - The adjustment value
 * @returns {Partial<Field>} The enhanced field properties
 */
export function enhanceFieldProtection(field, adjustment) {
  return {
    protection: {
      ...field.protection,
      strength: Math.min(1, field.protection.strength + adjustment),
      resilience: Math.min(1, field.protection.resilience + adjustment),
      adaptability: Math.min(1, field.protection.adaptability + adjustment)
    },
    flowMetrics: {
      ...field.flowMetrics,
      conductivity: Math.min(1, field.flowMetrics.conductivity + adjustment)
    }
  };
} 