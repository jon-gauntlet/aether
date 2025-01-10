import { Observable, BehaviorSubject } from 'rxjs';
import { map, filter } from 'rxjs/operators';
import { Feel, Spot, Way, Group, Level, blend, ease } from '../types/core';

interface Flow {
  spots: Map<string, Spot>;
  ways: Map<string, Way>;
  groups: Map<string, Group>;
}

export class Move {
  private flow: BehaviorSubject<Flow>;
  
  constructor() {
    this.flow = new BehaviorSubject<Flow>({
      spots: new Map(),
      ways: new Map(),
      groups: new Map()
    });
    
    this.start();
  }

  // Add a new spot
  add(spot: Spot) {
    const flow = this.flow.value;
    flow.spots.set(spot.id, spot);
    this.flow.next(flow);
  }

  // Start a new way
  begin(way: Way) {
    const flow = this.flow.value;
    flow.ways.set(way.id, way);
    this.flow.next(flow);
  }

  // Join a group
  join(group: Group) {
    const flow = this.flow.value;
    flow.groups.set(group.id, group);
    this.flow.next(flow);
  }

  // Keep things moving
  private start() {
    setInterval(() => {
      const flow = this.flow.value;
      
      // Spots affect each other
      flow.spots.forEach(spot => {
        spot.links.forEach(link => {
          const other = flow.spots.get(link.to);
          if (other) {
            spot.feel = mix(spot.feel, other.feel, link.strength);
          }
        });
      });

      // Ways blend with spots
      flow.ways.forEach(way => {
        const spot = flow.spots.get(way.id);
        if (spot) {
          way.feel = mix(way.feel, spot.feel, 0.3);
        }
      });

      // Groups bring it all together
      flow.groups.forEach(group => {
        const spot = flow.spots.get(group.spot.id);
        const way = flow.ways.get(group.way.id);
        if (spot && way) {
          group.story.feel = mix(
            mix(spot.feel, way.feel, 0.5),
            group.story.feel,
            0.2
          );
        }
      });

      this.flow.next(flow);
    }, 100);
  }

  // Watch what happens
  watch(): Observable<Flow> {
    return this.flow.asObservable();
  }

  // See one spot
  see(id: string): Observable<Spot | undefined> {
    return this.flow.pipe(
      map(flow => flow.spots.get(id))
    );
  }

  // Follow one way
  follow(id: string): Observable<Way | undefined> {
    return this.flow.pipe(
      map(flow => flow.ways.get(id))
    );
  }

  // Stay with one group
  stay(id: string): Observable<Group | undefined> {
    return this.flow.pipe(
      map(flow => flow.groups.get(id))
    );
  }
}

// Mix feelings with strength
function mix(a: Feel, b: Feel, strength: Level): Feel {
  return {
    ease: blend(a.ease, b.ease * strength),
    depth: Math.max(a.depth, b.depth * strength),
    warmth: blend(a.warmth, b.warmth * strength),
    space: Math.min(a.space, 1 + (b.space - 1) * strength)
  };
} 