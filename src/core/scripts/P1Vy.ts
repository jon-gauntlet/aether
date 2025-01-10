import type { Member, Room, Stage, State } from '../types/index';

export function progress(member: Member, room: Room, time: number) {
  // Natural progression
  const effect = stateEffect(member.state);
  const space = calculateSpaceEffect(room);
  
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
  return (
    state.focus.level * 0.4 +
    state.flow.level * 0.4 +
    state.depth * 0.2
  );
}

function calculateSpaceEffect(room: Room): number {
  // How room affects progress
  return (
    room.calm * 0.4 +
    room.focus * 0.4 +
    room.energy * 0.2
  );
}

export function interact(members: Member[], room: Room) {
  // Members influence each other
  members.forEach(member => {
    const others = members.filter(m => m.id !== member.id);
    
    if (others.length > 0) {
      member.energy = shareEnergy(member, others);
      member.focus.level = shareAttention(member, others);
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
  const average = others.reduce((sum, m) => sum + m.focus.level, 0) / others.length;
  return one.focus.level + (average - one.focus.level) * 0.05;
} 