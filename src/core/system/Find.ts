import { Observable, BehaviorSubject } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';
import { Flow } from './flow';

interface Spot {
  id: string;
  paths: Map<string, number>;
}

interface Path {
  spots: string[];
  ease: number;
}

export class Find {
  private spots = new Map<string, Spot>();
  private paths = new BehaviorSubject<Path[]>([]);
  private flow: Flow;
  private at = '';

  constructor(flow: Flow) {
    this.flow = flow;
  }

  async stay(id: string) {
    let spot = this.spots.get(id);

    if (!spot) {
      spot = { id, paths: new Map() };
      this.spots.set(id, spot);
    }

    if (this.at) {
      const last = this.spots.get(this.at);
      if (last) {
        const ease = last.paths.get(id) || 0;
        last.paths.set(id, Math.min(1, ease + 0.1));
      }
    }

    this.at = id;
    this.remember();

    this.flow.add(id, [
      { type: 'spot', ease: this.findEase(id) },
    ]);

    this.flow.notice(id, 'thinking');
  }

  private remember() {
    const paths: Path[] = [];
    const seen = new Set<string>();

    const walk = (id: string, visited: string[]) => {
      if (visited.length > 3) return;
      seen.add(id);

      const spot = this.spots.get(id);
      if (!spot) return;

      if (visited.length > 0) {
        paths.push({
          spots: [...visited, id],
          ease: this.findSmooth(visited.concat(id)),
        });
      }

      spot.paths.forEach((ease, next) => {
        if (!visited.includes(next) && ease > 0.3) {
          walk(next, [...visited, id]);
        }
      });
    };

    Array.from(this.spots.keys())
      .filter(id => !seen.has(id))
      .forEach(id => walk(id, []));

    this.paths.next(paths.filter(p => p.ease > 0.3));
  }

  private findSmooth(spots: string[]): number {
    let ease = 1;
    for (let i = 1; i < spots.length; i++) {
      const prev = this.spots.get(spots[i-1]);
      const smooth = prev?.paths.get(spots[i]) || 0;
      ease *= smooth;
    }
    return Math.pow(ease, 1/spots.length);
  }

  private findEase(id: string): number {
    const paths = this.paths.value
      .filter(p => p.spots.includes(id));
    if (!paths.length) return 1;
    return Math.max(0.3, 1 - paths.length * 0.1);
  }

  show(id: string): string[] {
    const spot = this.spots.get(id);
    if (!spot) return [];

    return Array.from(spot.paths.entries())
      .filter(([_, ease]) => ease > 0.3)
      .sort(([_, a], [__, b]) => b - a)
      .map(([id]) => id);
  }

  watch(): Observable<Path[]> {
    return this.paths.asObservable();
  }
}