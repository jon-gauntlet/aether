import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';

interface Garden {
  life: number;       // How lively things are
  roots: number;      // How deep things go
  ties: Map<string, number>;  // How things connect
  ways: Set<string>;  // Patterns that form
}

export interface Seed {
  id: string;
  life: number;      // Its own liveliness
  roots: number;     // Its own depth
  ties: string[];    // What it connects to
}

export class Weave {
  private garden: BehaviorSubject<Garden>;
  private seeds: Map<string, Observable<Seed>>;
  
  constructor() {
    this.garden = new BehaviorSubject<Garden>({
      life: 1,
      roots: 0,
      ties: new Map<string, number>(),
      ways: new Set<string>()
    });
    
    this.seeds = new Map();
    this.tend();
  }

  // Things join naturally
  plant(id: string, growth$: Observable<Seed>) {
    this.seeds.set(id, growth$);
    
    // Each thing adds its own life
    growth$.pipe(
      map(seed => this.grow(seed))
    ).subscribe(newGarden => {
      this.garden.next(newGarden);
    });
  }

  // Everything grows together
  private grow(seed: Seed): Garden {
    const now = this.garden.value;
    
    // Life spreads naturally
    const newLife = (now.life + seed.life) / 2;
    
    // Roots grow deeper
    const newRoots = Math.max(now.roots, seed.roots);
    
    // Ties get stronger
    const newTies = new Map(now.ties);
    seed.ties.forEach(tie => {
      const strength = newTies.get(tie) || 0;
      newTies.set(tie, strength + 0.1);
    });

    // Ways appear on their own
    const newWays = new Set(now.ways);
    if (seed.life > now.life) {
      newWays.add('flowing');
    }
    if (seed.roots > now.roots) {
      newWays.add('deepening');
    }

    return {
      life: newLife,
      roots: newRoots,
      ties: newTies,
      ways: newWays
    };
  }

  // Watch how things grow
  watch(): Observable<Garden> {
    return this.garden.asObservable();
  }

  // Find what connects
  find(id: string): string[] {
    const now = this.garden.value;
    return Array.from(now.ties.entries())
      .filter(([_, strength]) => strength > 0.5)
      .map(([id, _]) => id);
  }

  // Keep things healthy
  private tend() {
    setInterval(() => {
      const now = this.garden.value;
      
      // Keep life balanced
      if (now.life > 2) {
        now.life = Math.sqrt(now.life);
      }
      
      // Let weak ties fade
      if (now.roots > 0) {
        now.ties.forEach((strength, id) => {
          if (strength < 0.3) {
            now.ties.delete(id);
          }
        });
      }
      
      this.garden.next(now);
    }, 1000);
  }
} 