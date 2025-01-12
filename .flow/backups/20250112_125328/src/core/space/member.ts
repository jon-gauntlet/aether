import { Member, Room } from './types';

export function isActive(member: Member): boolean {
  return member.presence > 0.5;
}

export function isFocused(member: Member): boolean {
  const focusLevel = member.focus?.level ?? 0;
  return focusLevel > 0.7;
}

export function canInterrupt(member: Member): boolean {
  return !member.focus || member.focus.level < 0.7;
}

export function shouldConnect(member: Member, room: Room): boolean {
  return room.members.length < 5 || member.presence > 0.8;
}

export function adapt(member: Member, room: Room): Member {
  return {
    ...member,
    presence: Math.min(1, member.presence + 0.1)
  };
} 