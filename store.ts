
import { create } from 'zustand';
import { TimelineTrack, TimelineClip, AssetTag, MediaType, Keyframe, SelectedKeyframe, ProjectSettings } from './types';

// Export CustomWorkflow for use in other components like ComfyUIBridge
export interface CustomWorkflow {
  id: string;
  name: string;
  json: any;
  parameters: Record<string, any>;
}

interface SystemStatus {
  comfy: 'pending' | 'online' | 'offline';
  ollama: 'pending' | 'online' | 'offline';
  gpu: string;
  isChecking: boolean;
  nodes: { name: string; installed: boolean }[];
}

type ViewType = 'studio' | 'lab' | 'settings';

interface EditorState {
  activeView: ViewType;
  tracks: TimelineTrack[];
  currentTime: number;
  duration: number;
  zoomLevel: number;
  selectedClipId: string | null;
  selectedKeyframes: SelectedKeyframe[];
  isPlaying: boolean;
  assets: TimelineClip[];
  projectSettings: ProjectSettings;
  systemStatus: SystemStatus;
  
  // Missing state properties for preview and AI features
  maskData: string | null;
  proxyMode: boolean;
  customWorkflows: CustomWorkflow[];
  selectedWorkflowId: string | null;
  workspaceHandle: any | null;
  
  // Actions
  setActiveView: (view: ViewType) => void;
  setCurrentTime: (time: number) => void;
  setZoomLevel: (zoom: number) => void;
  setSelectedClipId: (id: string | null) => void;
  setSelectedKeyframes: (kfs: SelectedKeyframe[]) => void;
  setIsPlaying: (playing: boolean) => void;
  setSystemStatus: (status: Partial<SystemStatus>) => void;
  addAsset: (asset: TimelineClip) => void;
  updateAsset: (id: string, updates: Partial<TimelineClip>) => void;
  addClipToTrack: (trackId: string, asset: TimelineClip, startTime: number) => void;
  updateClip: (trackId: string, clipId: string, updates: Partial<TimelineClip>) => void;
  saveProject: (isAutoSave?: boolean) => Promise<void>;
  updateKeyframe: (trackId: string, clipId: string, property: string, index: number, updates: Partial<Keyframe>) => void;
  
  // Missing Actions for keyframing and workspace management
  toggleKeyframe: (trackId: string, clipId: string, property: string) => void;
  setKeyframeAtTime: (trackId: string, clipId: string, property: string, value: number) => void;
  setMaskData: (mask: string | null) => void;
  setProxyMode: (active: boolean) => void;
  addCustomWorkflow: (wf: CustomWorkflow) => void;
  setSelectedWorkflowId: (id: string | null) => void;
  updateWorkflowParams: (id: string, params: Partial<CustomWorkflow['parameters']>) => void;
  removeWorkflow: (id: string) => void;
  updateProjectSettings: (settings: Partial<ProjectSettings>) => void;
  setWorkspaceHandle: (handle: any) => void;
  applyOpacityPreset: (trackId: string, clipId: string, preset: 'fadeIn' | 'fadeOut' | 'crossFade') => void;
}

const INITIAL_TRACKS: TimelineTrack[] = [
  { id: 'v1', name: 'Main Video', type: MediaType.VIDEO, clips: [], muted: false, locked: false },
  { id: 'v2', name: 'Overlays', type: MediaType.VIDEO, clips: [], muted: false, locked: false },
  { id: 'a1', name: 'Audio Master', type: MediaType.AUDIO, clips: [], muted: false, locked: false },
];

const DEFAULT_SETTINGS: ProjectSettings = {
  projectName: "PRO_SCENE_01",
  projectVersion: "3.5.0",
  author: "Senior Editor",
  paths: {
    baseRoot: "",
    comfyRoot: "http://127.0.0.1:8188",
    outputDir: "",
    assetsDir: "",
    modelsDir: "",
    workflowsDir: ""
  },
  defaults: {
    resolution: "1920x1080",
    customWidth: 1920,
    customHeight: 1080,
    fps: 24,
    proxyScale: 1
  }
};

export const useEditorStore = create<EditorState>((set, get) => ({
  activeView: 'studio',
  tracks: INITIAL_TRACKS,
  currentTime: 0,
  duration: 300, // 5 minutes default
  zoomLevel: 100,
  selectedClipId: null,
  selectedKeyframes: [],
  isPlaying: false,
  assets: [],
  projectSettings: DEFAULT_SETTINGS,
  systemStatus: {
    comfy: 'pending',
    ollama: 'pending',
    gpu: 'Detecting...',
    isChecking: true,
    nodes: []
  },
  
  maskData: null,
  proxyMode: false,
  customWorkflows: [],
  selectedWorkflowId: null,
  workspaceHandle: null,

  setActiveView: (view) => set({ activeView: view }),
  setCurrentTime: (time) => set({ currentTime: Math.max(0, time) }),
  setZoomLevel: (zoom) => set({ zoomLevel: Math.max(5, Math.min(1000, zoom)) }),
  setSelectedClipId: (id) => set({ selectedClipId: id }),
  setSelectedKeyframes: (kfs) => set({ selectedKeyframes: kfs }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setSystemStatus: (status) => set(state => ({ systemStatus: { ...state.systemStatus, ...status } })),
  
  addAsset: (asset) => set(state => ({ assets: [...state.assets, asset] })),
  updateAsset: (id, updates) => set(state => ({ 
    assets: state.assets.map(a => a.id === id ? { ...a, ...updates } : a) 
  })),

  addClipToTrack: (trackId, asset, startTime) => set(state => ({
    tracks: state.tracks.map(t => t.id === trackId ? {
      ...t,
      clips: [...t.clips, { ...asset, id: crypto.randomUUID(), startTime }]
    } : t)
  })),

  updateClip: (trackId, clipId, updates) => set(state => ({
    tracks: state.tracks.map(t => t.id === trackId ? {
      ...t,
      clips: t.clips.map(c => c.id === clipId ? { ...c, ...updates, properties: { ...c.properties, ...(updates.properties || {}) } } : c)
    } : t)
  })),

  // Added missing saveProject action
  saveProject: async (isAutoSave = false) => {
    console.log(isAutoSave ? "Auto-saving..." : "Saving project...");
    // Mock save operation to provide a complete implementation
    return new Promise(resolve => setTimeout(resolve, 500));
  },

  updateKeyframe: (trackId, clipId, property, index, updates) => set(state => ({
    tracks: state.tracks.map(t => t.id === trackId ? {
      ...t,
      clips: t.clips.map(c => c.id === clipId ? {
        ...c,
        keyframes: {
          ...c.keyframes,
          [property]: (c.keyframes[property] || []).map((k, i) => i === index ? { ...k, ...updates } : k)
        }
      } : c)
    } : t)
  })),

  setKeyframeAtTime: (trackId, clipId, property, value) => set(state => {
    const track = state.tracks.find(t => t.id === trackId);
    if (!track) return state;
    const clip = track.clips.find(c => c.id === clipId);
    if (!clip) return state;

    const timeInClip = state.currentTime - clip.startTime;
    const existingKfs = clip.keyframes[property] || [];
    const index = existingKfs.findIndex(k => Math.abs(k.time - timeInClip) < 0.05);

    let newKfs;
    if (index !== -1) {
      newKfs = existingKfs.map((k, i) => i === index ? { ...k, value } : k);
    } else {
      newKfs = [...existingKfs, { time: timeInClip, value, easing: 'linear' }].sort((a, b) => a.time - b.time);
    }

    return {
      tracks: state.tracks.map(t => t.id === trackId ? {
        ...t,
        clips: t.clips.map(c => c.id === clipId ? {
          ...c,
          keyframes: { ...c.keyframes, [property]: newKfs }
        } : c)
      } : t)
    };
  }),

  toggleKeyframe: (trackId, clipId, property) => set(state => {
    const track = state.tracks.find(t => t.id === trackId);
    if (!track) return state;
    const clip = track.clips.find(c => c.id === clipId);
    if (!clip) return state;

    const timeInClip = state.currentTime - clip.startTime;
    const existingKfs = clip.keyframes[property] || [];
    const index = existingKfs.findIndex(k => Math.abs(k.time - timeInClip) < 0.1);

    let newKfs;
    if (index !== -1) {
      newKfs = existingKfs.filter((_, i) => i !== index);
    } else {
      const val = (clip.properties as any)[property];
      newKfs = [...existingKfs, { time: timeInClip, value: val, easing: 'linear' }].sort((a, b) => a.time - b.time);
    }

    return {
      tracks: state.tracks.map(t => t.id === trackId ? {
        ...t,
        clips: t.clips.map(c => c.id === clipId ? {
          ...c,
          keyframes: { ...c.keyframes, [property]: newKfs }
        } : c)
      } : t)
    };
  }),

  // Added missing state update actions for AI features and project settings
  setMaskData: (mask) => set({ maskData: mask }),
  setProxyMode: (active) => set({ proxyMode: active }),
  addCustomWorkflow: (wf) => set(state => ({ customWorkflows: [...state.customWorkflows, wf] })),
  setSelectedWorkflowId: (id) => set({ selectedWorkflowId: id }),
  updateWorkflowParams: (id, params) => set(state => ({
    customWorkflows: state.customWorkflows.map(wf => 
      wf.id === id ? { ...wf, parameters: { ...wf.parameters, ...params } } : wf
    )
  })),
  removeWorkflow: (id) => set(state => ({ 
    customWorkflows: state.customWorkflows.filter(wf => wf.id !== id),
    selectedWorkflowId: state.selectedWorkflowId === id ? null : state.selectedWorkflowId
  })),
  updateProjectSettings: (settings) => set(state => ({ 
    projectSettings: { ...state.projectSettings, ...settings } 
  })),
  setWorkspaceHandle: (handle) => set({ workspaceHandle: handle }),

  // Completed the truncated applyOpacityPreset action
  applyOpacityPreset: (trackId, clipId, preset) => set(state => {
    const track = state.tracks.find(t => t.id === trackId);
    if (!track) return state;
    const clip = track.clips.find(c => c.id === clipId);
    if (!clip) return state;

    let newKfs = clip.keyframes.opacity || [];
    const duration = clip.duration;
    
    if (preset === 'fadeIn') {
      newKfs = [
        { time: 0, value: 0, easing: 'ease-out' },
        { time: 0.5, value: 100, easing: 'linear' }
      ];
    } else if (preset === 'fadeOut') {
      newKfs = [
        { time: duration - 0.5, value: 100, easing: 'linear' },
        { time: duration, value: 0, easing: 'ease-in' }
      ];
    } else if (preset === 'crossFade') {
      newKfs = [
        { time: 0, value: 0, easing: 'linear' },
        { time: 0.5, value: 100, easing: 'linear' },
        { time: duration - 0.5, value: 100, easing: 'linear' },
        { time: duration, value: 0, easing: 'linear' }
      ];
    }

    return {
      tracks: state.tracks.map(t => t.id === trackId ? {
        ...t,
        clips: t.clips.map(c => c.id === clipId ? {
          ...c,
          keyframes: { ...c.keyframes, opacity: newKfs }
        } : c)
      } : t)
    };
  }),
}));
