export interface Room {
  id: string;
  calm: number;
  focus: number;
  paths: Path[];
}

export interface Path {
  to: string;
  strength: number;
} 