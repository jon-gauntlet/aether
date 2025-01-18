import { describe, test, expect, beforeEach } from 'vitest';
import { AutonomicTypeValidator } from './AutonomicTypeValidator';

describe('AutonomicTypeValidator', () => {
  let validator;
  let config;

  beforeEach(() => {
    config = {
      initialState: 'focused',
      protectionLevel: 'maximum',
      healingEnabled: true
    };
    validator = new AutonomicTypeValidator(config);
  });

  test('validates with initial flow state', async () => {
    const result = await validator.validateState('focused');
    expect(result.isValid).toBe(true);
  });

  test('maintains high focus in successful validation', async () => {
    const result = await validator.validateState('hyperfocused');
    expect(result.flowState).toBe('hyperfocused');
  });

  test('attempts healing on validation failure', async () => {
    const result = await validator.validateState('distracted');
    expect(result.healingAttempted).toBe(true);
  });

  test('transitions to recovery state after multiple failures', async () => {
    await validator.validateState('distracted');
    await validator.validateState('distracted');
    const result = await validator.validateState('distracted');
    expect(result.flowState).toBe('recovery');
  });

  test('maintains protection level throughout validation', async () => {
    const protectedValidator = new AutonomicTypeValidator({
      ...config,
      protectionLevel: 'maximum'
    });
    const result = await protectedValidator.validateState('focused');
    expect(result.protectionLevel).toBe('maximum');
  });
}); 