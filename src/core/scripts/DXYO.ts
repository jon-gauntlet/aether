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
import type { Workspace } from './types';

export const defaults = {
  focus: {
    deepenRate: 5,      // Minutes to deepen focus
    protectionRate: 0.2, // How quickly protection builds
    recoveryRate: 0.1   // How quickly focus returns
  },
  space: {
    adaptRate: 0.2,     // How quickly spaces change
    connectionRange: 0.7 // How easily spaces connect
  }
};

// Re-export the interface as lowercase for backward compatibility
export type { Workspace as workspace };

// Also export the interface directly for new code
export type { Workspace };

// Export workspace utilities
export { createWorkspace, adapt };
export * from './types'; 