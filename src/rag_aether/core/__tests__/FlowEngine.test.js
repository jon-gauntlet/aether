import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { FlowEngine } from '../experience/FlowEngine'
import { 
  createMockFlowState,
  validateSystemHealth,
  verifyFlowTransition,
  withFlowProtection,
  wait
} from './utils/test-utils'

/**
 * FlowState represents the current flow state with:
 * - active: whether flow is active
 * - intensity: flow intensity level
 * - quality: flow quality metric
 * - duration: time in flow state
 */

describe('FlowEngine', () => {
  let engine;
  const mockNow = 1736813549127;

  beforeEach(() => {
    vi.spyOn(Date, 'now').mockImplementation(() => mockNow);
    engine = new FlowEngine();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initialization', () => {
    it('initializes with healthy default state', () => {
      const flow = engine.currentFlow;
      expect(flow).toEqual(createMockFlowState());
      validateSystemHealth(engine.systemState);
    });
  });

  describe('flow state management', () => {
    it('starts flow with proper intensity', async () => {
      const before = { ...engine.currentFlow };
      engine.startFlow();
      
      verifyFlowTransition(before, engine.currentFlow, {
        active: true,
        intensity: 0.8
      });
    });

    it('maintains flow quality over time', async () => {
      engine.startFlow();
      const initial = { ...engine.currentFlow };

      // Simulate time passage
      await wait(100);
      vi.spyOn(Date, 'now').mockImplementation(() => mockNow + 1000);
      engine.maintainFlow();

      verifyFlowTransition(initial, engine.currentFlow, {
        duration: 1
      });
      expect(engine.currentFlow.quality).toBeGreaterThan(0);
    });

    it('preserves context during flow', async () => {
      const context = {
        task: 'Test task',
        priority: 'high'
      };

      engine.startFlow(context);
      await wait(50);

      expect(engine.currentFlow.context).toEqual(context);
      expect(engine.currentFlow.contextPreserved).toBe(true);
    });
  });

  describe('flow transitions', () => {
    it('handles smooth transitions', async () => {
      engine.startFlow();
      const initial = { ...engine.currentFlow };

      await wait(100);
      vi.spyOn(Date, 'now').mockImplementation(() => mockNow + 1000);
      engine.adjustFlow({ intensity: 0.9 });

      verifyFlowTransition(initial, engine.currentFlow, {
        intensity: 0.9,
        transitionCount: 1
      });
    });

    it('recovers from interruptions', async () => {
      engine.startFlow();
      await wait(50);
      engine.interrupt();
      await wait(50);
      engine.resume();

      expect(engine.currentFlow.recoveryCount).toBe(1);
      expect(engine.currentFlow.quality).toBeGreaterThan(0.5);
    });
  });

  describe('flow optimization', () => {
    it('optimizes based on patterns', async () => {
      const operations = async () => {
        engine.startFlow();
        await wait(50);
        engine.maintainFlow();
        await wait(50);
        engine.adjustFlow({ intensity: 0.9 });
      };

      await operations();
      const patterns = engine.analyzePatterns();

      expect(patterns.length).toBeGreaterThan(0);
      expect(patterns[0].efficiency).toBeGreaterThan(0.7);
    });

    it('suggests improvements', () => {
      engine.startFlow();
      const suggestions = engine.getSuggestions();

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0]).toMatch(/flow/i);
    });
  });
}); 