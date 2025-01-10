import { Workspace, Space, Mood } from './types';

export function createWorkspace(name: string): Workspace {
  return {
    name,
    spaces: [
      createMainSpace(),
      createQuietSpace(),
      createSocialSpace()
    ],
    people: [],
    connections: []
  };
}

function createMainSpace(): Space {
  return {
    name: 'Main Hall',
    purpose: 'Central gathering space for the team',
    character: {
      energy: 0.7,
      focus: 0.5,
      mood: 'lively'
    },
    connections: []
  };
}

function createQuietSpace(): Space {
  return {
    name: 'Study',
    purpose: 'Deep work and focused tasks',
    character: {
      energy: 0.3,
      focus: 0.9,
      mood: 'focused'
    },
    connections: []
  };
}

function createSocialSpace(): Space {
  return {
    name: 'Commons',
    purpose: 'Casual conversation and breaks',
    character: {
      energy: 0.8,
      focus: 0.2,
      mood: 'casual'
    },
    connections: []
  };
} 