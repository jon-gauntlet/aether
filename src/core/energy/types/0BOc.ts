import { BehaviorSubject, Observable } from 'rxjs';
import { Field, FlowState } from '../types/base';
import { Energy, EnergyMetrics } from '../energy/types';
import { ConsciousnessState } from '../types/consciousness';
import {
  EnergyPattern,
  PatternState,
  PatternContext,
  PatternMatch,
  PatternMetrics
} from './types';
import { PatternEvolution, EvolutionState } from './PatternEvolution';

export interface PatternSystemState {
  activePattern: EnergyPattern | null;
  patternHistory: Array<{
    timestamp: Date;
    pattern: EnergyPattern;
    success: boolean;
  }>;
  isStable: boolean;
}

export class PatternSystem {
  private state$: BehaviorSubject<PatternSystemState>;
  private evolution: PatternEvolution;
  private readonly MATCH_THRESHOLD = 0.7;

  constructor() {
    this.state$ = new BehaviorSubject<PatternSystemState>({
      activePattern: null,
      patternHistory: [],
      isStable: true
    });
    this.evolution = new PatternEvolution();
  }

  public getState(): Observable<PatternSystemState> {
    return this.state$.asObservable();
  }

  public createPattern(
    flowState: FlowState,
    energy: Energy,
    metrics: EnergyMetrics,
    context?: Partial<PatternContext>
  ): EnergyPattern {
    const pattern: EnergyPattern = {
      id: this.generateId(),
      name: `Pattern_${Date.now()}`,
      flowState,
      energyLevels: { ...energy },
      metrics: { ...metrics },
      state: PatternState.EVOLVING,
      evolution: {
        version: 1,
        history: [{
          timestamp: new Date(Date.now()),
          changes: {},
          success: true
        }]
      },
      metadata: context?.metadata
    };

    const currentState = this.state$.getValue();
    if (!currentState.activePattern) {
      this.state$.next({
        ...currentState,
        activePattern: pattern
      });
    }

    return pattern;
  }

  public findMatchingPattern(
    flowState: FlowState,
    energy: Energy,
    context?: Partial<PatternContext>
  ): PatternMatch | null {
    let evolutionState: EvolutionState;
    this.evolution.getState().subscribe(state => {
      evolutionState = state;
    });

    const matches = evolutionState!.patterns
      .map(pattern => ({
        pattern,
        confidence: this.calculateConfidence(pattern, flowState, energy, context),
        context: this.createContext(flowState, energy, pattern.metrics as PatternMetrics)
      }))
      .filter(match => match.confidence >= this.MATCH_THRESHOLD)
      .sort((a, b) => b.confidence - a.confidence);

    return matches.length > 0 ? matches[0] : null;
  }

  public findMatches(
    field: Field,
    consciousness: ConsciousnessState
  ): PatternMatch[] {
    let evolutionState: EvolutionState;
    this.evolution.getState().subscribe(state => {
      evolutionState = state;
    });

    return evolutionState!.patterns
      .map(pattern => ({
        pattern,
        confidence: this.calculateFieldConfidence(pattern, field, consciousness),
        context: this.createContext(
          consciousness.currentState,
          field.energy,
          pattern.metrics as PatternMetrics
        )
      }))
      .filter(match => match.confidence >= this.MATCH_THRESHOLD)
      .sort((a, b) => b.confidence - a.confidence);
  }

  public evolvePattern(
    pattern: EnergyPattern,
    context: {
      energyLevels: Energy;
      metrics: EnergyMetrics;
    },
    wasSuccessful: boolean
  ): EnergyPattern {
    const evolvedPattern = this.evolution.evolvePattern(pattern, context, wasSuccessful);
    
    const currentState = this.state$.getValue();
    this.state$.next({
      ...currentState,
      patternHistory: [
        ...currentState.patternHistory,
        {
          timestamp: new Date(Date.now()),
          pattern: evolvedPattern,
          success: wasSuccessful
        }
      ],
      isStable: evolvedPattern.state === PatternState.STABLE
    });

    return evolvedPattern;
  }

  private calculateConfidence(
    pattern: EnergyPattern,
    flowState: FlowState,
    energy: Energy,
    context?: Partial<PatternContext>
  ): number {
    const stateMatch = pattern.flowState === flowState ? 1 : 0;
    const energyMatch = this.calculateEnergyMatch(pattern.energyLevels, energy);
    const contextMatch = context ? this.calculateContextMatch(pattern, context) : 1;

    return (stateMatch * 0.4 + energyMatch * 0.4 + contextMatch * 0.2);
  }

  private calculateFieldConfidence(
    pattern: EnergyPattern,
    field: Field,
    consciousness: ConsciousnessState
  ): number {
    const stateMatch = pattern.flowState === consciousness.currentState ? 1 : 0;
    const energyMatch = this.calculateEnergyMatch(pattern.energyLevels, field.energy);
    const stabilityBonus = consciousness.flowSpace.stability * 0.2;

    return (stateMatch * 0.4 + energyMatch * 0.4 + stabilityBonus);
  }

  private calculateEnergyMatch(patternEnergy: Energy, currentEnergy: Energy): number {
    const mentalDiff = Math.abs(patternEnergy.mental - currentEnergy.mental);
    const physicalDiff = Math.abs(patternEnergy.physical - currentEnergy.physical);
    const emotionalDiff = Math.abs(patternEnergy.emotional - currentEnergy.emotional);

    return 1 - (mentalDiff + physicalDiff + emotionalDiff) / 3;
  }

  private calculateContextMatch(
    pattern: EnergyPattern,
    context: Partial<PatternContext>
  ): number {
    if (!context || !pattern.metadata) return 1;

    const matches = Object.keys(context).filter(key => 
      key in pattern.metadata! && pattern.metadata![key] === context[key]
    );

    return matches.length / Object.keys(context).length;
  }

  private createContext(
    flowState: FlowState,
    energy: Energy,
    metrics: PatternMetrics
  ): PatternContext {
    return {
      flowState,
      energyLevels: energy,
      metrics: {
        ...metrics,
        adaptability: 0.8,
        resonance: 0.7
      }
    };
  }

  private generateId(): string {
    return `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
} 