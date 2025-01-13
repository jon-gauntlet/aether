import { describe, test, expect, beforeEach, vi } from 'vitest';
import { AutonomicTypeValidator, AutonomicValidationConfig } from './AutonomicTypeValidator';
import { FlowState, ProtectionLevel } from '../primitives/base';

describe('AutonomicTypeValidator', () => {
  let validator: AutonomicTypeValidator;
  let config: AutonomicValidationConfig;

  beforeEach(() => {
    config = {
      initialState: FlowState.FOCUSED,
      protectionLevel: ProtectionLevel.MAXIMUM,
      healingEnabled: true
    };
    validator = new AutonomicTypeValidator(config);
  });

  test('validates with initial flow state', async () => {
    const result = await validator.validateState(FlowState.FOCUSED);
    expect(result.isValid).toBe(true);
  });

  test('maintains high focus in successful validation', async () => {
    const result = await validator.validateState(FlowState.HYPERFOCUSED);
    expect(result.flowState).toBe(FlowState.HYPERFOCUSED);
  });

  test('attempts healing on validation failure', async () => {
    const result = await validator.validateState(FlowState.DISTRACTED);
    expect(result.healingAttempted).toBe(true);
  });

  test('transitions to recovery state after multiple failures', async () => {
    await validator.validateState(FlowState.DISTRACTED);
    await validator.validateState(FlowState.DISTRACTED);
    const result = await validator.validateState(FlowState.DISTRACTED);
    expect(result.flowState).toBe(FlowState.RECOVERY);
  });

  test('maintains protection level throughout validation', async () => {
    const protectedValidator = new AutonomicTypeValidator({
      ...config,
      protectionLevel: ProtectionLevel.MAXIMUM
    });
    const result = await protectedValidator.validateState(FlowState.FOCUSED);
    expect(result.protectionLevel).toBe(ProtectionLevel.MAXIMUM);
  });
}); 