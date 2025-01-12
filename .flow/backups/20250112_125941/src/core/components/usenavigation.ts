import { useEffect, useState } from 'react';
import { Navigator, NavigationState } from './Navigator';

const globalNavigator = new Navigator();

export function useNavigation() {
  const [state, setState] = useState<NavigationState>(globalNavigator.getCurrentState());

  useEffect(() => {
    const subscription = globalNavigator.observeNavigation().subscribe(setState);
    return () => subscription.unsubscribe();
  }, []);

  return {
    currentPath: state.currentPath,
    previousPath: state.previousPath,
    params: state.params,
    navigate: (path: string, params?: Record<string, string>) => 
      globalNavigator.navigate(path, params),
    goBack: () => globalNavigator.goBack(),
    updateParams: (params: Record<string, string>) => 
      globalNavigator.updateParams(params),
    clearParams: () => globalNavigator.clearParams()
  };
}