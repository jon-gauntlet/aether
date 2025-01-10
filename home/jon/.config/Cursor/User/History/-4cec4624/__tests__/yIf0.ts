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

    it('should emit state update on mode change', (done) => {
      engine.observeState().pipe(
        take(2),
        toArray()
      ).subscribe((updates: NaturalFlow[]) => {
        expect(updates[0].type).toBe('natural');
        expect(updates[1].type).toBe('guided');
        done();
      });

      engine.setMode('guided');
    });
  });

  describe('observables', () => {
    it('should emit depth changes', (done) => {
      engine.observeDepth().subscribe(depth => {
        expect(depth).toBe(0.8);
        done();
      });
    });

    it('should emit energy changes', (done) => {
      engine.observeEnergy().subscribe(energy => {
        expect(energy).toBe(0.8);
        done();
      });
    });

    it('should emit focus changes', (done) => {
      engine.observeFocus().subscribe(focus => {
        const expectedFocus = (engine.metrics.presence + engine.metrics.coherence) / 2;
        expect(focus).toBe(expectedFocus);
        done();
      });
    });

    it('should emit multiple state updates', (done) => {
      engine.observeState().pipe(
        take(3),
        toArray()
      ).subscribe((states: NaturalFlow[]) => {
        expect(states.map(s => s.type)).toEqual(['natural', 'guided', 'resonant']);
        done();
      });

      engine.setMode('guided');
      engine.setMode('resonant');
    });
  });

  describe('stream management', () => {
    const streamId = 'test-stream';

    beforeEach(() => {
      engine = new FlowEngine();
    });

    it('should handle stream observation', (done) => {
      engine.observe(streamId).subscribe(stream => {
        expect(stream).toBeUndefined();
        done();
      });
    });

    it('should handle stream notifications', () => {
      const timestamp = engine.timestamp;
      engine.notice(streamId, 'test');
      expect(engine.timestamp).toBeGreaterThan(timestamp);
    });

    it('should handle stream additions', () => {
      const timestamp = engine.timestamp;
      engine.add(streamId, []);
      expect(engine.timestamp).toBeGreaterThan(timestamp);
    });

    it('should handle stream wake', () => {
      const timestamp = engine.timestamp;
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
      expect(engineWithStreams.streams.get(stream1)).not.toBe(engineWithStreams.streams.get(stream2));
    });

    it('should update streams atomically', () => {
      const updates: number[] = [];
      const timestamp = engine.timestamp;

      engine.observe(streamId).subscribe(() => {
        updates.push(engine.timestamp);
      });

      engine.add(streamId, []);
      engine.notice(streamId, 'test');
      engine.wake(streamId);

      expect(updates.every(t => t > timestamp)).toBe(true);
      expect(new Set(updates).size).toBe(updates.length); // All timestamps unique
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