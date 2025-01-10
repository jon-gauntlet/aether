import { Flow } from '../types/base';
import { FlowEngine } from '../experience/FlowEngine';

const flowEngine = new FlowEngine();

export function useFlow(): Flow {
  return flowEngine;
}