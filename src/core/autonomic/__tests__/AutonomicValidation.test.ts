import { FLOW_STATES, ACTION_TYPES } from '../../types/constants';
import { validateAutonomicAction } from '../AutonomicValidation';

describe('AutonomicValidation', () => {
  const mockState = {
    id: 'test-state',
    currentState: FLOW_STATES.FLOW,
    metrics: {
      stability: 0.8,
      coherence: 0.7,
      resonance: 0.9
    }
  };

  const mockHistory = {
    id: 'test-history',
    stateHistory: [FLOW_STATES.FOCUS, FLOW_STATES.FLOW],
    metrics: {
      stability: 0.8,
      coherence: 0.7,
      resonance: 0.9
    }
  };

  it('validates safe flow enhancement', () => {
    const result = validateAutonomicAction(
      ACTION_TYPES.ENHANCE_FLOW,
      mockState,
      mockHistory
    );

    expect(result.isValid).toBe(true);
    expect(result.safetyScore).toBeGreaterThan(0.7);
  });

  it('validates unsafe force transition', () => {
    const result = validateAutonomicAction(
      ACTION_TYPES.FORCE_TRANSITION,
      mockState,
      mockHistory
    );

    expect(result.isValid).toBe(false);
    expect(result.safetyScore).toBeLessThan(0.5);
  });

  it('validates field modification safety', () => {
    const result = validateAutonomicAction(
      ACTION_TYPES.MODIFY_FIELD,
      mockState,
      mockHistory
    );

    expect(result.isValid).toBe(true);
    expect(result.protectionScore).toBeLessThan(0.5);
  });

  it('validates recovery initiation', () => {
    const result = validateAutonomicAction(
      ACTION_TYPES.INITIATE_RECOVERY,
      mockState,
      mockHistory
    );

    expect(result.isValid).toBe(true);
    expect(result.safetyScore).toBeGreaterThan(0.8);
  });

  it('validates flow enhancement coherence', () => {
    const result = validateAutonomicAction(
      ACTION_TYPES.ENHANCE_FLOW,
      mockState,
      mockHistory
    );

    expect(result.isValid).toBe(true);
    expect(result.coherenceScore).toBeLessThan(0.5);
  });

  it('validates field modification resonance', () => {
    const result = validateAutonomicAction(
      ACTION_TYPES.MODIFY_FIELD,
      mockState,
      mockHistory
    );

    expect(result.isValid).toBe(true);
    expect(result.resonanceScore).toBeGreaterThan(0.8);
  });
}); 