import { Workspace, Space, Presence, Person, FocusState } from './types';

export function join(workspace: Workspace, person: Person, space?: Space): Presence {
  // Find or create presence
  let presence = workspace.people.find(p => p.person.id === person.id);
  
  if (!presence) {
    presence = {
      person,
      state: {
        focus: 'open',
        energy: 0.7,
        available: true
      },
      location: space || workspace.spaces[0]
    };
    workspace.people.push(presence);
  }

  // Move to new space if specified
  if (space && space !== presence.location) {
    moveToSpace(presence, space);
  }

  return presence;
}

export function leave(workspace: Workspace, person: Person) {
  workspace.people = workspace.people.filter(p => p.person.id !== person.id);
}

function moveToSpace(presence: Presence, space: Space) {
  // Adapt state to new space
  presence.state = {
    ...presence.state,
    focus: adaptFocus(presence.state.focus, space),
    energy: adaptEnergy(presence.state.energy, space)
  };
  
  presence.location = space;
}

function adaptFocus(current: FocusState, space: Space): FocusState {
  // Naturally shift focus based on space character
  if (space.character.focus > 0.8) return 'deep';
  if (space.character.focus > 0.6) return 'working';
  if (space.character.focus > 0.3) return 'open';
  return 'social';
}

function adaptEnergy(current: number, space: Space): number {
  // Gently move energy level toward space energy
  const diff = space.character.energy - current;
  return current + (diff * 0.2);
} 