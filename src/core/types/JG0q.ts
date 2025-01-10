import { NaturalFlow } from '../types/base';
import { FlowEngine } from './FlowEngine';

export function findFlow(id: string): NaturalFlow {
  return new FlowEngine();
}