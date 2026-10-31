export interface Point {
  x: number;
  y: number;
  pressure?: number;
  time: number;
}

export type PenStyle = 'standard' | 'fountain' | 'marker';

export interface Stroke {
  points: Point[];
  color: string;
  width: number;
  penStyle: PenStyle;
}

export type CanvasBackground = 'transparent' | 'white' | 'ruled' | 'parchment';

export interface SavedSignature {
  id: string;
  title: string;
  dataUrl: string;
  createdAt: number;
  isTransparent: boolean;
  width: number;
  height: number;
  fileSizeBytes?: number;
}

export interface ExportSettings {
  autoCrop: boolean;
  padding: number;
  transparentBackground: boolean;
  scale: number; // 1, 2, or 3
  filename: string;
}
