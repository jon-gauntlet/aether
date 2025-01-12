import { renderHook, act } from '@testing-library/react-hooks';
import { useFlow } from '../useFlow';
import { useEnergy } from '../../energy/useEnergy';
import { FlowStateType } from '../../types/flow/types';
import { EnergyType } from '../../energy/types';

// Mock useEnergy hook
jest.mock('../../energy/useEnergy', () => ({
  useEnergy: jest.fn()
}));

describe('useFlow', () => {
  const mockEnergy = {
    mental: 1.0,
    physical: 1.0,
    emotional: 1.0
  };

  const mockEnergyMetrics = {
    efficiency: 0.8,
    sustainability: 0.9,
    recovery: 0.7
  };

  beforeEach(() => {
    (useEnergy as jest.Mock).mockReturnValue({
      energy: mockEnergy,
      consume: jest.fn(),
      startRecovery: jest.fn(),
      metrics: mockEnergyMetrics
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('State Management', () => {
    it('initializes with natural flow state', () => {
      const { result } = renderHook(() => useFlow());
      expect(result.current.flow.state).toBe('natural');
    });

    it('transitions between states', async () => {
      const { result } = renderHook(() => useFlow());
      
      await act(async () => {
        await result.current.transition('flow', 'test');
      });
      
      expect(result.current.flow.state).toBe('flow');
    });

    it('measures flow state', async () => {
      const { result } = renderHook(() => useFlow());
      
      await act(async () => {
        const flow = await result.current.measureFlow();
        expect(flow.metrics.coherence).toBeGreaterThan(0);
      });
    });
  });

  describe('Protection', () => {
    it('can protect flow state', async () => {
      const { result } = renderHook(() => useFlow());
      
      await act(async () => {
        await result.current.protect();
      });

      expect(result.current.flow.protection.level).toBeGreaterThan(0);
    });

    it('deepens flow state', async () => {
      const { result } = renderHook(() => useFlow());
      
      await act(async () => {
        await result.current.deepen();
      });

      expect(result.current.flow.metrics.depth).toBeGreaterThan(0);
    });
  });

  describe('Mode Management', () => {
    it('sets flow mode', () => {
      const { result } = renderHook(() => useFlow());
      
      act(() => {
        result.current.setMode('focus');
      });

      // Mode affects metrics
      expect(result.current.flow.metrics.focus).toBeGreaterThan(0);
    });
  });

  describe('Flow Engine', () => {
    it('provides access to flow engine', () => {
      const { result } = renderHook(() => useFlow());
      expect(result.current.stream).toBeDefined();
    });
  });
}); 