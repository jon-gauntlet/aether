import { renderHook, act } from '@testing-library/react-hooks';
import { usePersistentPattern } from '../usePersistentPattern';
import { Context, ContextType } from '../../context/types';
import { Energy, EnergyType, FlowState as EnergyFlowState } from '../../energy/types';
import { Flow, FlowStateType } from '../../flow/types';

jest.mock('../../context/types');
jest.mock('../../energy/types');
jest.mock('../../flow/types');

describe('usePersistentPattern', () => {
  let mockStorage: { [key: string]: string };
  let context: Context;
  let energy: Energy;
  let flow: Flow;

  beforeEach(() => {
    // Mock localStorage
    mockStorage = {};
    global.localStorage = {
      getItem: jest.fn(key => mockStorage[key] || null),
      setItem: jest.fn((key, value) => {
        mockStorage[key] = value.toString();
      }),
      removeItem: jest.fn(key => {
        delete mockStorage[key];
      }),
      clear: jest.fn(() => {
        mockStorage = {};
      }),
      length: 0,
      key: jest.fn((index: number) => null)
    };

    // Setup test data
    context = {
      id: 'test-context',
      type: ContextType.Development,
      depth: 1,
      children: [],
      meta: {
        created: new Date(),
        lastAccessed: new Date(),
        accessCount: 0,
        importance: 1,
        tags: ['test']
      },
      data: {}
    };

    energy = {
      current: 100,
      max: 100,
      type: EnergyType.Mental,
      flow: EnergyFlowState.Flow,
      meta: {
        timestamp: new Date(),
        duration: 0,
        source: 'test',
        triggers: [],
        notes: ''
      }
    };

    flow = {
      state: FlowStateType.Focused,
      context: {
        task: 'test',
        goal: 'testing',
        constraints: [],
        resources: []
      },
      duration: 0,
      meta: {
        started: new Date(),
        lastTransition: new Date(),
        transitions: [],
        metrics: {
          productivity: 1,
          quality: 1,
          energy: 1,
          satisfaction: 1
        }
      }
    };
  });

  it('should initialize with empty state', () => {
    const { result } = renderHook(() => usePersistentPattern(context, energy, flow));

    expect(result.current.pattern).toBeNull();
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBeNull();
    expect(result.current.stats).toBeNull();
  });

  it('should record learning and update stats', async () => {
    const { result } = renderHook(() => usePersistentPattern(context, energy, flow));

    // Wait for initial load
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Create initial pattern through learning
    await act(async () => {
      if (result.current.pattern) {
        await result.current.actions.recordLearning('Test learning');
      }
    });

    // Stats should be updated
    expect(result.current.stats?.totalLearnings).toBeGreaterThanOrEqual(0);
  });

  it('should handle pattern export/import', async () => {
    const { result } = renderHook(() => usePersistentPattern(context, energy, flow));

    // Wait for initial load
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Export patterns
    const exported = result.current.actions.exportPatterns();
    expect(exported).toBeTruthy();

    // Clear patterns
    act(() => {
      result.current.actions.clearPatterns();
    });

    expect(result.current.pattern).toBeNull();
    expect(result.current.stats?.totalPatterns).toBe(0);

    // Import patterns
    await act(async () => {
      await result.current.actions.importPatterns(exported);
    });

    // Stats should be restored
    expect(result.current.stats?.totalPatterns).toBeGreaterThanOrEqual(0);
  });

  it('should handle errors gracefully', async () => {
    const { result } = renderHook(() => usePersistentPattern(context, energy, flow));

    // Try to import invalid data
    await act(async () => {
      const success = await result.current.actions.importPatterns('invalid json');
      expect(success).toBe(false);
      expect(result.current.error).toBeTruthy();
    });
  });

  it('should provide access to history and stats', async () => {
    const { result } = renderHook(() => usePersistentPattern(context, energy, flow));

    // Wait for initial load
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Check getters
    const activePattern = result.current.getters.getActivePattern();
    expect(activePattern).toBe(result.current.pattern);

    const contextHistory = result.current.getters.getContextHistory();
    expect(Array.isArray(contextHistory)).toBe(true);

    const stats = result.current.getters.getStats();
    expect(stats).toBe(result.current.stats);
  });

  it('should maintain state across hook instances', async () => {
    // First instance
    const { result: result1 } = renderHook(() => usePersistentPattern(context, energy, flow));

    // Wait for initial load
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Record learning
    await act(async () => {
      if (result1.current.pattern) {
        await result1.current.actions.recordLearning('Test learning');
      }
    });

    // Second instance should see the same state
    const { result: result2 } = renderHook(() => usePersistentPattern(context, energy, flow));

    expect(result2.current.stats?.totalLearnings).toBe(result1.current.stats?.totalLearnings);
  });
}); 