import { describe, it, expect } from 'vitest';
import { FlowTypeOptimizer } from './FlowTypeOptimizer';

describe('FlowTypeOptimizer', () => {
  const optimizer = new FlowTypeOptimizer();
  const mockState = {
    flowLevel: 0.7,
    patterns: [
      { type: 'block', severity: 0.6 }
    ]
  };

  it('optimizes flow types based on state', () => {
    const result = optimizer.optimize(mockState);
    
    expect(result.optimizedLevel).toBeGreaterThan(mockState.flowLevel);
    expect(result.recommendations).toHaveLength(1);
    expect(result.recommendations).toContain('Address blocking patterns');
  });

  it('detects flow patterns', () => {
    const patterns = optimizer.detectPatterns(mockState);
    
    expect(patterns).toHaveLength(1);
    expect(patterns[0].type).toBe('block');
  });

  it('generates recommendations', () => {
    const recommendations = optimizer.generateRecommendations(mockState);
    
    expect(recommendations).toHaveLength(1);
    expect(recommendations[0]).toMatch(/pattern/i);
  });

  it('calculates optimization score', () => {
    const score = optimizer.calculateScore(mockState);
    
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(1);
  });
});