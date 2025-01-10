import { renderHook, act } from '@testing-library/react';
import { useFlow } from '../useFlow';
import { FlowType, PresenceType } from '../../types/flow';

describe('useFlow', () => {
  const testId = 'test-flow';

  it('creates a new engine instance for new IDs', () => {
    const { result } = renderHook(() => useFlow(testId));
    expect(result.current.stream.id).toBe(testId);
    expect(result.current.stream.state).toBe('natural');
  });

  it('reuses existing engine instance for same ID', () => {
    const { result: result1 } = renderHook(() => useFlow(testId));
    const { result: result2 } = renderHook(() => useFlow(testId));
    expect(result1.current.stream.id).toBe(result2.current.stream.id);
  });

  it('updates presence through updatePresence', () => {
    const { result } = renderHook(() => useFlow(testId));
    const initialPresence = result.current.stream.context.presence;

    act(() => {
      result.current.updatePresence('focused' as PresenceType);
    });

    expect(result.current.stream.context.presence).toBe('focused');
    expect(result.current.stream.metrics.presence).toBeGreaterThan(0);
  });

  it('updates mode through setMode', () => {
    const { result } = renderHook(() => useFlow(testId));
    const modes: FlowType[] = ['natural', 'guided', 'resonant', 'protected'];

    modes.forEach(mode => {
      act(() => {
        result.current.setMode(mode);
      });
      expect(result.current.stream.state).toBe(mode);
    });
  });

  it('maintains separate state for different IDs', () => {
    const { result: result1 } = renderHook(() => useFlow('flow1'));
    const { result: result2 } = renderHook(() => useFlow('flow2'));

    act(() => {
      result1.current.setMode('guided');
      result2.current.setMode('resonant');
    });

    expect(result1.current.stream.state).toBe('guided');
    expect(result2.current.stream.state).toBe('resonant');
  });
}); 