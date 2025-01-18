import { PredictiveValidation, PredictionType } from '../PredictiveValidation';
import { FLOW_STATES } from '../../../types/constants';

describe('PredictiveValidation', () => {
  /** @type {import('../../types/base').Field} */
  let mockField;
  /** @type {import('../../types/consciousness').ConsciousnessState} */
  let mockConsciousness;

  beforeEach(() => {
    mockField = {
      id: '1',
      name: 'Test Field',
      strength: 0.8,
      resonance: {
        frequency: 1.0,
        amplitude: 0.7,
        phase: 0,
        harmonics: [1.0, 2.0]
      },
      protection: {
        shields: 0.9,
        recovery: 0.8,
        resilience: 0.7,
        adaptability: 0.6
      },
      flowMetrics: {
        velocity: 0.8,
        momentum: 0.7,
        resistance: 0.2,
        conductivity: 0.9
      },
      naturalFlow: {
        direction: 1,
        intensity: 0.8,
        stability: 0.7,
        sustainability: 0.9
      }
    };

    mockConsciousness = {
      currentState: FLOW_STATES.FLOW,
      fields: [mockField],
      flowSpace: {
        dimensions: 3,
        capacity: 100,
        utilization: 0.5,
        stability: 0.8,
        fields: [mockField],
        boundaries: []
      },
      lastTransition: Date.now(),
      stateHistory: [FLOW_STATES.FOCUS, FLOW_STATES.FLOW],
      metrics: {
        clarity: 0.8,
        depth: 0.7,
        coherence: 0.9,
        integration: 0.8,
        flexibility: 0.7
      }
    };
  });

  describe('validatePrediction', () => {
    it('should validate high probability predictions in flow state', () => {
      const validator = new PredictiveValidation();
      const result = validator.validatePrediction({
        type: PredictionType.FLOW_TRANSITION,
        probability: 0.8,
        field: mockField,
        consciousness: mockConsciousness
      });

      expect(result.isValid).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    it('should reject predictions with low field strength', () => {
      const validator = new PredictiveValidation();
      mockField.strength = 0.3;
      const result = validator.validatePrediction({
        type: PredictionType.PATTERN_EMERGENCE,
        probability: 0.7,
        field: mockField,
        consciousness: mockConsciousness
      });

      expect(result.isValid).toBe(false);
      expect(result.confidence).toBeLessThan(0.5);
    });

    it('should consider consciousness coherence in validation', () => {
      const validator = new PredictiveValidation();
      mockConsciousness.metrics.coherence = 0.3;
      const result = validator.validatePrediction({
        type: PredictionType.STATE_CHANGE,
        probability: 0.7,
        field: mockField,
        consciousness: mockConsciousness
      });

      expect(result.isValid).toBe(false);
      expect(result.coherenceScore).toBeLessThan(0.5);
    });
  });
}); 