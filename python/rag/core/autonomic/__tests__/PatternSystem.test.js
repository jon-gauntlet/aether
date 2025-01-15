import { PatternSystem } from '../PatternSystem';
import { FlowState } from '../../types/base';

describe('PatternSystem', () => {
  let patternSystem;
  let mockField;
  let mockConsciousness;

  beforeEach(() => {
    patternSystem = new PatternSystem();
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

  describe('pattern recognition', () => {
    it('should recognize flow state patterns', () => {
      const pattern = {
        id: 'flow_pattern',
        name: 'Flow State Pattern',
        conditions: {
          flowState: FlowState.FLOW,
          minFieldStrength: 0.7,
          minResonance: 0.6,
          maxResistance: 0.3
        },
        weight: 1.0,
        activations: 0
      };

      patternSystem.addPattern(pattern);
      const matches = patternSystem.findMatches(mockField, mockConsciousness);
      
      expect(matches).toHaveLength(1);
      expect(matches[0].pattern.id).toBe('flow_pattern');
      expect(matches[0].confidence).toBeGreaterThan(0.8);
    });

    it('should not match patterns with unmet conditions', () => {
      const pattern = {
        id: 'high_strength',
        name: 'High Strength Pattern',
        conditions: {
          minFieldStrength: 0.9,
          minResonance: 0.9,
          maxResistance: 0.1
        },
        weight: 1.0,
        activations: 0
      };

      patternSystem.addPattern(pattern);
      const matches = patternSystem.findMatches(mockField, mockConsciousness);
      
      expect(matches).toHaveLength(0);
    });

    it('should track pattern activations', () => {
      const pattern = {
        id: 'test_pattern',
        name: 'Test Pattern',
        conditions: {
          minFieldStrength: 0.7
        },
        weight: 1.0,
        activations: 0
      };

      patternSystem.addPattern(pattern);
      patternSystem.activatePattern('test_pattern');
      
      const updatedPattern = patternSystem.getPattern('test_pattern');
      expect(updatedPattern?.activations).toBe(1);
    });

    it('should calculate match confidence based on conditions', () => {
      const pattern = {
        id: 'resonance_pattern',
        name: 'Resonance Pattern',
        conditions: {
          minResonance: 0.7,
          minFieldStrength: 0.7
        },
        weight: 1.0,
        activations: 0
      };

      patternSystem.addPattern(pattern);
      const matches = patternSystem.findMatches(mockField, mockConsciousness);
      
      expect(matches[0].confidence).toBeCloseTo(
        (mockField.resonance.amplitude * mockField.strength) / 2,
        2
      );
    });

    it('should consider pattern weight in match confidence', () => {
      const pattern = {
        id: 'weighted_pattern',
        name: 'Weighted Pattern',
        conditions: {
          minFieldStrength: 0.7
        },
        weight: 0.5,
        activations: 0
      };

      patternSystem.addPattern(pattern);
      const matches = patternSystem.findMatches(mockField, mockConsciousness);
      
      expect(matches[0].confidence).toBeLessThan(mockField.strength);
    });
  });

  describe('pattern management', () => {
    it('should add and remove patterns', () => {
      const pattern = {
        id: 'test_pattern',
        name: 'Test Pattern',
        conditions: {},
        weight: 1.0,
        activations: 0
      };

      patternSystem.addPattern(pattern);
      expect(patternSystem.getPattern('test_pattern')).toBeDefined();

      patternSystem.removePattern('test_pattern');
      expect(patternSystem.getPattern('test_pattern')).toBeUndefined();
    });

    it('should update existing patterns', () => {
      const pattern = {
        id: 'test_pattern',
        name: 'Test Pattern',
        conditions: {},
        weight: 1.0,
        activations: 0
      };

      patternSystem.addPattern(pattern);
      patternSystem.updatePattern({
        ...pattern,
        name: 'Updated Pattern',
        weight: 0.5
      });

      const updated = patternSystem.getPattern('test_pattern');
      expect(updated?.name).toBe('Updated Pattern');
      expect(updated?.weight).toBe(0.5);
    });
  });
}); 