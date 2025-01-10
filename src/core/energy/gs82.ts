import { jest, expect, describe, it, beforeEach } from '@jest/globals';
import { ConsciousnessState, MindSpace, Resonance, Depth } from '../../types/consciousness';
import { PresenceSystem } from '../PresenceSystem';
import { ThoughtStreamSystem } from '../ThoughtStream';
import { MindSpaceSystem } from '../MindSpace';
import { EnergySystem } from '../EnergySystem';

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
      const space = mindSpaceSystem.createSpace('flow-1', 'flow');
      
      // Enter flow state
      presenceSystem.enterState('presence-1', 'flow', space);
      
      // Create thought stream
      thoughtStreamSystem.createStream('stream-1', 'flow', space);
      
      // Initialize energy
      const energyState = energySystem.initializeEnergy('energy-1', 'flow');
      
      // Wait for natural evolution
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Observe states
      const presenceState = await new Promise(resolve => {
        presenceSystem.observePresence('presence-1').subscribe(state => {
          resolve(state);
        });
      });
      
      const thoughtState = await new Promise(resolve => {
        thoughtStreamSystem.observeStream('stream-1').subscribe(state => {
          resolve(state);
        });
      });
      
      const spaceState = await new Promise(resolve => {
        mindSpaceSystem.observeSpace('flow-1').subscribe(state => {
          resolve(state);
        });
      });
      
      const energyStateUpdated = await new Promise(resolve => {
        energySystem.observeEnergy('energy-1').subscribe(state => {
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
      const presenceResonance = (presenceState as any).consciousness.resonance;
      const thoughtResonance = (thoughtState as any).resonance;
      const spaceResonance = (spaceState as any).state.resonance;
      const energyResonance = (energyStateUpdated as any).resonance;
      
      expect(presenceResonance.harmony).toBeWithinRange(0.7, 1);
      expect(thoughtResonance.harmony).toBeWithinRange(0.7, 1);
      expect(spaceResonance.harmony).toBeWithinRange(0.7, 1);
      expect(energyResonance.harmony).toBeWithinRange(0.7, 1);
    });

    it('should protect deep focus state from disturbances', async () => {
      // Create a focus space
      const space = mindSpaceSystem.createSpace('focus-1', 'focus');
      
      // Enter deep state
      presenceSystem.enterState('presence-2', 'deep', space);
      
      // Create focused thought stream
      thoughtStreamSystem.createStream('stream-2', 'focus', space);
      
      // Initialize focused energy
      const energyState = energySystem.initializeEnergy('energy-2', 'focus');
      
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
            harmonics: []
          }
        }
      };
      
      // Test disturbance handling
      const breaksThrough = presenceSystem.handleDisturbance('presence-2', disturbance);
      
      // Verify protection
      expect(breaksThrough).toBe(false);
      
      const presenceState = await new Promise(resolve => {
        presenceSystem.observePresence('presence-2').subscribe(state => {
          resolve(state);
        });
      });
      
      expect((presenceState as any).protection.strength).toBeWithinRange(0.7, 1);
    });

    it('should form natural connections between resonant spaces', async () => {
      // Create two resonant spaces
      const spaceA = mindSpaceSystem.createSpace('space-a', 'flow');
      const spaceB = mindSpaceSystem.createSpace('space-b', 'flow');
      
      // Initialize presence in both spaces
      presenceSystem.enterState('presence-a', 'flow', spaceA);
      presenceSystem.enterState('presence-b', 'flow', spaceB);
      
      // Create thought streams
      thoughtStreamSystem.createStream('stream-a', 'flow', spaceA);
      thoughtStreamSystem.createStream('stream-b', 'flow', spaceB);
      
      // Initialize energy
      energySystem.initializeEnergy('energy-a', 'flow');
      energySystem.initializeEnergy('energy-b', 'flow');
      
      // Connect spaces
      mindSpaceSystem.connectSpaces('space-a', 'space-b');
      
      // Wait for natural evolution
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Verify connections
      const connectionsA = await new Promise(resolve => {
        mindSpaceSystem.observeConnections('space-a').subscribe(connections => {
          resolve(connections);
        });
      });
      
      expect(Array.isArray(connectionsA)).toBe(true);
      expect((connectionsA as any[]).length).toBeGreaterThan(0);
      
      const connection = (connectionsA as any[])[0];
      expect(connection.strength).toBeWithinRange(0.7, 1);
      expect(connection.resonance.harmony).toBeWithinRange(0.7, 1);
    });
  });
}); 