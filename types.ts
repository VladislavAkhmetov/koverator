export interface CarpetSettings {
  geometry: string;
  complexity: number; // 1-10
  wearAndTear: number; // 1-10
  borderThickness: string;
  symmetry: string;
  elements: string[];
  brandingMode: 'none' | 'center' | 'pattern' | 'corners';
}

export enum GeneratorState {
  IDLE = 'IDLE',
  GENERATING = 'GENERATING',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR'
}

export interface GeneratedImage {
  url: string;
  prompt: string;
}