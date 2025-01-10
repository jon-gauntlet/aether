import { Context, ContextState } from '../Context';
import { take, toArray } from 'rxjs/operators';

describe('Context', () => {
  let context: Context;
  const initialId = 'test-context';
  const initialType = 'system' as const;
  const initialContent = 'Initial content';

  beforeEach(() => {
    context = new Context(initialId, initialType, initialContent);
  });

  describe('initialization', () => {
    it('initializes with provided values', () => {
      const state = context.getCurrentState();
      expect(state.id).toBe(initialId);
      expect(state.type).toBe(initialType);
      expect(state.content).toBe(initialContent);
      expect(state.metadata).toEqual({});
    });

    it('initializes with empty content when not provided', () => {
      const emptyContext = new Context(initialId, initialType);
      expect(emptyContext.getCurrentState().content).toBe('');
    });

    it('sets initial lastModified timestamp', () => {
      const before = Date.now();
      const state = context.getCurrentState();
      const after = Date.now();
      expect(state.lastModified).toBeGreaterThanOrEqual(before);
      expect(state.lastModified).toBeLessThanOrEqual(after);
    });
  });

  describe('content management', () => {
    it('updates content', () => {
      context.updateContent('New content');
      expect(context.getCurrentState().content).toBe('New content');
    });

    it('updates lastModified on content change', () => {
      const before = context.getCurrentState().lastModified;
      context.updateContent('New content');
      expect(context.getCurrentState().lastModified).toBeGreaterThan(before);
    });
  });

  describe('metadata management', () => {
    it('updates metadata', () => {
      context.updateMetadata({ key: 'value' });
      expect(context.getCurrentState().metadata).toEqual({ key: 'value' });
    });

    it('merges metadata', () => {
      context.updateMetadata({ a: '1' });
      context.updateMetadata({ b: '2' });
      expect(context.getCurrentState().metadata).toEqual({
        a: '1',
        b: '2'
      });
    });

    it('clears metadata', () => {
      context.updateMetadata({ key: 'value' });
      context.clearMetadata();
      expect(context.getCurrentState().metadata).toEqual({});
    });

    it('updates lastModified on metadata change', () => {
      const before = context.getCurrentState().lastModified;
      context.updateMetadata({ key: 'value' });
      expect(context.getCurrentState().lastModified).toBeGreaterThan(before);
    });
  });

  describe('type management', () => {
    it('updates type', () => {
      context.updateType('user');
      expect(context.getCurrentState().type).toBe('user');
    });

    it('updates lastModified on type change', () => {
      const before = context.getCurrentState().lastModified;
      context.updateType('user');
      expect(context.getCurrentState().lastModified).toBeGreaterThan(before);
    });

    it('handles all valid types', () => {
      const types: Array<ContextState['type']> = ['system', 'user', 'hidden'];
      types.forEach(type => {
        context.updateType(type);
        expect(context.getCurrentState().type).toBe(type);
      });
    });
  });

  describe('observation', () => {
    it('emits context updates', (done) => {
      context.observeContext().pipe(
        take(2),
        toArray()
      ).subscribe((states: ContextState[]) => {
        expect(states[0].content).toBe(initialContent);
        expect(states[1].content).toBe('New content');
        done();
      });

      context.updateContent('New content');
    });

    it('emits metadata updates', (done) => {
      context.observeContext().pipe(
        take(2),
        toArray()
      ).subscribe((states: ContextState[]) => {
        expect(states[0].metadata).toEqual({});
        expect(states[1].metadata).toEqual({ key: 'value' });
        done();
      });

      context.updateMetadata({ key: 'value' });
    });
  });

  describe('touch', () => {
    it('updates lastModified without changing other properties', () => {
      const before = context.getCurrentState();
      const beforeTime = before.lastModified;
      
      context.touch();
      
      const after = context.getCurrentState();
      expect(after.lastModified).toBeGreaterThan(beforeTime);
      expect(after.id).toBe(before.id);
      expect(after.type).toBe(before.type);
      expect(after.content).toBe(before.content);
      expect(after.metadata).toEqual(before.metadata);
    });
  });

  describe('error handling', () => {
    it('handles empty content gracefully', () => {
      expect(() => context.updateContent('')).not.toThrow();
      expect(context.getCurrentState().content).toBe('');
    });

    it('handles invalid metadata gracefully', () => {
      expect(() => context.updateMetadata(null as any)).not.toThrow();
      expect(context.getCurrentState().metadata).toEqual({});
    });

    it('prevents invalid type updates', () => {
      expect(() => context.updateType('invalid' as any)).toThrow();
    });
  });
}); 