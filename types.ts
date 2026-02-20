
export enum MediaType {
  VIDEO = 'video',
  AUDIO = 'audio',
  IMAGE = 'image',
  TEXT = 'text'
}

export enum AssetTag {
  KI = 'AI Generated',
  STOCK = 'Stock',
  LOCAL = 'Local'
}

export interface Keyframe {
  time: number;
  value: number;
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'bezier';
  bezierPoints?: [number, number, number, number]; // [x1, y1, x2, y2]
}

export interface VoiceProfile {
  id: string;
  name: string;
  sampleUrl?: string;
  baseVoice: 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr';
  characteristics: string[];
  pitch?: number;
  speed?: number;
  accent?: string;
}

export interface VoicePreset {
  id: string;
  name: string;
  pitch: number;
  speed: number;
  accent: string;
}

export interface ProjectSettings {
  projectName: string;
  projectVersion: string;
  author: string;
  paths: {
    baseRoot: string; // The /Sceneeditor_ultra root
    comfyRoot: string;
    outputDir: string;
    assetsDir: string;
    modelsDir: string;
    workflowsDir: string;
  };
  defaults: {
    resolution: string;
    customWidth: number;
    customHeight: number;
    fps: number;
    proxyScale: number;
  };
}

export interface AssetMetadata {
  width?: number;
  height?: number;
  codec?: string;
  fileSize?: number;
  mimeType?: string;
}

export interface TimelineClip {
  id: string;
  name: string;
  type: MediaType;
  startTime: number;
  duration: number;
  offset: number;
  sourceUrl: string;
  thumbnailUrl: string;
  tag: AssetTag;
  metadata?: AssetMetadata;
  properties: {
    scale: number;
    posX: number;
    posY: number;
    opacity: number;
    blur: number;
    volume?: number;
    fadeIn?: number;
    fadeOut?: number;
    // Text specific
    text?: string;
    fontSize?: number;
    color?: string;
    fontWeight?: string;
  };
  keyframes: Record<string, Keyframe[]>;
}

export interface TimelineTrack {
  id: string;
  name: string;
  type: MediaType;
  clips: TimelineClip[];
  muted: boolean;
  locked: boolean;
}

export interface SelectedKeyframe {
  trackId: string;
  clipId: string;
  property: string;
  index: number;
}
