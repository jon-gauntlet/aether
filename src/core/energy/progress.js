import { Member, Room, Stage, State } from '../types';

export function progress(member: Member, room: Room, time: number) {
  // Natural progression
  const effect = stateEffect(member.state);
  const space = spaceEffect(room);
  
  // Adjust focus
  member.focus.level = Math.min(1, member.focus.level + effect * time);
  member.focus.quality = Math.min(1, member.focus.quality + space * time);
  
  // Adjust energy
  member.energy = Math.min(1, member.energy + effect * time);
  
  // Deepen naturally
  member.depth = Math.min(1, member.depth + space * time);
}

function stateEffect(state: State): number {
  // How different states affect progress
  const effects: Record<State, number> = {
    clear: 0.5,
    active: 0.3,
    balanced: 0.4,
    calm: 0.2
  };
  
  return effects[state];
}

export function interact(members: Member[], room: Room) {
  // Members influence each other
  members.forEach(member => {
    const others = members.filter(m => m.id !== member.id);
    
    if (others.length > 0) {
      member.energy = shareEnergy(member, others);
      member.attention = shareAttention(member, others);
    }
  });
}

function shareEnergy(one: Member, others: Member[]): number {
  // Energy naturally shared
  const average = others.reduce((sum, m) => sum + m.energy, 0) / others.length;
  return one.energy + (average - one.energy) * 0.1;
}

function shareAttention(one: Member, others: Member[]): number {
  // Attention influenced by group
  const average = others.reduce((sum, m) => sum + m.attention, 0) / others.length;
  return one.attention + (average - one.attention) * 0.05;
} // Merged from 1_progress.ts
import { Member, Room, Stage, State } from './types';

export function progress(member: Member, room: Room, time: number) {
  // Natural progression
  const stage = advance(member.stage, room.state, time);
  const energy = adjust(member.energy, room.focus);
  const attention = tune(member.attention, stage);

  return {
    ...member,
    stage,
    energy,
    attention
  };
}

function advance(current: Stage, state: State, time: number): Stage {
  // Progress influenced by room state
  const rate = stateEffect(state) * time;
  
  if (rate < 0.3) return current;
  
  const steps: Stage[] = ['joining', 'learning', 'engaged', 'focused'];
  const pos = steps.indexOf(current);
  const next = Math.min(pos + Math.floor(rate), 3);
  
  return steps[next];
}

function adjust(current: number, focus: number): number {
  // Energy aligns with room focus
  const target = focus > 0.7 ? 1 
    : focus > 0.4 ? 0.7
    : 0.4;
  
  return current + (target - current) * 0.1;
}

function tune(current: number, stage: Stage): number {
  // Attention varies with stage
  const natural = stage === 'focused' ? 0.3
    : stage === 'engaged' ? 0.5
    : stage === 'learning' ? 0.8
    : 1;
    
  return current + (natural - current) * 0.1;
}

function stateEffect(state: State): number {
  // How different states affect progress
  const effects: Record<State, number> = {
    clear: 0.5,
    active: 0.3,
    balanced: 0.4,
    calm: 0.2
  };
  
  return effects[state];
}

export function interact(members: Member[], room: Room) {
  // Members influence each other
  members.forEach(member => {
    const others = members.filter(m => m.id !== member.id);
    
    if (others.length > 0) {
      member.energy = shareEnergy(member, others);
      member.attention = shareAttention(member, others);
    }
  });
}

function shareEnergy(one: Member, others: Member[]): number {
  // Energy naturally shared
  const average = others.reduce((sum, m) => sum + m.energy, 0) / others.length;
  return one.energy + (average - one.energy) * 0.1;
}

function shareAttention(one: Member, others: Member[]): number {
  // Attention influenced by group
  const average = others.reduce((sum, m) => sum + m.attention, 0) / others.length;
  return one.attention + (average - one.attention) * 0.05;
} // Merged from 1_progress.ts
import { Member, Room, Stage, State } from './types';

export function progress(member: Member, room: Room, time: number) {
  // Natural progression
  const stage = advance(member.stage, room.state, time);
  const energy = adjust(member.energy, room.focus);
  const attention = tune(member.attention, stage);

  return {
    ...member,
    stage,
    energy,
    attention
  };
}

function advance(current: Stage, state: State, time: number): Stage {
  // Progress influenced by room state
  const rate = stateEffect(state) * time;
  
  if (rate < 0.3) return current;
  
  const steps: Stage[] = ['joining', 'learning', 'engaged', 'focused'];
  const pos = steps.indexOf(current);
  const next = Math.min(pos + Math.floor(rate), 3);
  
  return steps[next];
}

function adjust(current: number, focus: number): number {
  // Energy aligns with room focus
  const target = focus > 0.7 ? 1 
    : focus > 0.4 ? 0.7
    : 0.4;
  
  return current + (target - current) * 0.1;
}

function tune(current: number, stage: Stage): number {
  // Attention varies with stage
  const natural = stage === 'focused' ? 0.3
    : stage === 'engaged' ? 0.5
    : stage === 'learning' ? 0.8
    : 1;
    
  return current + (natural - current) * 0.1;
}

function stateEffect(state: State): number {
  // How different states affect progress
  const effects: Record<State, number> = {
    clear: 0.5,
    active: 0.3,
    balanced: 0.4,
    calm: 0.2
  };
  
  return effects[state];
}

export function interact(members: Member[], room: Room) {
  // Members influence each other
  members.forEach(member => {
    const others = members.filter(m => m.id !== member.id);
    
    if (others.length > 0) {
      member.energy = shareEnergy(member, others);
      member.attention = shareAttention(member, others);
    }
  });
}

function shareEnergy(one: Member, others: Member[]): number {
  // Energy naturally shared
  const average = others.reduce((sum, m) => sum + m.energy, 0) / others.length;
  return one.energy + (average - one.energy) * 0.1;
}

function shareAttention(one: Member, others: Member[]): number {
  // Attention influenced by group
  const average = others.reduce((sum, m) => sum + m.attention, 0) / others.length;
  return one.attention + (average - one.attention) * 0.05;
} 