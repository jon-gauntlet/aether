import { FlowEngine } from '../FlowEngine';
import { NaturalFlowType, NaturalFlow } from '../../types/base';
import { BehaviorSubject } from 'rxjs';
import { take, toArray } from 'rxjs/operators';

describe('FlowEngine', () => {
  let engine: FlowEngine;

  beforeEach(() => {
    engine = new FlowEngine();
  });

  describe('initialization', () => {
    it('should initialize with default values', () => {
      expect(engine.type).toBe('natural');
      expect(engine.metrics).toEqual({
        depth: 0.8,
        harmony: 0.8,
        energy: 0.8,
        presence: 0.8,
        resonance: 0.8,
        coherence: 0.8,
        rhythm: 0.8,
      });
    });

    it('should initialize with custom values', () => {
      const customEngine = new FlowEngine({
        type: 'guided',
        depth: 0.5,
        harmony: 0.6,
        energy: 0.7,
      });

      expect(customEngine.type).toBe('guided');
      expect(customEngine.metrics.depth).toBe(0.5);
      expect(customEngine.metrics.harmony).toBe(0.6);
      expect(customEngine.metrics.energy).toBe(0.7);
    });

    it('should initialize with partial custom values', () => {
      const customEngine = new FlowEngine({
        type: 'resonant',
        depth: 0.5,
      });

      expect(customEngine.type).toBe('resonant');
      expect(customEngine.metrics.depth).toBe(0.5);
      expect(customEngine.metrics.harmony).toBe(0.8); // Default value
    });
  });

  describe('setMode', () => {
    it('should update flow type', () => {
      const modes: NaturalFlowType[] = ['natural', 'guided', 'resonant'];
      
      modes.forEach(mode => {
        engine.setMode(mode);
        expect(engine.type).toBe(mode);
      });
    });

    it('should emit state update on mode change', async () => {
      // Initialize with natural mode
      engine = new FlowEngine({ type: 'natural' });
      
      const promise = engine.observeState().pipe(
        take(2),
        toArray()
      ).toPromise();

      await new Promise(resolve => setTimeout(resolve, 1));
      engine.setMode('guided');
      
      const states = (await promise)!;
      expect(states[0].type).toBe('natural');
      expect(states[1].type).toBe('guided');
    });
  });

  describe('observables', () => {
    it('should emit depth changes', async () => {
      const depth = await engine.observeDepth().pipe(take(1)).toPromise();
      expect(depth).toBe(0.8);
    });

    it('should emit energy changes', async () => {
      const energy = await engine.observeEnergy().pipe(take(1)).toPromise();
      expect(energy).toBe(0.8);
    });

    it('should emit focus changes', async () => {
      const focus = await engine.observeFocus().pipe(take(1)).toPromise();
      const expectedFocus = (engine.metrics.presence + engine.metrics.coherence) / 2;
      expect(focus).toBe(expectedFocus);
    });

    it('should emit multiple state updates', async () => {
      // Initialize with natural mode
      engine = new FlowEngine({ type: 'natural' });
      
      const promise = engine.observeState().pipe(
        take(3),
        toArray()
      ).toPromise();

      await new Promise(resolve => setTimeout(resolve, 1));
      engine.setMode('guided');
      await new Promise(resolve => setTimeout(resolve, 1));
      engine.setMode('resonant');
      
      const states = (await promise)!;
      expect(states.map(s => s.type)).toEqual(['natural', 'guided', 'resonant']);
    });
  });

  describe('stream management', () => {
    const streamId = 'test-stream';

    beforeEach(() => {
      engine = new FlowEngine();
    });

    it('should handle stream observation', async () => {
      const stream = await engine.observe(streamId).pipe(take(1)).toPromise();
      expect(stream).toBeUndefined();
    });

    it('should handle stream notifications', async () => {
      const timestamp = engine.timestamp;
      await new Promise(resolve => setTimeout(resolve, 1));
      engine.notice(streamId, 'test');
      expect(engine.timestamp).toBeGreaterThan(timestamp);
    });

    it('should handle stream additions', async () => {
      const timestamp = engine.timestamp;
      await new Promise(resolve => setTimeout(resolve, 1));
      engine.add(streamId, []);
      expect(engine.timestamp).toBeGreaterThan(timestamp);
    });

    it('should handle stream wake', async () => {
      const timestamp = engine.timestamp;
      await new Promise(resolve => setTimeout(resolve, 1));
      engine.wake(streamId);
      expect(engine.timestamp).toBeGreaterThan(timestamp);
    });

    it('should maintain separate streams', () => {
      const stream1 = 'stream-1';
      const stream2 = 'stream-2';

      engine.add(stream1, [{ type: 'test', value: 1 }]);
      engine.add(stream2, [{ type: 'test', value: 2 }]);

      // Access protected streams through type assertion
      const engineWithStreams = engine as unknown as { streams: Map<string, unknown> };
      const stream1Data = engineWithStreams.streams.get(stream1);
      const stream2Data = engineWithStreams.streams.get(stream2);
      expect(stream1Data).toBeDefined();
      expect(stream2Data).toBeDefined();
      expect(stream1Data).not.toBe(stream2Data);
    });

    it('should update streams atomically', async () => {
      const timestamp = engine.timestamp;

      const promise = engine.observe(streamId).pipe(
        take(3),
        toArray()
      ).toPromise();

      await new Promise(resolve => setTimeout(resolve, 1));
      engine.add(streamId, []);
      await new Promise(resolve => setTimeout(resolve, 1));
      engine.notice(streamId, 'test');
      await new Promise(resolve => setTimeout(resolve, 1));
      engine.wake(streamId);

      const states = (await promise)!;
      const stateTimestamps = states.map(state => state?.timestamp ?? 0);
      expect(stateTimestamps.every(t => t > timestamp)).toBe(true);
      expect(new Set(stateTimestamps).size).toBe(stateTimestamps.length); // All timestamps unique
    });
  });

  describe('error handling', () => {
    it('should handle invalid stream operations gracefully', () => {
      expect(() => engine.add('', [])).not.toThrow();
      expect(() => engine.notice('', '')).not.toThrow();
      expect(() => engine.wake('')).not.toThrow();
    });

    it('should maintain state consistency on errors', () => {
      const initialState = { ...engine.metrics };
      
      try {
        engine.add('', [{ invalid: true }]);
      } catch (e) {
        // Should maintain original state
        expect(engine.metrics).toEqual(initialState);
      }
    });
  });
}); 