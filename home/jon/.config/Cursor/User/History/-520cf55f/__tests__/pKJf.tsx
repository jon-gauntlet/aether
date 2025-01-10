import { renderHook, act } from '@testing-library/react-hooks';
import { Subject } from 'rxjs';
import { useAutonomicDevelopment } from '../useAutonomicDevelopment';

describe('useAutonomicDevelopment', () => {
  it('initializes with default state', () => {
    const { result } = renderHook(() => useAutonomicDevelopment());

    expect(result.current.state).toEqual({
      context: {
        current: '',
        depth: 0,
        patterns: []
      },
      energy: {
        level: 1,
        type: 'steady',
        flow: 'natural'
      },
      protection: {
        depth: 0,
        patterns: [],
        states: []
      }
    });
  });

  it('updates state based on flow', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useAutonomicDevelopment());

    act(() => {
      (result.current.flow$ as Subject<any>).next({
        context: {
          current: 'test',
          depth: 0.5,
          patterns: ['pattern1'],
          protection: 0.5,
          protectedPatterns: ['protected1'],
          protectedStates: ['state1']
        },
        energy: {
          level: 0.8,
          type: 'deep',
          flow: 'natural'
        },
        protection: {
          depth: 0.5,
          patterns: ['protected1'],
          states: ['state1']
        }
      });
    });

    await waitForNextUpdate();

    expect(result.current.state).toEqual({
      context: {
        current: 'test',
        depth: 0.5,
        patterns: ['pattern1']
      },
      energy: {
        level: 0.8,
        type: 'deep',
        flow: 'natural'
      },
      protection: {
        depth: 0.5,
        patterns: ['protected1'],
        states: ['state1']
      }
    });
  });

  it('recognizes patterns', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useAutonomicDevelopment());

    act(() => {
      (result.current.flow$ as Subject<any>).next({
        context: {
          current: 'test',
          depth: 0.5,
          patterns: ['pattern1', 'pattern2'],
          protection: 0.5,
          protectedPatterns: [],
          protectedStates: []
        },
        energy: {
          level: 0.8,
          type: 'deep',
          flow: 'natural'
        },
        protection: {
          depth: 0.5,
          patterns: [],
          states: []
        }
      });
    });

    await waitForNextUpdate();

    expect(result.current.state.context.patterns).toEqual(['pattern1', 'pattern2']);
  });

  it('protects valuable states', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useAutonomicDevelopment());

    act(() => {
      (result.current.flow$ as Subject<any>).next({
        context: {
          current: 'test',
          depth: 0.8,
          patterns: ['valuable'],
          protection: 0.8,
          protectedPatterns: ['valuable'],
          protectedStates: ['deep']
        },
        energy: {
          level: 0.9,
          type: 'deep',
          flow: 'protected'
        },
        protection: {
          depth: 0.8,
          patterns: ['valuable'],
          states: ['deep']
        }
      });
    });

    await waitForNextUpdate();

    expect(result.current.state.protection).toEqual({
      depth: 0.8,
      patterns: ['valuable'],
      states: ['deep']
    });
  });

  it('maintains flow state', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useAutonomicDevelopment());

    // Enter flow state
    act(() => {
      (result.current.flow$ as Subject<any>).next({
        context: {
          current: 'flow',
          depth: 0.7,
          patterns: ['flow'],
          protection: 0.7,
          protectedPatterns: ['flow'],
          protectedStates: ['flow']
        },
        energy: {
          level: 0.9,
          type: 'deep',
          flow: 'natural'
        },
        protection: {
          depth: 0.7,
          patterns: ['flow'],
          states: ['flow']
        }
      });
    });

    await waitForNextUpdate();

    // Verify flow state is maintained
    expect(result.current.state.energy).toEqual({
      level: 0.9,
      type: 'deep',
      flow: 'natural'
    });

    // Attempt to disrupt flow
    act(() => {
      (result.current.flow$ as Subject<any>).next({
        context: {
          current: 'flow',
          depth: 0.7,
          patterns: ['flow'],
          protection: 0.8,
          protectedPatterns: ['flow'],
          protectedStates: ['flow']
        },
        energy: {
          level: 0.7,
          type: 'deep',
          flow: 'protected'
        },
        protection: {
          depth: 0.8,
          patterns: ['flow'],
          states: ['flow']
        }
      });
    });

    await waitForNextUpdate();

    // Verify protection kicked in
    expect(result.current.state.energy.flow).toBe('protected');
  });
}); 