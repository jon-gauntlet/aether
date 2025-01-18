import { useState, useEffect } from 'react';
import { FlowEngine } from '../experience/FlowEngine';
import { FlowState } from '../types/primitives/base';

/**
 * @typedef {Object} FlowContext
 * @property {'development'} type
 * @property {number} depth
 * @property {number} duration
 */

/**
 * @typedef {Object} FlowMetrics
 * @property {number} focus
 * @property {number} presence
 * @property {number} sustainability
 * @property {number} depth
 * @property {number} harmony
 */

/**
 * @typedef {Object} FlowProtection
 * @property {number} level
 * @property {'natural'} type
 * @property {number} strength
 */

/**
 * @typedef {Object} Flow
 * @property {string} state
 * @property {FlowContext} context
 * @property {FlowMetrics} metrics
 * @property {FlowProtection} protection
 */

/**
 * @typedef {Object} FlowTransition
 * @property {string} from
 * @property {string} to
 * @property {string} trigger
 */

/** @type {Map<string, FlowEngine>} */
const flowEngines = new Map();

/**
 * @param {string} [id='default']
 */
export function useFlow(id = 'default') {
  const [flow, setFlow] = useState({
    state: 'natural',
    context: {
      type: 'development',
      depth: 1,
      duration: 0
    },
    metrics: {
      focus: 1,
      presence: 1,
      sustainability: 1,
      depth: 1,
      harmony: 1
    },
    protection: {
      level: 1,
      type: 'natural',
      strength: 1
    }
  });

  // Initialize or get existing FlowEngine
  const [stream] = useState(() => {
    if (!flowEngines.has(id)) {
      flowEngines.set(id, new FlowEngine(id));
    }
    return flowEngines.get(id);
  });

  /**
   * @returns {Promise<Flow>}
   */
  async function measureFlow() {
    const engineFlow = await stream.measure();
    return {
      state: engineFlow.type,
      context: {
        type: 'development',
        depth: engineFlow.intensity,
        duration: engineFlow.duration
      },
      metrics: {
        focus: engineFlow.metrics.focus,
        presence: engineFlow.metrics.momentum,
        sustainability: engineFlow.quality,
        depth: engineFlow.intensity,
        harmony: engineFlow.metrics.quality
      },
      protection: {
        level: engineFlow.protected ? 1 : 0.5,
        type: engineFlow.type,
        strength: engineFlow.intensity
      }
    };
  }

  /**
   * @param {string} to
   * @param {string} trigger
   * @returns {Promise<FlowTransition>}
   */
  async function transition(to, trigger) {
    return stream.transition(to, trigger);
  }

  /**
   * @param {string} mode
   */
  function setMode(mode) {
    stream.setMode(mode);
  }

  /**
   * @returns {Promise<void>}
   */
  async function deepen() {
    await stream.deepen();
  }

  /**
   * @returns {Promise<void>}
   */
  async function protect() {
    await stream.protect();
  }

  useEffect(() => {
    const subscription = stream.observe().subscribe(updatedFlow => {
      setFlow({
        state: updatedFlow.type,
        context: {
          type: 'development',
          depth: updatedFlow.intensity,
          duration: updatedFlow.duration
        },
        metrics: {
          focus: updatedFlow.metrics.focus,
          presence: updatedFlow.metrics.momentum,
          sustainability: updatedFlow.quality,
          depth: updatedFlow.intensity,
          harmony: updatedFlow.metrics.quality
        },
        protection: {
          level: updatedFlow.protected ? 1 : 0.5,
          type: updatedFlow.type,
          strength: updatedFlow.intensity
        }
      });
    });

    return () => subscription.unsubscribe();
  }, [stream]);

  const isDeep = flow.context.depth > 0.7;

  return {
    flow,
    isDeep,
    measureFlow,
    transition,
    setMode,
    deepen,
    protect,
    stream
  };
}