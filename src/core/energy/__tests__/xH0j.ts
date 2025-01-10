import { PersistentPatternManager } from '../PersistentPatternManager';
import { Pattern, PatternState } from '../../../types/patterns';

describe('PersistentPatternManager', () => {
  let manager: PersistentPatternManager;
  let mockLocalStorage: { [key: string]: string };

  beforeEach(() => {
    mockLocalStorage = {};
    global.localStorage = {
      getItem: (key: string) => mockLocalStorage[key] || null,
      setItem: (key: string, value: string) => {
        mockLocalStorage[key] = value;
      },
      removeItem: (key: string) => {
        delete mockLocalStorage[key];
      },
      clear: () => {
        mockLocalStorage = {};
      },
      length: 0,
      key: (index: number) => '',
    };
    manager = new PersistentPatternManager();
  });

  describe('addPattern', () => {
    it('adds pattern with initial stats', () => {
      const pattern: Pattern = {
        id: 'test-1',
        name: 'Test Pattern',
        description: 'A test pattern',
        context: ['test'],
        energyLevel: 0.5,
        successRate: 0,
        states: [PatternState.ACTIVE]
      };

      let emittedPatterns: any[] = [];
      manager.getPatterns().subscribe(patterns => {
        emittedPatterns = patterns;
      });

      manager.addPattern(pattern);

      expect(emittedPatterns.length).toBe(1);
      expect(emittedPatterns[0].id).toBe('test-1');
      expect(emittedPatterns[0].stats).toBeDefined();
      expect(emittedPatterns[0].stats.uses).toBe(0);
      expect(emittedPatterns[0].stats.success).toBe(0);
    });

    it('persists pattern to localStorage', () => {
      const pattern: Pattern = {
        id: 'test-1',
        name: 'Test Pattern',
        description: 'A test pattern',
        context: ['test'],
        energyLevel: 0.5,
        successRate: 0,
        states: [PatternState.ACTIVE]
      };

      manager.addPattern(pattern);

      const stored = localStorage.getItem('aether_patterns');
      expect(stored).toBeTruthy();
      
      const parsedStored = JSON.parse(stored!);
      expect(parsedStored.length).toBe(1);
      expect(parsedStored[0].id).toBe('test-1');
    });
  });

  describe('updatePattern', () => {
    it('updates existing pattern', () => {
      const pattern: Pattern = {
        id: 'test-1',
        name: 'Test Pattern',
        description: 'A test pattern',
        context: ['test'],
        energyLevel: 0.5,
        successRate: 0,
        states: [PatternState.ACTIVE]
      };

      manager.addPattern(pattern);

      const storedPattern = {
        ...pattern,
        stats: {
          uses: 1,
          success: 1,
          lastUsed: Date.now()
        }
      };

      manager.updatePattern(storedPattern);

      let emittedPatterns: any[] = [];
      manager.getPatterns().subscribe(patterns => {
        emittedPatterns = patterns;
      });

      expect(emittedPatterns.length).toBe(1);
      expect(emittedPatterns[0].stats.uses).toBe(1);
      expect(emittedPatterns[0].stats.success).toBe(1);
    });
  });

  describe('recordUse', () => {
    it('updates pattern stats on successful use', () => {
      const pattern: Pattern = {
        id: 'test-1',
        name: 'Test Pattern',
        description: 'A test pattern',
        context: ['test'],
        energyLevel: 0.5,
        successRate: 0,
        states: [PatternState.ACTIVE]
      };

      manager.addPattern(pattern);
      manager.recordUse('test-1', true);

      let emittedPatterns: any[] = [];
      manager.getPatterns().subscribe(patterns => {
        emittedPatterns = patterns;
      });

      expect(emittedPatterns[0].stats.uses).toBe(1);
      expect(emittedPatterns[0].stats.success).toBe(1);
      expect(emittedPatterns[0].successRate).toBe(1);
    });

    it('updates pattern states based on success rate', () => {
      const pattern: Pattern = {
        id: 'test-1',
        name: 'Test Pattern',
        description: 'A test pattern',
        context: ['test'],
        energyLevel: 0.9,
        successRate: 0,
        states: [PatternState.ACTIVE]
      };

      manager.addPattern(pattern);

      // Record 10 successful uses
      for (let i = 0; i < 10; i++) {
        manager.recordUse('test-1', true);
      }

      let emittedPatterns: any[] = [];
      manager.getPatterns().subscribe(patterns => {
        emittedPatterns = patterns;
      });

      expect(emittedPatterns[0].states).toContain(PatternState.PROTECTED);
      expect(emittedPatterns[0].states).toContain(PatternState.STABLE);
    });
  });

  describe('importPatterns', () => {
    it('imports patterns with fresh stats', () => {
      const patterns: Pattern[] = [
        {
          id: 'test-1',
          name: 'Test Pattern 1',
          description: 'First test pattern',
          context: ['test'],
          energyLevel: 0.5,
          successRate: 0,
          states: [PatternState.ACTIVE]
        },
        {
          id: 'test-2',
          name: 'Test Pattern 2',
          description: 'Second test pattern',
          context: ['test'],
          energyLevel: 0.7,
          successRate: 0,
          states: [PatternState.ACTIVE]
        }
      ];

      manager.importPatterns(patterns);

      let emittedPatterns: any[] = [];
      manager.getPatterns().subscribe(patterns => {
        emittedPatterns = patterns;
      });

      expect(emittedPatterns.length).toBe(2);
      expect(emittedPatterns[0].stats.uses).toBe(0);
      expect(emittedPatterns[1].stats.uses).toBe(0);
    });
  });

  describe('exportPatterns', () => {
    it('exports patterns without stats', () => {
      const pattern: Pattern = {
        id: 'test-1',
        name: 'Test Pattern',
        description: 'A test pattern',
        context: ['test'],
        energyLevel: 0.5,
        successRate: 0,
        states: [PatternState.ACTIVE]
      };

      manager.addPattern(pattern);
      manager.recordUse('test-1', true);

      const exported = manager.exportPatterns();
      expect(exported.length).toBe(1);
      expect(exported[0].id).toBe('test-1');
      expect((exported[0] as any).stats).toBeUndefined();
    });
  });

  describe('clearPatterns', () => {
    it('removes all patterns', () => {
      const pattern: Pattern = {
        id: 'test-1',
        name: 'Test Pattern',
        description: 'A test pattern',
        context: ['test'],
        energyLevel: 0.5,
        successRate: 0,
        states: [PatternState.ACTIVE]
      };

      manager.addPattern(pattern);
      manager.clearPatterns();

      let emittedPatterns: any[] = [];
      manager.getPatterns().subscribe(patterns => {
        emittedPatterns = patterns;
      });

      expect(emittedPatterns.length).toBe(0);
      expect(localStorage.getItem('aether_patterns')).toBe('[]');
    });
  });
}); 