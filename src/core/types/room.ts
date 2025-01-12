import { Connection } from '../consciousness';

interface Effect {
  calm: number;
  focus: number;
}

interface Path extends Connection {
  strength: number;
  to: string;
}

interface Room {
  id: string;
  calm: number;
  focus: number;
  paths: Path[];
}

export function adapt(room: Room, rooms: Room[]): Effect {
  const connected = findConnected(room, rooms);
  const effects = connected.map(n => ({
    calm: n.room.calm * n.path.strength,
    focus: n.room.focus * n.path.strength
  }));

  if (effects.length > 0) {
    return {
      calm: average(effects.map(e => e.calm)),
      focus: average(effects.map(e => e.focus))
    };
  }

  return { calm: 0, focus: 0 };
}

function findConnected(room: Room, rooms: Room[]): Array<{room: Room, path: Path}> {
  return rooms
    .filter(r => r.id !== room.id)
    .map(r => ({
      room: r,
      path: room.paths.find(p => p.to === r.id)
    }))
    .filter((n): n is {room: Room, path: Path} => n.path !== undefined);
}

function average(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}
