import { Field } from '../types/consciousness';

export function createDefaultField(): Field {
  return {
    center: {
      x: 0,
      y: 0,
      z: 0
    },
    radius: 1,
    strength: 1,
    waves: []
  };
} 