/**
 * Core types that mirror natural workspace concepts
 * Each type reads like describing a real space
 */

export interface Workspace {
  name: string;
  spaces: Space[];
  people: Presence[];
  connections: Connection[];
}

// A space is like a room - it has character and purpose
export interface Space {
  name: string;
  purpose: string;
  character: {
    energy: number;    // How lively it feels
    focus: number;     // How deep the work is
    mood: Mood;        // The overall vibe
  };
  connections: Connection[];
}

// Presence is like being in a room
export interface Presence {
  person: Person;
  state: {
    focus: FocusState;   // How deep in work
    energy: number;      // How active
    available: boolean;  // Open to interaction
  };
  location: Space;
}

// Connections are like paths between rooms
export interface Connection {
  between: [Space, Space];
  strength: number;     // How well-worn the path is
  type: ConnectionType; // What usually flows here
}

// Natural, intuitive types
export type Mood = 
  | 'focused'   // Deep work happening
  | 'lively'    // Active discussion
  | 'casual'    // Social atmosphere
  | 'quiet';    // Low activity

export type FocusState = 
  | 'deep'      // In the zone
  | 'working'   // Steady progress
  | 'open'      // Available to help
  | 'social';   // Here to chat

export type ConnectionType =
  | 'discussion'  // Active conversation
  | 'reference'   // Information sharing
  | 'social'      // Casual chat
  | 'updates';    // Status sharing

// People are the core of any workspace
export interface Person {
  id: string;
  name: string;
  preferences: {
    focusStyle: FocusStyle;
    workStyle: WorkStyle;
    interactionStyle: InteractionStyle;
  };
}

// Everyone works differently
export type FocusStyle = 
  | 'deep-diver'     // Long focus periods
  | 'quick-switch'   // Rapid context shifts
  | 'steady-flow'    // Consistent pace
  | 'collaborative'; // Group-focused

export type WorkStyle =
  | 'maker'       // Creates things
  | 'connector'   // Brings people together
  | 'organizer'   // Keeps things flowing
  | 'responder';  // Helps others

export type InteractionStyle =
  | 'proactive'     // Initiates contact
  | 'responsive'    // Replies quickly
  | 'scheduled'     // Prefers structure
  | 'ambient';      // Always around 

export interface Focus {
  level: number;
  target: string;
  duration: number;
}

export interface Member {
  id: string;
  name: string;
  presence: number;
  focus?: Focus;
}

export interface Room {
  id: string;
  name: string;
  members: Member[];
  stage: Stage;
}

export interface Stage {
  id: string;
  state: State;
  progress: number;
}

