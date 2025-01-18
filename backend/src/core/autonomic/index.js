import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';

/**
 * @typedef {Object} Wave
 * @property {number} frequency
 * @property {number} amplitude
 * @property {number} phase
 */

/**
 * @typedef {Object} Resonance
 * @property {Wave} primary
 * @property {Wave[]} harmonics
 * @property {number} coherence
 * @property {number} stability
 */

/**
 * @typedef {Object} Field
 * @property {Object} center
 * @property {number} center.x
 * @property {number} center.y
 * @property {number} center.z
 * @property {number} radius
 * @property {number} strength
 * @property {number} coherence
 * @property {number} stability
 * @property {Wave[]} waves
 */

/**
 * @typedef {Object} Protection
 * @property {number} level
 * @property {string} type
 * @property {number} strength
 * @property {number} resilience
 * @property {number} adaptability
 * @property {boolean} natural
 * @property {Field} field
 */

/**
 * @typedef {Object} FlowMetrics
 * @property {number} velocity
 * @property {number} focus
 * @property {number} energy
 * @property {number} intensity
 * @property {number} coherence
 * @property {number} resonance
 * @property {number} presence
 * @property {number} harmony
 * @property {number} rhythm
 * @property {number} depth
 * @property {number} clarity
 * @property {number} stability
 * @property {number} quality
 */

/**
 * @typedef {Object} NaturalPattern
 * @property {string} type
 * @property {number} strength
 * @property {number} resonance
 */

/**
 * @typedef {Object} SacredSpace
 * @property {string} id
 * @property {string} type
 * @property {Protection} protection
 * @property {Resonance} resonance
 * @property {NaturalPattern[]} patterns
 */

/**
 * @typedef {Object} AutonomicMetrics
 * @property {number} confidence
 * @property {number} pattern_resonance
 * @property {number} flow_protection
 * @property {'active'|'passive'|'protective'} mode
 */

/**
 * @typedef {Object} EnhancedFlowState
 * @property {string} id
 * @property {string} type
 * @property {FlowMetrics} metrics
 * @property {Protection} protection
 * @property {NaturalPattern[]} patterns
 * @property {SacredSpace[]} spaces
 * @property {Resonance} resonance
 * @property {number} timestamp
 * @property {string} developmentPhase
 * @property {AutonomicMetrics} autonomicMetrics
 * @property {Object} energyState
 * @property {number} energyState.current
 * @property {number} energyState.efficiency
 * @property {'charging'|'discharging'|'stable'} energyState.phase
 */

export class AutonomicSystem {
  constructor() {
    /** @type {BehaviorSubject<EnhancedFlowState|null>} */
    this.flowState$ = new BehaviorSubject(null);
    /** @type {number} */
    this.naturalRhythm = 1.618033988749895; // Golden ratio
    /** @type {BehaviorSubject<string>} */
    this.developmentPhase$ = new BehaviorSubject('CONFIGURATION');
    
    this.initializeNaturalState();
    this.initializeAutonomicObservables();
  }

  initializeAutonomicObservables() {
    // Monitor development phase transitions
    this.developmentPhase$.pipe(
      distinctUntilChanged()
    ).subscribe(phase => {
      const currentState = this.flowState$.value;
      if (!currentState) return;

      this.flowState$.next({
        ...currentState,
        developmentPhase: phase,
        autonomicMetrics: this.calculateAutonomicMetrics(currentState)
      });
    });
  }

  /**
   * @param {EnhancedFlowState} state
   * @returns {AutonomicMetrics}
   */
  calculateAutonomicMetrics(state) {
    const patternStrength = state.patterns.reduce((acc, p) => acc + p.strength, 0) / state.patterns.length;
    const resonanceStrength = state.patterns.reduce((acc, p) => acc + p.resonance, 0) / state.patterns.length;

    return {
      confidence: state.metrics.stability,
      pattern_resonance: resonanceStrength,
      flow_protection: state.protection.strength,
      mode: state.protection.type === 'autonomous' ? 'active' : 
            state.protection.type === 'enhanced' ? 'protective' : 'passive'
    };
  }

  /**
   * @returns {Wave}
   */
  createNaturalWave() {
    return {
      frequency: this.naturalRhythm,
      amplitude: 1,
      phase: 0
    };
  }

  /**
   * @returns {Resonance}
   */
  createNaturalResonance() {
    const primaryWave = this.createNaturalWave();
    return {
      primary: primaryWave,
      harmonics: [
        { ...primaryWave, frequency: primaryWave.frequency * this.naturalRhythm },
        { ...primaryWave, frequency: primaryWave.frequency * this.naturalRhythm * this.naturalRhythm }
      ],
      coherence: 1,
      stability: 1
    };
  }

  /**
   * @param {string} type
   * @returns {SacredSpace}
   */
  createSacredSpace(type) {
    return {
      id: crypto.randomUUID(),
      type,
      protection: {
        level: 1,
        type: 'natural',
        strength: 1,
        resilience: 1,
        adaptability: 1,
        natural: true,
        field: {
          center: { x: 0, y: 0, z: 0 },
          radius: 1,
          strength: 1,
          coherence: 1,
          stability: 1,
          waves: [this.createNaturalWave()]
        }
      },
      resonance: this.createNaturalResonance(),
      patterns: []
    };
  }

  initializeNaturalState() {
    /** @type {EnhancedFlowState} */
    const initialState = {
      id: crypto.randomUUID(),
      type: 'natural',
      metrics: {
        velocity: 0.8,
        focus: 0.9,
        energy: 1,
        intensity: 0.8,
        coherence: 1,
        resonance: this.naturalRhythm,
        presence: 1,
        harmony: 1,
        rhythm: 1,
        depth: 0.8,
        clarity: 1,
        stability: 1,
        quality: 1
      },
      protection: {
        level: 1,
        type: 'natural',
        strength: 1,
        resilience: 1,
        adaptability: 1,
        natural: true,
        field: {
          center: { x: 0, y: 0, z: 0 },
          radius: 1,
          strength: 1,
          coherence: 1,
          stability: 1,
          waves: [this.createNaturalWave()]
        }
      },
      patterns: [],
      spaces: [
        this.createSacredSpace('flow'),
        this.createSacredSpace('presence'),
        this.createSacredSpace('connection')
      ],
      resonance: this.createNaturalResonance(),
      timestamp: Date.now(),
      developmentPhase: 'CONFIGURATION',
      autonomicMetrics: {
        confidence: 1,
        pattern_resonance: 1,
        flow_protection: 1,
        mode: 'active'
      },
      energyState: {
        current: 1,
        efficiency: 1,
        phase: 'stable'
      }
    };

    this.flowState$.next(initialState);
  }

  /**
   * @returns {Observable<EnhancedFlowState|null>}
   */
  observeFlow() {
    return this.flowState$.asObservable();
  }

  /**
   * @param {NaturalPattern} pattern
   */
  evolvePattern(pattern) {
    const currentState = this.flowState$.value;
    if (!currentState) return;

    // Transition to optimization phase during pattern evolution
    this.developmentPhase$.next('OPTIMIZATION');

    /** @type {EnhancedFlowState} */
    const evolvedState = {
      ...currentState,
      patterns: [...currentState.patterns, pattern],
      metrics: {
        ...currentState.metrics,
        coherence: Math.min(currentState.metrics.coherence * this.naturalRhythm, 1),
        resonance: currentState.metrics.resonance * this.naturalRhythm
      },
      resonance: {
        ...currentState.resonance,
        coherence: Math.min(currentState.resonance.coherence * this.naturalRhythm, 1)
      },
      energyState: {
        ...currentState.energyState,
        efficiency: Math.min(currentState.energyState.efficiency * this.naturalRhythm, 1)
      },
      timestamp: Date.now()
    };

    this.flowState$.next(evolvedState);
  }

  maintainHarmony() {
    const currentState = this.flowState$.value;
    if (!currentState) return;

    // Transition to healing phase during harmony maintenance
    this.developmentPhase$.next('HEALING');

    /** @type {EnhancedFlowState} */
    const harmonizedState = {
      ...currentState,
      metrics: {
        ...currentState.metrics,
        harmony: Math.min(currentState.metrics.harmony * this.naturalRhythm, 1),
        stability: Math.min(currentState.metrics.stability * this.naturalRhythm, 1)
      },
      resonance: {
        ...currentState.resonance,
        stability: Math.min(currentState.resonance.stability * this.naturalRhythm, 1)
      },
      energyState: {
        ...currentState.energyState,
        phase: currentState.energyState.efficiency > 0.8 ? 'charging' :
              currentState.energyState.efficiency < 0.2 ? 'discharging' : 'stable'
      }
    };

    this.flowState$.next(harmonizedState);
  }

  protectState() {
    const currentState = this.flowState$.value;
    if (!currentState) return;

    // Transition to protection phase
    this.developmentPhase$.next('PROTECTION');

    /** @type {EnhancedFlowState} */
    const protectedState = {
      ...currentState,
      protection: {
        ...currentState.protection,
        strength: Math.min(currentState.protection.strength * this.naturalRhythm, 1),
        resilience: Math.min(currentState.protection.resilience * this.naturalRhythm, 1)
      }
    };

    this.flowState$.next(protectedState);
  }
} 