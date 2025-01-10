import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { map, distinctUntilChanged, debounceTime } from 'rxjs/operators';
import { FlowStateGuardian } from '../flow/FlowStateGuardian';
import { EnergySystem } from '../energy/EnergySystem';
import { PredictiveValidation } from '../autonomic/PredictiveValidation';
import { FlowContext, FlowProtection, HyperfocusMetrics, EnhancedEnergyState } from '../types/base';

export interface SystemState {
  flow: FlowContext;
  protection: FlowProtection;
  hyperfocus: HyperfocusMetrics;
  energy: EnhancedEnergyState;
  validation: {
    patterns: any[];
    errors: any[];
  };
}

export class SystemIntegration {
  private state$ = new BehaviorSubject<SystemState | null>(null);
  
  private readonly SYNC_INTERVAL = 1000; // 1 second
  private readonly PROTECTION_THRESHOLD = 0.85;
  private readonly EMERGENCY_THRESHOLD = 0.3;

  constructor(
    private flow: FlowStateGuardian,
    private energy: EnergySystem,
    private validation: PredictiveValidation
  ) {
    this.initializeIntegration();
  }

  private initializeIntegration() {
    // Create initial context
    const flowContext = this.flow.createContext();

    // Set up system state monitoring
    combineLatest([
      this.flow.observeContext(flowContext),
      this.flow.observeProtection(flowContext),
      this.flow.observeHyperfocus(flowContext),
      this.energy.observeEnergy(),
      this.validation.getValidationPatterns(),
      this.validation.observeTypeErrors()
    ]).pipe(
      debounceTime(this.SYNC_INTERVAL),
      map(([flow, protection, hyperfocus, energy, patterns, errors]) => ({
        flow,
        protection,
        hyperfocus,
        energy,
        validation: {
          patterns,
          errors
        }
      }))
    ).subscribe(state => {
      this.state$.next(state);
      this.enforceProtection(state);
    });
  }

  private enforceProtection(state: SystemState) {
    const needsProtection = 
      state.hyperfocus.intensity > this.PROTECTION_THRESHOLD ||
      state.energy.current / state.energy.max < this.EMERGENCY_THRESHOLD;

    if (needsProtection && state.protection.type !== 'hard') {
      // Enhance protection
      this.flow.setMode(state.flow.id, 'protected');
      this.energy.pause(state.energy);
    }
  }

  public observeSystemState(): Observable<SystemState | null> {
    return this.state$.asObservable();
  }

  public async validateSystemState(): Promise<boolean> {
    const state = this.state$.value;
    if (!state) return false;

    // Validate core metrics
    const energyValid = state.energy.current > 0 && state.energy.efficiency > 0;
    const flowValid = state.flow.depth > 0 && state.flow.metrics.coherence > 0;
    const focusValid = state.hyperfocus.intensity >= 0 && state.hyperfocus.contextRetention > 0;

    // Check protection levels
    const protectionValid = 
      (state.hyperfocus.intensity > this.PROTECTION_THRESHOLD && state.protection.type === 'hard') ||
      (state.hyperfocus.intensity <= this.PROTECTION_THRESHOLD);

    // Validate patterns
    const patternsValid = state.validation.patterns.length > 0 && 
                         state.validation.errors.length === 0;

    return energyValid && flowValid && focusValid && protectionValid && patternsValid;
  }

  public getSystemMetrics(): {
    flowQuality: number;
    energyEfficiency: number;
    protectionLevel: number;
    patternCoherence: number;
  } {
    const state = this.state$.value;
    if (!state) return {
      flowQuality: 0,
      energyEfficiency: 0,
      protectionLevel: 0,
      patternCoherence: 0
    };

    return {
      flowQuality: state.flow.metrics.coherence * state.hyperfocus.intensity,
      energyEfficiency: state.energy.efficiency * state.energy.recoveryEfficiency,
      protectionLevel: state.protection.level * (state.protection.type === 'hard' ? 1.5 : 1),
      patternCoherence: state.validation.patterns.length > 0 ? 
        state.validation.patterns.reduce((acc, p) => acc + (p.strength || 0), 0) / 
        state.validation.patterns.length : 0
    };
  }
}