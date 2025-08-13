export type Shape = 'Rectangle' | 'Diamond' | 'Ellipse' | 'Parallelogram' | string;

export type ControlStructureType =
  | 'Start'
  | 'End'
  | 'Service'
  | 'Transformer'
  | 'If-Else'
  | 'Condition'
  | 'Switch'
  | 'Case'
  | 'ForEach'
  | 'Redo'
  | 'TCF-Block'
  | 'Try'
  | 'Catch'
  | 'Finally'
  | 'Await'
  | 'Group'
  | string;

export interface ControlStructure {
  id: string;
  type: ControlStructureType;
  label: string;
  position: { x: number; y: number };
  color?: string;
  shape?: Shape;
  comment?: string;
  condition?: string;
  children?: ControlStructure[];
  parentId?: string;
  [key: string]: any;
}

export interface Connection {
  id: string;
  source: string;
  target: string;
  sourceHandle: string;
  targetHandle: string;
  boolean?: string;
}

export interface Variable {
  name: string;
  type: string;
  value?: any;
}