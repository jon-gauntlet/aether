import { renderHook, act } from '@testing-library/react-hooks';
import { useFlow } from '../useFlow';
import { FlowEngine } from '../../experience/FlowEngine';
import { NaturalFlowType } from '../../types/base';

describe('useFlow', () => {
  const testId = 'test-flow';

  it('creates a new engine instance for new IDs', () => {
    const { result } = renderHook(() => useFlow(testId));
    expect(result.current.stream).toBeInstanceOf(FlowEngine);
  });

  it('reuses existing engine instance for same ID', () => {
    const { result: result1 } = renderHook(() => useFlow(testId));
    const { result: result2 } = renderHook(() => useFlow(testId));

    expect(result1.current.stream).toBe(result2.current.stream);
  });

  it('updates presence through updatePresence', () => {
    const { result } = renderHook(() => useFlow(testId));
    const initialTimestamp = result.current.stream.timestamp;

    act(() => {
      result.current.updatePresence('active');
    });

    expect(result.current.stream.timestamp).toBeGreaterThan(initialTimestamp);
  });

  it('updates mode through setMode', () => {
    const { result } = renderHook(() => useFlow(testId));
    const modes: NaturalFlowType[] = ['natural', 'guided', 'resonant'];

    modes.forEach(mode => {
      act(() => {
        result.current.setMode(mode);
      });
      expect(result.current.stream.type).toBe(mode);
    });
  });

  it('maintains separate state for different IDs', () => {
    const { result: result1 } = renderHook(() => useFlow('flow-1'));
    const { result: result2 } = renderHook(() => useFlow('flow-2'));

    expect(result1.current.stream).not.toBe(result2.current.stream);

    act(() => {
      result1.current.setMode('guided');
      result2.current.setMode('resonant');
    });

    expect(result1.current.stream.type).toBe('guided');
    expect(result2.current.stream.type).toBe('resonant');
  });
}); 