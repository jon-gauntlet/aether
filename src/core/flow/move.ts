import { Person, Place, Doing, Feel } from './types';

export function move(person: Person, place: Place, time: number) {
  // How things change
  const doing = shift(person.doing, place.feel, time);
  const mood = match(person.mood, place.flow);
  const here = settle(person.here, doing);

  return {
    ...person,
    doing,
    mood,
    here
  };
}

function shift(now: Doing, feel: Feel, time: number): Doing {
  // How work changes with the place
  const speed = paceOf(feel) * time;
  
  if (speed < 0.3) return now;
  
  const ways: Doing[] = ['around', 'looking', 'helping', 'working'];
  const at = ways.indexOf(now);
  const next = Math.min(at + Math.floor(speed), 3);
  
  return ways[next];
}

function match(now: number, flow: number): number {
  // Mood follows the flow
  const want = flow > 0.7 ? 1 
    : flow > 0.4 ? 0.7
    : 0.4;
  
  return now + (want - now) * 0.1;
}

function settle(now: number, doing: Doing): number {
  // How present you are depends on what you're doing
  const natural = doing === 'working' ? 0.3
    : doing === 'helping' ? 0.5
    : doing === 'looking' ? 0.8
    : 1;
    
  return now + (natural - now) * 0.1;
}

function paceOf(feel: Feel): number {
  // How different places affect work
  const paces: Record<Feel, number> = {
    flowing: 0.5,
    chatty: 0.3,
    mixed: 0.4,
    quiet: 0.2
  };
  
  return paces[feel];
}

export function together(people: Person[], place: Place) {
  // People affect each other
  people.forEach(person => {
    const others = people.filter(p => p.id !== person.id);
    
    if (others.length > 0) {
      person.mood = shareMood(person, others);
      person.here = shareSpace(person, others);
    }
  });
}

function shareMood(one: Person, others: Person[]): number {
  // Moods rub off
  const around = others.reduce((sum, p) => sum + p.mood, 0) / others.length;
  return one.mood + (around - one.mood) * 0.1;
}

function shareSpace(one: Person, others: Person[]): number {
  // Being around others changes how present you are
  const around = others.reduce((sum, p) => sum + p.here, 0) / others.length;
  return one.here + (around - one.here) * 0.05;
} 