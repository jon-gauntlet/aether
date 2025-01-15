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
    expect(validateAutonomicAction(validAction)).toBe(true)
  })
})