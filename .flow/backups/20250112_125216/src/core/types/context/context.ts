export interface Context {
  id: string;
  type: ContextType;
  depth: number;
  parent?: Context;
  children: Context[];
  meta: ContextMeta;
  data: any;
}

export enum ContextType {
  System = 'system',
  Development = 'development',
  Pattern = 'pattern',
  Learning = 'learning',
  Sacred = 'sacred'
}

export interface ContextMeta {
  created: Date;
  lastAccessed: Date;
  accessCount: number;
  importance: number;
  tags: string[];
}
