import { renderHook, act } from '@testing-library/react-hooks';
import { EnergySystem } from '../../energy/EnergySystem';
import { AutonomicSystem } from '../Autonomic';
import { useAutonomicValidation } from '../../hooks/useAutonomicValidation';

describe('Autonomic Validation System', () => {
  let energySystem: EnergySystem;

  beforeEach(() => {
    energySystem = new EnergySystem();
  });

  it('should evolve autonomic behavior over time', async () => {
    const { result } = renderHook(() => useAutonomicValidation(energySystem));

    // Initial state should have moderate autonomy
    await act(async () => {
      const state = await result.current.getAutonomicState().toPromise();
      expect(state.proactivity).toBeLessThan(0.7);
      expect(state.confidence).toBeLessThan(0.8);
    });

    // Simulate successful validations
    await act(async () => {
      for (let i = 0; i < 5; i++) {
        await result.current.validate({
          type: 'code',
          status: 'valid',
          context: ['test-context'],
          energy: 0.8,
          resonance: 0.9
        });
      }
    });

    // Autonomy should increase
    await act(async () => {
      const state = await result.current.getAutonomicState().toPromise();
      expect(state.proactivity).toBeGreaterThan(0.7);
      expect(state.confidence).toBeGreaterThan(0.8);
    });
  });

  it('should protect high-energy states', async () => {
    const { result } = renderHook(() => useAutonomicValidation(energySystem));

    // Enter flow state
    await act(async () => {
      await energySystem.enterFlow(['flow-context']);
      
      // Validate during flow
      await result.current.validate({
        type: 'code',
        status: 'valid',
        context: ['flow-context'],
        energy: 0.9,
        resonance: 0.9
      });
    });

    // Should reduce validation frequency
    const patterns = result.current.getPatterns();
    const flowPattern = patterns.find(p => 
      p.signature.includes('flow-context')
    );

    expect(flowPattern?.evolution.strength).toBeGreaterThan(0.7);
  });

  it('should learn from validation patterns', async () => {
    const { result } = renderHook(() => useAutonomicValidation(energySystem));

    // Create a validation pattern
    await act(async () => {
      await result.current.validate({
        type: 'test',
        status: 'valid',
        context: ['pattern-context'],
        energy: 0.7,
        resonance: 0.8
      });
    });

    // Similar validation should be handled autonomously
    await act(async () => {
      await result.current.validate({
        type: 'test',
        status: 'evolving',
        context: ['pattern-context', 'additional-context'],
        energy: 0.75,
        resonance: 0.85
      });
    });

    const patterns = result.current.getPatterns();
    const learningPattern = patterns.find(p => 
      p.signature.includes('pattern-context')
    );

    expect(learningPattern?.evolution.iterations).toBeGreaterThan(1);
    expect(learningPattern?.success_rate).toBeGreaterThan(0.5);
  });

  it('should maintain system coherence', async () => {
    const { result } = renderHook(() => useAutonomicValidation(energySystem));

    // Simulate mixed validation results
    await act(async () => {
      // Success pattern
      for (let i = 0; i < 3; i++) {
        await result.current.validate({
          type: 'code',
          status: 'valid',
          context: ['success-context'],
          energy: 0.8,
          resonance: 0.9
        });
      }

      // Failure pattern
      for (let i = 0; i < 2; i++) {
        await result.current.validate({
          type: 'code',
          status: 'invalid',
          context: ['failure-context'],
          energy: 0.4,
          resonance: 0.3
        });
      }
    });

    const patterns = result.current.getPatterns();
    
    // Success pattern should strengthen
    const successPattern = patterns.find(p => 
      p.signature.includes('success-context')
    );
    expect(successPattern?.evolution.strength).toBeGreaterThan(0.7);

    // Failure pattern should weaken
    const failurePattern = patterns.find(p => 
      p.signature.includes('failure-context')
    );
    expect(failurePattern?.evolution.strength).toBeLessThan(0.5);
  });

  it('should adapt to changing contexts', async () => {
    const { result } = renderHook(() => useAutonomicValidation(energySystem));

    // Establish initial context
    await act(async () => {
      await result.current.validate({
        type: 'build',
        status: 'valid',
        context: ['initial-context'],
        energy: 0.7,
        resonance: 0.8
      });
    });

    // Introduce new context
    await act(async () => {
      await result.current.validate({
        type: 'build',
        status: 'evolving',
        context: ['initial-context', 'new-context'],
        energy: 0.75,
        resonance: 0.85
      });
    });

    const patterns = result.current.getPatterns();
    
    // Should have patterns for both contexts
    expect(patterns.some(p => p.signature.includes('initial-context'))).toBe(true);
    expect(patterns.some(p => p.signature.includes('new-context'))).toBe(true);

    // Context evolution should strengthen pattern
    const evolvedPattern = patterns.find(p => 
      p.signature.includes('initial-context') && 
      p.signature.includes('new-context')
    );
    expect(evolvedPattern?.evolution.strength).toBeGreaterThan(0.6);
  });
}); 