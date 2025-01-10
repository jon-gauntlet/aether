import { FlowEngine } from '../FlowEngine';
import { NaturalFlowType } from '../../types/base';

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
  });

  describe('setMode', () => {
    it('should update flow type', () => {
      const modes: NaturalFlowType[] = ['natural', 'guided', 'resonant'];
      
      modes.forEach(mode => {
        engine.setMode(mode);
        expect(engine.type).toBe(mode);
      });
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
        // Focus is average of presence and coherence
        const expectedFocus = (engine.metrics.presence + engine.metrics.coherence) / 2;
        expect(focus).toBe(expectedFocus);
        done();
      });
    });
  });

  describe('stream management', () => {
    const streamId = 'test-stream';

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
  });
}); 