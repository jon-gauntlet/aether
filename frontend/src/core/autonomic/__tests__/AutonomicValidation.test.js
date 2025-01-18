import { FLOW_STATES, ACTION_TYPES } from '../../types/constants'
import { validateAutonomicAction } from '../AutonomicValidation'

describe('AutonomicValidation', () => {
  it('validates autonomic actions correctly', () => {
    const validAction = {
      type: ACTION_TYPES.FLOW_STATE_CHANGE,
      payload: {
        state: FLOW_STATES.NATURAL
      }
    }

    const mockState = {
      id: 'test-state',
      currentState: FLOW_STATES.RESTING,
      metrics: {
        stability: 0.8,
        coherence: 0.7,
        resonance: 0.9
      }
    }

    const mockHistory = {
      id: 'test-history',
      stateHistory: [FLOW_STATES.RESTING],
      metrics: {
        stability: 0.75,
        coherence: 0.8,
        resonance: 0.85
      }
    }

    const result = validateAutonomicAction(validAction, mockState, mockHistory)
    expect(result.isValid).toBe(true)
    expect(result.safetyScore).toBeGreaterThan(0)
    expect(result.protectionScore).toBeGreaterThan(0)
    expect(result.coherenceScore).toBeGreaterThan(0)
    expect(result.resonanceScore).toBeGreaterThan(0)
  })
})