import { BehaviorSubject } from 'rxjs';
import { Space, SpaceType, NaturalFlow } from '../types';

export class ConsciousnessEngine {
  private spaces: Map<string, Space> = new Map();
  
  constructor() {
    this.tend();
    setInterval(() => this.tend(), 1000);
  }

  private tend() {
    this.spaces.forEach(space => {
      // Update flow properties
      space.flow.rhythm = Math.min(1, space.flow.rhythm + 0.01);
      space.flow.resonance = Math.min(1, space.flow.resonance + 0.01);
      space.flow.coherence = Math.min(1, space.flow.coherence + 0.01);
      space.flow.presence = Math.min(1, space.flow.presence + 0.01);
      
      // Calculate harmony based on other properties
      space.flow.harmony = Math.min(1, (
        space.flow.rhythm + 
        space.flow.resonance + 
        space.flow.coherence + 
        space.flow.presence
      ) / 4);
      
      // Update depth based on flow
      space.depth = (space.flow.harmony + space.flow.presence) / 2;
    });
  }

  public createSpace(id: string, type: SpaceType): Space {
    const space: Space = {
      id,
      type,
      flow: { 
        rhythm: 1, 
        resonance: 1, 
        coherence: 1, 
        presence: 1,
        harmony: 1
      },
      depth: 1,
      connections: []
    };
    
    this.spaces.set(id, space);
    return space;
  }

  public getSpace(id: string): Space | undefined {
    return this.spaces.get(id);
  }

  public connect(fromId: string, toId: string, strength: number = 1) {
    const fromSpace = this.spaces.get(fromId);
    const toSpace = this.spaces.get(toId);
    
    if (fromSpace && toSpace) {
      fromSpace.connections.push({ from: fromId, to: toId, strength });
      toSpace.connections.push({ from: toId, to: fromId, strength });
    }
  }
} 