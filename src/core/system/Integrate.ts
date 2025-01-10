import { Observable, BehaviorSubject } from 'rxjs';
import { map, filter } from 'rxjs/operators';
import { Feel, Spot, Way, Group, Level, blend, ease } from './types/core';
import { Move } from './flow/move';
import { Settle } from './rest';

interface Wave {
  depth: Level;    // How deep it reaches
  spread: Level;   // How far it spreads
  strength: Level; // How strongly it affects
}

export class Integrate {
  private wave: BehaviorSubject<Wave>;
  private flow: Move;
  private settle: Settle;
  
  constructor(flow: Move) {
    this.wave = new BehaviorSubject<Wave>({
      depth: 0.5,
      spread: 0.3,
      strength: 0.7
    });
    
    this.flow = flow;
    this.settle = new Settle(flow);
    this.watch();
  }

  private watch() {
    // Let understanding flow naturally
    this.flow.watch().subscribe(flow => {
      const wave = this.wave.value;
      
      // Depth grows in quiet
      const { quiet } = this.settle.see().value;
      if (quiet > 0.8) {
        wave.depth = Math.min(1, wave.depth + 0.1);
      }
      
      // Spread follows connections
      const connected = Array.from(flow.spots.values())
        .reduce((sum, spot) => sum + spot.links.length, 0);
      wave.spread = ease(wave.spread, Math.min(1, connected / 10));
      
      // Strength comes from resonance
      const resonance = Array.from(flow.spots.values())
        .filter(spot => spot.feel.depth > 0.7)
        .length;
      wave.strength = ease(wave.strength, Math.min(1, resonance / 5));
      
      this.wave.next(wave);
    });
  }

  // See how understanding flows
  see(): Observable<Wave> {
    return this.wave.asObservable();
  }

  // Let understanding flow outward
  flow() {
    const wave = this.wave.value;
    const flow = this.flow.watch().value;
    
    // Understanding deepens spots
    flow.spots.forEach(spot => {
      spot.feel.depth = blend(
        spot.feel.depth,
        wave.depth,
        wave.strength
      );
    });
    
    // And spreads through ways
    flow.ways.forEach(way => {
      way.feel.depth = blend(
        way.feel.depth,
        wave.depth * wave.spread,
        wave.strength * 0.7
      );
    });
    
    // And settles in groups
    flow.groups.forEach(group => {
      group.story.feel.depth = blend(
        group.story.feel.depth,
        wave.depth * wave.spread * 0.5,
        wave.strength * 0.5
      );
    });
  }

  // Help understanding settle
  settle() {
    const wave = this.wave.value;
    wave.depth = Math.max(0.3, wave.depth - 0.1);
    wave.spread = Math.max(0.2, wave.spread - 0.1);
    wave.strength = Math.max(0.5, wave.strength - 0.1);
    this.wave.next(wave);
  }
} 