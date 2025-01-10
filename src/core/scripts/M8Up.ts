import { Observable, BehaviorSubject } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';
import { NaturalFlow } from './NaturalFlow';

interface Place {
  id: string;
  ways: Map<string, number>;  // Paths to other places
}

interface Way {
  through: string[];  // Places along the way
  peace: number;      // Ease of passage
}

export class NaturalNavigation {
  private places = new Map<string, Place>();
  private ways = new BehaviorSubject<Way[]>([]);
  private flow: NaturalFlow;
  private here = '';
  
  constructor(flow: NaturalFlow) {
    this.flow = flow;
  }

  async rest(id: string) {
    let place = this.places.get(id);
    
    if (!place) {
      place = { id, ways: new Map() };
      this.places.set(id, place);
    }

    if (this.here) {
      const from = this.places.get(this.here);
      if (from) {
        const peace = from.ways.get(id) || 0;
        from.ways.set(id, Math.min(1, peace + 0.1));
      }
    }

    this.here = id;
    this.keep();
    
    this.flow.add(id, [
      { type: 'place', still: this.findStill(id) }
    ]);
    
    this.flow.wake(id);
  }

  private keep() {
    const ways: Way[] = [];
    const seen = new Set<string>();

    const walk = (id: string, visited: string[]) => {
      if (visited.length > 3) return;
      seen.add(id);

      const place = this.places.get(id);
      if (!place) return;

      if (visited.length > 0) {
        ways.push({
          through: [...visited, id],
          peace: this.findPeace(visited.concat(id))
        });
      }

      place.ways.forEach((peace, next) => {
        if (!visited.includes(next) && peace > 0.3) {
          walk(next, [...visited, id]);
        }
      });
    };

    Array.from(this.places.keys())
      .filter(id => !seen.has(id))
      .forEach(id => walk(id, []));

    this.ways.next(ways.filter(w => w.peace > 0.3));
  }

  private findPeace(through: string[]): number {
    let peace = 1;
    for (let i = 1; i < through.length; i++) {
      const prev = this.places.get(through[i-1]);
      const strength = prev?.ways.get(through[i]) || 0;
      peace *= strength;
    }
    return Math.pow(peace, 1/through.length);
  }

  private findStill(id: string): number {
    const ways = this.ways.value
      .filter(w => w.through.includes(id));
    if (!ways.length) return 1;
    return Math.max(0.3, 1 - ways.length * 0.1);
  }

  guide(id: string): string[] {
    const place = this.places.get(id);
    if (!place) return [];

    return Array.from(place.ways.entries())
      .filter(([_, peace]) => peace > 0.3)
      .sort(([_, a], [__, b]) => b - a)
      .map(([id]) => id);
  }

  see(): Observable<Way[]> {
    return this.ways.asObservable();
  }
} 