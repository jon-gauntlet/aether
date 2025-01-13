import {
  calculateAttentionMetrics,
  calculateSpeedMetrics,
  analyzeAttentionPatterns,
  generateOptimizations
} from './utils/attention-metrics';

describe('Attention Metrics', () => {
  const mockSystemState = {
    focus: 0.8,
    energy: 0.9,
    health: 1,
    context: {
      clarity: 0.7,
      recentProgress: 0.8,
      blockers: 0.2
    }
  };

  describe('attention calculation', () => {
    it('calculates metrics from system state', () => {
      const metrics = calculateAttentionMetrics(mockSystemState);
      
      expect(metrics.focusDepth).toBe(0.8);
      expect(metrics.contextClarity).toBe(0.7);
      expect(metrics.energyReserves).toBe(0.9);
      expect(metrics.momentum).toBe(0.6); // recentProgress - blockers
    });

    it('handles missing context values', () => {
      const metrics = calculateAttentionMetrics({
        ...mockSystemState,
        context: {}
      });
      
      expect(metrics.contextClarity).toBe(1); // Default
      expect(metrics.momentum).toBe(0); // No progress, no blockers
    });
  });

  describe('speed metrics', () => {
    it('calculates development speed from transitions', () => {
      const now = Date.now();
      const transitions = [
        { timestamp: now - 3000000 }, // 50 min ago
        { timestamp: now - 2400000 }, // 40 min ago
        { timestamp: now - 1800000 }, // 30 min ago
        { timestamp: now - 1200000 }, // 20 min ago
        { timestamp: now - 600000 },  // 10 min ago
        { timestamp: now }
      ];

      const metrics = calculateSpeedMetrics(transitions);
      
      expect(metrics.iterationRate).toBeGreaterThan(0);
      expect(metrics.completionRate).toBeGreaterThan(0);
      expect(metrics.flowEfficiency).toBeGreaterThan(0.5);
    });

    it('identifies blocking periods', () => {
      const now = Date.now();
      const transitions = [
        { timestamp: now - 3600000 }, // 1 hour ago
        { timestamp: now - 3000000 }, // 50 min ago
        // Long gap (blocking period)
        { timestamp: now - 600000 },  // 10 min ago
        { timestamp: now }
      ];

      const metrics = calculateSpeedMetrics(transitions);
      expect(metrics.blockingTime).toBeGreaterThan(2000000); // >33 min
      expect(metrics.flowEfficiency).toBeLessThan(0.5);
    });
  });

  describe('pattern analysis', () => {
    it('detects optimal flow states', () => {
      const attentionMetrics = {
        focusDepth: 0.9,
        contextClarity: 0.8,
        momentum: 0.9,
        energyReserves: 0.7
      };

      const speedMetrics = {
        iterationRate: 2,
        completionRate: 5,
        blockingTime: 0,
        flowEfficiency: 0.9
      };

      const insights = analyzeAttentionPatterns(attentionMetrics, speedMetrics);
      expect(insights).toContain('Optimal flow state detected - protect from interruptions');
    });

    it('identifies context clarity issues', () => {
      const attentionMetrics = {
        focusDepth: 0.7,
        contextClarity: 0.5,
        momentum: 0.6,
        energyReserves: 0.8
      };

      const speedMetrics = {
        iterationRate: 1,
        completionRate: 3,
        blockingTime: 1200000,
        flowEfficiency: 0.6
      };

      const insights = analyzeAttentionPatterns(attentionMetrics, speedMetrics);
      expect(insights).toContain('Context clarity dropping - consider documenting current state');
    });
  });

  describe('optimization recommendations', () => {
    it('suggests focus improvements', () => {
      const attentionMetrics = {
        focusDepth: 0.5,
        contextClarity: 0.8,
        momentum: 0.7,
        energyReserves: 0.9
      };

      const speedMetrics = {
        iterationRate: 1,
        completionRate: 4,
        blockingTime: 600000,
        flowEfficiency: 0.7
      };

      const optimizations = generateOptimizations(attentionMetrics, speedMetrics);
      expect(optimizations).toContain('Reduce context switches');
      expect(optimizations).toContain('Break down complex tasks');
    });

    it('suggests momentum improvements', () => {
      const attentionMetrics = {
        focusDepth: 0.8,
        contextClarity: 0.7,
        momentum: 0.4,
        energyReserves: 0.9
      };

      const speedMetrics = {
        iterationRate: 0.5,
        completionRate: 2,
        blockingTime: 1800000,
        flowEfficiency: 0.4
      };

      const optimizations = generateOptimizations(attentionMetrics, speedMetrics);
      expect(optimizations).toContain('Start with small wins');
      expect(optimizations).toContain('Remove immediate blockers');
    });
  });
}); 