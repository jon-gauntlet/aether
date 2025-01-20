import { Observable } from 'rxjs';
import { Stream } from '../experience/flow';

/**
 * @typedef {Object} FlowMetrics
 * @property {number} depth
 * @property {number} harmony
 * @property {number} energy
 * @property {number} focus
 */

/**
 * @typedef {'text'|'voice'|'visual'|'spatial'} FlowType
 */

/**
 * @typedef {Object} FlowPattern
 * @property {string} id
 * @property {FlowType} type
 * @property {FlowState} state
 * @property {FlowContext} context
 */

/**
 * @typedef {Object} FlowState
 * @property {boolean} active
 * @property {FlowDepth} depth
 * @property {number} energy
 * @property {Resonance} resonance
 * @property {number} harmony
 * @property {NaturalCycles} naturalCycles
 * @property {Protection} protection
 * @property {number} timestamp
 */

/**
 * @typedef {'surface'|'shallow'|'deep'|'profound'} FlowDepth
 */

/**
 * @typedef {Object} Resonance
 * @property {number} frequency
 * @property {number} amplitude
 * @property {number} harmony
 * @property {number} divine
 * @property {Field} field
 */

/**
 * @typedef {Object} Field
 * @property {Point3D} center
 * @property {number} radius
 * @property {number} strength
 * @property {Wave[]} waves
 */

/**
 * @typedef {Object} Wave
 * @property {number} frequency
 * @property {number} amplitude
 * @property {number} phase
 */

/**
 * @typedef {Object} Point3D
 * @property {number} x
 * @property {number} y
 * @property {number} z
 */

/**
 * @typedef {Object} NaturalCycles
 * @property {number} circadian
 * @property {number} ultradian
 * @property {number} seasonal
 */

/**
 * @typedef {Object} Protection
 * @property {number} strength
 * @property {number} resilience
 * @property {string[]} triggers
 * @property {boolean} active
 */

/**
 * @typedef {Object} FlowContext
 * @property {string} id
 * @property {string} type
 * @property {string[]} tags
 * @property {FlowMetrics} metrics
 */

/**
 * @typedef {Object} FlowTransition
 * @property {FlowState} from
 * @property {FlowState} to
 * @property {string} trigger
 * @property {number} duration
 */

/**
 * @typedef {Object} FlowHistory
 * @property {FlowState[]} states
 * @property {FlowTransition[]} transitions
 * @property {FlowMetrics[]} metrics
 * @property {string[]} context
 */

/**
 * @typedef {Object} FlowValidation
 * @property {boolean} isValid
 * @property {string[]} errors
 * @property {string[]} warnings
 * @property {FlowMetrics} metrics
 */

/**
 * @typedef {Object} Flow
 * @property {string} id
 * @property {FlowType} type
 * @property {FlowState} state
 * @property {FlowContext} context
 * @property {FlowMetrics} metrics
 * @property {FlowHistory} history
 * @property {FlowValidation} validation
 */

/**
 * @typedef {Object} FlowObservable
 * @property {Observable<FlowState>} state$
 * @property {Observable<FlowMetrics>} metrics$
 * @property {Observable<FlowContext>} context$
 * @property {Observable<FlowValidation>} validation$
 */

/**
 * @typedef {Object} FlowStream
 * @property {Stream<FlowState>} state
 * @property {Stream<FlowMetrics>} metrics
 * @property {Stream<FlowContext>} context
 * @property {Stream<FlowValidation>} validation
 */

export const createFlow = () => ({
  id: '',
  type: 'text',
  state: {
    active: false,
    depth: 'surface',
    energy: 0,
    resonance: {
      frequency: 0,
      amplitude: 0,
      harmony: 0,
      divine: 0,
      field: {
        center: { x: 0, y: 0, z: 0 },
        radius: 0,
        strength: 0,
        waves: []
      }
    },
    harmony: 0,
    naturalCycles: {
      circadian: 0,
      ultradian: 0,
      seasonal: 0
    },
    protection: {
      strength: 0,
      resilience: 0,
      triggers: [],
      active: false
    },
    timestamp: Date.now()
  },
  context: {
    id: '',
    type: '',
    tags: [],
    metrics: {
      depth: 0,
      harmony: 0,
      energy: 0,
      focus: 0
    }
  },
  metrics: {
    depth: 0,
    harmony: 0,
    energy: 0,
    focus: 0
  },
  history: {
    states: [],
    transitions: [],
    metrics: [],
    context: []
  },
  validation: {
    isValid: true,
    errors: [],
    warnings: [],
    metrics: {
      depth: 0,
      harmony: 0,
      energy: 0,
      focus: 0
    }
  }
}); 