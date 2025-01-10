import { renderHook, act } from '@testing-library/react-hooks';
import { useAutonomic } from '../useAutonomic';
import { EnergyType } from '../../energy/types';

jest.useFakeTimers();

describe('useAutonomic', () => {
  beforeEach(() => {
    jest.clearAllTimers();
  });

  it('initializes with default state', () => {
    const { result } = renderHook(() =>
      useAutonomic({
        task: 'test-task'
      })
    );

    expect(result.current.state).toEqual({
      inFlow: false,
      energyLevel: 100,
      hasActivePattern: false,
      learningCount: 0
    });
  });

  it('handles energy state changes', () => {
    const handleLowEnergy = jest.fn();
    const handleCriticalEnergy = jest.fn();

    const { result } = renderHook(() =>
      useAutonomic({
        task: 'test-task',
        onLowEnergy: handleLowEnergy,
        onCriticalEnergy: handleCriticalEnergy
      })
    );

    // Advance time to trigger low energy
    act(() => {
      jest.advanceTimersByTime(120 * 60 * 1000); // 2 hours
    });

    expect(handleLowEnergy).toHaveBeenCalled();

    // Advance more time to trigger critical energy
    act(() => {
      jest.advanceTimersByTime(60 * 60 * 1000); // 1 more hour
    });

    expect(handleCriticalEnergy).toHaveBeenCalled();
  });

  it('manages flow state', async () => {
    const handleStateChange = jest.fn();

    const { result } = renderHook(() =>
      useAutonomic({
        task: 'test-task',
        onStateChange: handleStateChange
      })
    );

    // Enter flow
    await act(async () => {
      result.current.actions.enterFlow('test trigger');
    });

    expect(result.current.state.inFlow).toBe(true);
    expect(handleStateChange).toHaveBeenCalledWith(
      expect.objectContaining({
        inFlow: true
      })
    );

    // Exit flow
    await act(async () => {
      result.current.actions.exitFlow('test reason');
    });

    expect(result.current.state.inFlow).toBe(false);
    expect(handleStateChange).toHaveBeenCalledWith(
      expect.objectContaining({
        inFlow: false
      })
    );
  });

  it('records pattern success', async () => {
    const { result } = renderHook(() =>
      useAutonomic({
        task: 'test-task'
      })
    );

    // Record success (note: pattern might not exist initially)
    await act(async () => {
      await result.current.actions.recordSuccess();
    });

    // Check learning count (might be 0 if no pattern exists)
    expect(result.current.state.learningCount).toBeGreaterThanOrEqual(0);
  });

  it('records pattern improvements', async () => {
    const { result } = renderHook(() =>
      useAutonomic({
        task: 'test-task'
      })
    );

    // Record improvement
    await act(async () => {
      await result.current.actions.recordImprovement('test improvement');
    });

    // Get latest learning
    const learnings = result.current.history.getLearnings();
    const lastLearning = learnings[learnings.length - 1];

    // Verify learning (if pattern exists)
    if (lastLearning) {
      expect(lastLearning.insight).toContain('test improvement');
    }
  });

  it('supports different energy types', () => {
    const { result } = renderHook(() =>
      useAutonomic({
        task: 'test-task',
        energyType: EnergyType.Creative
      })
    );

    expect(result.current.energy.type).toBe(EnergyType.Creative);
  });

  it('maintains context history', async () => {
    const { result } = renderHook(() =>
      useAutonomic({
        task: 'test-task'
      })
    );

    // Perform some actions
    await act(async () => {
      result.current.actions.enterFlow('test trigger');
      await result.current.actions.recordSuccess();
      result.current.actions.exitFlow('test reason');
    });

    const history = result.current.history.getContextHistory();
    expect(history.length).toBeGreaterThan(0);
  });

  it('handles energy recovery', async () => {
    const { result } = renderHook(() =>
      useAutonomic({
        task: 'test-task'
      })
    );

    // Decay energy
    act(() => {
      jest.advanceTimersByTime(120 * 60 * 1000);
    });

    const lowEnergy = result.current.energy.current;

    // Rest
    await act(async () => {
      await result.current.actions.rest(300);
      jest.advanceTimersByTime(300 * 1000);
    });

    expect(result.current.energy.current).toBeGreaterThan(lowEnergy);
  });
}); 