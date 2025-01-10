import { Workspace, WorkspaceState } from '../Workspace';
import { take, toArray } from 'rxjs/operators';

describe('Workspace', () => {
  let workspace: Workspace;
  const initialId = 'test-id';
  const initialName = 'Test Workspace';
  const initialPath = '/test/path';

  beforeEach(() => {
    workspace = new Workspace(initialId, initialName, initialPath);
  });

  describe('initialization', () => {
    it('initializes with provided values', () => {
      const state = workspace.getCurrentState();
      expect(state.id).toBe(initialId);
      expect(state.name).toBe(initialName);
      expect(state.path).toBe(initialPath);
      expect(state.settings).toEqual({});
    });

    it('sets initial lastAccessed timestamp', () => {
      const before = Date.now();
      const state = workspace.getCurrentState();
      const after = Date.now();
      expect(state.lastAccessed).toBeGreaterThanOrEqual(before);
      expect(state.lastAccessed).toBeLessThanOrEqual(after);
    });

    it('handles empty initialization values', () => {
      const emptyWorkspace = new Workspace('', '', '');
      const state = emptyWorkspace.getCurrentState();
      expect(state.id).toBe('');
      expect(state.name).toBe('');
      expect(state.path).toBe('');
      expect(state.settings).toEqual({});
    });
  });

  describe('settings management', () => {
    it('updates settings', () => {
      workspace.updateSettings({ theme: 'dark' });
      expect(workspace.getCurrentState().settings).toEqual({ theme: 'dark' });
    });

    it('merges settings', () => {
      workspace.updateSettings({ theme: 'dark' });
      workspace.updateSettings({ fontSize: 14 });
      expect(workspace.getCurrentState().settings).toEqual({
        theme: 'dark',
        fontSize: 14
      });
    });

    it('clears settings', () => {
      workspace.updateSettings({ theme: 'dark' });
      workspace.clearSettings();
      expect(workspace.getCurrentState().settings).toEqual({});
    });

    it('updates lastAccessed on settings change', async () => {
      const before = workspace.getCurrentState().lastAccessed;
      await new Promise(resolve => setTimeout(resolve, 1));
      workspace.updateSettings({ theme: 'dark' });
      expect(workspace.getCurrentState().lastAccessed).toBeGreaterThan(before);
    });

    it('handles undefined settings gracefully', () => {
      workspace.updateSettings(undefined as any);
      expect(workspace.getCurrentState().settings).toEqual({});
    });

    it('handles nested settings objects', () => {
      workspace.updateSettings({ 
        theme: { 
          primary: '#000',
          secondary: '#fff'
        }
      });
      expect(workspace.getCurrentState().settings).toEqual({
        theme: {
          primary: '#000',
          secondary: '#fff'
        }
      });
    });
  });

  describe('name management', () => {
    it('updates name', () => {
      workspace.updateName('New Name');
      expect(workspace.getCurrentState().name).toBe('New Name');
    });

    it('updates lastAccessed on name change', async () => {
      const before = workspace.getCurrentState().lastAccessed;
      await new Promise(resolve => setTimeout(resolve, 1));
      workspace.updateName('New Name');
      expect(workspace.getCurrentState().lastAccessed).toBeGreaterThan(before);
    });

    it('handles undefined name gracefully', () => {
      const defaultName = '';
      workspace.updateName(undefined as any);
      expect(workspace.getCurrentState().name).toBe(defaultName);
    });

    it('handles special characters in name', () => {
      workspace.updateName('Test!@#$%^&*()');
      expect(workspace.getCurrentState().name).toBe('Test!@#$%^&*()');
    });
  });

  describe('path management', () => {
    it('updates path', () => {
      workspace.updatePath('/new/path');
      expect(workspace.getCurrentState().path).toBe('/new/path');
    });

    it('updates lastAccessed on path change', () => {
      const before = workspace.getCurrentState().lastAccessed;
      workspace.updatePath('/new/path');
      expect(workspace.getCurrentState().lastAccessed).toBeGreaterThan(before);
    });

    it('handles undefined path gracefully', () => {
      const defaultPath = '';
      workspace.updatePath(undefined as any);
      expect(workspace.getCurrentState().path).toBe(defaultPath);
    });

    it('handles relative paths', () => {
      workspace.updatePath('./relative/path');
      expect(workspace.getCurrentState().path).toBe('./relative/path');
    });
  });

  describe('observation', () => {
    it('emits workspace updates', async () => {
      const promise = workspace.observeWorkspace().pipe(
        take(2),
        toArray()
      ).toPromise();

      await new Promise(resolve => setTimeout(resolve, 1));
      workspace.updateName('New Name');
      
      const states = (await promise)!;
      expect(states[0].name).toBe(initialName);
      expect(states[1].name).toBe('New Name');
    });

    it('emits settings updates', async () => {
      const promise = workspace.observeWorkspace().pipe(
        take(2),
        toArray()
      ).toPromise();

      await new Promise(resolve => setTimeout(resolve, 1));
      workspace.updateSettings({ theme: 'dark' });
      
      const states = (await promise)!;
      expect(states[0].settings).toEqual({});
      expect(states[1].settings).toEqual({ theme: 'dark' });
    });

    it('emits multiple sequential updates', async () => {
      const promise = workspace.observeWorkspace().pipe(
        take(3),
        toArray()
      ).toPromise();

      await new Promise(resolve => setTimeout(resolve, 1));
      workspace.updateSettings({ a: 1 });
      await new Promise(resolve => setTimeout(resolve, 1));
      workspace.updateSettings({ b: 2 });
      
      const states = (await promise)!;
      expect(states[0].settings).toEqual({});
      expect(states[1].settings).toEqual({ a: 1 });
      expect(states[2].settings).toEqual({ a: 1, b: 2 });
    });

    it('handles unsubscribe correctly', () => {
      const subscription = workspace.observeWorkspace().subscribe();
      subscription.unsubscribe();
      expect(subscription.closed).toBe(true);
    });
  });

  describe('touch', () => {
    it('updates lastAccessed without changing other properties', async () => {
      const before = workspace.getCurrentState();
      const beforeTime = before.lastAccessed;
      
      await new Promise(resolve => setTimeout(resolve, 1));
      workspace.touch();
      
      const after = workspace.getCurrentState();
      expect(after.lastAccessed).toBeGreaterThan(beforeTime);
      expect(after.id).toBe(before.id);
      expect(after.name).toBe(before.name);
      expect(after.path).toBe(before.path);
      expect(after.settings).toEqual(before.settings);
    });

    it('emits state update on touch', async () => {
      const beforeTime = workspace.getCurrentState().lastAccessed;
      
      const promise = workspace.observeWorkspace().pipe(
        take(2),
        toArray()
      ).toPromise();

      await new Promise(resolve => setTimeout(resolve, 1));
      workspace.touch();
      
      const states = (await promise)!;
      expect(states[1].lastAccessed).toBeGreaterThan(beforeTime);
    });
  });

  describe('error handling', () => {
    it('handles invalid settings gracefully', () => {
      expect(() => workspace.updateSettings(null as any)).not.toThrow();
      expect(workspace.getCurrentState().settings).toEqual({});
    });

    it('handles empty name gracefully', () => {
      expect(() => workspace.updateName('')).not.toThrow();
      expect(workspace.getCurrentState().name).toBe('');
    });

    it('handles empty path gracefully', () => {
      expect(() => workspace.updatePath('')).not.toThrow();
      expect(workspace.getCurrentState().path).toBe('');
    });

    it('handles non-object settings gracefully', () => {
      workspace.updateSettings('invalid' as any);
      expect(workspace.getCurrentState().settings).toEqual({});
    });

    it('handles array settings gracefully', () => {
      expect(() => workspace.updateSettings([] as any)).not.toThrow();
      expect(workspace.getCurrentState().settings).toEqual({});
    });
  });
}); 