import { jest, expect, describe, it, beforeEach } from '@jest/globals';
import { ConsciousnessState, MindSpace, Resonance, Depth, Connection, Field, Wave } from '../../types/consciousness';
import { PresenceSystem } from '../PresenceSystem';
import { ThoughtStreamSystem, ThoughtState } from '../ThoughtStream';
import { MindSpaceSystem } from '../MindSpace';
import { EnergySystem, EnergyState } from '../EnergySystem';

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
      const presenceState = await new Promise<ConsciousnessState>(resolve => {
        presenceSystem.observe('presence-1').subscribe(state => {
          resolve(state);
        });
      });
      
      const thoughtState = await new Promise<ThoughtState>(resolve => {
        thoughtStreamSystem.observe('stream-1').subscribe(state => {
          resolve(state);
        });
      });
      
      const spaceState = await new Promise<MindSpace>(resolve => {
        mindSpaceSystem.observe('flow-1').subscribe(state => {
          resolve(state);
        });
      });
      
      const energyStateUpdated = await new Promise<EnergyState>(resolve => {
        energySystem.observe('energy-1').subscribe(state => {
          resolve(state);
        });
      });
      
      // Verify natural flow properties
      expect(presenceState).toBeDefined();
      expect(presenceState.resonance).toBeDefined();
      expect(presenceState.depth).toBeDefined();
      expect(thoughtState).toBeDefined();
      expect(thoughtState.resonance).toBeDefined();
      expect(thoughtState.depth).toBeDefined();
      expect(spaceState).toBeDefined();
      expect(spaceState.resonance).toBeDefined();
      expect(spaceState.depth).toBeDefined();
      expect(energyStateUpdated).toBeDefined();
      
      // Verify resonance harmony
      expect(presenceState.resonance.harmony).toBeGreaterThanOrEqual(0.7);
      expect(presenceState.resonance.harmony).toBeLessThanOrEqual(1);
      expect(thoughtState.resonance.harmony).toBeGreaterThanOrEqual(0.7);
      expect(thoughtState.resonance.harmony).toBeLessThanOrEqual(1);
      expect(spaceState.resonance.harmony).toBeGreaterThanOrEqual(0.7);
      expect(spaceState.resonance.harmony).toBeLessThanOrEqual(1);
      expect(energyStateUpdated.resonance.harmony).toBeGreaterThanOrEqual(0.7);
      expect(energyStateUpdated.resonance.harmony).toBeLessThanOrEqual(1);
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
      
      const presenceState = await new Promise<ConsciousnessState>(resolve => {
        presenceSystem.observe('presence-2').subscribe(state => {
          resolve(state);
        });
      });
      
      expect(presenceState.protection.strength).toBeGreaterThanOrEqual(0.7);
      expect(presenceState.protection.strength).toBeLessThanOrEqual(1);
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
      const connectionsA = await new Promise<Connection[]>(resolve => {
        mindSpaceSystem.observe('space-a').subscribe(space => {
          resolve(space.connections);
        });
      });
      
      expect(Array.isArray(connectionsA)).toBe(true);
      expect(connectionsA.length).toBeGreaterThan(0);
      
      const connection = connectionsA[0];
      expect(connection.strength).toBeGreaterThanOrEqual(0.7);
      expect(connection.strength).toBeLessThanOrEqual(1);
    });
  });
}); // Merged from 1_LfOS.ts
import { jest, expect, describe, it, beforeEach } from '@jest/globals';
import { ConsciousnessState, MindSpace, Resonance, Depth, Connection, Field, Wave } from '../../types/consciousness';
import { PresenceSystem } from '../PresenceSystem';
import { ThoughtStreamSystem, ThoughtState } from '../ThoughtStream';
import { MindSpaceSystem } from '../MindSpace';
import { EnergySystem, EnergyState } from '../EnergySystem';

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
      const presenceState = await new Promise<ConsciousnessState>(resolve => {
        presenceSystem.observe('presence-1').subscribe(state => {
          resolve(state);
        });
      });
      
      const thoughtState = await new Promise<ThoughtState>(resolve => {
        thoughtStreamSystem.observe('stream-1').subscribe(state => {
          resolve(state);
        });
      });
      
      const spaceState = await new Promise<MindSpace>(resolve => {
        mindSpaceSystem.observe('flow-1').subscribe(state => {
          resolve(state);
        });
      });
      
      const energyStateUpdated = await new Promise<EnergyState>(resolve => {
        energySystem.observe('energy-1').subscribe(state => {
          resolve(state);
        });
      });
      
      // Verify natural flow properties
      expect(presenceState).toBeDefined();
      expect(presenceState.resonance).toBeDefined();
      expect(presenceState.depth).toBeDefined();
      expect(thoughtState).toBeDefined();
      expect(thoughtState.resonance).toBeDefined();
      expect(thoughtState.depth).toBeDefined();
      expect(spaceState).toBeDefined();
      expect(spaceState.resonance).toBeDefined();
      expect(spaceState.depth).toBeDefined();
      expect(energyStateUpdated).toBeDefined();
      
      // Verify resonance harmony
      expect(presenceState.resonance.harmony).toBeGreaterThanOrEqual(0.7);
      expect(presenceState.resonance.harmony).toBeLessThanOrEqual(1);
      expect(thoughtState.resonance.harmony).toBeGreaterThanOrEqual(0.7);
      expect(thoughtState.resonance.harmony).toBeLessThanOrEqual(1);
      expect(spaceState.resonance.harmony).toBeGreaterThanOrEqual(0.7);
      expect(spaceState.resonance.harmony).toBeLessThanOrEqual(1);
      expect(energyStateUpdated.resonance.harmony).toBeGreaterThanOrEqual(0.7);
      expect(energyStateUpdated.resonance.harmony).toBeLessThanOrEqual(1);
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
      
      const presenceState = await new Promise<ConsciousnessState>(resolve => {
        presenceSystem.observe('presence-2').subscribe(state => {
          resolve(state);
        });
      });
      
      expect(presenceState.protection.strength).toBeGreaterThanOrEqual(0.7);
      expect(presenceState.protection.strength).toBeLessThanOrEqual(1);
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
      const connectionsA = await new Promise<Connection[]>(resolve => {
        mindSpaceSystem.observe('space-a').subscribe(space => {
          resolve(space.connections);
        });
      });
      
      expect(Array.isArray(connectionsA)).toBe(true);
      expect(connectionsA.length).toBeGreaterThan(0);
      
      const connection = connectionsA[0];
      expect(connection.strength).toBeGreaterThanOrEqual(0.7);
      expect(connection.strength).toBeLessThanOrEqual(1);
    });
  });
}); // Merged from 1_LfOS.ts
import { jest, expect, describe, it, beforeEach } from '@jest/globals';
import { ConsciousnessState, MindSpace, Resonance, Depth, Connection, Field, Wave } from '../../types/consciousness';
import { PresenceSystem } from '../PresenceSystem';
import { ThoughtStreamSystem, ThoughtState } from '../ThoughtStream';
import { MindSpaceSystem } from '../MindSpace';
import { EnergySystem, EnergyState } from '../EnergySystem';

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
      const presenceState = await new Promise<ConsciousnessState>(resolve => {
        presenceSystem.observe('presence-1').subscribe(state => {
          resolve(state);
        });
      });
      
      const thoughtState = await new Promise<ThoughtState>(resolve => {
        thoughtStreamSystem.observe('stream-1').subscribe(state => {
          resolve(state);
        });
      });
      
      const spaceState = await new Promise<MindSpace>(resolve => {
        mindSpaceSystem.observe('flow-1').subscribe(state => {
          resolve(state);
        });
      });
      
      const energyStateUpdated = await new Promise<EnergyState>(resolve => {
        energySystem.observe('energy-1').subscribe(state => {
          resolve(state);
        });
      });
      
      // Verify natural flow properties
      expect(presenceState).toBeDefined();
      expect(presenceState.resonance).toBeDefined();
      expect(presenceState.depth).toBeDefined();
      expect(thoughtState).toBeDefined();
      expect(thoughtState.resonance).toBeDefined();
      expect(thoughtState.depth).toBeDefined();
      expect(spaceState).toBeDefined();
      expect(spaceState.resonance).toBeDefined();
      expect(spaceState.depth).toBeDefined();
      expect(energyStateUpdated).toBeDefined();
      
      // Verify resonance harmony
      expect(presenceState.resonance.harmony).toBeGreaterThanOrEqual(0.7);
      expect(presenceState.resonance.harmony).toBeLessThanOrEqual(1);
      expect(thoughtState.resonance.harmony).toBeGreaterThanOrEqual(0.7);
      expect(thoughtState.resonance.harmony).toBeLessThanOrEqual(1);
      expect(spaceState.resonance.harmony).toBeGreaterThanOrEqual(0.7);
      expect(spaceState.resonance.harmony).toBeLessThanOrEqual(1);
      expect(energyStateUpdated.resonance.harmony).toBeGreaterThanOrEqual(0.7);
      expect(energyStateUpdated.resonance.harmony).toBeLessThanOrEqual(1);
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
      
      const presenceState = await new Promise<ConsciousnessState>(resolve => {
        presenceSystem.observe('presence-2').subscribe(state => {
          resolve(state);
        });
      });
      
      expect(presenceState.protection.strength).toBeGreaterThanOrEqual(0.7);
      expect(presenceState.protection.strength).toBeLessThanOrEqual(1);
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
      const connectionsA = await new Promise<Connection[]>(resolve => {
        mindSpaceSystem.observe('space-a').subscribe(space => {
          resolve(space.connections);
        });
      });
      
      expect(Array.isArray(connectionsA)).toBe(true);
      expect(connectionsA.length).toBeGreaterThan(0);
      
      const connection = connectionsA[0];
      expect(connection.strength).toBeGreaterThanOrEqual(0.7);
      expect(connection.strength).toBeLessThanOrEqual(1);
    });
  });
}); 