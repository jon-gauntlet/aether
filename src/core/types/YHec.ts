import { Member, Room } from './types';

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