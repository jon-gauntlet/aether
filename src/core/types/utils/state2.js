import { create } from 'zustand';
import { ContextPoint } from './types';

interface ContextState {
  points: ContextPoint[];
  selectedPoint: string | null;
  addPoint: (point: ContextPoint) => void;
  selectPoint: (id: string) => void;
  clearPoint: (id: string) => void;
}

export const useContextStore = create<ContextState>()((set) => ({
  points: [],
  selectedPoint: null,

  addPoint: (point: ContextPoint) => 
    set((state) => ({ 
      points: [...state.points, point].sort((a, b) => 
        b.timestamp.getTime() - a.timestamp.getTime()
      )
    })),

  selectPoint: (id: string) => 
    set({ selectedPoint: id }),

  clearPoint: (id: string) =>
    set((state) => ({
      points: state.points.filter((p) => p.id !== id),
      selectedPoint: state.selectedPoint === id ? null : state.selectedPoint
    }))
}));