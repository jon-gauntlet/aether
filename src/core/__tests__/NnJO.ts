import { Navigator, NavigationState } from '../Navigator';
import { take, toArray } from 'rxjs/operators';

describe('Navigator', () => {
  let navigator: Navigator;

  beforeEach(() => {
    navigator = new Navigator();
  });

  describe('initialization', () => {
    it('initializes with default path', () => {
      expect(navigator.getCurrentState().currentPath).toBe('/');
      expect(navigator.getCurrentState().params).toEqual({});
    });

    it('initializes with custom path', () => {
      const customNav = new Navigator('/home');
      expect(customNav.getCurrentState().currentPath).toBe('/home');
    });
  });

  describe('navigation', () => {
    it('updates current path on navigation', () => {
      navigator.navigate('/test');
      expect(navigator.getCurrentState().currentPath).toBe('/test');
    });

    it('maintains navigation history', () => {
      navigator.navigate('/first');
      navigator.navigate('/second');
      
      const state = navigator.getCurrentState();
      expect(state.currentPath).toBe('/second');
      expect(state.previousPath).toBe('/first');
    });

    it('handles params during navigation', () => {
      navigator.navigate('/test', { id: '123' });
      const state = navigator.getCurrentState();
      expect(state.currentPath).toBe('/test');
      expect(state.params).toEqual({ id: '123' });
    });
  });

  describe('observation', () => {
    it('emits navigation updates', async () => {
      const promise = navigator.observeNavigation().pipe(
        take(2),
        toArray()
      ).toPromise();

      await new Promise(resolve => setTimeout(resolve, 1));
      navigator.navigate('/test');
      
      const states = (await promise)!;
      expect(states[0].currentPath).toBe('/');
      expect(states[1].currentPath).toBe('/test');
    });

    it('includes timestamps in updates', async () => {
      const initialTime = navigator.getCurrentState().timestamp;
      await new Promise(resolve => setTimeout(resolve, 10));
      navigator.navigate('/test');
      const newTime = navigator.getCurrentState().timestamp;
      expect(newTime).toBeGreaterThan(initialTime);
    });
  });

  describe('params management', () => {
    it('updates params independently', () => {
      navigator.navigate('/test', { id: '123' });
      navigator.updateParams({ name: 'test' });

      const state = navigator.getCurrentState();
      expect(state.params).toEqual({
        id: '123',
        name: 'test'
      });
    });

    it('clears params', () => {
      navigator.navigate('/test', { id: '123' });
      navigator.clearParams();

      expect(navigator.getCurrentState().params).toEqual({});
    });

    it('merges params on update', () => {
      navigator.updateParams({ a: '1' });
      navigator.updateParams({ b: '2' });

      expect(navigator.getCurrentState().params).toEqual({
        a: '1',
        b: '2'
      });
    });
  });

  describe('back navigation', () => {
    it('navigates to previous path', () => {
      navigator.navigate('/first');
      navigator.navigate('/second');
      navigator.goBack();

      expect(navigator.getCurrentState().currentPath).toBe('/first');
    });

    it('does nothing if no previous path', () => {
      const initialState = navigator.getCurrentState();
      navigator.goBack();
      expect(navigator.getCurrentState()).toEqual(initialState);
    });

    it('maintains params during back navigation', () => {
      // Store initial params
      const firstParams = { id: '123' };
      navigator.navigate('/first', firstParams);
      
      // Navigate to second route with different params
      navigator.navigate('/second', { name: 'test' });
      
      // Go back and verify params are restored
      navigator.goBack();
      
      // Create a new object with the expected params to avoid reference issues
      const expectedParams = { ...firstParams };
      expect(navigator.getCurrentState().params).toEqual(expectedParams);
    });
  });

  describe('error handling', () => {
    it('handles invalid paths gracefully', () => {
      expect(() => navigator.navigate('')).not.toThrow();
      expect(navigator.getCurrentState().currentPath).toBe('');
    });

    it('handles invalid params gracefully', () => {
      expect(() => navigator.updateParams(null as any)).not.toThrow();
      expect(navigator.getCurrentState().params).toEqual({});
    });
  });
}); 