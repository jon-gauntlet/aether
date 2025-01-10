/**
 * A place for people to work together naturally
 */

export interface Place {
  id: string;
  quiet: number;      // How peaceful it is
  flow: number;       // How work is going
  feel: Feel;         // Current mood
  doors: Door[];      // Ways to other places
}

export interface Door {
  from: string;
  to: string;
  use: number;        // How often used
  way: Way;          // What it's used for
}

export interface Person {
  id: string;
  doing: Doing;      // What they're up to
  mood: number;      // How they're feeling
  here: number;      // How present they are
}

export type Feel = 
  | 'flowing'    // Work going well
  | 'chatty'     // People talking
  | 'mixed'      // Bit of everything
  | 'quiet';     // Nice and peaceful

export type Doing =
  | 'working'    // Getting things done
  | 'helping'    // Working with others
  | 'looking'    // Finding their way
  | 'around';    // Just hanging out

export type Way =
  | 'work'       // Getting things done
  | 'chat'       // Having a talk
  | 'help'       // Giving a hand
  | 'wander';    // Just moving about

export interface Setting {
  steady: number;    // Keeps its feel
  easy: number;      // Changes smoothly
  fresh: number;     // Stays welcoming
