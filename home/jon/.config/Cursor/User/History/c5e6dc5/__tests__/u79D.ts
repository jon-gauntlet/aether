import { BehaviorSubject } from 'rxjs';
import { ConsciousnessState, MindSpace, Resonance, Connection, Field, Wave, Protection } from '../../types/base';
import { PresenceSystem } from '../PresenceSystem';
import { MindSpaceImpl } from '../MindSpace';
import { createDefaultField } from '../../factories/field';
import { createEmptyNaturalFlow } from '../../factories/flow';

describe('ConsciousnessSystem', () => {
  let presenceSystem: PresenceSystem;
  let mindSpace: MindSpaceImpl;

  beforeEach(() => {
    presenceSystem = new PresenceSystem();
    mindSpace = new MindSpaceImpl('test-space');
  });

  describe('evolution', () => {
    it('deepens with presence', () => {
      const presence = { type: 'active', intensity: 0.8 };
      const state = presenceSystem.evolve(presence);
      expect(state.depth).toBeGreaterThan(0);
      expect(state.resonance.harmony).toBeGreaterThan(0);
    });

    it('strengthens resonance over time', async () => {
      const presence = { type: 'active', intensity: 0.8 };
      const initialState = presenceSystem.evolve(presence);
      await new Promise(resolve => setTimeout(resolve, 10));
      const nextState = presenceSystem.evolve(presence);
      expect(nextState.resonance.harmony).toBeGreaterThan(initialState.resonance.harmony);
    });

    it('adapts to patterns', () => {
      const presence = { type: 'active', intensity: 0.8 };
      const state = presenceSystem.evolve(presence);
      expect(state.patterns).toBeDefined();
      expect(state.patterns!.length).toBeGreaterThan(0);
    });
  });

  describe('protection', () => {
    it('scales with depth', () => {
      const depth = { presence: 0.8, stillness: 0.5, clarity: 0.7 };
      const protection = presenceSystem.protect(depth);
      expect(protection.coherence).toBeGreaterThan(0);
      expect(protection.flexibility).toBeLessThan(1);
      expect(protection.recovery).toBeGreaterThan(0);
    });

    it('maintains flexibility inversely with stillness', () => {
      const lowStillness = { presence: 0.8, stillness: 0.2, clarity: 0.7 };
      const highStillness = { presence: 0.8, stillness: 0.8, clarity: 0.7 };
      
      const lowProtection = presenceSystem.protect(lowStillness);
      const highProtection = presenceSystem.protect(highStillness);
      
      expect(lowProtection.flexibility).toBeGreaterThan(highProtection.flexibility);
    });

    it('increases recovery with clarity', () => {
      const lowClarity = { presence: 0.8, stillness: 0.5, clarity: 0.3 };
      const highClarity = { presence: 0.8, stillness: 0.5, clarity: 0.9 };
      
      const lowProtection = presenceSystem.protect(lowClarity);
      const highProtection = presenceSystem.protect(highClarity);
      
      expect(highProtection.recovery).toBeGreaterThan(lowProtection.recovery);
    });
  });

  describe('mind space', () => {
    it('forms deep pools with sustained presence', async () => {
      const presence = { type: 'deep', intensity: 0.9 };
      await mindSpace.sustain(presence, 100);
      const pools = mindSpace.getPools();
      expect(pools.length).toBeGreaterThan(0);
      expect(pools[0].depth).toBeGreaterThan(0.5);
    });

    it('channels focused interest into active streams', () => {
      const interest = { topic: 'test', intensity: 0.8 };
      mindSpace.focus(interest);
      const streams = mindSpace.getStreams();
      expect(streams.length).toBeGreaterThan(0);
      expect(streams[0].activity).toBeGreaterThan(0.5);
    });

    it('preserves wisdom in quiet spaces', async () => {
      const wisdom = { insight: 'test', value: 0.9 };
      await mindSpace.preserve(wisdom);
      const spaces = mindSpace.getQuietSpaces();
      expect(spaces.length).toBeGreaterThan(0);
      expect(spaces[0].wisdom).toBeDefined();
    });

    it('strengthens connections through resonance', async () => {
      const source = mindSpace.createSpace('source');
      const target = mindSpace.createSpace('target');
      
      await mindSpace.connect(target.id);
      const connection = mindSpace.getConnection(source.id, target.id);
      
      expect(connection).toBeDefined();
      expect(connection!.strength).toBeGreaterThan(0);
    });
  });
});