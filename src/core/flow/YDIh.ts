import { useEffect, useState } from 'react';
import { Move } from './move';
import { Spot, Way, Group, Feel } from '../types/core';
import { spot, way, group } from '../types/use';

// One place to keep track
const flow = new Move();

// Use a spot
export function useSpot(id: string) {
  const [here, setHere] = useState<Spot>(spot(id));
  
  useEffect(() => {
    flow.add(here);
    const sub = flow.see(id).subscribe(spot => {
      if (spot) setHere(spot);
    });
    return () => sub.unsubscribe();
  }, [id]);

  return here;
}

// Use a way
export function useWay(id: string, move?: Way['move'], work?: Way['work']) {
  const [path, setPath] = useState<Way>(way(id, move, work));
  
  useEffect(() => {
    flow.begin(path);
    const sub = flow.follow(id).subscribe(way => {
      if (way) setPath(way);
    });
    return () => sub.unsubscribe();
  }, [id, move, work]);

  return path;
}

// Use a group
export function useGroup(id: string, spot: Spot) {
  const [together, setTogether] = useState<Group>(group(id, spot));
  
  useEffect(() => {
    flow.join(together);
    const sub = flow.stay(id).subscribe(group => {
      if (group) setTogether(group);
    });
    return () => sub.unsubscribe();
  }, [id, spot]);

  return together;
}

// Watch everything
export function useFlow() {
  const [spots, setSpots] = useState<Map<string, Spot>>(new Map());
  const [ways, setWays] = useState<Map<string, Way>>(new Map());
  const [groups, setGroups] = useState<Map<string, Group>>(new Map());

  useEffect(() => {
    const sub = flow.watch().subscribe(flow => {
      setSpots(flow.spots);
      setWays(flow.ways);
      setGroups(flow.groups);
    });
    return () => sub.unsubscribe();
  }, []);

  return { spots, ways, groups };
}

// Feel what's happening
export function useFeel(spot?: Spot, way?: Way, group?: Group): Feel {
  const [feel, setFeel] = useState<Feel>({
    ease: 1,
    depth: 0,
    warmth: 1,
    space: 1
  });

  useEffect(() => {
    const feels = [
      spot?.feel,
      way?.feel,
      group?.story.feel
    ].filter(Boolean) as Feel[];

    if (feels.length > 0) {
      setFeel(feels.reduce((a, b) => ({
        ease: (a.ease + b.ease) / 2,
        depth: Math.max(a.depth, b.depth),
        warmth: (a.warmth + b.warmth) / 2,
        space: Math.min(a.space, b.space)
      })));
    }
  }, [spot, way, group]);

  return feel;
} 