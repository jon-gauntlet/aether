import { Connection } from './consciousness';

// Re-export all consciousness types
export * from './consciousness';

// Workspace types
export interface Space {
  id: string;
  name: string;
  purpose: string;
  character: {
    energy: number;
    focus: number;
    mood: Mood;
  };
  connections: Connection[];
}

export type Mood = 'focused' | 'lively' | 'casual' | 'quiet';

// Member types
export interface Member {
  id: string;
  focus: {
    level: number;
    quality: number;
  };
}

export interface Room {
  id: string;
  calm: number;
  focus: number;
  paths: Connection[];
}

export interface Stage {
  level: number;
  quality: number;
}

export interface State {
  focus: Stage;
  flow: Stage;
} 