
import React, { useState } from 'react';
import { useEditorStore } from '../store';
import { Settings, Maximize2, Move, Ghost, Wand2, History, Cpu, Zap, Type, Palette, AlignLeft, Diamond, Volume2, BrainCircuit, Sparkles, RefreshCw, ShieldCheck, Spline, SlidersHorizontal, Activity, Edit3, Tag } from 'lucide-react';
import { MediaType, Keyframe } from '../types';
import { analyzeScene } from '../ollamaService';

const Inspector: React.FC = () => {
  const { selectedClipId, selectedKeyframes, tracks, updateClip, toggleKeyframe, setKeyframeAtTime, updateKeyframe, currentTime } = useEditorStore();
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  let selectedClip = null;
  let selectedTrackId = '';
  for (const track of tracks) {
    const clip = track.clips.find(c => c.id === selectedClipId);
    if (clip) {
      selectedClip = clip;
      selectedTrackId = track.id;
      break;
    }
  }

  const selectedKeyframe = selectedKeyframes[0];
  const activeKeyframeData = selectedKeyframe && selectedClip?.keyframes[selectedKeyframe.property]?.[selectedKeyframe.index];

  if (!selectedClip) {
    return (
      <div className="w-80 bg-zinc-900 border-l border-zinc-800 flex flex-col items-center justify-center p-12 text-center">
        <div className="w-20 h-20 rounded-3xl bg-zinc-950 border border-zinc-800 flex items-center justify-center mb-6 shadow-2xl">
           <Settings size={40} className="text-zinc-800" />
        </div>
        <h3 className="text-zinc-400 font-black uppercase text-[10px] tracking-widest">Idle Engine</h3>
        <p className="text-zinc-600 text-[9px] mt-3 leading-relaxed uppercase tracking-tighter opacity-50">Select any timeline object to load its telemetry and controls</p>
      </div>
    );
  }

  const handleUpdate = (prop: string, value: any) => {
    if (!selectedClip) return;
    
    // Auto-keyframing: If keyframes already exist for this property, update/create one at current playhead
    const hasExistingKeyframes = selectedClip.keyframes[prop] && selectedClip.keyframes[prop].length > 0;
    
    if (hasExistingKeyframes) {
      setKeyframeAtTime(selectedTrackId, selectedClip.id, prop, value);
    }
    
    updateClip(selectedTrackId, selectedClip.id, {
      properties: { ...selectedClip.properties, [prop]: value }
    });
  };

  const handleRename = (newName: string) => {
    updateClip(selectedTrackId, selectedClip!.id, { name: newName });
  };

  const handleKeyframeUpdate = (updates: Partial<Keyframe>) => {
    if (selectedKeyframe) {
      updateKeyframe(selectedKeyframe.trackId, selectedKeyframe.clipId, selectedKeyframe.property, selectedKeyframe.index, updates);
    }
  };

  const handleAiAdvice = async () => {
    if (!selectedClip) return;
    setIsAnalyzing(true);
    const advice = await analyzeScene(selectedClip.name + ": " + (selectedClip.properties.text || "Video sequence"));
    setAiAnalysis(advice);
    setIsAnalyzing(false);
  };

  const isKeyframedAtPlayhead = (prop: string) => {
    if (!selectedClip) return false;
    const timeInClip = currentTime - selectedClip.startTime;
    return (selectedClip.keyframes[prop] || []).some(k => Math.abs(k.time - timeInClip) < 0.1);
  };

  const hasAnimation = (prop: string) => {
    return selectedClip?.keyframes[prop] && selectedClip.keyframes[prop].length > 0;
  };

  return (
    <div className="w-80 bg-zinc-900 border-l border-zinc-800 flex flex-col h-full overflow-y-auto overflow-x-hidden shadow-2xl no-scrollbar">
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between sticky top-0 bg-zinc-900/95 backdrop-blur-xl z-10">
        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Inspector v3.5</h2>
        <div className="flex gap-2">
           <div className="flex items-center gap-1.5 px-2 py-1 bg-green-500/10 rounded-md border border-green-500/20" title="100% Local AI">
             <ShieldCheck size={10} className="text-green-500" />
             <span className="text-[8px] font-black text-green-500 uppercase">Local</span>
           </div>
        </div>
      </div>

      <div className="p-6 space-y-10">
        {/* Metadata Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-zinc-400 text-[10px] font-black uppercase tracking-widest">
            <Tag size={12} className="text-zinc-600" /> Metadata
          </div>
          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-3">
            <div className="space-y-2">
              <label className="text-[8px] text-zinc-600 uppercase font-black">Clip Identifier</label>
              <div className="relative group">
                <input 
                  type="text" 
                  value={selectedClip.name} 
                  onChange={(e) => handleRename(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 pl-3 pr-8 text-xs font-bold text-white focus:outline-none focus:border-blue-500 transition-all uppercase tracking-tighter"
                />
                <Edit3 size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-700 group-hover:text-blue-500 transition-colors pointer-events-none" />
              </div>
            </div>
            <div className="flex items-center justify-between text-[8px] font-mono text-zinc-600 uppercase">
              <span>Type: {selectedClip.type}</span>
              <span>ID: {selectedClip.id.split('-')[0]}</span>
            </div>
            {selectedClip.metadata && (
              <div className="pt-2 border-t border-white/5 space-y-1">
                {selectedClip.metadata.width && selectedClip.metadata.height && (
                  <div className="flex justify-between text-[8px] font-mono text-zinc-500 uppercase">
                    <span>Resolution:</span>
                    <span className="text-zinc-400">{selectedClip.metadata.width}×{selectedClip.metadata.height}</span>
                  </div>
                )}
                {selectedClip.duration > 0 && (
                  <div className="flex justify-between text-[8px] font-mono text-zinc-500 uppercase">
                    <span>Duration:</span>
                    <span className="text-zinc-400">{selectedClip.duration.toFixed(2)}s</span>
                  </div>
                )}
                {selectedClip.metadata.mimeType && (
                  <div className="flex justify-between text-[8px] font-mono text-zinc-500 uppercase">
                    <span>Format:</span>
                    <span className="text-zinc-400 truncate ml-4" title={selectedClip.metadata.mimeType}>{selectedClip.metadata.mimeType}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Keyframe Interpolation Controls */}
        {activeKeyframeData && (
          <section className="space-y-4 animate-in fade-in slide-in-from-top duration-300">
             <div className="flex items-center gap-2 text-blue-400 text-[10px] font-black uppercase tracking-widest">
                <Spline size={12} /> Interpolation: {selectedKeyframe.property}
             </div>
             <div className="bg-zinc-950 p-4 rounded-xl border border-blue-500/20 space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  {['linear', 'ease-in', 'ease-out', 'ease-in-out', 'bezier'].map(type => (
                    <button 
                      key={type}
                      onClick={() => handleKeyframeUpdate({ easing: type as any })}
                      className={`px-2 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-tighter transition-all ${
                        activeKeyframeData.easing === type 
                        ? 'bg-blue-600 text-white shadow-lg' 
                        : 'bg-zinc-900 text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                {activeKeyframeData.easing === 'bezier' && (
                  <div className="space-y-4 pt-2 border-t border-white/5">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[8px] text-zinc-600 uppercase font-black tracking-widest">Bezier Path Editor</label>
                      <Activity size={10} className="text-blue-500/50" />
                    </div>
                    
                    <div className="flex justify-center mb-4">
                      <div className="relative w-32 h-32 bg-zinc-900 rounded-lg border border-zinc-800 flex items-center justify-center">
                        <svg className="w-full h-full p-2" viewBox="0 0 100 100">
                          <path 
                            d={`M 0 100 C ${activeKeyframeData.bezierPoints?.[0]! * 100} ${100 - activeKeyframeData.bezierPoints?.[1]! * 100}, ${activeKeyframeData.bezierPoints?.[2]! * 100} ${100 - activeKeyframeData.bezierPoints?.[3]! * 100}, 100 0`} 
                            stroke="#3b82f6" 
                            strokeWidth="3" 
                            fill="transparent" 
                          />
                          <line x1="0" y1="100" x2={activeKeyframeData.bezierPoints?.[0]! * 100} y2={100 - activeKeyframeData.bezierPoints?.[1]! * 100} stroke="#444" strokeWidth="1" strokeDasharray="2" />
                          <line x1="100" y1="0" x2={activeKeyframeData.bezierPoints?.[2]! * 100} y2={100 - activeKeyframeData.bezierPoints?.[3]! * 100} stroke="#444" strokeWidth="1" strokeDasharray="2" />
                          <circle cx={activeKeyframeData.bezierPoints?.[0]! * 100} cy={100 - activeKeyframeData.bezierPoints?.[1]! * 100} r="3" fill="#3b82f6" />
                          <circle cx={activeKeyframeData.bezierPoints?.[2]! * 100} cy={100 - activeKeyframeData.bezierPoints?.[3]! * 100} r="3" fill="#3b82f6" />
                        </svg>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                      {[0, 1, 2, 3].map(i => (
                         <div key={i} className="space-y-1">
                            <span className="text-[7px] text-zinc-700 font-mono font-black">{i % 2 === 0 ? 'X' : 'Y'}{Math.floor(i / 2) + 1}</span>
                            <input 
                              type="number" 
                              step="0.05"
                              value={activeKeyframeData.bezierPoints?.[i] || 0}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                const newPoints = [...(activeKeyframeData.bezierPoints || [0,0,0,0])] as [number, number, number, number];
                                newPoints[i] = val;
                                handleKeyframeUpdate({ bezierPoints: newPoints });
                              }}
                              className="w-full bg-zinc-900 border border-zinc-800 rounded p-1 text-[10px] font-mono text-blue-400 focus:outline-none focus:border-blue-500"
                            />
                         </div>
                      ))}
                    </div>
                  </div>
                )}
             </div>
          </section>
        )}

        <section className="space-y-4">
           <div className="flex items-center justify-between text-blue-400 text-[10px] font-black uppercase tracking-widest">
              <div className="flex items-center gap-2"><BrainCircuit size={12} /> Ollama Intel</div>
              <button 
                onClick={handleAiAdvice}
                disabled={isAnalyzing}
                className="p-1 bg-blue-500/10 rounded-md hover:bg-blue-500/20 transition-all disabled:opacity-50"
              >
                {isAnalyzing ? <RefreshCw size={10} className="animate-spin" /> : <Sparkles size={10} />}
              </button>
           </div>
           <div className="bg-gradient-to-br from-blue-900/20 to-zinc-950 p-4 rounded-xl border border-blue-500/10 min-h-[60px] relative overflow-hidden">
              {!aiAnalysis && !isAnalyzing && <p className="text-[9px] text-zinc-600 italic">Analyze scene using local GPU inference...</p>}
              {isAnalyzing && <p className="text-[9px] text-blue-300 animate-pulse uppercase font-black">Inferencing on RTX 5090...</p>}
              {aiAnalysis && <p className="text-[10px] text-blue-100 leading-relaxed font-medium">{aiAnalysis}</p>}
           </div>
        </section>

        {selectedClip.type === MediaType.TEXT && (
          <section className="space-y-4 animate-in slide-in-from-right duration-300">
             <div className="flex items-center gap-2 text-zinc-400 text-[10px] font-black uppercase tracking-widest">
              <Type size={12} /> Typography
            </div>
            <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-4 shadow-inner">
               <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[8px] text-zinc-600 uppercase font-black">Content</label>
                    <span className={`text-[7px] font-mono uppercase font-black ${
                      (selectedClip.properties.text?.length || 0) >= 100 ? 'text-red-500' : 'text-zinc-500'
                    }`}>
                      {100 - (selectedClip.properties.text?.length || 0)} Remaining
                    </span>
                  </div>
                  <input 
                    type="text" 
                    maxLength={100}
                    value={selectedClip.properties.text} 
                    onChange={(e) => handleUpdate('text', e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs font-bold text-white focus:outline-none focus:border-blue-500 transition-all uppercase tracking-tighter"
                  />
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <PropertyControl label="Size" value={selectedClip.properties.fontSize || 48} onChange={(v) => handleUpdate('fontSize', v)} min={10} max={200} />
                  <div className="space-y-2">
                    <label className="text-[8px] text-zinc-600 uppercase font-black">Color</label>
                    <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg p-1">
                       <input type="color" value={selectedClip.properties.color} onChange={(e) => handleUpdate('color', e.target.value)} className="w-6 h-6 rounded border-none bg-transparent cursor-pointer" />
                       <span className="text-[9px] font-mono text-zinc-400 uppercase">{selectedClip.properties.color}</span>
                    </div>
                  </div>
               </div>
            </div>
          </section>
        )}

        <section className="space-y-4">
          <div className="flex items-center gap-2 text-zinc-400 text-[10px] font-black uppercase tracking-widest">
            <Maximize2 size={12} className="text-zinc-600" /> Transform Engine
          </div>
          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-5 shadow-inner">
            <PropertyControl 
              label="Scale" 
              value={selectedClip.properties.scale} 
              onChange={(v) => handleUpdate('scale', v)} 
              min={0} max={500} unit="%" 
              isKeyframed={isKeyframedAtPlayhead('scale')}
              isAnimated={hasAnimation('scale')}
              onToggleKeyframe={() => toggleKeyframe(selectedTrackId, selectedClip!.id, 'scale')}
            />
            <div className="grid grid-cols-2 gap-4">
              <PropertyControl 
                label="Pos X" 
                value={selectedClip.properties.posX} 
                onChange={(v) => handleUpdate('posX', v)} 
                min={-1000} max={1000} 
                isKeyframed={isKeyframedAtPlayhead('posX')}
                isAnimated={hasAnimation('posX')}
                onToggleKeyframe={() => toggleKeyframe(selectedTrackId, selectedClip!.id, 'posX')}
              />
              <PropertyControl 
                label="Pos Y" 
                value={selectedClip.properties.posY} 
                onChange={(v) => handleUpdate('posY', v)} 
                min={-1000} max={1000} 
                isKeyframed={isKeyframedAtPlayhead('posY')}
                isAnimated={hasAnimation('posY')}
                onToggleKeyframe={() => toggleKeyframe(selectedTrackId, selectedClip!.id, 'posY')}
              />
            </div>
          </div>
        </section>

        <section className="space-y-4 pt-2">
          <div className="flex items-center gap-2 text-zinc-400 text-[10px] font-black uppercase tracking-widest">
            <Ghost size={12} className="text-zinc-600" /> Rendering
          </div>
          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-5 shadow-inner">
            <PropertyControl 
              label="Opacity" 
              value={selectedClip.properties.opacity} 
              onChange={(v) => handleUpdate('opacity', v)} 
              min={0} max={100} unit="%" 
              isKeyframed={isKeyframedAtPlayhead('opacity')}
              isAnimated={hasAnimation('opacity')}
              onToggleKeyframe={() => toggleKeyframe(selectedTrackId, selectedClip!.id, 'opacity')}
            />
            <PropertyControl 
              label="Blur" 
              value={selectedClip.properties.blur} 
              onChange={(v) => handleUpdate('blur', v)} 
              min={0} max={100} 
              isKeyframed={isKeyframedAtPlayhead('blur')}
              isAnimated={hasAnimation('blur')}
              onToggleKeyframe={() => toggleKeyframe(selectedTrackId, selectedClip!.id, 'blur')}
            />
          </div>
        </section>
      </div>
    </div>
  );
};

const PropertyControl: React.FC<{ 
  label: string; 
  value: number; 
  onChange: (v: number) => void; 
  min: number; 
  max: number; 
  unit?: string;
  isKeyframed?: boolean;
  isAnimated?: boolean;
  onToggleKeyframe?: () => void;
}> = ({ label, value, onChange, min, max, unit, isKeyframed, isAnimated, onToggleKeyframe }) => (
  <div className="space-y-3">
    <div className="flex justify-between text-[8px] text-zinc-500 font-black uppercase tracking-widest">
      <div className="flex items-center gap-2">
        <span>{label}</span>
        {onToggleKeyframe && (
          <button 
            onClick={(e) => { e.stopPropagation(); onToggleKeyframe(); }}
            className={`transition-all ${isKeyframed ? 'text-blue-500 scale-125' : isAnimated ? 'text-blue-900 hover:text-blue-700' : 'text-zinc-800 hover:text-zinc-600'}`}
            title={isAnimated ? "Animation Active - Click to remove keyframe at playhead" : "Click to enable animation"}
          >
            <Diamond size={10} fill={isKeyframed ? "currentColor" : "none"} strokeWidth={isAnimated ? 3 : 2} />
          </button>
        )}
      </div>
      <span className="text-zinc-300 font-mono bg-zinc-900 px-1.5 py-0.5 rounded">{value}{unit}</span>
    </div>
    <div className="flex items-center gap-3 group">
      <input 
        type="range" 
        min={min} max={max} 
        value={value} 
        onChange={(e) => onChange(parseInt(e.target.value))}
        className={`flex-1 h-1.5 bg-zinc-900 rounded-full appearance-none cursor-pointer transition-all ${isAnimated ? 'accent-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]' : 'accent-zinc-700 hover:accent-zinc-500'}`}
      />
    </div>
  </div>
);

export default Inspector;
