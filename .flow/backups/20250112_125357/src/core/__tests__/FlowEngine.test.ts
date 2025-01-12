import { FlowEngine } from '../experience/FlowEngine';
import { 
  createMockFlowState,
  validateSystemHealth,
  verifyFlowTransition,
  withFlowProtection,
  wait
} from './utils/test-utils';

describe('FlowEngine', () => {
  let engine: FlowEngine;

  beforeEach(() => {
    engine = new FlowEngine();
  });

  describe('initialization', () => {
    it('initializes with healthy default state', () => {
      const flow = engine.currentFlow;
      expect(flow).toEqual(createMockFlowState());
      validateSystemHealth(engine['systemState']);
    });
  });

  describe('flow state management', () => {
    it('starts flow with proper intensity', withFlowProtection(async () => {
      const before = { ...engine.currentFlow };
      engine.startFlow();
      
      verifyFlowTransition(before, engine.currentFlow, {
        active: true,
        intensity: 0.8
      });
    }));

    it('maintains flow quality over time', withFlowProtection(async () => {
      engine.startFlow();
      const initial = { ...engine.currentFlow };

      // Simulate time passage
      await wait(100);
      engine.maintainFlow();

      verifyFlowTransition(initial, engine.currentFlow, {
        duration: 1
      });
      expect(engine.currentFlow.quality).toBeGreaterThan(0);
    }));

    it('preserves context during flow', withFlowProtection(async () => {
      engine.startFlow();
      const before = engine['systemState'].context;
      
      await wait(100);
      engine.maintainFlow();
      const after = engine['systemState'].context;

      expect(after.flow).toBeDefined();
      expect(after.timestamp).toBeGreaterThan(before.timestamp || 0);
    }));

    it('ends flow gracefully', withFlowProtection(async () => {
      engine.startFlow();
      await wait(100);
      engine.maintainFlow();

      const finalState = engine.endFlow();
      expect(finalState.active).toBe(false);
      expect(finalState.duration).toBeGreaterThan(0);
      expect(engine.currentFlow).toEqual(createMockFlowState());
    }));
  });

  describe('quality monitoring', () => {
    it('calculates quality based on system health', () => {
      engine.startFlow();
      const quality = engine['calculateQuality']();
      expect(quality).toBeGreaterThanOrEqual(0);
      expect(quality).toBeLessThanOrEqual(1);
    });

    it('suggests breaks when quality drops', () => {
      const consoleSpy = jest.spyOn(console, 'log');
      
      // Simulate low energy state
      engine['systemState'].energy = 0.3;
      engine.startFlow();
      engine.maintainFlow();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('consider taking a break')
      );
      consoleSpy.mockRestore();
    });
  });

  describe('error handling', () => {
    it('handles maintain calls when not in flow', () => {
      expect(() => engine.maintainFlow()).not.toThrow();
      expect(engine.currentFlow.active).toBe(false);
    });

    it('preserves system health during errors', () => {
      const initial = { ...engine['systemState'] };
      
      // Simulate error condition
      engine['calculateQuality'] = () => { throw new Error('Test error'); };
      
      expect(() => engine.maintainFlow()).not.toThrow();
      validateSystemHealth(engine['systemState']);
      expect(engine['systemState'].health).toBeGreaterThanOrEqual(initial.health);
    });
  });

  describe('system integration', () => {
    it('maintains system coherence across operations', withFlowProtection(async () => {
      const operations = async () => {
        engine.startFlow();
        await wait(100);
        engine.maintainFlow();
        await wait(100);
        return engine.endFlow();
      };

      const finalState = await operations();
      expect(finalState.quality).toBeGreaterThan(0);
      validateSystemHealth(engine['systemState']);
    }));

    it('preserves context across state transitions', async () => {
      const states: any[] = [];
      
      engine.startFlow();
      states.push(engine['systemState'].context);
      
      await wait(100);
      engine.maintainFlow();
      states.push(engine['systemState'].context);
      
      engine.endFlow();
      states.push(engine['systemState'].context);

      // Verify context evolution
      expect(states[1].timestamp).toBeGreaterThan(states[0].timestamp);
      expect(states[2].timestamp).toBeGreaterThan(states[1].timestamp);
      expect(states.every(s => s.flow)).toBe(true);
    });
  });
}); 