import { FlowEngine } from './FlowEngine';
import { SpaceEngine } from '../space/SpaceEngine';
import { validateType } from '../types/validation';
import { combineLatest } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

/**
 * @typedef {import('../types/base').Resonance} Resonance
 * @typedef {import('../types/base').Field} Field
 * @typedef {import('./types/flowstate').FlowState} FlowState
 * @typedef {import('../space/types/spacestate').SpaceState} SpaceState
 */

/**
 * @typedef {Object} IntegratedState
 * @property {FlowState} flow - Flow state
 * @property {SpaceState} space - Space state
 * @property {Resonance} resonance - Combined resonance
 * @property {Field} field - Combined field
 */

/**
 * Integration between flow and space systems
 */
class FlowSpaceIntegration {
  /**
   * @param {FlowEngine} flowEngine - Flow engine instance
   * @param {SpaceEngine} spaceEngine - Space engine instance
   */
  constructor(flowEngine, spaceEngine) {
    /** @private */
    this.flowEngine = flowEngine;
    /** @private */
    this.spaceEngine = spaceEngine;

    // Setup resonance observation
    combineLatest([
      this.spaceEngine.observeResonance(),
      this.flowEngine.observeResonance()
    ]).pipe(
      debounceTime(100)
    ).subscribe(([spaceRes, flowRes]) => {
      this.handleResonanceChange(spaceRes, flowRes);
    });
  }

  /**
   * Create an integrated flow space
   * @param {Object} params - Creation parameters
   * @param {string} params.flowId - Flow ID
   * @param {string} params.spaceId - Space ID
   * @returns {Promise<IntegratedState>}
   */
  async createFlowSpace({ flowId, spaceId }) {
    const flowState = await this.flowEngine.getState(flowId);
    const spaceState = await this.spaceEngine.getState(spaceId);
    
    const resonance = this.combineResonance(flowState.resonance, spaceState.resonance);
    const field = this.combineFields(flowState.field, spaceState.field);

    return {
      flow: flowState,
      space: spaceState,
      resonance,
      field
    };
  }

  /**
   * Move flow to a different space
   * @param {Object} params - Move parameters
   * @param {string} params.flowId - Flow ID
   * @param {string} params.fromSpaceId - Source space ID
   * @param {string} params.toSpaceId - Target space ID
   * @returns {Promise<void>}
   */
  async moveFlow({ flowId, fromSpaceId, toSpaceId }) {
    await this.spaceEngine.adapt(fromSpaceId);
    await this.flowEngine.transition(flowId);
    await this.spaceEngine.adapt(toSpaceId);
  }

  /**
   * Dissolve a flow space integration
   * @param {Object} params - Dissolution parameters
   * @param {string} params.flowId - Flow ID
   * @param {string} params.spaceId - Space ID
   * @returns {Promise<void>}
   */
  async dissolveFlow({ flowId, spaceId }) {
    await this.flowEngine.end(flowId);
    await this.spaceEngine.clear(spaceId);
  }

  /**
   * Handle resonance changes
   * @private
   * @param {Resonance} spaceRes - Space resonance
   * @param {Resonance} flowRes - Flow resonance
   */
  handleResonanceChange(spaceRes, flowRes) {
    const combined = this.combineResonance(spaceRes, flowRes);
    // Implementation here
  }

  /**
   * Combine resonances
   * @private
   * @param {Resonance} res1 - First resonance
   * @param {Resonance} res2 - Second resonance
   * @returns {Resonance}
   */
  combineResonance(res1, res2) {
    validateType(res1, 'Resonance');
    validateType(res2, 'Resonance');
    
    return {
      primary: {
        frequency: (res1.primary.frequency + res2.primary.frequency) / 2,
        amplitude: Math.max(res1.primary.amplitude, res2.primary.amplitude),
        phase: (res1.primary.phase + res2.primary.phase) / 2
      },
      harmonics: res1.harmonics.concat(res2.harmonics).slice(0, 3), // Keep strongest waves
      coherence: (res1.coherence + res2.coherence) / 2,
      stability: Math.min(res1.stability, res2.stability)
    };
  }

  /**
   * Combine fields
   * @private
   * @param {Field} field1 - First field
   * @param {Field} field2 - Second field
   * @returns {Field}
   */
  combineFields(field1, field2) {
    validateType(field1, 'Field');
    validateType(field2, 'Field');

    const center = {
      x: (field1.center.x + field2.center.x) / 2,
      y: (field1.center.y + field2.center.y) / 2,
      z: (field1.center.z + field2.center.z) / 2
    };

    const radius = Math.max(field1.radius, field2.radius);
    const strength = (field1.strength + field2.strength) / 2;
    const coherence = Math.min(field1.coherence, field2.coherence);
    const stability = Math.min(field1.stability, field2.stability);

    return {
      center,
      radius,
      strength,
      coherence,
      stability,
      resonance: this.combineResonance(field1.resonance, field2.resonance),
      protection: {
        ...field1.protection,
        strength: Math.max(field1.protection.strength, field2.protection.strength)
      },
      flowMetrics: field1.flowMetrics,
      metrics: field1.metrics
    };
  }
}

export { FlowSpaceIntegration };