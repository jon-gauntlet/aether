import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map, distinctUntilChanged, debounceTime } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';
import { EnergyState, DevelopmentPhase } from '../types/base';

export interface EnhancedEnergyState extends EnergyState {
  focusMultiplier: number;
  recoveryEfficiency: number;
  sustainedDuration: number;
  developmentPhase: DevelopmentPhase;
}

export class EnergySystem {
  private states$ = new BehaviorSubject<Map<string, EnhancedEnergyState>>(new Map());
  
  private readonly BASE_RECOVERY_RATE = 0.1;
  private readonly BASE_DECAY_RATE = 0.05;
  private readonly EFFICIENCY_BOOST = 1.2;
  private readonly EFFICIENCY_PENALTY = 0.8;
  private readonly FOCUS_DECAY_RATE = 0.02;
  private readonly MIN_RECOVERY_THRESHOLD = 0.3;
  private readonly SUSTAINED_THRESHOLD = 0.6;
  private readonly PEAK_THRESHOLD = 0.8;
  private readonly MAX_SUSTAINED_HOURS = 16;
  private readonly OPTIMAL_RECOVERY_DURATION = 6; // hours
  private readonly RECOVERY_BOOST_THRESHOLD = 0.4;

  constructor() {
    this.initializeEnergyTracking();
  }

  private initializeEnergyTracking() {
    setInterval(() => {
      this.updateEnergies();
    }, 60 * 1000); // Every minute
  }

  private updateEnergies() {
    const states = this.states$.value;
    const updated = new Map(states);

    for (const [id, state] of states) {
      updated.set(id, this.evolveEnergyState(state));
    }

    this.states$.next(updated);
  }

  private evolveEnergyState(state: EnhancedEnergyState): EnhancedEnergyState {
    const timeDelta = (Date.now() - state.lastTransition) / (60 * 1000); // Minutes
    let energyDelta = 0;
    let focusMultiplier = state.focusMultiplier;
    let recoveryEfficiency = state.recoveryEfficiency;

    switch (state.phase) {
      case 'charging':
        energyDelta = this.calculateRecovery(state, timeDelta);
        recoveryEfficiency = this.updateRecoveryEfficiency(state, true);
        focusMultiplier = Math.min(1.5, focusMultiplier + 0.1);
        break;
      case 'discharging':
        energyDelta = -this.calculateDecay(state, timeDelta);
        recoveryEfficiency = this.updateRecoveryEfficiency(state, false);
        focusMultiplier = Math.max(0.5, focusMultiplier - this.FOCUS_DECAY_RATE);
        break;
      case 'stable':
        focusMultiplier = Math.max(0.8, focusMultiplier);
        recoveryEfficiency = state.recoveryEfficiency;
        break;
    }

    const newEnergy = Math.max(0, Math.min(state.max, state.current + energyDelta));
    const efficiency = this.calculateEfficiency(state, newEnergy);
    const developmentPhase = this.determineDevelopmentPhase(state, newEnergy);

    return {
      ...state,
      current: newEnergy,
      efficiency,
      focusMultiplier,
      recoveryEfficiency,
      sustainedDuration: this.updateSustainedDuration(state, developmentPhase),
      developmentPhase,
      lastTransition: Date.now()
    };
  }

  private updateRecoveryEfficiency(state: EnhancedEnergyState, isRecovering: boolean): number {
    const baseEfficiency = state.recoveryEfficiency;
    const energyRatio = state.current / state.max;
    const sustainedHours = state.sustainedDuration / 60;
    
    // Apply sustained duration penalties
    const durationPenalty = Math.max(0, (sustainedHours - this.MAX_SUSTAINED_HOURS) / this.MAX_SUSTAINED_HOURS);
    
    if (isRecovering) {
      const recoveryBoost = energyRatio < this.RECOVERY_BOOST_THRESHOLD ? 0.15 : 0.08;
      const sustainedBonus = Math.max(0, 1 - (durationPenalty * 0.5));
      return Math.min(1.2, baseEfficiency + (recoveryBoost * sustainedBonus));
    } else {
      const decayPenalty = energyRatio < this.MIN_RECOVERY_THRESHOLD ? 0.2 : 0.1;
      const sustainedPenalty = 1 + (durationPenalty * 0.3);
      return Math.max(0.6, baseEfficiency - (decayPenalty * sustainedPenalty));
    }
  }

  private updateSustainedDuration(state: EnhancedEnergyState, phase: DevelopmentPhase): number {
    const isRecovery = (p: DevelopmentPhase): boolean => p === 'recovery';
    
    // Reset duration during recovery
    if (isRecovery(phase)) {
      return 0;
    }
    
    // Continue accumulating during same non-recovery phase
    if (phase === state.developmentPhase && !isRecovery(state.developmentPhase)) {
      const currentHours = state.sustainedDuration / 60;
      
      // Apply diminishing returns after MAX_SUSTAINED_HOURS
      if (currentHours >= this.MAX_SUSTAINED_HOURS) {
        return state.sustainedDuration + 0.5; // Slower accumulation
      }
      return state.sustainedDuration + 1;
    }
    
    // Partial reset on phase change to allow for micro-recoveries
    return Math.max(0, state.sustainedDuration * 0.7);
  }

  private determineDevelopmentPhase(state: EnhancedEnergyState, energy: number): DevelopmentPhase {
    const energyRatio = energy / state.max;
    const sustainedHours = state.sustainedDuration / 60;
    
    // Force recovery if sustained too long
    if (sustainedHours > this.MAX_SUSTAINED_HOURS && energyRatio < this.SUSTAINED_THRESHOLD) {
      return 'recovery';
    }
    
    // Check for recovery phase
    if (energyRatio < this.MIN_RECOVERY_THRESHOLD || 
        (sustainedHours > this.MAX_SUSTAINED_HOURS * 0.8 && energyRatio < this.RECOVERY_BOOST_THRESHOLD)) {
      return 'recovery';
    }
    
    // Check for peak phase - requires high energy and focus
    if (energyRatio > this.PEAK_THRESHOLD && state.focusMultiplier > 1.2) {
      // Limit peak duration based on sustained hours
      return sustainedHours < this.MAX_SUSTAINED_HOURS * 0.7 ? 'peak' : 'sustained';
    }
    
    // Check for sustained phase
    if (energyRatio > this.SUSTAINED_THRESHOLD) {
      return 'sustained';
    }
    
    return 'conservation';
  }

  private calculateRecovery(state: EnhancedEnergyState, minutes: number): number {
    const baseRecovery = state.recoveryRate * minutes;
    const efficiencyFactor = state.efficiency >= 0.8 ? this.EFFICIENCY_BOOST : this.EFFICIENCY_PENALTY;
    
    // Enhanced recovery during optimal recovery periods
    const optimalRecoveryBonus = this.isOptimalRecoveryTime(state) ? 1.3 : 1;
    
    // Recovery boost when energy is very low
    const emergencyBoost = state.current / state.max < this.RECOVERY_BOOST_THRESHOLD ? 1.5 : 1;
    
    return baseRecovery * efficiencyFactor * state.recoveryEfficiency * optimalRecoveryBonus * emergencyBoost;
  }

  private isOptimalRecoveryTime(state: EnhancedEnergyState): boolean {
    const sustainedHours = state.sustainedDuration / 60;
    return sustainedHours >= this.OPTIMAL_RECOVERY_DURATION &&
           state.current / state.max < this.SUSTAINED_THRESHOLD;
  }

  private calculateDecay(state: EnhancedEnergyState, minutes: number): number {
    const baseDecay = state.decayRate * minutes;
    const efficiencyFactor = state.efficiency >= 0.8 ? this.EFFICIENCY_PENALTY : this.EFFICIENCY_BOOST;
    
    // Increased decay during extended sessions
    const sustainedPenalty = Math.max(1, (state.sustainedDuration / 60) / this.MAX_SUSTAINED_HOURS);
    
    // Focus helps reduce decay
    const focusProtection = Math.max(0.6, 1 / state.focusMultiplier);
    
    return baseDecay * efficiencyFactor * sustainedPenalty * focusProtection;
  }

  private calculateEfficiency(state: EnhancedEnergyState, newEnergy: number): number {
    const energyRatio = newEnergy / state.max;
    const timeFactor = Math.min(1, (Date.now() - state.lastTransition) / (8 * 60 * 60 * 1000));
    return Math.min(1, (energyRatio * 0.7 + timeFactor * 0.3) * state.efficiency);
  }

  public createState(): EnhancedEnergyState {
    const state: EnhancedEnergyState = {
      current: 1,
      max: 1,
      level: 1,
      type: 'development',
      efficiency: 1,
      focusMultiplier: 1,
      recoveryEfficiency: 1,
      sustainedDuration: 0,
      developmentPhase: 'sustained',
      lastTransition: Date.now(),
      recoveryRate: this.BASE_RECOVERY_RATE,
      decayRate: this.BASE_DECAY_RATE,
      phase: 'stable'
    };

    const states = this.states$.value;
    const id = uuidv4();
    states.set(id, state);
    this.states$.next(states);

    return state;
  }

  public pause(state: EnhancedEnergyState) {
    const states = this.states$.value;
    states.set(state.lastTransition.toString(), {
      ...state,
      phase: 'stable',
      lastTransition: Date.now()
    });
    this.states$.next(states);
  }

  public resume(state: EnhancedEnergyState) {
    const states = this.states$.value;
    states.set(state.lastTransition.toString(), {
      ...state,
      phase: 'discharging',
      lastTransition: Date.now()
    });
    this.states$.next(states);
  }

  public observeState(stateId: string): Observable<EnhancedEnergyState | undefined> {
    return this.states$.pipe(
      map(states => states.get(stateId)),
      distinctUntilChanged()
    );
  }

  public observeEnergy(): Observable<EnhancedEnergyState> {
    return this.states$.pipe(
      map(states => {
        const latestState = Array.from(states.values())[0];
        if (!latestState) {
          return this.createState();
        }
        return latestState;
      }),
      distinctUntilChanged()
    );
  }

  public getDevelopmentMetrics(): Observable<{
    sustainedHours: number;
    peakPerformance: number;
    recoveryEfficiency: number;
  }> {
    return this.states$.pipe(
      map(states => {
        const allStates = Array.from(states.values());
        const peakStates = allStates.filter(s => s.developmentPhase === 'peak');
        
        return {
          sustainedHours: Math.max(...allStates.map(s => s.sustainedDuration)) / 60,
          peakPerformance: peakStates.reduce((acc, s) => acc + s.focusMultiplier, 0) / peakStates.length,
          recoveryEfficiency: allStates.reduce((acc, s) => acc + s.recoveryEfficiency, 0) / allStates.length
        };
      }),
      distinctUntilChanged()
    );
  }
} 