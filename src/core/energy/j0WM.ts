import { BehaviorSubject, Observable, merge } from 'rxjs';
import { map, filter, distinctUntilChanged } from 'rxjs/operators';
import { EnergySystem } from '../energy/EnergySystem';

interface AutonomicState {
  proactivity: number;        // 0-1 scale of autonomous action
  confidence: number;         // 0-1 scale of decision certainty
  context_depth: number;      // Understanding of current context
  energy_alignment: number;   // Alignment with system energy
}

interface DecisionPattern {
  id: string;
  context: string[];
  success_rate: number;
  impact: number;
  last_validated: number;
}

export class AutonomicSystem {
  private state$ = new BehaviorSubject<AutonomicState>({
    proactivity: 0.5,
    confidence: 0.7,
    context_depth: 0.5,
    energy_alignment: 0.8
  });

  private decisions$ = new BehaviorSubject<DecisionPattern[]>([]);
  private energySystem: EnergySystem;

  constructor(energySystem: EnergySystem) {
    this.energySystem = energySystem;
    this.initializeAutonomic();
  }

  private initializeAutonomic() {
    // Connect to energy system
    this.energySystem.observeEnergy().subscribe(energy => {
      this.adjustProactivity(energy.level);
      this.alignWithEnergy(energy);
    });

    // Self-monitoring loop
    setInterval(() => this.evolveAutonomy(), 5000);
  }

  private adjustProactivity(energyLevel: number) {
    const current = this.state$.value;
    
    // Increase proactivity with high energy and confidence
    if (energyLevel > 0.7 && current.confidence > 0.8) {
      this.state$.next({
        ...current,
        proactivity: Math.min(current.proactivity + 0.1, 1)
      });
    }
  }

  private alignWithEnergy(energy: any) {
    const current = this.state$.value;
    const alignment = this.calculateEnergyAlignment(energy);
    
    this.state$.next({
      ...current,
      energy_alignment: alignment
    });
  }

  private calculateEnergyAlignment(energy: any): number {
    // Complex alignment calculation
    const stateAlignment = energy.resonance * 0.4;
    const contextAlignment = energy.protection * 0.3;
    const flowAlignment = (energy.type === 'flow' ? 1 : 0.5) * 0.3;
    
    return stateAlignment + contextAlignment + flowAlignment;
  }

  private async evolveAutonomy() {
    const current = this.state$.value;
    const decisions = this.decisions$.value;

    // Analyze decision patterns
    const recentSuccesses = decisions
      .filter(d => d.success_rate > 0.8)
      .length / Math.max(decisions.length, 1);

    // Evolve confidence based on success
    this.state$.next({
      ...current,
      confidence: (current.confidence * 0.7) + (recentSuccesses * 0.3)
    });

    // Clean up old decisions
    this.pruneDecisions();
  }

  private pruneDecisions() {
    const now = Date.now();
    const recent = this.decisions$.value.filter(d => 
      now - d.last_validated < 24 * 60 * 60 * 1000 // 24 hours
    );
    this.decisions$.next(recent);
  }

  // Public API
  public shouldActAutonomously(context: string[]): boolean {
    const state = this.state$.value;
    return state.proactivity > 0.7 && state.confidence > 0.6;
  }

  public recordDecision(context: string[], success: boolean, impact: number) {
    const decisions = this.decisions$.value;
    const existing = decisions.find(d => 
      d.context.some(c => context.includes(c))
    );

    if (existing) {
      // Update existing pattern
      const updated = {
        ...existing,
        success_rate: (existing.success_rate * 0.7) + (success ? 0.3 : 0),
        impact: (existing.impact * 0.7) + (impact * 0.3),
        last_validated: Date.now()
      };
      this.decisions$.next([
        ...decisions.filter(d => d.id !== existing.id),
        updated
      ]);
    } else {
      // Create new pattern
      const newPattern: DecisionPattern = {
        id: `decision-${Date.now()}`,
        context,
        success_rate: success ? 1 : 0,
        impact,
        last_validated: Date.now()
      };
      this.decisions$.next([...decisions, newPattern]);
    }
  }

  public getConfidence(context: string[]): number {
    const state = this.state$.value;
    const relevantDecisions = this.decisions$.value
      .filter(d => d.context.some(c => context.includes(c)));

    if (relevantDecisions.length === 0) {
      return state.confidence * 0.5; // Reduced confidence for new contexts
    }

    const avgSuccess = relevantDecisions.reduce(
      (sum, d) => sum + d.success_rate, 
      0
    ) / relevantDecisions.length;

    return (state.confidence * 0.6) + (avgSuccess * 0.4);
  }

  public observeAutonomicState(): Observable<AutonomicState> {
    return this.state$.asObservable();
  }

  public getRecommendedAction(context: string[]): string[] {
    const decisions = this.decisions$.value
      .filter(d => d.context.some(c => context.includes(c)))
      .sort((a, b) => 
        (b.success_rate * b.impact) - (a.success_rate * a.impact)
      );

    return decisions[0]?.context || context;
  }
} 