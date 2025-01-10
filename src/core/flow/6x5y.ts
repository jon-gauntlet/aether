import { Place, Person, Feel, Door, Way } from './types';

export function change(place: Place, time: number) {
  // Things settle naturally
  let quiet = settle(place.quiet, time);
  let flow = keep(place.flow, time);
  
  // See how it feels
  const feel = check(quiet, flow);
  
  // Update the doors
  const doors = place.doors.map(door => 
    wear(door, feel)
  );

  return {
    ...place,
    quiet,
    flow,
    feel,
    doors
  };
}

function settle(quiet: number, time: number): number {
  // Gets quieter on its own
  const bit = 0.05 * time;
  return Math.min(1, quiet + bit);
}

function keep(flow: number, time: number): number {
  // Need to keep the flow going
  const bit = 0.02 * time;
  return Math.max(0.1, flow - bit);
}

function check(quiet: number, flow: number): Feel {
  if (flow > 0.7) return 'flowing';
  if (quiet < 0.3) return 'chatty';
  if (quiet < 0.7) return 'mixed';
  return 'quiet';
}

function wear(door: Door, feel: Feel): Door {
  // Doors get more or less used
  let use = door.use;

  if (fits(feel, door.way)) {
    use = Math.min(1, use + 0.1);
  } else {
    use = Math.max(0.1, use - 0.05);
  }

  return { ...door, use };
}

function fits(feel: Feel, way: Way): boolean {
  // What works well together
  const works: Record<Feel, Way[]> = {
    flowing: ['work', 'wander'],
    chatty: ['chat', 'wander'],
    mixed: ['help', 'chat'],
    quiet: ['work', 'help']
  };

  return works[feel].includes(way);
}

export function mix(places: Place[]) {
  // Places affect each other
  places.forEach(place => {
    const near = findNear(place, places);
    const feels = near.map(n => ({
      quiet: n.place.quiet * n.door.use,
      flow: n.place.flow * n.door.use
    }));

    if (feels.length > 0) {
      place.quiet = blend(place.quiet, avg(feels.map(f => f.quiet)));
      place.flow = blend(place.flow, avg(feels.map(f => f.flow)));
      place.feel = check(place.quiet, place.flow);
    }
  });
}

function findNear(place: Place, places: Place[]) {
  return place.doors
    .map(door => ({
      place: places.find(p => p.id === door.to)!,
      door
    }))
    .filter(n => n.place);
}

function blend(a: number, b: number): number {
  return a + (b - a) * 0.1;
}

function avg(nums: number[]): number {
  return nums.reduce((sum, n) => sum + n, 0) / nums.length;
} 