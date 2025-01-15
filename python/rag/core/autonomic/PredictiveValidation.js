import { Observable, Subject } from 'rxjs';

/**
 * @typedef {Object} FlowMetrics
 * @property {number} velocity
 * @property {number} resistance
 * @property {number} momentum
 * @property {number} conductivity
 */

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} isValid
 * @property {number} confidence
 * @property {number} coherenceScore
 */

/**
 * @typedef {'FLOW_TRANSITION' | 'PATTERN_EMERGENCE' | 'STATE_CHANGE'} PredictionType
 */

/**
 * @typedef {Object} PredictionValidation
 * @property {PredictionType} type
 * @property {number} probability
 * @property {Field} field
 * @property {ConsciousnessState} consciousness
 */

export const PredictionType = {
  FLOW_TRANSITION: 'FLOW_TRANSITION',
  PATTERN_EMERGENCE: 'PATTERN_EMERGENCE',
  STATE_CHANGE: 'STATE_CHANGE'
};

export class PredictiveValidation {
  constructor() {
    /** @type {Subject<any[]>} */
    this.typeErrors = new Subject();
  }

  /**
   * @returns {Observable<any[]>}
   */
  observeTypeErrors() {
    return this.typeErrors.asObservable();
  }

  /**
   * @param {any} value
   * @param {string} expectedType
   * @returns {boolean}
   */
  validateType(value, expectedType) {
    const errors = [];
    const actualType = typeof value;

    if (actualType !== expectedType) {
      errors.push({
        value,
        expectedType,
        actualType,
        message: `Expected ${expectedType} but got ${actualType}`
      });
      this.typeErrors.next(errors);
      return false;
    }

    return true;
  }

  /**
   * @param {FlowMetrics} metrics
   * @returns {boolean}
   */
  validateMetrics(metrics) {
    const errors = [];
    const requiredFields = ['velocity', 'resistance', 'momentum', 'conductivity'];

    for (const field of requiredFields) {
      if (!(field in metrics)) {
        errors.push({
          field,
          message: `Missing required field: ${field}`
        });
      } else if (typeof metrics[field] !== 'number') {
        errors.push({
          field,
          value: metrics[field],
          message: `Field ${field} must be a number`
        });
      }
    }

    if (errors.length > 0) {
      this.typeErrors.next(errors);
      return false;
    }

    return true;
  }

  /**
   * @param {PredictionValidation} prediction
   * @returns {ValidationResult}
   */
  validatePrediction(prediction) {
    const { type, probability, field, consciousness } = prediction;
    const confidenceScore = probability * field.strength * 1.2;
    const coherenceScore = consciousness.metrics.coherence;

    return {
      isValid: confidenceScore > 0.6 && coherenceScore > 0.5,
      confidence: confidenceScore,
      coherenceScore
    };
  }
} 