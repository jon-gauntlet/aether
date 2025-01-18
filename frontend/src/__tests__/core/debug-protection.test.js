import { describe, it, expect } from 'vitest';
import { createDebugProtection } from '../debug-protection';

describe('Debug Protection', () => {
  const mockContext = {
    flowState: {
      active: true,
      intensity: 0.8,
      duration: 1200000
    },
    debugState: {
      active: false,
      lastPause: Date.now() - 3600000
    }
  };

  const protection = createDebugProtection();

  it('validates state transitions', () => {
    const result = protection.validateTransition({
      from: { type: 'FLOW', intensity: 0.8 },
      to: { type: 'DEBUG', intensity: 0.4 },
      context: mockContext
    });

    expect(result.valid).toBe(true);
    expect(result.impact).toBeLessThan(0.5);
  });

  it('analyzes debug patterns', () => {
    const patterns = protection.analyzePatterns(mockContext);

    expect(patterns).toHaveLength(2);
    expect(patterns[0].type).toBe('DEBUG_FREQUENCY');
    expect(patterns[1].type).toBe('FLOW_INTERRUPTION');
  });

  it('tracks state evolution', () => {
    const evolution = protection.trackEvolution([
      { type: 'FLOW_CONTINUE', timestamp: Date.now() - 2000 },
      { type: 'DEBUG_PAUSE', timestamp: Date.now() - 1000 },
      { type: 'FLOW_RESUME', timestamp: Date.now() }
    ]);

    expect(evolution.transitions).toHaveLength(3);
    expect(evolution.debugTime).toBeLessThan(2000);
  });

  it('generates protection recommendations', () => {
    const recommendations = protection.getRecommendations(mockContext);

    expect(recommendations).toHaveLength(2);
    expect(recommendations[0]).toMatch(/flow/i);
    expect(recommendations[1]).toMatch(/debug/i);
  });
}); 