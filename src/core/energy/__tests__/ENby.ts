import { PersistentPatternManager } from '../PersistentPatternManager';
import { Pattern } from '../types';
import { ContextType } from '../../context/types';
import { EnergyType, FlowState as EnergyFlowState } from '../../energy/types';
import { FlowStateType } from '../../flow/types';

describe('PersistentPatternManager', () => {
  let manager: PersistentPatternManager;
  let mockStorage: { [key: string]: string };

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

    manager = new PersistentPatternManager();
  });

  it('should persist patterns to localStorage', async () => {
    const context = {
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

    const energy = {
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

    const flow = {
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

    // Create and record a pattern
    const pattern: Pattern = {
      id: 'test-pattern',
      name: 'Test Pattern',
      description: 'A test pattern',
      context,
      energy,
      flow,
      meta: {
        created: new Date(),
        lastUsed: new Date(),
        useCount: 0,
        successRate: 0,
        learnings: []
      }
    };

    await manager.recordLearning(pattern, context, 'Initial learning');
    expect(localStorage.setItem).toHaveBeenCalled();

    // Create new manager to test loading
    const newManager = new PersistentPatternManager();
    const loadedPattern = await newManager.applyPattern(context, energy, flow);
    expect(loadedPattern).toBeTruthy();
    expect(loadedPattern?.id).toBe(pattern.id);
  });

  it('should track pattern statistics', async () => {
    const context = {
      id: 'stats-test',
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

    const pattern: Pattern = {
      id: 'test-pattern',
      name: 'Test Pattern',
      description: 'A test pattern',
      context,
      energy: {
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
      },
      flow: {
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
      },
      meta: {
        created: new Date(),
        lastUsed: new Date(),
        useCount: 0,
        successRate: 0,
        learnings: []
      }
    };

    // Record multiple learnings
    await manager.recordLearning(pattern, context, 'Learning 1');
    await manager.recordLearning(pattern, context, 'Learning 2');
    await manager.recordLearning(pattern, context, 'Learning 3');

    const stats = manager.getPatternStats();
    expect(stats.totalPatterns).toBeGreaterThan(0);
    expect(stats.totalLearnings).toBe(3);
    expect(stats.recentLearnings.length).toBe(3);
  });

  it('should support pattern import/export', async () => {
    const pattern: Pattern = {
      id: 'export-test',
      name: 'Export Test Pattern',
      description: 'Testing export/import',
      context: {
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
      },
      energy: {
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
      },
      flow: {
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
      },
      meta: {
        created: new Date(),
        lastUsed: new Date(),
        useCount: 0,
        successRate: 0,
        learnings: []
      }
    };

    await manager.recordLearning(pattern, pattern.context, 'Export test');
    const exported = manager.exportPatterns();
    
    // Create new manager and import
    const newManager = new PersistentPatternManager();
    await newManager.importPatterns(exported);

    const stats = newManager.getPatternStats();
    expect(stats.totalPatterns).toBe(1);
    expect(stats.totalLearnings).toBe(1);
  });

  it('should handle invalid data gracefully', async () => {
    // Test invalid localStorage data
    localStorage.setItem('autonomic_patterns', 'invalid json');
    const manager = new PersistentPatternManager();
    expect(manager.getPatternStats().totalPatterns).toBe(0);

    // Test invalid import data
    const success = await manager.importPatterns('invalid json');
    expect(success).toBe(false);
  });

  it('should clear patterns', () => {
    manager.clearPatterns();
    const stats = manager.getPatternStats();
    expect(stats.totalPatterns).toBe(0);
    expect(stats.totalLearnings).toBe(0);
    expect(localStorage.setItem).toHaveBeenCalled();
  });
}); 