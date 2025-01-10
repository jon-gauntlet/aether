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

    it('handles empty id initialization', () => {
      const emptyContext = new Context('', initialType);
      expect(emptyContext.getCurrentState().id).toBe('');
    });

    it('initializes with all valid types', () => {
      const types: Array<ContextState['type']> = ['system', 'user', 'hidden'];
      types.forEach(type => {
        const typeContext = new Context(initialId, type);
        expect(typeContext.getCurrentState().type).toBe(type);
      });
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

    it('handles undefined content gracefully', () => {
      context.updateContent(undefined as any);
      expect(context.getCurrentState().content).toBe('');
    });

    it('handles special characters in content', () => {
      const specialContent = 'Test!@#$%^&*()\nNew line\tTab';
      context.updateContent(specialContent);
      expect(context.getCurrentState().content).toBe(specialContent);
    });

    it('handles empty content', () => {
      context.updateContent('');
      expect(context.getCurrentState().content).toBe('');
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

    it('handles undefined metadata gracefully', () => {
      context.updateMetadata(undefined as any);
      expect(context.getCurrentState().metadata).toEqual({});
    });

    it('handles nested metadata objects', () => {
      context.updateMetadata({
        nested: {
          key: 'value',
          array: [1, 2, 3]
        }
      });
      expect(context.getCurrentState().metadata).toEqual({
        nested: {
          key: 'value',
          array: [1, 2, 3]
        }
      });
    });

    it('preserves existing metadata when clearing', () => {
      context.updateMetadata({ key: 'value' });
      const beforeClear = context.getCurrentState().lastModified;
      context.clearMetadata();
      expect(context.getCurrentState().lastModified).toBeGreaterThan(beforeClear);
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

    it('throws on invalid type', () => {
      expect(() => context.updateType('invalid' as any)).toThrow();
    });

    it('preserves state when type changes', () => {
      context.updateMetadata({ key: 'value' });
      context.updateContent('test content');
      context.updateType('user');
      
      const state = context.getCurrentState();
      expect(state.metadata).toEqual({ key: 'value' });
      expect(state.content).toBe('test content');
    });
  });

  describe('observation', () => {
    it('emits context updates', async () => {
      const promise = context.observeContext().pipe(
        take(2),
        toArray()
      ).toPromise();

      await new Promise(resolve => setTimeout(resolve, 1));
      context.updateContent('New content');
      
      const states = (await promise)!;
      expect(states[0].content).toBe(initialContent);
      expect(states[1].content).toBe('New content');
    });

    it('emits metadata updates', async () => {
      const promise = context.observeContext().pipe(
        take(2),
        toArray()
      ).toPromise();

      await new Promise(resolve => setTimeout(resolve, 1));
      context.updateMetadata({ key: 'value' });
      
      const states = (await promise)!;
      expect(states[0].metadata).toEqual({});
      expect(states[1].metadata).toEqual({ key: 'value' });
    });

    it('emits multiple sequential updates', async () => {
      const promise = context.observeContext().pipe(
        take(3),
        toArray()
      ).toPromise();

      await new Promise(resolve => setTimeout(resolve, 1));
      context.updateContent('Content 1');
      await new Promise(resolve => setTimeout(resolve, 1));
      context.updateContent('Content 2');
      
      const states = (await promise)!;
      expect(states[0].content).toBe(initialContent);
      expect(states[1].content).toBe('Content 1');
      expect(states[2].content).toBe('Content 2');
    });

    it('handles unsubscribe correctly', () => {
      const subscription = context.observeContext().subscribe();
      subscription.unsubscribe();
      expect(subscription.closed).toBe(true);
    });
  });

  describe('touch', () => {
    it('updates lastModified without changing other properties', async () => {
      const before = context.getCurrentState();
      const beforeTime = before.lastModified;
      
      await new Promise(resolve => setTimeout(resolve, 1));
      context.touch();
      
      const after = context.getCurrentState();
      expect(after.lastModified).toBeGreaterThan(beforeTime);
      expect(after.id).toBe(before.id);
      expect(after.type).toBe(before.type);
      expect(after.content).toBe(before.content);
      expect(after.metadata).toEqual(before.metadata);
    });

    it('emits state update on touch', async () => {
      const beforeTime = context.getCurrentState().lastModified;
      
      const promise = context.observeContext().pipe(
        take(2),
        toArray()
      ).toPromise();

      await new Promise(resolve => setTimeout(resolve, 1));
      context.touch();
      
      const states = (await promise)!;
      expect(states[1].lastModified).toBeGreaterThan(beforeTime);
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

    it('handles non-object metadata gracefully', () => {
      expect(() => context.updateMetadata('invalid' as any)).not.toThrow();
      expect(context.getCurrentState().metadata).toEqual({});
    });

    it('handles array metadata gracefully', () => {
      expect(() => context.updateMetadata([] as any)).not.toThrow();
      expect(context.getCurrentState().metadata).toEqual({});
    });
  });
}); 