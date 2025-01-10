import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Stream, PresenceType } from './flow';

export type SpaceType = 
  | 'sanctuary'    // For deep contemplation and stillness
  | 'library'      // For focused reading and study
  | 'workshop'     // For active creation and writing
  | 'garden'       // For natural conversation and sharing
  | 'commons';     // For open gathering and connection

export interface Space {
  id: string;
  type: SpaceType;
  depth: number;      // Natural depth of the space
  stillness: number;  // Ambient quietude
  presence: number;   // Collective presence
  resonance: number;  // Shared harmony
  streams: Set<string>;
  neighbors: Set<string>;  // Adjacent spaces
}

export interface SpaceQualities {
  depthCapacity: number;     // How deep presence can naturally go
  stillnessSupport: number;  // How well it maintains stillness
  presenceGather: number;    // How it gathers presence
  resonanceFlow: number;     // How freely resonance moves
  influence: number;         // How strongly it affects neighbors
  receptivity: number;       // How much it's affected by neighbors
}

export class SpaceSystem {
  private spaces = new Map<string, BehaviorSubject<Space>>();
  
  private spaceQualities: Record<SpaceType, SpaceQualities> = {
    sanctuary: {
      depthCapacity: 1.0,
      stillnessSupport: 1.0,
      presenceGather: 0.7,
      resonanceFlow: 0.5,
      influence: 0.8,      // Strong calming influence
      receptivity: 0.3     // Limited external influence
    },
    library: {
      depthCapacity: 0.9,
      stillnessSupport: 0.9,
      presenceGather: 0.6,
      resonanceFlow: 0.4,
      influence: 0.6,      // Moderate focused influence
      receptivity: 0.4     // Moderate receptivity
    },
    workshop: {
      depthCapacity: 0.7,
      stillnessSupport: 0.5,
      presenceGather: 0.8,
      resonanceFlow: 0.7,
      influence: 0.5,      // Balanced influence
      receptivity: 0.6     // More receptive
    },
    garden: {
      depthCapacity: 0.8,
      stillnessSupport: 0.7,
      presenceGather: 0.9,
      resonanceFlow: 0.9,
      influence: 0.7,      // Natural harmonizing influence
      receptivity: 0.7     // Natural receptivity
    },
    commons: {
      depthCapacity: 0.6,
      stillnessSupport: 0.4,
      presenceGather: 1.0,
      resonanceFlow: 1.0,
      influence: 0.4,      // Light influence
      receptivity: 0.9     // Highly receptive
    }
  };

  constructor() {
    // Start the natural flow between spaces
    setInterval(() => this.tendSpaces(), 1000);
  }

  private tendSpaces() {
    this.spaces.forEach(subject => {
      const space = subject.value;
      const qualities = this.spaceQualities[space.type];
      
      // Calculate influence from neighbors
      let neighborInfluence = this.calculateNeighborInfluence(space);
      
      // Natural qualities tend toward their base capacity
      const depth = this.tendQuality(space.depth, qualities.depthCapacity * 0.3, neighborInfluence.depth);
      const stillness = this.tendQuality(space.stillness, qualities.stillnessSupport * 0.4, neighborInfluence.stillness);
      const resonance = this.tendQuality(space.resonance, 0, neighborInfluence.resonance);
      
      subject.next({
        ...space,
        depth,
        stillness,
        resonance
      });
    });
  }

  private calculateNeighborInfluence(space: Space): { depth: number; stillness: number; resonance: number } {
    const spaceQualities = this.spaceQualities[space.type];
    if (!space.neighbors.size) {
      return { depth: 0, stillness: 0, resonance: 0 };
    }

    let totalDepth = 0;
    let totalStillness = 0;
    let totalResonance = 0;
    
    space.neighbors.forEach(neighborId => {
      const neighbor = this.spaces.get(neighborId)?.value;
      if (neighbor) {
        const neighborQualities = this.spaceQualities[neighbor.type];
        const influence = neighborQualities.influence * spaceQualities.receptivity;
        
        totalDepth += (neighbor.depth - space.depth) * influence;
        totalStillness += (neighbor.stillness - space.stillness) * influence;
        totalResonance += (neighbor.resonance - space.resonance) * influence;
      }
    });

    return {
      depth: totalDepth / space.neighbors.size,
      stillness: totalStillness / space.neighbors.size,
      resonance: totalResonance / space.neighbors.size
    };
  }

  private tendQuality(current: number, natural: number, influence: number): number {
    // Move toward natural level plus neighbor influence
    const target = natural + influence;
    return current + (target - current) * 0.1;
  }

  createSpace(id: string, type: SpaceType): void {
    const qualities = this.spaceQualities[type];
    const space: Space = {
      id,
      type,
      depth: qualities.depthCapacity * 0.3,
      stillness: qualities.stillnessSupport * 0.4,
      presence: 0,
      resonance: 0,
      streams: new Set(),
      neighbors: new Set()
    };
    
    this.spaces.set(id, new BehaviorSubject<Space>(space));
  }

  connectSpaces(spaceId: string, neighborId: string): void {
    const space = this.spaces.get(spaceId)?.value;
    const neighbor = this.spaces.get(neighborId)?.value;
    
    if (space && neighbor) {
      // Add bidirectional connection
      space.neighbors.add(neighborId);
      neighbor.neighbors.add(spaceId);
      
      // Update both spaces
      this.spaces.get(spaceId)?.next(space);
      this.spaces.get(neighborId)?.next(neighbor);
    }
  }

  observe(id: string): Observable<Space | undefined> {
    const subject = this.spaces.get(id);
    return subject ? subject.pipe(
      map(space => space || undefined)
    ) : new Observable();
  }

  enter(spaceId: string, streamId: string): void {
    const subject = this.spaces.get(spaceId);
    if (!subject) return;

    const space = subject.value;
    space.streams.add(streamId);
    
    subject.next({
      ...space,
      presence: Math.min(1, space.presence + 0.1),
      resonance: Math.min(1, space.resonance + 0.05)
    });
  }

  leave(spaceId: string, streamId: string): void {
    const subject = this.spaces.get(spaceId);
    if (!subject) return;

    const space = subject.value;
    space.streams.delete(streamId);
    
    subject.next({
      ...space,
      presence: Math.max(0, space.presence - 0.1),
      resonance: Math.max(0, space.resonance - 0.05)
    });
  }

  getPreferredTypes(presenceType: PresenceType): SpaceType[] {
    // Different activities have natural space affinities
    switch (presenceType) {
      case 'thinking':
        return ['sanctuary', 'library', 'garden'];
      case 'reading':
        return ['library', 'garden', 'sanctuary'];
      case 'writing':
        return ['workshop', 'library', 'sanctuary'];
      case 'listening':
        return ['garden', 'commons', 'sanctuary'];
      default:
        return ['commons', 'garden'];
    }
  }

  getSpaceQuality(spaceId: string): SpaceQualities | undefined {
    const space = this.spaces.get(spaceId)?.value;
    return space ? this.spaceQualities[space.type] : undefined;
  }
} 