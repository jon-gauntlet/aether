import { Connection } from './consciousness';
import { FlowPattern } from './flow';

export interface SpaceState {
  id: string;
  type: SpaceType;
  patterns: FlowPattern[];
  connections: Connection[];
}

export type SpaceType = 'gathering' | 'deepening' | 'contemplation' | 'communion';

export interface SpaceContext {
  depth: number;
  focus: number;
  energy: number;
  harmony: number;
}

export interface SpaceTransition {
  from: string;
  to: string;
  type: SpaceType;
  context: SpaceContext;

}