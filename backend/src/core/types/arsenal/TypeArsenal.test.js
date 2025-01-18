import { describe, it, expect } from 'vitest';
import { TypeArsenal } from './TypeArsenal';

describe('TypeArsenal', () => {
  const arsenal = new TypeArsenal();
  const mockState = {
    type: 'flow',
    level: 0.8,
    metrics: {
      focus: 0.9,
      clarity: 0.85
    }
  };

  it('registers type validators', () => {
    arsenal.registerValidator('flow', (state) => ({
      valid: state.level > 0.5,
      score: state.metrics.focus
    }));

    expect(arsenal.validators.size).toBe(1);
  });

  it('validates state using registered validators', () => {
    const result = arsenal.validate('flow', mockState);
    expect(result.valid).toBe(true);
    expect(result.score).toBe(0.9);
  });

  it('generates optimization recommendations', () => {
    arsenal.addRecommendation('flow', (state) => [
      'Maintain high focus',
      'Keep clarity above 0.8'
    ]);

    const recommendations = arsenal.getRecommendations('flow', mockState);
    expect(recommendations).toHaveLength(2);
  });

  it('tracks validation history', () => {
    arsenal.validate('flow', mockState);
    arsenal.validate('flow', { ...mockState, level: 0.9 });

    const history = arsenal.getValidationHistory('flow');
    expect(history).toHaveLength(2);
  });

  it('analyzes validation trends', () => {
    // Register validator that returns increasing scores
    arsenal.registerValidator('flow', (state) => ({
      valid: state.level > 0.5,
      score: state.level
    }));

    // Validate with increasing scores
    arsenal.validate('flow', { ...mockState, level: 0.7 });
    arsenal.validate('flow', { ...mockState, level: 0.9 });
    
    const trends = arsenal.analyzeTrends();
    expect(trends.improvement).toBe(true);
  });
}); 