import { Observable, BehaviorSubject } from 'rxjs';
import { map, filter } from 'rxjs/operators';
import { Feel, Spot, Way, Group, Level, blend, ease } from './types/core';
import { Move } from './flow/move';

interface Rest {
  quiet: Level;      // How peaceful it is
  ready: Level;      // How prepared it feels
  open: Level;       // How welcoming it is
}

export class Settle {
  private rest: BehaviorSubject<Rest>;
  private flow: Move;
  
  constructor(flow: Move) {
    this.rest = new BehaviorSubject<Rest>({
      quiet: 1,
      ready: 1,
      open: 1
    });
    
    this.flow = flow;
    this.watch();
  }

  private watch() {
    // Let things settle naturally
    setInterval(() => {
      const now = this.rest.value;
      
      // Things get quiet on their own
      now.quiet = blend(now.quiet, 1);
      
      // Stay gently ready
      now.ready = ease(now.ready, 0.7);
      
      // Keep somewhat open
      now.open = ease(now.open, 0.5);
      
      this.rest.next(now);
    }, 1000);

    // Notice what's happening
    this.flow.watch().subscribe(flow => {
      const now = this.rest.value;
      
      // Activity affects quiet
      const active = countActive(flow);
      if (active > 3) {
        now.quiet = Math.max(0.3, now.quiet - 0.1);
      }
      
      // Connections affect openness
      const connected = countConnections(flow);
      if (connected > 5) {
        now.open = Math.min(0.8, now.open + 0.1);
      }
      
      // Work affects readiness
      const working = countWorking(flow);
      if (working > 2) {
        now.ready = Math.min(0.9, now.ready + 0.1);
      }
      
      this.rest.next(now);
    });
  }

  // See how restful things are
  see(): Observable<Rest> {
    return this.rest.asObservable();
  }

  // Check if it's a good time to rest
  check(): boolean {
    const now = this.rest.value;
    return (
      now.quiet > 0.7 &&
      now.ready > 0.5 &&
      now.open > 0.3
    );
  }

  // Help things settle
  calm() {
    const now = this.rest.value;
    now.quiet = Math.min(1, now.quiet + 0.2);
    now.ready = Math.max(0.5, now.ready - 0.1);
    now.open = Math.max(0.3, now.open - 0.1);
    this.rest.next(now);
  }
}

// Count active spots
function countActive(flow: { spots: Map<string, Spot> }): number {
  return Array.from(flow.spots.values())
    .filter(spot => spot.feel.ease > 0.7)
    .length;
}

// Count strong connections
function countConnections(flow: { spots: Map<string, Spot> }): number {
  return Array.from(flow.spots.values())
    .reduce((sum, spot) => 
      sum + spot.links.filter(link => link.strength > 0.5).length
    , 0);
}

// Count focused work
function countWorking(flow: { ways: Map<string, Way> }): number {
  return Array.from(flow.ways.values())
    .filter(way => 
      way.work === 'make' && 
      way.feel.depth > 0.7
    ).length;
} 