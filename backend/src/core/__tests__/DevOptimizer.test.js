import { describe, it, expect, beforeEach, vi } from 'vitest'
import { DevOptimizer } from '../aaa/DevOptimizer'

describe('DevOptimizer', () => {
  let optimizer;
  let now;

  beforeEach(() => {
    optimizer = new DevOptimizer();
    now = Date.now();
  });

  describe('flow management', () => {
    it('tracks flow sessions', () => {
      // Start flow
      optimizer.recordAction({
        type: 'START_FLOW',
        timestamp: now - 50 * 60 * 1000 // 50 min ago
      });

      const recommendations = optimizer.getRecommendations();
      expect(recommendations).toContain('Consider quick break to maintain energy');
    });

    it('monitors context switches', () => {
      // Simulate multiple flow interruptions
      for (let i = 0; i < 3; i++) {
        optimizer.recordAction({
          type: 'START_FLOW',
          timestamp: now - (i + 1) * 20 * 60 * 1000
        });
        optimizer.recordAction({
          type: 'END_FLOW',
          timestamp: now - (i + 1) * 15 * 60 * 1000
        });
      }

      const metrics = optimizer.getMetrics();
      expect(metrics.flowInterruptions).toBe(3);
    });
  });

  describe('progress tracking', () => {
    it('monitors commit frequency', () => {
      // Simulate low commit frequency
      for (let i = 0; i < 3; i++) {
        optimizer.recordAction({
          type: 'COMMIT',
          timestamp: now - i * 60 * 60 * 1000 // hourly commits
        });
      }

      const metrics = optimizer.getMetrics();
      expect(metrics.iterationSpeed).toBeLessThan(5);
    });
  });

  describe('optimization', () => {
    it('improves AI assistance over time', () => {
      const initial = optimizer.getMetrics().aiAssistanceLevel;

      optimizer.recordAction({
        type: 'AI_ASSIST',
        timestamp: now,
        metadata: { success: true }
      });

      const updated = optimizer.getMetrics().aiAssistanceLevel;
      expect(updated).toBeGreaterThan(initial);
    });
  });
}); 