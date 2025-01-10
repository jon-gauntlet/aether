import { renderHook } from '@testing-library/react-hooks';
import { usePatternLibrary } from '../usePatternLibrary';
import { PatternState } from '../../types/patterns';

describe('usePatternLibrary', () => {
  it('initializes with default patterns', () => {
    const { result } = renderHook(() => usePatternLibrary());
    
    expect(result.current.patterns).toEqual([
      {
        id: '1',
        name: 'Natural Flow',
        description: 'Enables organic development following energy and context',
        energyLevel: 0.8,
        successRate: 0.9,
        context: ['Development', 'Flow State', 'Energy'],
        states: [PatternState.ACTIVE, PatternState.STABLE]
      },
      {
        id: '2',
        name: 'Deep Connection',
        description: 'Fosters genuine presence and deep understanding',
        energyLevel: 0.7,
        successRate: 0.85,
        context: ['Communication', 'Understanding', 'Presence'],
        states: [PatternState.ACTIVE, PatternState.EVOLVING]
      },
      {
        id: '3',
        name: 'Pattern Evolution',
        description: 'Allows patterns to naturally evolve and adapt',
        energyLevel: 0.9,
        successRate: 0.75,
        context: ['Adaptation', 'Growth', 'Learning'],
        states: [PatternState.ACTIVE, PatternState.EVOLVING]
      }
    ]);
  });

  it('provides patterns with valid energy levels', () => {
    const { result } = renderHook(() => usePatternLibrary());
    
    result.current.patterns.forEach(pattern => {
      expect(pattern.energyLevel).toBeGreaterThanOrEqual(0);
      expect(pattern.energyLevel).toBeLessThanOrEqual(1);
    });
  });

  it('provides patterns with valid success rates', () => {
    const { result } = renderHook(() => usePatternLibrary());
    
    result.current.patterns.forEach(pattern => {
      expect(pattern.successRate).toBeGreaterThanOrEqual(0);
      expect(pattern.successRate).toBeLessThanOrEqual(1);
    });
  });

  it('provides patterns with non-empty context', () => {
    const { result } = renderHook(() => usePatternLibrary());
    
    result.current.patterns.forEach(pattern => {
      expect(pattern.context.length).toBeGreaterThan(0);
    });
  });

  it('provides patterns with valid states', () => {
    const { result } = renderHook(() => usePatternLibrary());
    
    result.current.patterns.forEach(pattern => {
      expect(pattern.states.length).toBeGreaterThan(0);
      pattern.states.forEach(state => {
        expect(Object.values(PatternState)).toContain(state);
      });
    });
  });

  it('maintains pattern consistency across renders', () => {
    const { result, rerender } = renderHook(() => usePatternLibrary());
    const initialPatterns = result.current.patterns;
    
    rerender();
    
    expect(result.current.patterns).toEqual(initialPatterns);
  });

  it('provides patterns with unique IDs', () => {
    const { result } = renderHook(() => usePatternLibrary());
    const ids = result.current.patterns.map(p => p.id);
    const uniqueIds = new Set(ids);
    
    expect(ids.length).toBe(uniqueIds.size);
  });

  it('provides patterns with meaningful descriptions', () => {
    const { result } = renderHook(() => usePatternLibrary());
    
    result.current.patterns.forEach(pattern => {
      expect(pattern.description.length).toBeGreaterThan(10);
    });
  });

  it('maintains natural flow relationships between patterns', () => {
    const { result } = renderHook(() => usePatternLibrary());
    const naturalFlowPattern = result.current.patterns.find(p => p.name === 'Natural Flow');
    const deepConnectionPattern = result.current.patterns.find(p => p.name === 'Deep Connection');
    
    expect(naturalFlowPattern).toBeDefined();
    expect(deepConnectionPattern).toBeDefined();
    expect(naturalFlowPattern?.energyLevel).toBeGreaterThan(0.7);
    expect(deepConnectionPattern?.successRate).toBeGreaterThan(0.8);
  });

  it('maintains coherent pattern states', () => {
    const { result } = renderHook(() => usePatternLibrary());
    
    result.current.patterns.forEach(pattern => {
      if (pattern.states.includes(PatternState.STABLE)) {
        expect(pattern.successRate).toBeGreaterThan(0.8);
      }
      if (pattern.states.includes(PatternState.EVOLVING)) {
        expect(pattern.energyLevel).toBeGreaterThan(0.6);
      }
    });
  });
}); 