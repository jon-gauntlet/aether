/**
 * Core Type System - Part 8
 * 
 * This file contains the core types for the space system.
 */

import type { Connection } from '../base';
import type { Energy, Presence, Harmony, Depth } from '../base';

// Space types
export interface Space {
  id: string;
  name: string;
  purpose: string;
  character: {
    energy: Energy;
    focus: number;
    mood: Mood;
  };
  connections: Connection[];
}

export type Mood = 'focused' | 'lively' | 'casual' | 'quiet';

// Experience types
export interface Member {
  id: string;
  focus: {
    level: Presence;
    quality: Harmony;
  };
  energy: Energy;
  depth: Depth;
}

export interface Room {
  id: string;
  calm: Harmony;
  focus: Presence;
  energy: Energy;
  paths: Connection[];
}

export interface Stage {
  level: Presence;
  quality: Harmony;
  energy: Energy;
}

export interface State {
  focus: Stage;
  flow: Stage;
  depth: Depth;
}