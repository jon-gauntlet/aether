import { PatternSystem } from '../PatternSystem';
import { Pattern, PatternState } from '../../../types/patterns';

describe('PatternSystem', () => {
  let system: PatternSystem;

  beforeEach(() => {
    system = new PatternSystem();
  });

  describe('applyPattern', () => {
    it('returns null when no patterns exist', async () => {
      const result = await system.applyPattern(
        { depth: 1, tags: ['test'] },
        { level: 0.5, type: 'natural' },
        { state: 'active', metrics: { coherence: 0.8, resonance: 0.7 } }
      );
      expect(result).toBeNull();
    });

    it('finds best matching pattern based on context and energy', async () => {
      const pattern: Partial<Pattern> = {
        id: 'test-1',
        context: ['test', 'flow'],
        energyLevel: 0.6
      };

      await system.recordLearning(pattern, { depth: 1, tags: ['test', 'flow'] });

      const result = await system.applyPattern(
        { depth: 1, tags: ['test', 'flow'] },
        { level: 0.5, type: 'natural' },
        { state: 'active', metrics: { coherence: 0.8, resonance: 0.7 } }
      );

      expect(result).toBeTruthy();
      expect(result?.id).toBe('test-1');
    });
  });

  describe('recordLearning', () => {
    it('creates new pattern when recording first learning', async () => {
      const pattern: Partial<Pattern> = {
        id: 'test-1',
        context: ['test'],
        energyLevel: 0.5
      };

      const result = await system.recordLearning(
        pattern,
        { depth: 1, tags: ['test'] },
        'Test learning'
      );

      expect(result).toBeTruthy();
      expect(result.id).toBe('test-1');
      expect(result.states).toContain(PatternState.ACTIVE);
    });

    it('evolves existing pattern when recording additional learning', async () => {
      const pattern: Partial<Pattern> = {
        id: 'test-1',
        context: ['test'],
        energyLevel: 0.8
      };

      await system.recordLearning(
        pattern,
        { depth: 1, tags: ['test'] },
        'First learning'
      );

      const result = await system.recordLearning(
        pattern,
        { depth: 1, tags: ['test', 'flow'] },
        'Second learning'
      );

      expect(result).toBeTruthy();
      expect(result.id).toBe('test-1');
      expect(result.context).toContain('flow');
      expect(result.states).toContain(PatternState.EVOLVING);
    });
  });

  describe('getPatterns', () => {
    it('emits updated patterns after recording learning', async () => {
      const pattern: Partial<Pattern> = {
        id: 'test-1',
        context: ['test'],
        energyLevel: 0.5
      };

      let emittedPatterns: Pattern[] = [];
      system.getPatterns().subscribe(patterns => {
        emittedPatterns = patterns;
      });

      await system.recordLearning(
        pattern,
        { depth: 1, tags: ['test'] },
        'Test learning'
      );

      expect(emittedPatterns.length).toBe(1);
      expect(emittedPatterns[0].id).toBe('test-1');
    });
  });

  describe('getLearningHistory', () => {
    it('returns learning history for specific pattern', async () => {
      const pattern: Partial<Pattern> = {
        id: 'test-1',
        context: ['test'],
        energyLevel: 0.5
      };

      await system.recordLearning(
        pattern,
        { depth: 1, tags: ['test'] },
        'First learning'
      );

      await system.recordLearning(
        pattern,
        { depth: 1, tags: ['test', 'flow'] },
        'Second learning'
      );

      const history = system.getLearningHistory('test-1');
      expect(history.length).toBe(2);
      expect(history[0].notes).toBe('First learning');
      expect(history[1].notes).toBe('Second learning');
    });
  });
}); 