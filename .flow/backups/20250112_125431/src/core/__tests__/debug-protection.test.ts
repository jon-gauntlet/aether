import { FlowEngine } from '../experience/FlowEngine';
import {
  createDebugContext,
  trackStateTransition,
  validateStateTransition,
  recordHealthCheck,
  analyzeDebugContext,
  withDebugProtection
} from './utils/debug-utils';
import { wait } from './utils/test-utils';

describe('Debug Protection', () => {
  let engine: FlowEngine;
  let debugContext: any;

  beforeEach(() => {
    engine = new FlowEngine();
    debugContext = createDebugContext();
  });

  describe('state transition tracking', () => {
    it('detects invalid state transitions', () => {
      const before = { ...engine.currentFlow };
      
      // Attempt invalid transition
      expect(() => {
        validateStateTransition(
          debugContext,
          before,
          { ...before, quality: 2 }, // Invalid quality > 1
          [
            (before, after) => after.quality >= 0 && after.quality <= 1
          ]
        );
      }).toThrow();

      const analysis = analyzeDebugContext(debugContext);
      expect(analysis.errorCount).toBe(1);
      expect(analysis.recommendations).toContain(
        'Review error patterns and add preventive validation'
      );
    });

    it('tracks healthy state evolution', async () => {
      const operation = withDebugProtection(() => {
        const before = { ...engine.currentFlow };
        engine.startFlow();
        const after = { ...engine.currentFlow };
        
        trackStateTransition(debugContext, before, after, 'startFlow');
        recordHealthCheck(debugContext, engine['systemState']);
        
        return after;
      }, debugContext);

      await wait(100);

      withDebugProtection(() => {
        engine.maintainFlow();
        recordHealthCheck(debugContext, engine['systemState']);
      }, debugContext);

      const analysis = analyzeDebugContext(debugContext);
      expect(analysis.errorCount).toBe(0);
      expect(analysis.healthTrend).toBe('stable');
    });
  });

  describe('health monitoring', () => {
    it('detects health degradation', () => {
      // Record initial health
      recordHealthCheck(debugContext, engine['systemState']);
      
      // Simulate health degradation
      engine['systemState'].health = 0.5;
      recordHealthCheck(debugContext, engine['systemState']);

      const analysis = analyzeDebugContext(debugContext);
      expect(analysis.healthTrend).toBe('degrading');
      expect(analysis.recommendations).toContain(
        'Implement additional health preservation measures'
      );
    });

    it('tracks recovery from degradation', () => {
      // Record degraded health
      engine['systemState'].health = 0.5;
      recordHealthCheck(debugContext, engine['systemState']);
      
      // Simulate recovery
      engine['systemState'].health = 1;
      recordHealthCheck(debugContext, engine['systemState']);

      const analysis = analyzeDebugContext(debugContext);
      expect(analysis.healthTrend).toBe('improving');
    });
  });

  describe('error prevention', () => {
    it('preserves context during errors', () => {
      const operation = () => {
        throw new Error('Test error');
      };

      expect(() => withDebugProtection(operation, debugContext)).toThrow();
      
      const analysis = analyzeDebugContext(debugContext);
      expect(analysis.errorCount).toBe(1);
      expect(debugContext.errors[0].message).toBe('Test error');
    });

    it('handles rapid state transitions', async () => {
      // Simulate rapid transitions
      for (let i = 0; i < 15; i++) {
        const before = { ...engine.currentFlow };
        engine.startFlow();
        const after = { ...engine.currentFlow };
        
        trackStateTransition(debugContext, before, after, 'startFlow');
        await wait(10);
      }

      const analysis = analyzeDebugContext(debugContext);
      expect(analysis.warnings).toContain('High transition frequency detected');
    });
  });

  describe('system coherence', () => {
    it('maintains debug context across operations', async () => {
      const operations = async () => {
        withDebugProtection(() => {
          engine.startFlow();
          recordHealthCheck(debugContext, engine['systemState']);
        }, debugContext);

        await wait(100);

        withDebugProtection(() => {
          engine.maintainFlow();
          recordHealthCheck(debugContext, engine['systemState']);
        }, debugContext);

        await wait(100);

        withDebugProtection(() => {
          engine.endFlow();
          recordHealthCheck(debugContext, engine['systemState']);
        }, debugContext);
      };

      await operations();

      const analysis = analyzeDebugContext(debugContext);
      expect(analysis.errorCount).toBe(0);
      expect(debugContext.healthChecks.length).toBe(3);
      expect(debugContext.transitions.length).toBe(0); // We didn't track these transitions
    });
  });
}); 