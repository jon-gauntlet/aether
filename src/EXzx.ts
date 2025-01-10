/**
 * Workspace: The natural environment for team collaboration
 * 
 * Think of this like a real workspace:
 * - Rooms have their own character
 * - People naturally gather and disperse
 * - Focus and energy flow naturally
 * - Everything adapts organically
 */

import { createWorkspace } from './create';
import { adapt } from './utils';

export function setupWorkspace(name: string) {
  return {
    workspace: createWorkspace(name),
    actions: {
      create: createWorkspace,
      adapt
    }
  };
}

export * from './types';
export * from './utils'; 