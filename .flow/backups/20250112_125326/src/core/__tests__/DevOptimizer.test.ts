import { DevOptimizer } from '../aaa/DevOptimizer';

describe('DevOptimizer', () => {
  let optimizer: DevOptimizer;
  let now: number;

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

      const metrics = new Promise(resolve => {
        optimizer.observeMetrics().subscribe(m => {
          if (m.flowInterruptions > 0) resolve(m);
        });
      });

      return expect(metrics).resolves.toHaveProperty('flowInterruptions', 3);
    });
  });

  describe('progress tracking', () => {
    it('monitors commit frequency', () => {
      // Simulate low commit frequency
      optimizer.recordAction({
        type: 'COMMIT',
        timestamp: now - 45 * 60 * 1000
      });

      const recommendations = optimizer.getRecommendations();
      expect(recommendations).toContain('Break work into smaller commits');
    });

    it('tracks build health', () => {
      // Simulate build failure
      optimizer.recordAction({
        type: 'BUILD',
        timestamp: now,
        metadata: { success: false }
      });

      const priorities = optimizer.getPriorities();
      expect(priorities).toContain('Fix build stability');
    });
  });

  describe('deadline awareness', () => {
    it('adjusts priorities near deadline', () => {
      // Mock deadline approach
      jest.spyOn(Date, 'now').mockImplementation(() => {
        const deadline = new Date();
        deadline.setHours(15, 0, 0, 0); // 3 PM
        return deadline.getTime() - 90 * 60 * 1000; // 1.5 hours before
      });

      const priorities = optimizer.getPriorities();
      expect(priorities).toContain('CRITICAL: Focus only on Week 1 requirements');
      expect(priorities).toContain('Prepare deployment pipeline');
    });

    it('prioritizes deliverable progress', () => {
      // Simulate some progress
      optimizer.recordAction({
        type: 'DEPLOY',
        timestamp: now
      });

      const recommendations = optimizer.getRecommendations();
      expect(recommendations).toContain('Prioritize Week 1 deliverable requirements');
    });
  });

  describe('system health', () => {
    it('maintains test coverage', () => {
      // Simulate dropping test coverage
      optimizer.recordAction({
        type: 'TEST',
        timestamp: now,
        metadata: { coverage: 0.6 }
      });

      const priorities = optimizer.getPriorities();
      expect(priorities).toContain('Add core test coverage');
    });

    it('tracks repo coherence', () => {
      // Simulate repo organization issues
      optimizer.recordAction({
        type: 'COMMIT',
        timestamp: now,
        metadata: { coherence: 0.7 }
      });

      const recommendations = optimizer.getRecommendations();
      expect(recommendations).toContain('Organize code before continuing');
    });
  });

  describe('metric observation', () => {
    it('emits updated metrics', (done) => {
      optimizer.observeMetrics().subscribe(metrics => {
        if (metrics.commitFrequency > 0) {
          expect(metrics.commitFrequency).toBe(1);
          done();
        }
      });

      optimizer.recordAction({
        type: 'COMMIT',
        timestamp: now
      });
    });
  });
}); 