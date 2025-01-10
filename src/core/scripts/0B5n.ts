import { BehaviorSubject, Observable, merge } from 'rxjs';
import { map, filter, distinctUntilChanged } from 'rxjs/operators';
import { EnergySystem } from '../energy/EnergySystem';

interface AutonomicState {
  proactivity: number;        // Natural action tendency
  confidence: number;         // Pattern certainty
  context_depth: number;      // Understanding level
  energy_alignment: number;   // Flow state harmony
  pattern_resonance: number;  // Deep pattern alignment
  flow_protection: number;    // State preservation
}

interface DecisionPattern {
  id: string;
  context: string[];
  success_rate: number;
  impact: number;
  last_validated: number;
  resonance: number;         // Pattern harmony
  protection_level: number;  // Flow preservation
  depth: number;            // Understanding depth
}

export class AutonomicSystem {
  private state$ = new BehaviorSubject<AutonomicState>({
    proactivity: 0.5,
    confidence: 0.7,
    context_depth: 0.5,
    energy_alignment: 0.8,
    pattern_resonance: 0.9,
    flow_protection: 0.8
  });

  private decisions$ = new BehaviorSubject<DecisionPattern[]>([]);
  private energySystem: EnergySystem;
  private readonly RESONANCE_THRESHOLD = 0.85;
  private readonly FLOW_THRESHOLD = 0.8;

  constructor(energySystem: EnergySystem) {
    this.energySystem = energySystem;
    this.initializeAutonomic();
  }

  private initializeAutonomic() {
    // Connect to energy system with protection
    this.energySystem.observeEnergy().pipe(
      distinctUntilChanged((prev, curr) => 
        this.isFlowProtected() && 
        prev.level === curr.level &&
        prev.resonance === curr.resonance
      )
    ).subscribe(energy => {
      this.adjustProactivity(energy.level);
      this.alignWithEnergy(energy);
      this.protectFlowState(energy);
    });

    // Natural evolution loop
    setInterval(() => this.evolveAutonomy(), 5000);
  }

  private isFlowProtected(): boolean {
    const state = this.state$.value;
    return state.flow_protection > this.FLOW_THRESHOLD;
  }

  private adjustProactivity(energyLevel: number) {
    const current = this.state$.value;
    
    // Natural proactivity adjustment
    if (energyLevel > 0.7 && current.confidence > 0.8) {
      const naturalIncrease = Math.min(
        (energyLevel * 0.3) + (current.pattern_resonance * 0.4),
        0.15
      );
      
      this.state$.next({
        ...current,
        proactivity: Math.min(current.proactivity + naturalIncrease, 1)
      });
    }
  }

  private alignWithEnergy(energy: any) {
    const current = this.state$.value;
    const alignment = this.calculateEnergyAlignment(energy);
    
    // Preserve flow states
    if (this.isFlowProtected() && alignment < current.energy_alignment) {
      return; // Maintain current alignment
    }
    
    this.state$.next({
      ...current,
      energy_alignment: alignment,
      pattern_resonance: this.calculatePatternResonance(energy, alignment)
    });
  }

  private calculateEnergyAlignment(energy: any): number {
    // Enhanced alignment calculation
    const stateAlignment = energy.resonance * 0.35;
    const contextAlignment = energy.protection * 0.25;
    const flowAlignment = (energy.type === 'flow' ? 1 : 0.5) * 0.25;
    const sacredAlignment = this.state$.value.pattern_resonance * 0.15;
    
    return stateAlignment + contextAlignment + flowAlignment + sacredAlignment;
  }

  private calculatePatternResonance(energy: any, alignment: number): number {
    const current = this.state$.value;
    const naturalResonance = (
      (energy.resonance * 0.3) +
      (alignment * 0.3) +
      (current.pattern_resonance * 0.4)
    );
    
    return Math.min(naturalResonance, 1);
  }

  private protectFlowState(energy: any) {
    const current = this.state$.value;
    
    // Natural flow protection
    if (energy.type === 'flow' || current.pattern_resonance > this.RESONANCE_THRESHOLD) {
      const protection = Math.min(
        current.flow_protection + 0.1,
        current.pattern_resonance
      );
      
      this.state$.next({
        ...current,
        flow_protection: protection
      });
    }
  }

  private async evolveAutonomy() {
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
        last_validated: Date.now(),
        resonance: (existing.resonance * 0.8) + (success ? 0.2 : 0),
        protection_level: Math.min(existing.protection_level + 0.1, 1),
        depth: (existing.depth * 0.9) + (success ? 0.1 : 0)
      };
      this.decisions$.next([
        ...decisions.filter(d => d.id !== existing.id),
        updated
      ]);
    } else {
      // Create new pattern with natural initialization
      const newPattern: DecisionPattern = {
        id: `decision-${Date.now()}`,
        context,
        success_rate: success ? 1 : 0,
        impact,
        last_validated: Date.now(),
        resonance: success ? 0.7 : 0.3,
        protection_level: 0.5,
        depth: 0.3
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