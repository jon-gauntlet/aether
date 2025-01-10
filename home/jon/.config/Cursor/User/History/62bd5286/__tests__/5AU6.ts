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

    it('updates lastAccessed on settings change', () => {
      const before = workspace.getCurrentState().lastAccessed;
      workspace.updateSettings({ theme: 'dark' });
      expect(workspace.getCurrentState().lastAccessed).toBeGreaterThan(before);
    });
  });

  describe('name management', () => {
    it('updates name', () => {
      workspace.updateName('New Name');
      expect(workspace.getCurrentState().name).toBe('New Name');
    });

    it('updates lastAccessed on name change', () => {
      const before = workspace.getCurrentState().lastAccessed;
      workspace.updateName('New Name');
      expect(workspace.getCurrentState().lastAccessed).toBeGreaterThan(before);
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
  });

  describe('observation', () => {
    it('emits workspace updates', (done) => {
      workspace.observeWorkspace().pipe(
        take(2),
        toArray()
      ).subscribe((states: WorkspaceState[]) => {
        expect(states[0].name).toBe(initialName);
        expect(states[1].name).toBe('New Name');
        done();
      });

      workspace.updateName('New Name');
    });

    it('emits settings updates', (done) => {
      workspace.observeWorkspace().pipe(
        take(2),
        toArray()
      ).subscribe((states: WorkspaceState[]) => {
        expect(states[0].settings).toEqual({});
        expect(states[1].settings).toEqual({ theme: 'dark' });
        done();
      });

      workspace.updateSettings({ theme: 'dark' });
    });
  });

  describe('touch', () => {
    it('updates lastAccessed without changing other properties', () => {
      const before = workspace.getCurrentState();
      const beforeTime = before.lastAccessed;
      
      workspace.touch();
      
      const after = workspace.getCurrentState();
      expect(after.lastAccessed).toBeGreaterThan(beforeTime);
      expect(after.id).toBe(before.id);
      expect(after.name).toBe(before.name);
      expect(after.path).toBe(before.path);
      expect(after.settings).toEqual(before.settings);
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
  });
}); 