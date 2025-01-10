import { Workspace, Space, Presence, FocusState } from './types';
import { defaults } from './index';

export const focus = {
  // Help someone enter deep focus
  deepen(workspace: Workspace, presence: Presence) {
    if (canDeepen(presence)) {
      presence.state = {
        ...presence.state,
        focus: 'deep',
        available: false
      };
      
      adjustSpace(presence.location);
    }
  },

  // Create protection for focus
  protect(workspace: Workspace, presence: Presence) {
    if (presence.state.focus === 'deep') {
      presence.location.character = {
        ...presence.location.character,
        energy: presence.location.character.energy * 0.8,
        focus: Math.min(1, presence.location.character.focus + defaults.focus.protectionRate)
      };
    }
  },

  // Help restore focus after interruption
  restore(workspace: Workspace, presence: Presence) {
    if (presence.state.focus !== 'deep') {
      presence.state = {
        ...presence.state,
        focus: 'working',
        available: true,
        energy: presence.state.energy * 0.9
      };
    }
  }
};

function canDeepen(presence: Presence): boolean {
  return (
    presence.state.focus !== 'deep' &&
    presence.location.character.focus > 0.6 &&
    presence.state.energy > 0.4
  );
}

function adjustSpace(space: Space) {
  space.character = {
    ...space.character,
    energy: space.character.energy * 0.9,
    focus: Math.min(1, space.character.focus + 0.1),
    mood: 'focused'
  };
} 