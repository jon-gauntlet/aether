import { useEffect, useState } from 'react';
import { Workspace, WorkspaceState } from './Workspace';

const globalWorkspace = new Workspace(
  'aether',
  'Aether',
  '/home/jon/projects/aether'
);

export function useWorkspace() {
  const [state, setState] = useState<WorkspaceState>(globalWorkspace.getCurrentState());

  useEffect(() => {
    const subscription = globalWorkspace.observeWorkspace().subscribe(setState);
    return () => subscription.unsubscribe();
  }, []);

  return {
    id: state.id,
    name: state.name,
    path: state.path,
    settings: state.settings,
    lastAccessed: state.lastAccessed,
    updateName: (name: string) => globalWorkspace.updateName(name),
    updatePath: (path: string) => globalWorkspace.updatePath(path),
    updateSettings: (settings: Record<string, any>) => 
      globalWorkspace.updateSettings(settings),
    clearSettings: () => globalWorkspace.clearSettings(),
    touch: () => globalWorkspace.touch()
  };
} 