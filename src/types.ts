export interface Voice {
  id: string;
  name: string;
  gender: 'Male' | 'Female';
  locale: string;
}

export interface VoicePreset {
  key: string;
  label: string;
  voiceId: string;
}

export interface VoicesResponse {
  presets: Record<string, string>;
  voices: Voice[];
}

export interface ScriptSection {
  name: string;
  text: string;
  wordCount: number;
  estDurationSec: number;
}

export interface ParseResult {
  totalSections: number;
  totalWords: number;
  estimatedDurationSec: number;
  sections: ScriptSection[];
}

export interface GeneratedFile {
  sectionName: string;
  filename: string;
  audioUrl: string;
  audioBlob?: Blob;
  voiceUsed?: string;
  sizeKb: number;
  durationSec: number;
  recommendedTimelineSec: number;
}

export interface GenerateResponse {
  success: boolean;
  elapsedSeconds: number;
  files: GeneratedFile[];
}

export interface GenerateSingleResponse {
  success: boolean;
  file: GeneratedFile;
}

export type GenerationStatus = 'idle' | 'generating' | 'success' | 'error';

export interface SpeedOption {
  label: string;
  value: string;
}
