import create from 'zustand';
import { ContextPoint } from './types';

interface ContextState {
  points: ContextPoint[];
  addPoint: (point: ContextPoint) => void;
  removePoint: (id: string) => void;
}

const useContextStore = create<ContextState>((set) => ({
  points: [],
  
  addPoint: (point: ContextPoint) =>
    set((state) => ({ 
      points: [...state.points, point].sort((a, b) => 
        b.timestamp - a.timestamp
      )
    })),

  removePoint: (id: string) =>
    set((state) => ({
      points: state.points.filter((p) => p.id !== id)
    }))
}));

export default useContextStore; 