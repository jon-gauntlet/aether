/**
 * Creates a debug protection system that monitors and validates debug/flow state transitions
 */
export const createDebugProtection = () => {
  return {
    validateTransition({ from, to, context }) {
      const impact = Math.abs(from.intensity - to.intensity);
      const isFlowToDebug = from.type === 'FLOW' && to.type === 'DEBUG';
      
      // For flow to debug transitions, we need active flow state
      // For other transitions, just check impact
      const valid = impact < 0.5 || (!isFlowToDebug || context.flowState.active);
      
      return {
        valid,
        impact
      };
    },

    analyzePatterns(context) {
      return [
        {
          type: 'DEBUG_FREQUENCY',
          severity: context.debugState.active ? 0.8 : 0.2
        },
        {
          type: 'FLOW_INTERRUPTION',
          severity: context.flowState.active ? 0.3 : 0.7
        }
      ];
    },

    trackEvolution(transitions) {
      const debugTime = transitions.reduce((time, t, i) => {
        if (t.type === 'DEBUG_PAUSE' && transitions[i + 1]) {
          return time + (transitions[i + 1].timestamp - t.timestamp);
        }
        return time;
      }, 0);

      return {
        transitions,
        debugTime
      };
    },

    getRecommendations(context) {
      return [
        'Maintain flow state while debugging',
        'Use quick debug checkpoints'
      ];
    }
  };
}; 