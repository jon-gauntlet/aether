import { validatePrediction, PredictionType } from '../PredictiveValidation';
import { Field, FlowState } from '../../types/base';
import { ConsciousnessState } from '../../types/consciousness';

describe('PredictiveValidation', () => {
  let mockField: Field;
  let mockConsciousness: ConsciousnessState;

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
      currentState: FlowState.FLOW,
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
      stateHistory: [FlowState.FOCUS, FlowState.FLOW],
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
      const result = validatePrediction({
        type: PredictionType.FLOW_TRANSITION,
        probability: 0.8,
        field: mockField,
        consciousness: mockConsciousness
      });

      expect(result.isValid).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    it('should reject predictions with low field strength', () => {
      mockField.strength = 0.3;
      const result = validatePrediction({
        type: PredictionType.PATTERN_EMERGENCE,
        probability: 0.7,
        field: mockField,
        consciousness: mockConsciousness
      });

      expect(result.isValid).toBe(false);
      expect(result.confidence).toBeLessThan(0.5);
    });

    it('should consider consciousness coherence in validation', () => {
      mockConsciousness.metrics.coherence = 0.3;
      const result = validatePrediction({
        type: PredictionType.STATE_CHANGE,
        probability: 0.7,
        field: mockField,
        consciousness: mockConsciousness
      });

      expect(result.isValid).toBe(false);
      expect(result.coherenceScore).toBeLessThan(0.5);
    });

    it('should validate predictions with strong resonance harmonics', () => {
      mockField.resonance.harmonics = [1.0, 2.0, 3.0, 4.0];
      const result = validatePrediction({
        type: PredictionType.RESONANCE_SHIFT,
        probability: 0.7,
        field: mockField,
        consciousness: mockConsciousness
      });

      expect(result.isValid).toBe(true);
      expect(result.resonanceScore).toBeGreaterThan(0.8);
    });

    it('should consider flow metrics in validation', () => {
      mockField.flowMetrics = {
        velocity: 0.9,
        momentum: 0.8,
        resistance: 0.1,
        conductivity: 0.9
      };

      const result = validatePrediction({
        type: PredictionType.FLOW_OPTIMIZATION,
        probability: 0.7,
        field: mockField,
        consciousness: mockConsciousness
      });

      expect(result.isValid).toBe(true);
      expect(result.flowScore).toBeGreaterThan(0.8);
    });

    it('should reject predictions with high resistance', () => {
      mockField.flowMetrics.resistance = 0.8;
      const result = validatePrediction({
        type: PredictionType.FLOW_TRANSITION,
        probability: 0.7,
        field: mockField,
        consciousness: mockConsciousness
      });

      expect(result.isValid).toBe(false);
      expect(result.flowScore).toBeLessThan(0.5);
    });
  });
}); 