import { PatternSystem } from '../implementation';
import { Pattern, PatternState } from '../types';

describe('PatternSystem', () => {
  const testPattern: Pattern = {
    id: 'test-1',
    name: 'Test Pattern',
    energy: {
      required: 10,
      current: 5
    },
    state: {
      active: true,
      strength: 0.5,
      stability: 0.7,
      evolution: 1
    }
  };

  let system: PatternSystem;

  beforeEach(() => {
    system = new PatternSystem();
  });

  it('adds and retrieves patterns', () => {
    system.addPattern(testPattern);
    const retrieved = system.getPattern(testPattern.id);
    expect(retrieved).toEqual(testPattern);
  });

  it('updates pattern state', () => {
    system.addPattern(testPattern);
    
    const newState: PatternState = {
      active: false,
      strength: 0.3,
      stability: 0.8,
      evolution: 2
    };

    system.updatePatternState(testPattern.id, newState);
    const updated = system.getPattern(testPattern.id);
    
    expect(updated?.state).toEqual(newState);
  });

  it('updates pattern energy', () => {
    system.addPattern(testPattern);
    
    const newEnergy = 8;
    system.updatePatternEnergy(testPattern.id, newEnergy);
    const updated = system.getPattern(testPattern.id);
    
    expect(updated?.energy.current).toBe(newEnergy);
    expect(updated?.energy.required).toBe(testPattern.energy.required);
  });

  it('filters active patterns', () => {
    const inactivePattern: Pattern = {
      ...testPattern,
      id: 'test-2',
      state: { ...testPattern.state, active: false }
    };

    system.addPattern(testPattern);
    system.addPattern(inactivePattern);

    const active = system.getActivePatterns();
    expect(active).toHaveLength(1);
    expect(active[0].id).toBe(testPattern.id);
  });

  it('throws on invalid pattern updates', () => {
    expect(() => system.updatePatternState('invalid', testPattern.state))
      .toThrow('Pattern not found');
    
    expect(() => system.updatePatternEnergy('invalid', 10))
      .toThrow('Pattern not found');
  });
}); 