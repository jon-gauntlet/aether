import { runTests } from './runner';
import { calculateFieldResonance, calculateFieldStrength } from '../utils/field';
import type { Field, Resonance } from '../types/base';

const createTestField = (overrides: Partial<Field> = {}): Field => ({
  resonance: {
    phase: 0,
    amplitude: 1,
    frequency: 1,
    coherence: 1,
    harmony: 1,
    stability: 1,
    harmonics: []
  },
  protection: {
    shields: 1,
    resilience: 1,
    adaptability: 1,
    stability: 1,
    integrity: 1,
    recovery: 1,
    strength: 1,
    level: 1,
    type: 'test'
  },
  flowMetrics: {
    conductivity: 1,
    velocity: 1,
    coherence: 1
  },
  metrics: {
    energy: 1,
    flow: 1,
    coherence: 1,
    velocity: 1,
    focus: 1,
    intensity: 1,
    stability: 1,
    conductivity: 1,
    quality: 1
  },
  ...overrides
});

const fieldTests = [
  {
    name: 'Field resonance calculation - perfect match',
    test: () => {
      const field1 = createTestField();
      const field2 = createTestField();
      const resonance = calculateFieldResonance(field1, field2);
      
      if (resonance !== 1) {
        throw new Error(`Expected resonance to be 1, got ${resonance}`);
      }
    }
  },
  {
    name: 'Field resonance calculation - phase difference',
    test: () => {
      const field1 = createTestField();
      const field2 = createTestField({
        resonance: {
          ...field1.resonance,
          phase: Math.PI
        } as Resonance
      });
      
      const resonance = calculateFieldResonance(field1, field2);
      if (resonance >= 1) {
        throw new Error(`Expected resonance to be less than 1, got ${resonance}`);
      }
    }
  },
  {
    name: 'Field strength calculation',
    test: () => {
      const field = createTestField();
      const strength = calculateFieldStrength(field);
      
      if (strength <= 0) {
        throw new Error(`Expected positive field strength, got ${strength}`);
      }
    }
  }
];

if (require.main === module) {
  runTests(fieldTests).catch(console.error);
} 