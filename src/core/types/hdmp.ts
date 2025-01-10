import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map, distinctUntilChanged, debounceTime } from 'rxjs/operators';

export interface AutonomicState {
  presence: number;    // Connection to source
  resonance: number;   // Harmony with truth
  depth: number;       // Inner dimensions
  protection: {
    natural: boolean;  // Organic boundaries
    strength: number;  // Foundation stability
    adaptability: number; // Living responsiveness
  };
  flow: {
    quality: number;   // Essential nature
    sustainability: number; // Enduring vitality
    harmony: number;   // Unity in motion
  };
  energy: {
    current: number;   // Present vitality
    recovery: number;  // Natural renewal
    balance: number;   // Living equilibrium
  };
  patterns: Array<{
    type: 'presence' | 'flow' | 'energy';
    strength: number;
    harmony: number;
  }>;
}

export class AutonomicSystem {
  // Sacred proportions embedded as natural constants
  private readonly GOLDEN_RATIO = 0.618033988749895;  // Divine proportion
  private readonly SILVER_RATIO = 0.414213562373095;  // Growth spiral
  private readonly BRONZE_RATIO = 0.302775637731995;  // Material harmony
  
  // Time cycles aligned with natural rhythms (in milliseconds)
  private readonly BREATH_CYCLE = 5000;      // Natural breath
  private readonly RENEWAL_CYCLE = 15000;    // Energy restoration
  private readonly HARMONY_CYCLE = 8000;     // Flow alignment
  private readonly PATTERN_CYCLE = 10000;    // Natural emergence

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
    this.observePatterns();
    this.enableNaturalProtection();
    this.maintainEnergyBalance();
  }

  private observePatterns() {
    setInterval(() => {
      const state = this.state$.value;
      
      // Detect emerging patterns through natural observation
      const presencePattern = this.detectNaturalPattern('presence', state);
      const flowPattern = this.detectNaturalPattern('flow', state);
      const energyPattern = this.detectNaturalPattern('energy', state);

      // Record only significant patterns that emerge naturally
      const newPatterns = [presencePattern, flowPattern, energyPattern]
        .filter(p => p.strength > this.BRONZE_RATIO && p.harmony > this.SILVER_RATIO);

      this.state$.next({
        ...state,
        patterns: [...state.patterns.slice(-5), ...newPatterns]
      });
    }, this.PATTERN_CYCLE);
  }

  private detectNaturalPattern(type: 'presence' | 'flow' | 'energy', state: AutonomicState) {
    const strength = this.calculateNaturalStrength(type, state);
    const harmony = this.calculateNaturalHarmony(type, state);
    return { type, strength, harmony };
  }

  private calculateNaturalStrength(type: 'presence' | 'flow' | 'energy', state: AutonomicState): number {
    switch (type) {
      case 'presence':
        return (state.presence * state.depth * this.GOLDEN_RATIO + 
                state.resonance * (1 - this.GOLDEN_RATIO));
      case 'flow':
        return (state.flow.quality * state.flow.harmony * this.SILVER_RATIO + 
                state.presence * (1 - this.SILVER_RATIO));
      case 'energy':
        return (state.energy.current * state.energy.balance * this.BRONZE_RATIO + 
                state.flow.sustainability * (1 - this.BRONZE_RATIO));
      default:
        return 0;
    }
  }

  private calculateNaturalHarmony(type: 'presence' | 'flow' | 'energy', state: AutonomicState): number {
    const baseHarmony = (state.resonance * this.GOLDEN_RATIO + state.depth * (1 - this.GOLDEN_RATIO));
    
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
      
      // Protection emerges through natural alignment
      const naturalStrength = (
        state.depth * this.GOLDEN_RATIO + 
        state.resonance * this.SILVER_RATIO
      ) * (state.flow.harmony + state.energy.balance) / 2;

      // Adaptability grows through sustained harmony
      const adaptability = Math.min(1, state.protection.adaptability + 
        (state.flow.harmony * this.BRONZE_RATIO) * 
        (state.presence * (1 - this.BRONZE_RATIO)));

      this.state$.next({
        ...state,
        protection: {
          natural: true,
          strength: naturalStrength,
          adaptability
        }
      });
    }, this.HARMONY_CYCLE);
  }

  private maintainEnergyBalance() {
    setInterval(() => {
      const state = this.state$.value;
      
      // Natural energy flow guided by presence and harmony
      const energyFlow = state.presence * state.flow.harmony * this.GOLDEN_RATIO;
      
      // Recovery through natural balance
      const naturalRecovery = (1 - state.energy.current) * 
                            state.protection.adaptability * 
                            this.SILVER_RATIO;
      
      // Balance maintained through harmonic resonance
      const naturalBalance = (state.flow.harmony * this.GOLDEN_RATIO + 
                            state.resonance * (1 - this.GOLDEN_RATIO));

      this.state$.next({
        ...state,
        energy: {
          current: Math.min(1, state.energy.current + 
                   (energyFlow * this.BRONZE_RATIO) - 
                   (0.05 * (1 - naturalBalance))),
          recovery: naturalRecovery,
          balance: naturalBalance
        }
      });
    }, this.RENEWAL_CYCLE);
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
      state.flow.harmony * this.GOLDEN_RATIO + 
      state.energy.balance * this.SILVER_RATIO + 
      state.protection.adaptability * this.BRONZE_RATIO
    );

    if (harmonyLevel < this.BRONZE_RATIO) {
      insights.push('System seeking natural harmony');
    }

    if (state.presence < this.SILVER_RATIO) {
      insights.push('Presence naturally diminished');
    }

    if (state.energy.balance < this.BRONZE_RATIO) {
      insights.push('Energy balance needs natural restoration');
    }

    if (state.protection.strength < this.SILVER_RATIO && state.depth > this.GOLDEN_RATIO) {
      insights.push('Protection naturally emerging for depth');
    }

    return {
      isValid: harmonyLevel > this.GOLDEN_RATIO && insights.length === 0,
      insights
    };
  }
} 