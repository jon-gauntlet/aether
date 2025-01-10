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
}

export interface SpaceQualities {
  // Natural qualities of different space types
  depthCapacity: number;     // How deep presence can naturally go
  stillnessSupport: number;  // How well it maintains stillness
  presenceGather: number;    // How it gathers presence
  resonanceFlow: number;     // How freely resonance moves
}

export class SpaceSystem {
  private spaces = new Map<string, BehaviorSubject<Space>>();
  
  private spaceQualities: Record<SpaceType, SpaceQualities> = {
    sanctuary: {
      depthCapacity: 1.0,    // Deepest possible presence
      stillnessSupport: 1.0, // Highest stillness maintenance
      presenceGather: 0.7,   // Moderate presence gathering
      resonanceFlow: 0.5     // Limited resonance flow
    },
    library: {
      depthCapacity: 0.9,    // Very deep presence
      stillnessSupport: 0.9, // High stillness
      presenceGather: 0.6,   // Lower presence gathering
      resonanceFlow: 0.4     // More limited resonance
    },
    workshop: {
      depthCapacity: 0.7,    // Moderate depth
      stillnessSupport: 0.5, // Lower stillness
      presenceGather: 0.8,   // Higher presence gathering
      resonanceFlow: 0.7     // Good resonance flow
    },
    garden: {
      depthCapacity: 0.8,    // Good depth
      stillnessSupport: 0.7, // Good stillness
      presenceGather: 0.9,   // High presence gathering
      resonanceFlow: 0.9     // High resonance flow
    },
    commons: {
      depthCapacity: 0.6,    // Lower depth
      stillnessSupport: 0.4, // Lower stillness
      presenceGather: 1.0,   // Highest presence gathering
      resonanceFlow: 1.0     // Highest resonance flow
    }
  };

  constructor() {}

  createSpace(id: string, type: SpaceType): void {
    const qualities = this.spaceQualities[type];
    const space: Space = {
      id,
      type,
      depth: qualities.depthCapacity * 0.3,    // Start at 30% capacity
      stillness: qualities.stillnessSupport * 0.4,
      presence: 0,
      resonance: 0,
      streams: new Set()
    };
    
    this.spaces.set(id, new BehaviorSubject<Space>(space));
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