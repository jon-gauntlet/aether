import { StateManager } from '../StateManager';
import { SystemMeta, State, Flow, Field } from '../../types/consciousness';

type DoneCallback = (error?: any) => void;

describe('StateManager', () => {
  let manager: StateManager;
  const meta: SystemMeta = {
    baseFrequency: 1,
    baseAmplitude: 1,
    baseHarmony: 1,
    baseProtection: {
      strength: 1,
      resilience: 1,
      adaptability: 1
    }
  };

  beforeEach(() => {
    manager = new StateManager(meta);
  });

  afterEach(() => {
    manager.destroy();
  });

  it('should create initial state with natural values', (done: DoneCallback) => {
    manager.observe().subscribe(state => {
      expect(state).toBeDefined();
      expect(state.resonance.frequency).toBe(meta.baseFrequency);
      expect(state.resonance.amplitude).toBe(meta.baseAmplitude);
      expect(state.coherence).toBe(1);
      done();
    });
  });

  it('should maintain harmonic balance', (done: DoneCallback) => {
    // Subscribe to state changes
    manager.observe().subscribe(state => {
      expect(state.resonance.harmony).toBeGreaterThan(0);
      expect(state.resonance.harmony).toBeLessThanOrEqual(1);
      done();
    });

    // Trigger state transition
    manager.transition({
      resonance: {
        frequency: 2,
        amplitude: 1.5,
        harmony: 0.8,
        field: {
          center: { x: 0, y: 0, z: 0 },
          radius: 1,
          strength: 1,
          waves: []
        }
      }
    });
  });

  it('should observe flow patterns', (done: DoneCallback) => {
    const flow: Flow = {
      pace: 0.8,
      adaptability: 0.9,
      emergence: 0.7,
      balance: 0
    };

    manager.observeFlow().subscribe(currentFlow => {
      expect(currentFlow.balance).toBeCloseTo(0.8, 1);
      done();
    });

    manager.transition({ flow });
  });

  it('should observe energy fields', (done: DoneCallback) => {
    const field: Field = {
      center: { x: 1, y: 1, z: 1 },
      radius: 2,
      strength: 1.5,
      waves: []
    };

    manager.observeField().subscribe(currentField => {
      expect(currentField.center).toEqual(field.center);
      expect(currentField.radius).toBe(field.radius);
      expect(currentField.strength).toBe(field.strength);
      done();
    });

    manager.transition({
      resonance: {
        frequency: 1,
        amplitude: 1,
        harmony: 1,
        field
      }
    });
  });

  it('should maintain coherence during transitions', (done: DoneCallback) => {
    let lastCoherence = 1;

    manager.observe().subscribe(state => {
      expect(state.coherence).toBeGreaterThan(0);
      expect(Math.abs(state.coherence - lastCoherence)).toBeLessThan(0.5);
      lastCoherence = state.coherence;
      done();
    });

    manager.transition({
      energy: 0.5,
      presence: 0.8,
      depth: {
        level: 2,
        clarity: 0.7,
        stillness: 0.9,
        presence: 0.8
      }
    });
  });
}); 