import { describe, it, expect } from 'vitest';
import { calculateFieldResonance, calculateFieldStrength } from '../utils/field';

/**
 * @typedef {Object} Resonance
 * @property {Object} primary
 * @property {number} primary.frequency
 * @property {number} primary.amplitude
 * @property {number} primary.phase
 * @property {Array<{frequency: number, amplitude: number, phase: number}>} harmonics
 * @property {number} coherence
 * @property {number} stability
 */

/**
 * @typedef {Object} Protection
 * @property {number} level
 * @property {'natural' | 'enhanced' | 'autonomous' | 'standard'} type
 * @property {number} strength
 * @property {number} resilience
 * @property {number} adaptability
 * @property {boolean} natural
 * @property {Field} field
 */

/**
 * @typedef {Object} FlowMetrics
 * @property {number} intensity
 * @property {number} stability
 * @property {number} conductivity
 * @property {number} velocity
 * @property {number} focus
 * @property {number} energy
 */

/**
 * @typedef {Object} Metrics
 * @property {number} stability
 * @property {number} coherence
 * @property {number} resonance
 * @property {number} quality
 */

/**
 * @typedef {Object} Field
 * @property {Object} center
 * @property {number} center.x
 * @property {number} center.y
 * @property {number} center.z
 * @property {number} radius
 * @property {number} strength
 * @property {number} coherence
 * @property {number} stability
 * @property {Resonance} resonance
 * @property {Protection} protection
 * @property {FlowMetrics} flowMetrics
 * @property {Metrics} metrics
 */

/**
 * Creates a test field with default values
 * @param {Partial<Field>} overrides - Optional overrides for field properties
 * @returns {Field} The test field
 */
function createTestField(overrides = {}) {
  return {
    center: {
      x: 0,
      y: 0,
      z: 0
    },
    radius: 1,
    strength: 1,
    coherence: 1,
    stability: 1,
    resonance: {
      primary: {
        frequency: 1,
        amplitude: 1,
        phase: 0,
      },
      coherence: 1,
      stability: 1,
      harmonics: []
    },
    protection: {
      level: 1,
      type: 'natural',
      strength: 1,
      resilience: 1,
      adaptability: 1,
      natural: true,
      field: null
    },
    flowMetrics: {
      intensity: 1,
      stability: 1,
      conductivity: 1,
      velocity: 1,
      focus: 1,
      energy: 1
    },
    metrics: {
      stability: 1,
      coherence: 1,
      resonance: 1,
      quality: 1
    },
    ...overrides
  };
}

describe('Field calculations', () => {
  it('calculates perfect resonance match', () => {
    const field1 = createTestField();
    const field2 = createTestField();
    
    const resonance = calculateFieldResonance(field1, field2);
    expect(resonance).toBe(1);
  });

  it('calculates reduced resonance with phase difference', () => {
    const field1 = createTestField();
    const field2 = createTestField({
      resonance: {
        ...field1.resonance,
        primary: {
          ...field1.resonance.primary,
          phase: Math.PI
        }
      }
    });
    
    const resonance = calculateFieldResonance(field1, field2);
    expect(resonance).toBeLessThan(1);
  });

  it('calculates positive field strength', () => {
    const field = createTestField();
    const strength = calculateFieldStrength(field);
    expect(strength).toBeGreaterThan(0);
  });
}); 