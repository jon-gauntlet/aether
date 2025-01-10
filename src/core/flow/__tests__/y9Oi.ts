/// <reference types="vitest" />
/// <reference types="@testing-library/jest-dom" />

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { StateManager } from '../StateManager';
import { SystemMeta, Flow, Field } from '../../types/consciousness';
import { BehaviorSubject } from 'rxjs';
import { Stream } from '../../types/stream';
import '@testing-library/jest-dom';
import { ConsciousnessState, SystemMeta, Field, NaturalFlow, Protection } from '../../types/base';
import { createDefaultField } from '../../factories/field';
import { createEmptyNaturalFlow } from '../../factories/flow';

describe('StateManager', () => {
  let manager: StateManager;
  let meta: SystemMeta;

  beforeEach(() => {
    meta = {
      baseFrequency: 0.8,
      baseAmplitude: 0.8,
      baseHarmony: 0.8,
      baseProtection: {
        level: 0.8,
        strength: 0.8,
        resilience: 0.8,
        adaptability: 0.8,
        field: createDefaultField()
      }
    };
    manager = new StateManager(meta);
  });

  it('should initialize with default state', () => {
    return new Promise<void>(resolve => {
      manager.observe().subscribe(state => {
        expect(state).toBeDefined();
        expect(state.id).toBe('system');
        expect(state.type).toBe('individual');
        expect(state.space).toBeDefined();
        expect(state.space.metrics).toBeDefined();
        expect(state.space.resonance).toBeDefined();
        expect(state.space.protection).toBeDefined();
        expect(state.space.flow).toBeDefined();
        resolve();
      });
    });
  });

  it('should update state correctly', () => {
    return new Promise<void>(resolve => {
      const newFlow = createEmptyNaturalFlow();
      manager.updateState({ flow: newFlow });
      manager.observe().subscribe(state => {
        expect(state.flow).toEqual(newFlow);
        resolve();
      });
    });
  });

  it('should observe field changes', () => {
    return new Promise<void>(resolve => {
      const field = createDefaultField();
      let observedField: Field | undefined;
      
      manager.observeField().subscribe(f => {
        observedField = f;
        expect(observedField).toBeDefined();
        expect(observedField?.center).toBeDefined();
        expect(observedField?.radius).toBeDefined();
        expect(observedField?.strength).toBeDefined();
        expect(observedField?.waves).toBeDefined();
        resolve();
      });
    });
  });
});