import { Field } from './types/base';

export interface Workspace {
  [key: string]: any;
  getField(...args: any): any;
  clearWaves(field: string): void;
}

class WorkspaceImplementation implements Workspace {
  [key: string]: any;

  getField(...args: any): any {
    // Implementation here
  }

  clearWaves(field: string): void {
    if (this[field]) {
      this[field].waves = [];
    }
  }
}

export { WorkspaceImplementation };