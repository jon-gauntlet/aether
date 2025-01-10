import create from 'zustand';
import { ContextPoint } from './types';

interface ContextState {
  points: ContextPoint[];
  selectedPoint: string | null;
  addPoint: (point: ContextPoint) => void;
  selectPoint: (id: string) => void;
  clearPoint: (id: string) => void;
}

export const useContextStore = create<ContextState>((set) => ({
  points: [],
  selectedPoint: null,

  addPoint: (point) => 
    set((state) => ({ 
      points: [...state.points, point].sort((a, b) => 
        b.timestamp.getTime() - a.timestamp.getTime()
      )
    })),

  selectPoint: (id) => 
    set({ selectedPoint: id }),

  clearPoint: (id) =>
    set((state) => ({
      points: state.points.filter(p => p.id !== id),
      selectedPoint: state.selectedPoint === id ? null : state.selectedPoint
    })),
