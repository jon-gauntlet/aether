import { BehaviorSubject, Observable, Subject, merge } from 'rxjs';
import { map, filter, scan, debounceTime } from 'rxjs/operators';
import {
  ConsciousnessState,
  MindSpace,
  Resonance,
  Depth,
  Connection,
  Energy,
  EnergyFlow,
  EnergyState
} from '../types/consciousness';

interface EnergyEvent {
  type: 'flow' | 'distribution' | 'resonance' | 'recovery';
  data: any;
  timestamp: number;
}

export class EnergySystem {
  private states: Map<string, BehaviorSubject<EnergyState>>;
  private events: Subject<EnergyEvent>;
  private flows: Map<string, EnergyFlow[]>;
  
  private readonly EVOLUTION_INTERVAL = 50;
  private readonly FLOW_THRESHOLD = 0.3;
  private readonly MAX_FLOWS = 100;
  
  constructor() {
    this.states = new Map();
    this.events = new Subject();
    this.flows = new Map();
    this.initializeNaturalProcesses();
  }
  
  private initializeNaturalProcesses() {
    // Natural energy evolution
    setInterval(() => this.evolveEnergy(), this.EVOLUTION_INTERVAL);
    
    // Energy flow management
    this.events.pipe(
      filter(event => event.type === 'flow'),
      debounceTime(100)
    ).subscribe(() => this.manageFlows());
    
    // Energy recovery
    this.events.pipe(
      filter(event => event.type === 'recovery'),
      debounceTime(500)
    ).subscribe(() => this.recoverEnergy());
  }
  
  // Initialize energy state for a space
  initializeEnergy(spaceId: string, type: 'focus' | 'flow' | 'rest'): EnergyState {
    const state: EnergyState = {
      id: spaceId,
      type,
      energy: this.createInitialEnergy(type),
      flows: [],
      resonance: this.createInitialResonance(type),
      recovery: {
        rate: 1,
        capacity: 1,
        threshold: 0.3
      }
    };
    
    const stateSubject = new BehaviorSubject(state);
    this.states.set(spaceId, stateSubject);
    this.flows.set(spaceId, []);
    
    this.emitEvent({
      type: 'flow',
      data: state,
      timestamp: Date.now()
    });
    
    return state;
  }
  
  // Direct energy flow between spaces
  flowEnergy(sourceId: string, targetId: string, amount: number) {
    const source = this.states.get(sourceId)?.value;
    const target = this.states.get(targetId)?.value;
    
    if (!source || !target) return;
    
    const resonance = this.calculateEnergyResonance(source, target);
    
    if (resonance > this.FLOW_THRESHOLD) {
      const flow: EnergyFlow = {
        id: `${sourceId}_${targetId}_${Date.now()}`,
        source: sourceId,
        target: targetId,
        amount: Math.min(amount, source.energy.current),
        resonance: this.createFlowResonance(resonance),
        timestamp: Date.now()
      };
      
      this.addFlow(sourceId, flow);
      this.addFlow(targetId, flow);
      
      // Update energy levels
      this.updateEnergyLevels(sourceId, targetId, flow);
      
      this.emitEvent({
        type: 'flow',
        data: flow,
        timestamp: Date.now()
      });
    }
  }
  
  private addFlow(spaceId: string, flow: EnergyFlow) {
    const flows = this.flows.get(spaceId) || [];
    const updatedFlows = [...flows, flow].slice(-this.MAX_FLOWS);
    
    this.flows.set(spaceId, updatedFlows);
    
    const state = this.states.get(spaceId)?.value;
    if (state) {
      this.states.get(spaceId)?.next({
        ...state,
        flows: updatedFlows
      });
    }
  }
  
  private updateEnergyLevels(sourceId: string, targetId: string, flow: EnergyFlow) {
    const source = this.states.get(sourceId)?.value;
    const target = this.states.get(targetId)?.value;
    
    if (!source || !target) return;
    
    // Calculate energy transfer with resonance efficiency
    const efficiency = this.calculateFlowEfficiency(flow.resonance);
    const transferAmount = flow.amount * efficiency;
    
    // Update source energy
    this.states.get(sourceId)?.next({
      ...source,
      energy: {
        ...source.energy,
        current: Math.max(0, source.energy.current - flow.amount),
        capacity: source.energy.capacity * 0.99 // Slight capacity reduction from transfer
      }
    });
    
    // Update target energy
    this.states.get(targetId)?.next({
      ...target,
      energy: {
        ...target.energy,
        current: Math.min(
          target.energy.capacity,
          target.energy.current + transferAmount
        ),
        capacity: target.energy.capacity * 1.01 // Slight capacity increase from receiving
      }
    });
  }
  
  private evolveEnergy() {
    this.states.forEach((stateSubject, id) => {
      const state = stateSubject.value;
      
      // Natural energy evolution
      const energy = this.evolveEnergyState(state.energy, state.type);
      
      stateSubject.next({
        ...state,
        energy,
        resonance: this.evolveResonance(state.resonance, state.type)
      });
      
      this.emitEvent({
        type: 'distribution',
        data: { spaceId: id, energy },
        timestamp: Date.now()
      });
    });
  }
  
  private evolveEnergyState(energy: Energy, type: EnergyState['type']): Energy {
    let current = energy.current;
    let capacity = energy.capacity;
    
    switch (type) {
      case 'focus':
        // Focus states maintain high energy but slowly drain capacity
        current = Math.min(capacity, current + 0.01);
        capacity = Math.max(1, capacity - 0.001);
        break;
      case 'flow':
        // Flow states have balanced energy/capacity evolution
        current = current + (capacity / 2 - current) * 0.1;
        capacity = Math.min(2, capacity + 0.002);
        break;
      case 'rest':
        // Rest states recover energy and capacity
        current = Math.min(capacity, current + 0.02);
        capacity = Math.min(2, capacity + 0.005);
        break;
    }
    
    return {
      current,
      capacity,
      threshold: energy.threshold,
      resonance: this.evolveEnergyResonance(energy.resonance)
    };
  }
  
  private evolveEnergyResonance(resonance: Resonance): Resonance {
    return {
      ...resonance,
      harmony: Math.min(1, resonance.harmony + 0.005),
      field: {
        ...resonance.field,
        strength: Math.min(1, resonance.field.strength + 0.01)
      }
    };
  }
  
  private evolveResonance(resonance: Resonance, type: EnergyState['type']): Resonance {
    let frequency = resonance.frequency;
    let amplitude = resonance.amplitude;
    
    switch (type) {
      case 'focus':
        frequency = Math.max(0.2, frequency - 0.01);
        amplitude = Math.min(0.8, amplitude + 0.01);
        break;
      case 'flow':
        frequency = Math.min(0.8, frequency + 0.01);
        amplitude = Math.max(0.4, amplitude - 0.01);
        break;
      default:
        // Maintain current values for rest state
        break;
    }
    
    return {
      ...resonance,
      frequency,
      amplitude,
      harmony: Math.min(1, resonance.harmony + 0.005),
      field: {
        ...resonance.field,
        strength: Math.min(1, resonance.field.strength + 0.01)
      }
    };
  }
  
  private recoverEnergy() {
    this.states.forEach((stateSubject, id) => {
      const state = stateSubject.value;
      
      if (state.energy.current < state.recovery.threshold * state.energy.capacity) {
        const recoveredEnergy = {
          ...state.energy,
          current: Math.min(
            state.energy.capacity,
            state.energy.current + state.recovery.rate * 0.1
          )
        };
        
        stateSubject.next({
          ...state,
          energy: recoveredEnergy
        });
        
        this.emitEvent({
          type: 'recovery',
          data: { spaceId: id, energy: recoveredEnergy },
          timestamp: Date.now()
        });
      }
    });
  }
  
  private calculateEnergyResonance(a: EnergyState, b: EnergyState): number {
    const resonanceHarmony = this.calculateResonanceHarmony(
      a.resonance,
      b.resonance
    );
    
    const energyCompatibility = this.calculateEnergyCompatibility(
      a.energy,
      b.energy
    );
    
    return (resonanceHarmony + energyCompatibility) / 2;
  }
  
  private calculateResonanceHarmony(a: Resonance, b: Resonance): number {
    const frequencyDiff = Math.abs(a.frequency - b.frequency);
    const amplitudeDiff = Math.abs(a.amplitude - b.amplitude);
    return Math.max(0, 1 - (frequencyDiff + amplitudeDiff) / 2);
  }
  
  private calculateEnergyCompatibility(a: Energy, b: Energy): number {
    const currentRatio = Math.min(a.current, b.current) / Math.max(a.current, b.current);
    const capacityRatio = Math.min(a.capacity, b.capacity) / Math.max(a.capacity, b.capacity);
    return (currentRatio + capacityRatio) / 2;
  }
  
  private calculateFlowEfficiency(resonance: Resonance): number {
    return Math.min(1, (resonance.harmony + resonance.field.strength) / 2);
  }
  
  private createInitialEnergy(type: EnergyState['type']): Energy {
    switch (type) {
      case 'focus':
        return {
          current: 0.8,
          capacity: 1,
          threshold: 0.3,
          resonance: this.createInitialResonance(type)
        };
      case 'flow':
        return {
          current: 0.6,
          capacity: 1.2,
          threshold: 0.2,
          resonance: this.createInitialResonance(type)
        };
      default:
        return {
          current: 0.5,
          capacity: 1,
          threshold: 0.1,
          resonance: this.createInitialResonance(type)
        };
    }
  }
  
  private createInitialResonance(type: EnergyState['type']): Resonance {
    switch (type) {
      case 'focus':
        return {
          frequency: 0.3,
          amplitude: 0.7,
          harmony: 1,
          field: {
            center: { x: 0, y: 0, z: 0 },
            radius: 1,
            strength: 1,
            harmonics: []
          }
        };
      case 'flow':
        return {
          frequency: 0.7,
          amplitude: 0.5,
          harmony: 1,
          field: {
            center: { x: 0, y: 0, z: 0 },
            radius: 1.5,
            strength: 1,
            harmonics: []
          }
        };
      default:
        return {
          frequency: 0.5,
          amplitude: 0.5,
          harmony: 1,
          field: {
            center: { x: 0, y: 0, z: 0 },
            radius: 1,
            strength: 1,
            harmonics: []
          }
        };
    }
  }
  
  private createFlowResonance(strength: number): Resonance {
    return {
      frequency: 0.5,
      amplitude: strength,
      harmony: 1,
      field: {
        center: { x: 0, y: 0, z: 0 },
        radius: strength,
        strength: strength,
        harmonics: []
      }
    };
  }
  
  private emitEvent(event: EnergyEvent) {
    this.events.next(event);
  }
  
  // Public observation methods
  observeEnergy(id: string): Observable<EnergyState | undefined> {
    const subject = this.states.get(id);
    return subject ? subject.asObservable() :
      new Observable(sub => sub.next(undefined));
  }
  
  observeEvents(): Observable<EnergyEvent> {
    return this.events.asObservable();
  }
  
  observeFlows(spaceId: string): Observable<EnergyFlow[]> {
    return this.observeEnergy(spaceId).pipe(
      map(state => state?.flows || [])
    );
  }
} 