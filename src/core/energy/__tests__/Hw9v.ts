import { jest, expect, describe, it, beforeEach } from '@jest/globals';
import { ConsciousnessState, MindSpace, Resonance, Depth, Connection, Field, Wave } from '../../types/consciousness';
import { PresenceSystem } from '../PresenceSystem';
import { ThoughtStreamSystem } from '../ThoughtStream';
import { MindSpaceSystem } from '../MindSpace';
import { EnergySystem } from '../EnergySystem';

// Custom matchers
declare global {
  namespace jest {
    interface Matchers<R, T> {
      toHaveResonance(): R;
      toHaveDepth(): R;
      toBeWithinRange(min: number, max: number): R;
    }
  }
}

expect.extend({
  toHaveResonance(received: any) {
    const hasResonance = received && 
      received.resonance && 
      typeof received.resonance.harmony === 'number';
    return {
      message: () => `expected ${received} to have resonance`,
      pass: hasResonance
    };
  },
  toHaveDepth(received: any) {
    const hasDepth = received && 
      typeof received.depth === 'number';
    return {
      message: () => `expected ${received} to have depth`,
      pass: hasDepth
    };
  },
  toBeWithinRange(received: number, min: number, max: number) {
    const pass = received >= min && received <= max;
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${min}-${max}`,
        pass: true
      };
    } else {
      return {
        message: () => `expected ${received} to be within range ${min}-${max}`,
        pass: false
      };
    }
  }
});

describe('Consciousness System Integration', () => {
  let presenceSystem: PresenceSystem;
  let thoughtStreamSystem: ThoughtStreamSystem;
  let mindSpaceSystem: MindSpaceSystem;
  let energySystem: EnergySystem;

  beforeEach(() => {
    presenceSystem = new PresenceSystem();
    thoughtStreamSystem = new ThoughtStreamSystem();
    mindSpaceSystem = new MindSpaceSystem();
    energySystem = new EnergySystem();
  });

  describe('Natural Flow', () => {
    it('should maintain presence in flow state', async () => {
      // Create a flow space
      const space = mindSpaceSystem.createSpace('flow-1');
      
      // Enter flow state
      presenceSystem.enter('presence-1', space);
      
      // Create thought stream
      thoughtStreamSystem.create('stream-1', space);
      
      // Initialize energy
      const energyState = energySystem.initialize('energy-1');
      
      // Wait for natural evolution
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Observe states
      const presenceState = await new Promise(resolve => {
        presenceSystem.observe('presence-1').subscribe(state => {
          resolve(state);
        });
      });
      
      const thoughtState = await new Promise(resolve => {
        thoughtStreamSystem.observe('stream-1').subscribe(state => {
          resolve(state);
        });
      });
      
      const spaceState = await new Promise(resolve => {
        mindSpaceSystem.observe('flow-1').subscribe(state => {
          resolve(state);
        });
      });
      
      const energyStateUpdated = await new Promise(resolve => {
        energySystem.observe('energy-1').subscribe(state => {
          resolve(state);
        });
      });
      
      // Verify natural flow properties
      expect(presenceState).toHaveResonance();
      expect(presenceState).toHaveDepth();
      expect(thoughtState).toHaveResonance();
      expect(thoughtState).toHaveDepth();
      expect(spaceState).toHaveResonance();
      expect(spaceState).toHaveDepth();
      expect(energyStateUpdated).toBeDefined();
      
      // Verify resonance harmony
      const presenceResonance = (presenceState as any).resonance;
      const thoughtResonance = (thoughtState as any).resonance;
      const spaceResonance = (spaceState as any).resonance;
      const energyResonance = (energyStateUpdated as any).resonance;
      
      expect(presenceResonance.harmony).toBeWithinRange(0.7, 1);
      expect(thoughtResonance.harmony).toBeWithinRange(0.7, 1);
      expect(spaceResonance.harmony).toBeWithinRange(0.7, 1);
      expect(energyResonance.harmony).toBeWithinRange(0.7, 1);
    });

    it('should protect deep focus state from disturbances', async () => {
      // Create a focus space
      const space = mindSpaceSystem.createSpace('focus-1');
      
      // Enter deep state
      presenceSystem.enter('presence-2', space);
      
      // Create focused thought stream
      thoughtStreamSystem.create('stream-2', space);
      
      // Initialize focused energy
      const energyState = energySystem.initialize('energy-2');
      
      // Wait for protection to build
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Create disturbance
      const disturbance = {
        type: 'notification' as const,
        intensity: 0.5,
        source: 'test',
        resonance: {
          frequency: 0.8,
          amplitude: 0.9,
          harmony: 0.5,
          field: {
            center: { x: 0, y: 0, z: 0 },
            radius: 1,
            strength: 0.8,
            waves: []
          } as Field
        } as Resonance
      };
      
      // Test disturbance handling
      const breaksThrough = presenceSystem.handleDisturbance('presence-2', disturbance);
      
      // Verify protection
      expect(breaksThrough).toBe(false);
      
      const presenceState = await new Promise(resolve => {
        presenceSystem.observe('presence-2').subscribe(state => {
          resolve(state);
        });
      });
      
      expect((presenceState as any).protection.strength).toBeWithinRange(0.7, 1);
    });

    it('should form natural connections between resonant spaces', async () => {
      // Create two resonant spaces
      const spaceA = mindSpaceSystem.createSpace('space-a');
      const spaceB = mindSpaceSystem.createSpace('space-b');
      
      // Initialize presence in both spaces
      presenceSystem.enter('presence-a', spaceA);
      presenceSystem.enter('presence-b', spaceB);
      
      // Create thought streams
      thoughtStreamSystem.create('stream-a', spaceA);
      thoughtStreamSystem.create('stream-b', spaceB);
      
      // Initialize energy
      energySystem.initialize('energy-a');
      energySystem.initialize('energy-b');
      
      // Connect spaces
      mindSpaceSystem.connect('space-a', 'space-b');
      
      // Wait for natural evolution
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Verify connections
      const connectionsA = await new Promise(resolve => {
        mindSpaceSystem.observe('space-a').subscribe(space => {
          resolve(space.connections);
        });
      });
      
      expect(Array.isArray(connectionsA)).toBe(true);
      expect((connectionsA as Connection[]).length).toBeGreaterThan(0);
      
      const connection = (connectionsA as Connection[])[0];
      expect(connection.strength).toBeWithinRange(0.7, 1);
    });
  });
}); 