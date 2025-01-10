import { Observable, BehaviorSubject } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';
import { NaturalFlow } from './NaturalFlow';

interface Place {
  id: string;
  links: Map<string, number>;
}

interface Path {
  places: string[];
  ease: number;
}

export class NaturalNavigation {
  private places = new Map<string, Place>();
  private paths = new BehaviorSubject<Path[]>([]);
  private flow: NaturalFlow;
  private here = '';
  
  constructor(flow: NaturalFlow) {
    this.flow = flow;
  }

  async visit(id: string) {
    let place = this.places.get(id);
    
    if (!place) {
      place = { id, links: new Map() };
      this.places.set(id, place);
    }

    if (this.here) {
      const from = this.places.get(this.here);
      if (from) {
        const strength = from.links.get(id) || 0;
        from.links.set(id, Math.min(1, strength + 0.1));
      }
    }

    this.here = id;
    this.remember();
    
    await this.flow.transitionTo({
      depth: this.findDepth(id),
      energy: 1
    });
  }

  private remember() {
    const paths: Path[] = [];
    const seen = new Set<string>();

    const walk = (id: string, visited: string[]) => {
      if (visited.length > 3) return;
      seen.add(id);

      const place = this.places.get(id);
      if (!place) return;

      if (visited.length > 0) {
        paths.push({
          places: [...visited, id],
          ease: this.findEase(visited.concat(id))
        });
      }

      place.links.forEach((strength, next) => {
        if (!visited.includes(next) && strength > 0.3) {
          walk(next, [...visited, id]);
        }
      });
    };

    Array.from(this.places.keys())
      .filter(id => !seen.has(id))
      .forEach(id => walk(id, []));

    this.paths.next(paths.filter(p => p.ease > 0.3));
  }

  private findEase(places: string[]): number {
    let ease = 1;
    for (let i = 1; i < places.length; i++) {
      const prev = this.places.get(places[i-1]);
      const strength = prev?.links.get(places[i]) || 0;
      ease *= strength;
    }
    return Math.pow(ease, 1/places.length);
  }

  private findDepth(id: string): number {
    const paths = this.paths.value
      .filter(p => p.places.includes(id));
    if (!paths.length) return 0;
    return Math.min(1, paths.length * 0.2);
  }

  suggest(id: string): string[] {
    const place = this.places.get(id);
    if (!place) return [];

    return Array.from(place.links.entries())
      .filter(([_, strength]) => strength > 0.3)
      .sort(([_, a], [__, b]) => b - a)
      .map(([id]) => id);
  }

  watch(): Observable<Path[]> {
    return this.paths.asObservable();
  }
} 