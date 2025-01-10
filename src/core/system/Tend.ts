import { Observable, BehaviorSubject } from 'rxjs';
import { map, filter } from 'rxjs/operators';
import { Seed } from './weave';

interface Care {
  water: number;     // Nourishment level
  light: number;     // Clarity level
  soil: number;      // Foundation strength
  air: number;       // Freedom to grow
}

interface Need {
  id: string;
  kind: 'water' | 'light' | 'soil' | 'air';
  amount: number;
}

export class Tend {
  private care: BehaviorSubject<Care>;
  private needs: BehaviorSubject<Need[]>;
  
  constructor() {
    this.care = new BehaviorSubject<Care>({
      water: 1,
      light: 1,
      soil: 1,
      air: 1
    });
    
    this.needs = new BehaviorSubject<Need[]>([]);
    this.watch();
  }

  // Notice what's needed
  notice(seed: Seed) {
    const needs: Need[] = [];
    
    if (seed.life < 0.3) {
      needs.push({
        id: seed.id,
        kind: 'water',
        amount: 0.5 - seed.life
      });
    }
    
    if (seed.roots < 0.3) {
      needs.push({
        id: seed.id,
        kind: 'soil',
        amount: 0.5 - seed.roots
      });
    }

    this.needs.next([
      ...this.needs.value.filter(n => n.id !== seed.id),
      ...needs
    ]);
  }

  // Give what's needed
  private give() {
    const now = this.care.value;
    const needs = this.needs.value;
    
    // Share what we have
    needs.forEach(need => {
      const current = now[need.kind];
      if (current >= need.amount) {
        now[need.kind] = current - need.amount;
      }
    });

    // Things come back naturally
    now.water = Math.min(1, now.water + 0.01);
    now.light = Math.min(1, now.light + 0.02);
    now.soil = Math.min(1, now.soil + 0.005);
    now.air = Math.min(1, now.air + 0.03);

    this.care.next(now);
  }

  // Keep watching and helping
  private watch() {
    setInterval(() => this.give(), 100);
  }

  // See what's needed
  see(): Observable<Need[]> {
    return this.needs.asObservable().pipe(
      filter(needs => needs.length > 0)
    );
  }

  // Check how we're doing
  check(): Observable<Care> {
    return this.care.asObservable();
  }

  // Help something specific
  help(id: string, kind: Need['kind'], amount: number) {
    const needs = this.needs.value;
    const now = this.care.value;

    if (now[kind] >= amount) {
      now[kind] -= amount;
      this.care.next(now);
      
      this.needs.next(
        needs.filter(n => !(n.id === id && n.kind === kind))
      );
    }
  }
} 