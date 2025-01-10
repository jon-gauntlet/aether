/// <reference types="vitest" />
/// <reference types="@testing-library/jest-dom" />

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { StateManager } from '../StateManager';
import { SystemMeta, Flow, Field } from '../../types/consciousness';
import { BehaviorSubject } from 'rxjs';
import { Stream } from '../../types/stream';
import '@testing-library/jest-dom';

describe('StateManager', () => {
  let manager: StateManager;
  const meta: SystemMeta = {
    baseFrequency: 1,
    baseAmplitude: 1,
    baseHarmony: 1,
    baseProtection: {
      strength: 0.8,
      level: 0.7,
      resilience: 0.9,
      adaptability: 0.8,
      field: {
        center: { x: 0, y: 0, z: 0 },
        radius: 1,
        strength: 1,
        waves: []
      }
    }
  };

  beforeEach(() => {
    manager = new StateManager(meta);
  });

  afterEach(() => {
    manager.destroy();
  });

  it('should create initial state with natural values', () => {
    return new Promise<void>(resolve => {
      let isFirstUpdate = true;
      manager.observe().subscribe(state => {
        if (isFirstUpdate && state.resonance) {
          isFirstUpdate = false;
          expect(state).toBeDefined();
          expect(state.resonance.frequency).toBe(meta.baseFrequency);
          expect(state.resonance.amplitude).toBe(meta.baseAmplitude);
          expect(state.coherence).toBe(1);
          resolve();
        }
      });
    });
  });

  it('should maintain harmonic balance', () => {
    return new Promise<void>(resolve => {
      let isFirstUpdate = true;
      manager.observe().subscribe(state => {
        if (isFirstUpdate && state.resonance) {
          isFirstUpdate = false;
          expect(state.resonance.harmony).toBeGreaterThan(0);
          expect(state.resonance.harmony).toBeLessThanOrEqual(1);
          resolve();
        }
      });

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
          },
          essence: 0.9
        }
      });
    });
  });

  it('should observe flow patterns', () => {
    return new Promise<void>(resolve => {
      const flow: Flow = {
        type: 'natural',
        metrics: {
          depth: 0.8,
          harmony: 0.9,
          energy: 0.7,
          presence: 0.8,
          resonance: 0.9,
          coherence: 0.8,
          rhythm: 0.7
        },
        presence: 0.8,
        harmony: 0.9,
        rhythm: 0.7,
        resonance: 0.9,
        coherence: 0.8,
        timestamp: Date.now(),
        observe: () => new BehaviorSubject<Stream | undefined>(undefined),
        notice: () => {},
        add: () => {},
        wake: () => {}
      };

      let isFirstUpdate = true;
      manager.observeFlow().subscribe(currentFlow => {
        if (isFirstUpdate) {
          isFirstUpdate = false;
          expect(currentFlow.coherence).toBeCloseTo(0.8, 1);
          resolve();
        }
      });

      manager.transition({ flow });
    });
  });

  it('should observe energy fields', () => {
    return new Promise<void>(resolve => {
      const field: Field = {
        center: { x: 0, y: 0, z: 0 },
        radius: 1,
        strength: 1,
        waves: []
      };

      let isFirstUpdate = true;
      manager.observeField().subscribe(currentField => {
        if (isFirstUpdate) {
          isFirstUpdate = false;
          expect(currentField.center).toEqual(field.center);
          expect(currentField.radius).toBe(field.radius);
          expect(currentField.strength).toBe(field.strength);
          resolve();
        }
      });

      manager.transition({
        resonance: {
          frequency: 1,
          amplitude: 1,
          harmony: 1,
          field: {
            center: { x: 0, y: 0, z: 0 },
            radius: 1,
            strength: 1,
            waves: []
          },
          essence: 1
        }
      });
    });
  });

  it('should maintain coherence during transitions', () => {
    return new Promise<void>(resolve => {
      let lastCoherence = 1;
      let isFirstUpdate = true;

      manager.observe().subscribe(state => {
        if (isFirstUpdate && state.coherence !== undefined) {
          isFirstUpdate = false;
          expect(state.coherence).toBeGreaterThan(0);
          expect(Math.abs(state.coherence - lastCoherence)).toBeLessThan(0.5);
          lastCoherence = state.coherence;
          resolve();
        }
      });

      manager.transition({
        energy: {
          level: 0.5,
          capacity: 1.0,
          flow: 0.8,
          stability: 0.9,
          quality: 0.7,
          protection: 0.8,
          resonance: {
            frequency: 0.8,
            amplitude: 0.7,
            harmony: 0.9,
            field: {
              center: { x: 0, y: 0, z: 0 },
              radius: 1,
              strength: 1,
              waves: []
            },
            essence: 0.8
          },
          field: {
            center: { x: 0, y: 0, z: 0 },
            radius: 1,
            strength: 1,
            waves: []
          },
          recovery: 0.7,
          reserves: 0.6,
          timestamp: Date.now()
        },
        flow: {
          type: 'natural',
          metrics: {
            depth: 0.8,
            harmony: 0.8,
            energy: 0.8,
            presence: 0.8,
            resonance: 0.8,
            coherence: 0.8,
            rhythm: 0.8
          },
          presence: 0.8,
          harmony: 0.8,
          rhythm: 0.8,
          resonance: 0.8,
          coherence: 0.8,
          timestamp: Date.now()
        },
        depth: 0.8
      });
    });
  });
});