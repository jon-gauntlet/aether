import { Observable, BehaviorSubject } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';

export interface AutonomicDecision {
  timestamp: number;
  success_rate: number;
  resonance: number;
  depth: number;
  protection_level: number;
  last_validated: number;
}

export interface AutonomicState {
  confidence: number;
  pattern_resonance: number;
  flow_protection: number;
  mode: 'active' | 'passive' | 'protective';
}

export interface AutonomicSystem {
  observeAutonomicState(): Observable<AutonomicState>;
  getDecisions(): Observable<AutonomicDecision[]>;
  recordDecision(decision: Partial<AutonomicDecision>): void;
  protectFlow(): void;
  releaseFlow(): void;
}

export class Autonomic implements AutonomicSystem {
  private state$ = new BehaviorSubject<AutonomicState>({
    confidence: 0.5,
    pattern_resonance: 0.5,
    flow_protection: 0,
    mode: 'active'
  });

  private decisions$ = new BehaviorSubject<AutonomicDecision[]>([]);

  private readonly RESONANCE_THRESHOLD = 0.8;
  private readonly FLOW_THRESHOLD = 0.7;

  constructor() {
    this.initializeAutonomic();
  }

  private initializeAutonomic() {
    // Start autonomic cycle
    setInterval(() => {
      this.evolveAutonomy();
    }, 5000);
  }

  private evolveAutonomy() {
    const current = this.state$.value;
    const decisions = this.decisions$.value;

    // Natural pattern evolution
    const recentSuccesses = decisions
      .filter(d => d.success_rate > 0.8 && d.resonance > 0.7)
      .length / Math.max(decisions.length, 1);

    // Pattern evolution
    const patternDepth = decisions
      .filter(d => d.depth > 0.8)
      .reduce((sum, d) => sum + d.protection_level, 0) / Math.max(decisions.length, 1);

    this.state$.next({
      ...current,
      confidence: (current.confidence * 0.6) + (recentSuccesses * 0.4),
      pattern_resonance: (current.pattern_resonance * 0.7) + (patternDepth * 0.3)
    });

    // Natural cleanup
    this.pruneDecisions();
  }

  private pruneDecisions() {
    const now = Date.now();
    const recent = this.decisions$.value.filter(d => 
      now - d.last_validated < 24 * 60 * 60 * 1000 // 24 hours
    );
    this.decisions$.next(recent);
  }

  public observeAutonomicState(): Observable<AutonomicState> {
    return this.state$.asObservable();
  }

  public getDecisions(): Observable<AutonomicDecision[]> {
    return this.decisions$.asObservable();
  }

  public recordDecision(decision: Partial<AutonomicDecision>) {
    const now = Date.now();
    const newDecision: AutonomicDecision = {
      timestamp: now,
      success_rate: decision.success_rate ?? 0.5,
      resonance: decision.resonance ?? 0.5,
      depth: decision.depth ?? 0.5,
      protection_level: decision.protection_level ?? 0,
      last_validated: now
    };

    this.decisions$.next([...this.decisions$.value, newDecision]);
  }

  public protectFlow() {
    const current = this.state$.value;
    if (current.pattern_resonance >= this.RESONANCE_THRESHOLD) {
      this.state$.next({
        ...current,
        flow_protection: Math.min(1, current.flow_protection + 0.2),
        mode: 'protective'
      });
    }
  }

  public releaseFlow() {
    const current = this.state$.value;
    this.state$.next({
      ...current,
      flow_protection: Math.max(0, current.flow_protection - 0.1),
      mode: current.confidence > this.FLOW_THRESHOLD ? 'active' : 'passive'
    });
  }
} 