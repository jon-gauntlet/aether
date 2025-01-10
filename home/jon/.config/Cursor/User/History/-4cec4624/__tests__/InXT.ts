import { describe, it, expect, beforeEach } from 'vitest';
import { FlowEngine } from '../FlowEngine';
import { Flow, FlowType } from '../../types/flow';
import { take, toArray } from 'rxjs/operators';

describe('FlowEngine', () => {
  let engine: FlowEngine;

  beforeEach(() => {
    engine = new FlowEngine('test');
  });

  describe('initialization', () => {
    it('should initialize with default values', async () => {
      const flow = await engine.observe().pipe(take(1)).toPromise();
      expect(flow).toBeDefined();
      if (!flow) throw new Error('Flow should be defined');
      
      expect(flow.state).toBe('natural');
      expect(flow.metrics.depth).toBe(1);
      expect(flow.metrics.harmony).toBe(1);
    });

    it('should initialize with custom values', async () => {
      const customEngine = new FlowEngine('custom');
      const flow = await customEngine.observe().pipe(take(1)).toPromise();
      expect(flow).toBeDefined();
      if (!flow) throw new Error('Flow should be defined');
      
      expect(flow.state).toBe('natural');
      expect(flow.metrics.depth).toBe(1);
      expect(flow.metrics.harmony).toBe(1);
    });
  });

  describe('setMode', () => {
    it('should update flow type', async () => {
      const modes: FlowType[] = ['natural', 'guided', 'resonant', 'protected'];
      
      for (const mode of modes) {
        engine.setMode(mode);
        const flow = await engine.observe().pipe(take(1)).toPromise();
        expect(flow?.state).toBe(mode);
      }
    });

    it('should emit state update on mode change', async () => {
      const states = await engine.observe().pipe(
        take(2),
        toArray()
      ).toPromise();

      engine.setMode('guided');
      
      expect(states).toBeDefined();
      if (!states) throw new Error('States should be defined');
      expect(states).toHaveLength(2);
      expect(states[0]?.state).toBe('natural');
      expect(states[1]?.state).toBe('guided');
    });
  });

  describe('metrics', () => {
    it('should maintain metrics during transitions', async () => {
      const initialFlow = await engine.measure();
      const initialMetrics = initialFlow.metrics;

      engine.setMode('guided');
      const updatedFlow = await engine.measure();

      expect(updatedFlow.metrics.depth).toBe(initialMetrics.depth);
      expect(updatedFlow.metrics.harmony).toBe(initialMetrics.harmony);
    });

    it('should update coherence on transitions', async () => {
      const initialFlow = await engine.measure();
      const initialCoherence = initialFlow.metrics.coherence;

      await engine.transition('guided', 'test');
      const updatedFlow = await engine.measure();

      expect(updatedFlow.metrics.coherence).toBeGreaterThan(initialCoherence);
    });
  });

  describe('protection', () => {
    it('should increase protection on protect()', async () => {
      const initialFlow = await engine.measure();
      const initialProtection = initialFlow.protection.level;

      await engine.protect();
      const updatedFlow = await engine.measure();

      expect(updatedFlow.protection.level).toBeGreaterThan(initialProtection);
      expect(updatedFlow.state).toBe('protected');
    });
  });

  describe('deepening', () => {
    it('should increase depth on deepen()', async () => {
      const initialFlow = await engine.measure();
      const initialDepth = initialFlow.context.depth;
      const initialFocus = initialFlow.metrics.focus;

      await engine.deepen();
      const updatedFlow = await engine.measure();

      expect(updatedFlow.context.depth).toBeGreaterThan(initialDepth);
      expect(updatedFlow.metrics.focus).toBeGreaterThan(initialFocus);
    });
  });
}); 