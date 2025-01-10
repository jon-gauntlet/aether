import { PatternManager } from '../PatternManager';
import { Context, ContextType } from '../../context/types';
import { Energy, EnergyType, FlowState as EnergyFlowState } from '../../energy/types';
import { Flow, FlowStateType } from '../../flow/types';

describe('Autonomic Pattern System', () => {
  let manager: PatternManager;
  let context: Context;
  let energy: Energy;
  let flow: Flow;

  beforeEach(() => {
    manager = new PatternManager();
    
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

  it('should start with no patterns', async () => {
    const pattern = await manager.applyPattern(context, energy, flow);
    expect(pattern).toBeNull();
  });

  it('should evolve patterns through learning', async () => {
    // Create initial pattern through learning
    const initialPattern = await manager.recordLearning(
      {
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
      },
      context,
      'Initial pattern created'
    );

    expect(initialPattern.meta.useCount).toBe(1);
    expect(initialPattern.meta.learnings.length).toBe(1);

    // Apply pattern
    const appliedPattern = await manager.applyPattern(context, energy, flow);
    expect(appliedPattern).not.toBeNull();
    expect(appliedPattern?.id).toBe(initialPattern.id);

    // Record success
    const evolvedPattern = await manager.recordLearning(
      appliedPattern!,
      context,
      'Pattern applied successfully'
    );

    expect(evolvedPattern.meta.useCount).toBe(2);
    expect(evolvedPattern.meta.learnings.length).toBe(2);
    expect(evolvedPattern.meta.successRate).toBeGreaterThan(0);
  });

  it('should select patterns based on context match', async () => {
    // Create two patterns with different contexts
    const pattern1Context = { ...context, tags: ['test', 'type1'] };
    const pattern2Context = { ...context, tags: ['test', 'type2'] };

    await manager.recordLearning(
      {
        id: 'pattern1',
        name: 'Pattern 1',
        description: 'First test pattern',
        context: pattern1Context,
        energy,
        flow,
        meta: {
          created: new Date(),
          lastUsed: new Date(),
          useCount: 0,
          successRate: 0,
          learnings: []
        }
      },
      pattern1Context,
      'Created pattern 1'
    );

    await manager.recordLearning(
      {
        id: 'pattern2',
        name: 'Pattern 2',
        description: 'Second test pattern',
        context: pattern2Context,
        energy,
        flow,
        meta: {
          created: new Date(),
          lastUsed: new Date(),
          useCount: 0,
          successRate: 0,
          learnings: []
        }
      },
      pattern2Context,
      'Created pattern 2'
    );

    // Test pattern selection
    const searchContext1 = { ...context, meta: { ...context.meta, tags: ['test', 'type1'] }};
    const selectedPattern1 = await manager.applyPattern(searchContext1, energy, flow);
    expect(selectedPattern1?.id).toBe('pattern1');

    const searchContext2 = { ...context, meta: { ...context.meta, tags: ['test', 'type2'] }};
    const selectedPattern2 = await manager.applyPattern(searchContext2, energy, flow);
    expect(selectedPattern2?.id).toBe('pattern2');
  });

  it('should maintain pattern history', async () => {
    const pattern = {
      id: 'history-test',
      name: 'History Test Pattern',
      description: 'Testing pattern history',
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

    // Record multiple learnings
    await manager.recordLearning(pattern, context, 'Learning 1');
    await manager.recordLearning(pattern, context, 'Learning 2');
    await manager.recordLearning(pattern, context, 'Learning 3');

    const history = manager.getContextHistory();
    expect(history.length).toBe(3);
    expect(history[0].id).toBe(context.id);
  });
}); 