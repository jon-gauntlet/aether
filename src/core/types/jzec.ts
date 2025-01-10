import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map, distinctUntilChanged, debounceTime } from 'rxjs/operators';

export interface AutonomicState {
  presence: number;
  resonance: number;
  depth: number;
  protection: {
    natural: boolean;
    strength: number;
    adaptability: number;
  };
  flow: {
    quality: number;
    sustainability: number;
    harmony: number;
  };
  energy: {
    current: number;
    recovery: number;
    balance: number;
  };
  patterns: Array<{
    type: 'presence' | 'flow' | 'energy';
    strength: number;
    harmony: number;
  }>;
}

export class AutonomicSystem {
  private state$ = new BehaviorSubject<AutonomicState>({
    presence: 0.7,
    resonance: 0.6,
    depth: 0.5,
    protection: {
      natural: true,
      strength: 0.6,
      adaptability: 0.8
    },
    flow: {
      quality: 0.7,
      sustainability: 0.8,
      harmony: 0.7
    },
    energy: {
      current: 0.9,
      recovery: 0.8,
      balance: 0.7
    },
    patterns: []
  });

  constructor() {
    this.initializeNaturalSystem();
  }

  private initializeNaturalSystem() {
    // Allow natural emergence of patterns
    this.observePatterns();
    
    // Enable organic protection
    this.enableNaturalProtection();
    
    // Support natural energy flow
    this.maintainEnergyBalance();
  }

  private observePatterns() {
    setInterval(() => {
      const state = this.state$.value;
      
      // Detect emerging patterns naturally
      const presencePattern = this.detectNaturalPattern('presence', state);
      const flowPattern = this.detectNaturalPattern('flow', state);
      const energyPattern = this.detectNaturalPattern('energy', state);

      // Only record significant patterns
      const newPatterns = [presencePattern, flowPattern, energyPattern]
        .filter(p => p.strength > 0.3 && p.harmony > 0.4);

      this.state$.next({
        ...state,
        patterns: [...state.patterns.slice(-5), ...newPatterns]
      });
    }, 10000); // Longer interval for natural observation
  }

  private detectNaturalPattern(type: 'presence' | 'flow' | 'energy', state: AutonomicState) {
    // Calculate pattern strength based on natural resonance
    const strength = this.calculateNaturalStrength(type, state);
    
    // Determine harmony through natural alignment
    const harmony = this.calculateNaturalHarmony(type, state);

    return { type, strength, harmony };
  }

  private calculateNaturalStrength(type: 'presence' | 'flow' | 'energy', state: AutonomicState): number {
    switch (type) {
      case 'presence':
        return (state.presence * state.depth + state.resonance) / 2;
      case 'flow':
        return (state.flow.quality * state.flow.harmony) * state.presence;
      case 'energy':
        return (state.energy.current * state.energy.balance) * state.flow.sustainability;
      default:
        return 0;
    }
  }

  private calculateNaturalHarmony(type: 'presence' | 'flow' | 'energy', state: AutonomicState): number {
    const baseHarmony = (state.resonance + state.depth) / 2;
    
    switch (type) {
      case 'presence':
        return baseHarmony * state.protection.adaptability;
      case 'flow':
        return baseHarmony * state.flow.harmony;
      case 'energy':
        return baseHarmony * state.energy.balance;
      default:
        return 0;
    }
  }

  private enableNaturalProtection() {
    setInterval(() => {
      const state = this.state$.value;
      
      // Protection emerges from depth and resonance
      const naturalStrength = (state.depth * 0.7 + state.resonance * 0.3) * 
        (state.flow.harmony + state.energy.balance) / 2;

      // Adaptability increases with sustained harmony
      const adaptability = Math.min(1, state.protection.adaptability + 
        (state.flow.harmony * 0.1) * (state.presence * 0.1));

      this.state$.next({
        ...state,
        protection: {
          natural: true,
          strength: naturalStrength,
          adaptability
        }
      });
    }, 8000); // Natural protection adjustment interval
  }

  private maintainEnergyBalance() {
    setInterval(() => {
      const state = this.state$.value;
      
      // Natural energy flow based on presence and harmony
      const energyFlow = state.presence * state.flow.harmony;
      
      // Recovery through natural balance
      const naturalRecovery = (1 - state.energy.current) * state.protection.adaptability;
      
      // Balance maintains itself through harmony
      const naturalBalance = (state.flow.harmony + state.resonance) / 2;

      this.state$.next({
        ...state,
        energy: {
          current: Math.min(1, state.energy.current + (energyFlow * 0.1) - (0.05 * (1 - naturalBalance))),
          recovery: naturalRecovery,
          balance: naturalBalance
        }
      });
    }, 15000); // Natural energy flow interval
  }

  public observeState(): Observable<AutonomicState> {
    return this.state$.pipe(
      distinctUntilChanged()
    );
  }

  public getPresenceMetrics(): Observable<{
    presence: number;
    resonance: number;
    depth: number;
  }> {
    return this.state$.pipe(
      map(state => ({
        presence: state.presence,
        resonance: state.resonance,
        depth: state.depth
      })),
      distinctUntilChanged()
    );
  }

  public getFlowMetrics(): Observable<{
    quality: number;
    sustainability: number;
    harmony: number;
  }> {
    return this.state$.pipe(
      map(state => state.flow),
      distinctUntilChanged()
    );
  }

  public getEnergyMetrics(): Observable<{
    current: number;
    recovery: number;
    balance: number;
  }> {
    return this.state$.pipe(
      map(state => state.energy),
      distinctUntilChanged()
    );
  }

  public async validateState(): Promise<{
    isValid: boolean;
    insights: string[];
  }> {
    const state = this.state$.value;
    const insights: string[] = [];

    // Natural validation through harmony assessment
    const harmonyLevel = (
      state.flow.harmony + 
      state.energy.balance + 
      state.protection.adaptability
    ) / 3;

    if (harmonyLevel < 0.4) {
      insights.push('System seeking natural harmony');
    }

    if (state.presence < 0.3) {
      insights.push('Presence naturally diminished');
    }

    if (state.energy.balance < 0.4) {
      insights.push('Energy balance needs natural restoration');
    }

    if (state.protection.strength < 0.5 && state.depth > 0.7) {
      insights.push('Protection naturally emerging for depth');
    }

    return {
      isValid: harmonyLevel > 0.6 && insights.length === 0,
      insights
    };
  }
} 