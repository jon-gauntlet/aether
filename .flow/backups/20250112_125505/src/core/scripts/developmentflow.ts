import { Space } from './base';
import { Energy } from './energy';
import { Flow } from './flow';

export interface DevelopmentFlow {
  context: {
    current: string;     // Current focus area
    depth: number;       // Understanding depth
    patterns: string[];  // Active patterns
    protection: number;  // Context protection level
    protectedPatterns: string[]; // Protected patterns
    protectedStates: string[];   // Protected states
  };
  energy: {
    level: number;       // Current energy level
    type: string;        // Energy quality
    flow: string;        // Flow state
  };
  protection: {
    depth: number;       // Protection depth
    patterns: string[];  // Protected patterns
    states: string[];    // Protected states
  };
}

export interface DevelopmentContext {
  current: string;
  depth: number;
  patterns: string[];
  protection: number;
  protectedPatterns: string[];
  protectedStates: string[];
}

export interface DevelopmentState {
  space: Space;
  energy: Energy;
  flow: Flow;
  context: DevelopmentContext;
}

export interface DevelopmentMetrics {
  energy: number;
  focus: number;
  progress: number;
  quality: number;
  learning: number;
}

export interface PatternRecognition {
  pattern: string;
  confidence: number;
  frequency: number;
  value: number;
}

export interface LearningCrystal {
  pattern: string;
  context: string;
  insight: string;
  value: number;
} 