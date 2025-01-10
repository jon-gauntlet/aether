import { Connection } from '../core';
import { Resonance } from '../flow';

// Space field definition
export interface Field {
  center: {
    x: number;
    y: number;
    z: number;
  };
  radius: number;
  strength: number;
  waves: Wave[];
}

// Wave properties
export interface Wave {
  frequency: number;
  amplitude: number;
  phase: number;
}

// Mind space definition
export interface MindSpace {
  id: string;
  resonance: Resonance;
  depth: number;
  connections: Connection[];
}

// Type guards
export const isMindSpace = (space: any): space is MindSpace => {
  return (
    typeof space === 'object' &&
    typeof space.id === 'string' &&
    typeof space.depth === 'number' &&
    Array.isArray(space.connections)
  );
};

export const isField = (field: any): field is Field => {
  return (
    typeof field === 'object' &&
    typeof field.radius === 'number' &&
    typeof field.strength === 'number' &&
    Array.isArray(field.waves) &&
    field.center && 
    typeof field.center.x === 'number' &&
    typeof field.center.y === 'number' &&
    typeof field.center.z === 'number'
  );
};

export const isWave = (wave: any): wave is Wave => {
  return (
    typeof wave === 'object' &&
    typeof wave.frequency === 'number' &&
    typeof wave.amplitude === 'number' &&
    typeof wave.phase === 'number'
  );
}; 