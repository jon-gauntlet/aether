import { Workspace, Space, Connection, ConnectionType } from './types';
import { defaults } from './index';

export function connect(workspace: Workspace, a: Space, b: Space, type: ConnectionType = 'discussion') {
  // Check if connection exists
  const existing = workspace.connections.find(c => 
    (c.between[0] === a && c.between[1] === b) ||
    (c.between[0] === b && c.between[1] === a)
  );

  if (existing) {
    strengthen(existing);
  } else {
    createConnection(workspace, a, b, type);
  }
}

function createConnection(workspace: Workspace, a: Space, b: Space, type: ConnectionType) {
  const connection: Connection = {
    between: [a, b],
    strength: 0.3,
    type
  };

  workspace.connections.push(connection);
  a.connections.push(connection);
  b.connections.push(connection);

  // Spaces influence each other
  blend(a, b);
}

function strengthen(connection: Connection) {
  connection.strength = Math.min(1, connection.strength + 0.1);
  blend(...connection.between);
}

function blend(a: Space, b: Space) {
  if (shouldBlend(a, b)) {
    // Gently blend space characteristics
    const rate = defaults.space.adaptRate;
    
    a.character = {
      ...a.character,
      energy: blend2(a.character.energy, b.character.energy, rate),
      focus: blend2(a.character.focus, b.character.focus, rate)
    };

    b.character = {
      ...b.character,
      energy: blend2(b.character.energy, a.character.energy, rate),
      focus: blend2(b.character.focus, a.character.focus, rate)
    };
  }
}

function shouldBlend(a: Space, b: Space): boolean {
  const energyDiff = Math.abs(a.character.energy - b.character.energy);
  const focusDiff = Math.abs(a.character.focus - b.character.focus);
  
  return (
    energyDiff < defaults.space.connectionRange &&
    focusDiff < defaults.space.connectionRange
  );
}

function blend2(a: number, b: number, rate: number): number {
  const diff = b - a;
  return a + (diff * rate);
} 