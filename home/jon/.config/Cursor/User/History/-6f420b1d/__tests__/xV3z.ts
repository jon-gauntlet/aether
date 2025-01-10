import { validateAutonomicAction, ActionType, ValidationResult } from '../AutonomicValidation';
import { Field, FlowState } from '../../types/base';
import { ConsciousnessState } from '../../types/consciousness';

describe('AutonomicValidation', () => {
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

  describe('validateAutonomicAction', () => {
    it('should validate safe actions in stable state', () => {
      const result = validateAutonomicAction({
        type: ActionType.ENHANCE_FLOW,
        field: mockField,
        consciousness: mockConsciousness
      });

      expect(result.isValid).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.safetyScore).toBeGreaterThan(0.7);
    });

    it('should reject unsafe actions in unstable state', () => {
      mockConsciousness.flowSpace.stability = 0.3;
      const result = validateAutonomicAction({
        type: ActionType.FORCE_TRANSITION,
        field: mockField,
        consciousness: mockConsciousness
      });

      expect(result.isValid).toBe(false);
      expect(result.safetyScore).toBeLessThan(0.5);
    });

    it('should consider field protection in validation', () => {
      mockField.protection.shields = 0.3;
      const result = validateAutonomicAction({
        type: ActionType.MODIFY_FIELD,
        field: mockField,
        consciousness: mockConsciousness
      });

      expect(result.isValid).toBe(false);
      expect(result.protectionScore).toBeLessThan(0.5);
    });

    it('should validate recovery actions regardless of state', () => {
      mockConsciousness.flowSpace.stability = 0.2;
      const result = validateAutonomicAction({
        type: ActionType.INITIATE_RECOVERY,
        field: mockField,
        consciousness: mockConsciousness
      });

      expect(result.isValid).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.6);
    });

    it('should consider consciousness coherence in validation', () => {
      mockConsciousness.metrics.coherence = 0.3;
      const result = validateAutonomicAction({
        type: ActionType.ENHANCE_FLOW,
        field: mockField,
        consciousness: mockConsciousness
      });

      expect(result.isValid).toBe(false);
      expect(result.coherenceScore).toBeLessThan(0.5);
    });

    it('should validate field modifications based on resonance', () => {
      mockField.resonance.amplitude = 0.9;
      const result = validateAutonomicAction({
        type: ActionType.MODIFY_FIELD,
        field: mockField,
        consciousness: mockConsciousness
      });

      expect(result.isValid).toBe(true);
      expect(result.resonanceScore).toBeGreaterThan(0.8);
    });
  });
}); 