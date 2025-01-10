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
import { join, leave } from './presence';
import { focus } from './focus';
import { connect } from './connections';

// Natural workspace creation - just like finding a new office
export function workspace(name: string) {
  return {
    // Core actions feel like physical movements
    enter: join,
    leave: leave,
    connect,
    
    // Focus works like real spaces
    focus: {
      deepen: focus.deepen,    // Like getting into flow
      protect: focus.protect,   // Like closing your door
      restore: focus.restore   // Like coming back after coffee
    },

    // Spaces behave like real rooms
    spaces: {
      create: createWorkspace,
      join: join,
      adapt: adapt
    }
  };
}

// Everything has defaults that "just work"
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

// Types that read like natural concepts
export type {
  Workspace,
  Space,
  Presence,
  Focus,
  Connection
} from './types';

// Utilities that feel like natural actions
export {
  isActive,
  isFocused,
  canInterrupt,
  shouldConnect
} from './utils'; 