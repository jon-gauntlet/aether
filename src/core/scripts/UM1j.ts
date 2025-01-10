import { BehaviorSubject, Observable, merge } from 'rxjs';
import { map, filter, scan } from 'rxjs/operators';
import {
  ConsciousnessState,
  MindSpace,
  Depth,
  Protection,
  Resonance,
  Presence,
  Coherence
} from '../types/consciousness';

interface PresenceState {
  id: string;
  type: 'deep' | 'resonant' | 'flow' | 'open';
  consciousness: ConsciousnessState;
  protection: Protection;
  disturbanceThreshold: number;
  recoveryPoints: RecoveryPoint[];
}

interface RecoveryPoint {
  timestamp: number;
  consciousness: ConsciousnessState;
  resonance: Resonance;
  depth: Depth;
}

interface Disturbance {
  type: 'notification' | 'interruption' | 'context-switch' | 'noise';
  intensity: number;
  source: string;
  resonance: Resonance;
}

export class PresenceSystem {
  private states: Map<string, BehaviorSubject<PresenceState>>;
  private activeSpaces: Map<string, MindSpace>;
  
  private readonly PROTECTION_DECAY = 0.99;
  private readonly RECOVERY_LIMIT = 10;
  private readonly COHERENCE_THRESHOLD = 0.7;
  
  constructor() {
    this.states = new Map();
    this.activeSpaces = new Map();
    this.initializeNaturalProcesses();
  }
  
  private initializeNaturalProcesses() {
    // Natural protection evolution
    setInterval(() => this.evolveProtection(), 100);
    
    // Recovery point management
    setInterval(() => this.manageRecoveryPoints(), 500);
    
    // Space resonance
    setInterval(() => this.harmonizeSpaces(), 200);
  }
  
  // Enter a new presence state
  enterState(id: string, type: PresenceState['type'], space: MindSpace) {
    const state: PresenceState = {
      id,
      type,
      consciousness: {
        id: `consciousness_${id}`,
        resonance: this.createInitialResonance(type),
        depth: this.createInitialDepth(type),
        energy: 1,
        coherence: 1,
        presence: 1
      },
      protection: this.createInitialProtection(type),
      disturbanceThreshold: this.getInitialThreshold(type),
      recoveryPoints: []
    };
    
    const stateSubject = new BehaviorSubject(state);
    this.states.set(id, stateSubject);
    this.activeSpaces.set(id, space);
    
    this.createRecoveryPoint(id);
  }
  
  // Handle potential disturbance
  handleDisturbance(stateId: string, disturbance: Disturbance): boolean {
    const state = this.states.get(stateId)?.value;
    if (!state) return true; // No protection if state doesn't exist
    
    // Check if disturbance breaks through protection
    const breaksThrough = this.calculateDisturbanceImpact(state, disturbance);
    
    if (breaksThrough) {
      // Create recovery point before disturbance
      this.createRecoveryPoint(stateId);
      
      // Update state with reduced protection
      this.states.get(stateId)?.next({
        ...state,
        protection: this.weakenProtection(state.protection, disturbance)
      });
    }
    
    return breaksThrough;
  }
  
  // Recover to previous state
  async recoverState(stateId: string): Promise<boolean> {
    const state = this.states.get(stateId)?.value;
    if (!state || state.recoveryPoints.length === 0) return false;
    
    const recoveryPoint = state.recoveryPoints[state.recoveryPoints.length - 1];
    
    // Gradually restore state
    await this.transitionTo(stateId, {
      ...state,
      consciousness: recoveryPoint.consciousness,
      protection: this.strengthenProtection(state.protection)
    });
    
    return true;
  }
  
  private async transitionTo(stateId: string, targetState: PresenceState) {
    const state = this.states.get(stateId)?.value;
    if (!state) return;
    
    const steps = 20;
    const stepDuration = 50;
    
    for (let i = 0; i <= steps; i++) {
      const progress = i / steps;
      const interpolatedState = this.interpolateStates(state, targetState, progress);
      
      this.states.get(stateId)?.next(interpolatedState);
      await new Promise(resolve => setTimeout(resolve, stepDuration));
    }
  }
  
  private interpolateStates(
    current: PresenceState,
    target: PresenceState,
    progress: number
  ): PresenceState {
    // Cubic easing for natural feel
    const t = progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;
    
    return {
      ...current,
      consciousness: {
        ...current.consciousness,
        resonance: this.interpolateResonance(
          current.consciousness.resonance,
          target.consciousness.resonance,
          t
        ),
        depth: this.interpolateDepth(
          current.consciousness.depth,
          target.consciousness.depth,
          t
        ),
        energy: this.interpolateNumber(
          current.consciousness.energy,
          target.consciousness.energy,
          t
        ),
        coherence: this.interpolateNumber(
          current.consciousness.coherence,
          target.consciousness.coherence,
          t
        ),
        presence: this.interpolateNumber(
          current.consciousness.presence,
          target.consciousness.presence,
          t
        )
      },
      protection: this.interpolateProtection(
        current.protection,
        target.protection,
        t
      )
    };
  }
  
  private createInitialResonance(type: PresenceState['type']): Resonance {
    switch (type) {
      case 'deep':
        return {
          frequency: 0.2,
          amplitude: 0.3,
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
          frequency: 0.6,
          amplitude: 0.8,
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
  
  private createInitialDepth(type: PresenceState['type']): Depth {
    switch (type) {
      case 'deep':
        return {
          level: 0.8,
          clarity: 1,
          stillness: 1,
          presence: 1
        };
      case 'flow':
        return {
          level: 0.6,
          clarity: 0.8,
          stillness: 0.7,
          presence: 1
        };
      default:
        return {
          level: 0.3,
          clarity: 1,
          stillness: 0.5,
          presence: 1
        };
    }
  }
  
  private createInitialProtection(type: PresenceState['type']): Protection {
    switch (type) {
      case 'deep':
        return {
          strength: 0.9,
          flexibility: 0.3,
          recovery: 0.8,
          coherence: 1
        };
      case 'flow':
        return {
          strength: 0.7,
          flexibility: 0.6,
          recovery: 0.9,
          coherence: 1
        };
      default:
        return {
          strength: 0.5,
          flexibility: 0.8,
          recovery: 1,
          coherence: 1
        };
    }
  }
  
  private getInitialThreshold(type: PresenceState['type']): number {
    switch (type) {
      case 'deep': return 0.8;
      case 'flow': return 0.6;
      case 'resonant': return 0.4;
      default: return 0.2;
    }
  }
  
  private evolveProtection() {
    this.states.forEach((stateSubject, id) => {
      const state = stateSubject.value;
      
      // Natural protection decay
      const protection = {
        ...state.protection,
        strength: state.protection.strength * this.PROTECTION_DECAY,
        coherence: Math.min(1, state.protection.coherence + 0.01)
      };
      
      // Strengthen protection in deep/flow states
      if (state.type === 'deep' || state.type === 'flow') {
        protection.strength = Math.min(
          1,
          protection.strength + 0.02
        );
      }
      
      stateSubject.next({
        ...state,
        protection
      });
    });
  }
  
  private createRecoveryPoint(stateId: string) {
    const state = this.states.get(stateId)?.value;
    if (!state) return;
    
    const recoveryPoint: RecoveryPoint = {
      timestamp: Date.now(),
      consciousness: state.consciousness,
      resonance: state.consciousness.resonance,
      depth: state.consciousness.depth
    };
    
    // Add recovery point and maintain limit
    const recoveryPoints = [
      ...state.recoveryPoints,
      recoveryPoint
    ].slice(-this.RECOVERY_LIMIT);
    
    this.states.get(stateId)?.next({
      ...state,
      recoveryPoints
    });
  }
  
  private manageRecoveryPoints() {
    const now = Date.now();
    const MAX_AGE = 30 * 60 * 1000; // 30 minutes
    
    this.states.forEach((stateSubject, id) => {
      const state = stateSubject.value;
      
      // Remove old recovery points
      const recoveryPoints = state.recoveryPoints.filter(
        point => now - point.timestamp < MAX_AGE
      );
      
      if (recoveryPoints.length !== state.recoveryPoints.length) {
        stateSubject.next({
          ...state,
          recoveryPoints
        });
      }
    });
  }
  
  private harmonizeSpaces() {
    this.states.forEach((stateSubject, id) => {
      const state = stateSubject.value;
      const space = this.activeSpaces.get(id);
      
      if (space && state.consciousness.coherence > this.COHERENCE_THRESHOLD) {
        // Harmonize space with consciousness
        this.activeSpaces.set(id, {
          ...space,
          state: {
            ...space.state,
            resonance: this.harmonizeResonance(
              space.state.resonance,
              state.consciousness.resonance
            )
          }
        });
      }
    });
  }
  
  private calculateDisturbanceImpact(
    state: PresenceState,
    disturbance: Disturbance
  ): boolean {
    const protectionStrength = 
      state.protection.strength * 
      state.protection.coherence * 
      state.consciousness.presence;
    
    const disturbanceStrength = 
      disturbance.intensity * 
      (1 - this.calculateResonanceHarmony(
        state.consciousness.resonance,
        disturbance.resonance
      ));
    
    return disturbanceStrength > protectionStrength;
  }
  
  private weakenProtection(
    protection: Protection,
    disturbance: Disturbance
  ): Protection {
    return {
      ...protection,
      strength: Math.max(0.1, protection.strength - disturbance.intensity * 0.3),
      coherence: Math.max(0.5, protection.coherence - disturbance.intensity * 0.2)
    };
  }
  
  private strengthenProtection(protection: Protection): Protection {
    return {
      ...protection,
      strength: Math.min(1, protection.strength + 0.2),
      coherence: Math.min(1, protection.coherence + 0.1)
    };
  }
  
  private calculateResonanceHarmony(a: Resonance, b: Resonance): number {
    const frequencyDiff = Math.abs(a.frequency - b.frequency);
    const amplitudeDiff = Math.abs(a.amplitude - b.amplitude);
    return Math.max(0, 1 - (frequencyDiff + amplitudeDiff) / 2);
  }
  
  private harmonizeResonance(a: Resonance, b: Resonance): Resonance {
    return {
      frequency: (a.frequency + b.frequency) / 2,
      amplitude: Math.max(a.amplitude, b.amplitude),
      harmony: Math.min(1, (a.harmony + b.harmony) / 2 + 0.1),
      field: {
        ...a.field,
        strength: Math.min(1, (a.field.strength + b.field.strength) / 2 + 0.1)
      }
    };
  }
  
  private interpolateNumber(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }
  
  private interpolateResonance(
    a: Resonance,
    b: Resonance,
    t: number
  ): Resonance {
    return {
      frequency: this.interpolateNumber(a.frequency, b.frequency, t),
      amplitude: this.interpolateNumber(a.amplitude, b.amplitude, t),
      harmony: this.interpolateNumber(a.harmony, b.harmony, t),
      field: {
        ...a.field,
        strength: this.interpolateNumber(
          a.field.strength,
          b.field.strength,
          t
        )
      }
    };
  }
  
  private interpolateDepth(a: Depth, b: Depth, t: number): Depth {
    return {
      level: this.interpolateNumber(a.level, b.level, t),
      clarity: this.interpolateNumber(a.clarity, b.clarity, t),
      stillness: this.interpolateNumber(a.stillness, b.stillness, t),
      presence: this.interpolateNumber(a.presence, b.presence, t)
    };
  }
  
  private interpolateProtection(
    a: Protection,
    b: Protection,
    t: number
  ): Protection {
    return {
      strength: this.interpolateNumber(a.strength, b.strength, t),
      flexibility: this.interpolateNumber(a.flexibility, b.flexibility, t),
      recovery: this.interpolateNumber(a.recovery, b.recovery, t),
      coherence: this.interpolateNumber(a.coherence, b.coherence, t)
    };
  }
  
  // Public observation methods
  observePresence(id: string): Observable<PresenceState | undefined> {
    const subject = this.states.get(id);
    return subject ? subject.asObservable() :
      new Observable(sub => sub.next(undefined));
  }
  
  observeProtection(id: string): Observable<Protection | undefined> {
    return this.observePresence(id).pipe(
      map(state => state?.protection)
    );
  }
} 