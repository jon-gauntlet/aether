import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map, distinctUntilChanged, debounceTime } from 'rxjs/operators';

export interface AutonomicState {
  confidence: number;
  flow_protection: number;
  resonance: number;
  depth: number;
  hyperfocus: {
    active: boolean;
    intensity: number;
    duration: number;
    quality: number;
  };
  energy: {
    current: number;
    recovery_rate: number;
    efficiency: number;
    sustained_duration: number;
  };
  decisions: {
    success_rate: number;
    resonance: number;
    depth: number;
    protection_level: number;
    energy_impact: number;
  }[];
}

export class AutonomicSystem {
  private state$ = new BehaviorSubject<AutonomicState>({
    confidence: 0.8,
    flow_protection: 0.5,
    resonance: 0.7,
    depth: 0.6,
    hyperfocus: {
      active: false,
      intensity: 0,
      duration: 0,
      quality: 0.8
    },
    energy: {
      current: 1.0,
      recovery_rate: 0.05,
      efficiency: 0.8,
      sustained_duration: 0
    },
    decisions: []
  });

  private readonly MAX_DECISIONS = 100;
  private readonly CONFIDENCE_DECAY = 0.02;
  private readonly CONFIDENCE_BOOST = 0.05;
  private readonly MIN_CONFIDENCE = 0.4;
  private readonly MAX_CONFIDENCE = 0.95;
  private readonly HYPERFOCUS_THRESHOLD = 0.85;
  private readonly ENERGY_DECAY_RATE = 0.01;
  private readonly MIN_ENERGY = 0.2;

  constructor() {
    this.initializeAutonomicSystem();
  }

  private initializeAutonomicSystem() {
    // Update state every 5 seconds
    setInterval(() => {
      this.updateAutonomicState();
    }, 5000);

    // Check for hyperfocus conditions every minute
    setInterval(() => {
      this.evaluateHyperfocus();
    }, 60000);

    // Manage energy levels every 30 seconds
    setInterval(() => {
      this.manageEnergy();
    }, 30000);
  }

  private evaluateHyperfocus() {
    const state = this.state$.value;
    const recentDecisions = state.decisions.slice(-5);
    
    if (recentDecisions.length === 0) return;

    const avgDepth = recentDecisions.reduce((acc, d) => acc + d.depth, 0) / recentDecisions.length;
    const avgResonance = recentDecisions.reduce((acc, d) => acc + d.resonance, 0) / recentDecisions.length;
    
    const hyperfocusIntensity = (avgDepth + avgResonance) / 2;
    const isHyperfocus = hyperfocusIntensity > this.HYPERFOCUS_THRESHOLD;
    
    const currentHyperfocus = state.hyperfocus;
    const newDuration = isHyperfocus ? currentHyperfocus.duration + 1 : 0;
    
    this.state$.next({
      ...state,
      hyperfocus: {
        active: isHyperfocus,
        intensity: hyperfocusIntensity,
        duration: newDuration,
        quality: isHyperfocus ? Math.min(1, currentHyperfocus.quality + 0.05) : currentHyperfocus.quality
      }
    });
  }

  private manageEnergy() {
    const state = this.state$.value;
    const { energy, hyperfocus } = state;

    // Calculate energy consumption rate based on hyperfocus state
    const consumptionRate = hyperfocus.active ? 
      this.ENERGY_DECAY_RATE * (1 + hyperfocus.intensity) :
      this.ENERGY_DECAY_RATE;

    // Calculate recovery efficiency based on sustained duration
    const recoveryEfficiency = Math.max(0.3, energy.efficiency - (energy.sustained_duration * 0.001));

    // Update energy levels
    const newEnergy = Math.max(
      this.MIN_ENERGY,
      energy.current - consumptionRate + (energy.recovery_rate * recoveryEfficiency)
    );

    this.state$.next({
      ...state,
      energy: {
        ...energy,
        current: newEnergy,
        efficiency: recoveryEfficiency,
        sustained_duration: energy.sustained_duration + 0.5
      }
    });
  }

  private updateAutonomicState() {
    const currentState = this.state$.value;
    const recentDecisions = currentState.decisions.slice(-10);
    
    if (recentDecisions.length === 0) return;

    const successRate = recentDecisions.reduce((acc, d) => acc + d.success_rate, 0) / recentDecisions.length;
    const avgResonance = recentDecisions.reduce((acc, d) => acc + d.resonance, 0) / recentDecisions.length;
    const avgDepth = recentDecisions.reduce((acc, d) => acc + d.depth, 0) / recentDecisions.length;
    const energyImpact = recentDecisions.reduce((acc, d) => acc + d.energy_impact, 0) / recentDecisions.length;

    // Update confidence based on performance and energy levels
    let newConfidence = currentState.confidence;
    if (successRate > 0.7 && avgResonance > 0.6 && currentState.energy.current > 0.4) {
      newConfidence = Math.min(this.MAX_CONFIDENCE, newConfidence + this.CONFIDENCE_BOOST);
    } else {
      newConfidence = Math.max(this.MIN_CONFIDENCE, newConfidence - this.CONFIDENCE_DECAY);
    }

    // Update protection level based on depth and energy
    const newProtection = Math.min(1, (avgDepth * 1.2) * (currentState.energy.current * 0.8));

    this.state$.next({
      ...currentState,
      confidence: newConfidence,
      flow_protection: newProtection,
      resonance: avgResonance,
      depth: avgDepth
    });
  }

  public recordDecision(decision: {
    success_rate: number;
    resonance: number;
    depth: number;
    protection_level: number;
  }) {
    const currentState = this.state$.value;
    const newDecisions = [
      ...currentState.decisions,
      decision
    ].slice(-this.MAX_DECISIONS);

    this.state$.next({
      ...currentState,
      decisions: newDecisions
    });
  }

  public observeAutonomicState(): Observable<AutonomicState> {
    return this.state$.pipe(
      distinctUntilChanged()
    );
  }

  public getConfidence(): number {
    return this.state$.value.confidence;
  }

  public getProtectionLevel(): number {
    return this.state$.value.flow_protection;
  }

  public getResonance(): number {
    return this.state$.value.resonance;
  }

  public getDepth(): number {
    return this.state$.value.depth;
  }

  public getDecisionHistory(): Observable<{
    success_rate: number[];
    resonance: number[];
    depth: number[];
    protection_level: number[];
  }> {
    return this.state$.pipe(
      map(state => {
        const decisions = state.decisions;
        return {
          success_rate: decisions.map(d => d.success_rate),
          resonance: decisions.map(d => d.resonance),
          depth: decisions.map(d => d.depth),
          protection_level: decisions.map(d => d.protection_level)
        };
      })
    );
  }

  public async validateAutonomicState(): Promise<{
    isValid: boolean;
    issues: string[];
  }> {
    const state = this.state$.value;
    const issues: string[] = [];

    // Validate confidence
    if (state.confidence < this.MIN_CONFIDENCE) {
      issues.push('Confidence below minimum threshold');
    }

    // Validate protection
    if (state.depth > 0.8 && state.flow_protection < 0.7) {
      issues.push('Insufficient protection for current depth');
    }

    // Validate resonance
    if (state.resonance < 0.5) {
      issues.push('Low system resonance');
    }

    // Validate energy levels
    if (state.energy.current < this.MIN_ENERGY) {
      issues.push('Critical energy level - recovery needed');
    }

    // Validate hyperfocus conditions
    if (state.hyperfocus.active && state.energy.current < 0.3) {
      issues.push('Unsustainable hyperfocus state - energy critically low');
    }

    // Validate decision history
    if (state.decisions.length === 0) {
      issues.push('No decision history available');
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }

  public getHyperfocusMetrics(): Observable<{
    active: boolean;
    intensity: number;
    duration: number;
    quality: number;
  }> {
    return this.state$.pipe(
      map(state => state.hyperfocus),
      distinctUntilChanged()
    );
  }

  public getEnergyMetrics(): Observable<{
    current: number;
    recovery_rate: number;
    efficiency: number;
    sustained_duration: number;
  }> {
    return this.state$.pipe(
      map(state => state.energy),
      distinctUntilChanged()
    );
  }
} 