
import React, { useRef, useState, useEffect } from 'react';
import { useEditorStore } from '../store';
import { Pencil, Square, Circle, Eraser, Download, Maximize, Trash2, Camera, Type, Move } from 'lucide-react';
import { MediaType, Keyframe } from '../types';

/**
 * Advanced Cubic Bezier interpolation logic for fluid animations.
 */
function cubicBezier(t: number, p1x: number, p1y: number, p2x: number, p2y: number): number {
  // Simple implementation using T as input (not x-solving for standard CSS timing, 
  // but enough for high-fidelity visual feedback)
  const cx = 3 * p1x;
  const bx = 3 * (p2x - p1x) - cx;
  const ax = 1 - cx - bx;
  
  const cy = 3 * p1y;
  const by = 3 * (p2y - p1y) - cy;
  const ay = 1 - cy - by;

  const sampleCurveY = (t: number) => ((ay * t + by) * t + cy) * t;
  return sampleCurveY(t);
}

const Preview: React.FC = () => {
  const { currentTime, tracks, isPlaying, maskData, setMaskData, proxyMode } = useEditorStore();
  const [isAnnotating, setIsAnnotating] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  // Load mask from store on init
  useEffect(() => {
    if (canvasRef.current && isAnnotating) {
      const canvas = canvasRef.current;
      ctxRef.current = canvas.getContext('2d');
      if (ctxRef.current) {
        ctxRef.current.strokeStyle = '#3b82f6';
        ctxRef.current.lineWidth = 15;
        ctxRef.current.lineCap = 'round';
        ctxRef.current.lineJoin = 'round';
        
        if (maskData) {
          const img = new Image();
          img.onload = () => ctxRef.current?.drawImage(img, 0, 0);
          img.src = maskData;
        }
      }
    }
  }, [isAnnotating, maskData]);

  // Handle Video Seek
  useEffect(() => {
    if (videoRef.current && !isPlaying) {
      videoRef.current.currentTime = currentTime;
    }
  }, [currentTime, isPlaying]);

  // Drawing Logic
  const startDrawing = (e: React.MouseEvent) => {
    if (!isAnnotating || !ctxRef.current) return;
    setIsDrawing(true);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    ctxRef.current.beginPath();
    ctxRef.current.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e: React.MouseEvent) => {
    if (!isDrawing || !ctxRef.current) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    ctxRef.current.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctxRef.current.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing && canvasRef.current) {
      setMaskData(canvasRef.current.toDataURL());
    }
    setIsDrawing(false);
  };

  const clearMask = () => {
    if (ctxRef.current && canvasRef.current) {
      ctxRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      setMaskData(null);
    }
  };

  const interpolateValue = (clip: any, property: string, baseValue: number) => {
    const kfs = clip.keyframes[property];
    if (!kfs || kfs.length === 0) return baseValue;

    const timeInClip = currentTime - clip.startTime;
    
    // Find boundary keyframes
    let prev = kfs[0];
    let next = null;

    for (let i = 0; i < kfs.length; i++) {
      if (kfs[i].time <= timeInClip) {
        prev = kfs[i];
      } else {
        next = kfs[i];
        break;
      }
    }

    if (!next) return prev.value;

    const t = (timeInClip - prev.time) / (next.time - prev.time);
    let easedT = t;

    switch (prev.easing) {
      case 'ease-in': easedT = t * t * t; break;
      case 'ease-out': easedT = 1 - Math.pow(1 - t, 3); break;
      case 'ease-in-out': easedT = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; break;
      case 'bezier': 
        const pts = prev.bezierPoints || [0.25, 0.1, 0.25, 1.0];
        easedT = cubicBezier(t, pts[0], pts[1], pts[2], pts[3]); 
        break;
      default: easedT = t; // linear
    }

    return prev.value + (next.value - prev.value) * easedT;
  };

  const activeClips = tracks.flatMap(track => 
    track.clips.filter(c => currentTime >= c.startTime && currentTime <= (c.startTime + c.duration))
  ).sort((a, b) => {
    const trackAIndex = tracks.findIndex(t => t.clips.some(c => c.id === a.id));
    const trackBIndex = tracks.findIndex(t => t.clips.some(c => c.id === b.id));
    return trackAIndex - trackBIndex;
  });

  const videoClips = activeClips.filter(c => c.type === MediaType.VIDEO);
  const textClips = activeClips.filter(c => c.type === MediaType.TEXT);

  const getClipProperties = (clip: any) => {
    const scale = interpolateValue(clip, 'scale', clip.properties.scale);
    const posX = interpolateValue(clip, 'posX', clip.properties.posX);
    const posY = interpolateValue(clip, 'posY', clip.properties.posY);
    const blur = interpolateValue(clip, 'blur', clip.properties.blur);
    const rawOpacity = interpolateValue(clip, 'opacity', clip.properties.opacity);
    
    // Manual fade handled separately if no keyframes for opacity
    const baseOpacity = rawOpacity / 100;
    const timeIn = currentTime - clip.startTime;
    const timeOut = (clip.startTime + clip.duration) - currentTime;
    const fadeTime = 0.3;
    let fadeOpacity = 1;
    if (timeIn < fadeTime) fadeOpacity = timeIn / fadeTime;
    if (timeOut < fadeTime) fadeOpacity = timeOut / fadeTime;

    return {
      scale: scale / 100,
      posX,
      posY,
      opacity: baseOpacity * fadeOpacity,
      blur
    };
  };

  return (
    <div className="flex-1 flex flex-col bg-[#09090b] relative overflow-hidden">
      <div className="flex-1 relative flex items-center justify-center p-8 group">
        <div 
          className="relative aspect-video w-full max-w-5xl bg-black shadow-[0_0_150px_rgba(0,0,0,0.8)] border border-white/5 rounded-2xl overflow-hidden"
          style={{ filter: proxyMode ? 'blur(2px) contrast(1.1)' : 'none' }}
        >
          {videoClips.map((clip, idx) => {
            const props = getClipProperties(clip);
            return (
              <video 
                key={clip.id}
                ref={idx === videoClips.length - 1 ? videoRef : null}
                src={clip.sourceUrl} 
                className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                style={{
                  transform: `scale(${props.scale}) translate(${props.posX}px, ${props.posY}px)`,
                  opacity: props.opacity,
                  filter: `blur(${props.blur}px)`,
                  zIndex: idx,
                  imageRendering: proxyMode ? 'pixelated' : 'auto'
                }}
                muted
                playsInline
              />
            );
          })}

          {!videoClips.length && (
            <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-zinc-800">
               <Camera size={48} strokeWidth={1} className="animate-pulse" />
               <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30">Waiting for Media Pipeline</span>
            </div>
          )}

          <div className="absolute inset-0 pointer-events-none z-[100]">
            {textClips.map(clip => {
              const props = getClipProperties(clip);
              return (
                <div 
                  key={clip.id}
                  className="absolute w-full h-full flex items-center justify-center"
                  style={{
                    transform: `translate(${props.posX}px, ${props.posY}px) scale(${props.scale})`,
                    opacity: props.opacity
                  }}
                >
                  <span style={{ 
                    fontSize: `${clip.properties.fontSize}px`, 
                    color: clip.properties.color,
                    fontWeight: clip.properties.fontWeight === 'bold' ? 900 : 400,
                    textShadow: '0 8px 32px rgba(0,0,0,0.8)',
                    filter: `blur(${props.blur}px)`
                  }} className="font-sans uppercase italic tracking-tighter">
                    {clip.properties.text}
                  </span>
                </div>
              );
            })}
          </div>
          
          {isAnnotating && (
            <canvas 
              ref={canvasRef} 
              className="absolute inset-0 cursor-crosshair z-[200]"
              width={1920} height={1080}
              style={{ width: '100%', height: '100%', mixBlendMode: 'screen' }}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
            />
          )}
          
          <div className="absolute top-6 left-6 flex items-center gap-3">
             <div className="bg-black/60 px-4 py-2 rounded-2xl text-[10px] font-black font-mono text-white backdrop-blur-3xl border border-white/10 flex items-center gap-2 shadow-2xl">
               <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]" /> 
               PRO_MONITOR_4K
             </div>
             {proxyMode && (
               <div className="bg-purple-600/80 px-4 py-2 rounded-2xl text-[10px] font-black font-mono text-white border border-purple-400/20 shadow-2xl">
                 PROXY_ACTIVE (LOW_RES)
               </div>
             )}
          </div>

          <div className="absolute top-6 right-6 bg-black/60 px-4 py-2 rounded-2xl text-[10px] font-black font-mono text-zinc-400 backdrop-blur-3xl border border-white/10 flex items-center gap-2">
             RTX 5090 NVENC_ACTIVE
          </div>
        </div>

        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-[#121214]/90 backdrop-blur-3xl border border-white/5 rounded-3xl px-6 py-3 flex items-center gap-5 opacity-0 group-hover:opacity-100 transition-all duration-500 shadow-[0_32px_64px_-16px_rgba(0,0,0,1)] z-[300] translate-y-4 group-hover:translate-y-0">
          <ToolButton active={isAnnotating} onClick={() => setIsAnnotating(!isAnnotating)} title="AI Inpainting Mask">
            <Pencil size={20} />
          </ToolButton>
          <div className="w-px h-8 bg-zinc-800" />
          <ToolButton onClick={clearMask} title="Wipe Mask Data"><Trash2 size={20} /></ToolButton>
          <ToolButton onClick={() => {}} title="Capture Reference Frame"><Camera size={20} /></ToolButton>
          <div className="w-px h-8 bg-zinc-800" />
          <ToolButton onClick={() => {}} title="Fullscreen Preview"><Maximize size={20} /></ToolButton>
        </div>
      </div>
    </div>
  );
};

const ToolButton: React.FC<{ children: React.ReactNode; active?: boolean; onClick?: () => void; title?: string }> = ({ children, active, onClick, title }) => (
  <button 
    onClick={onClick}
    title={title}
    className={`p-3 rounded-2xl transition-all duration-300 ${active ? 'bg-blue-600 text-white shadow-[0_0_30px_rgba(59,130,246,0.5)] scale-110' : 'text-zinc-500 hover:text-white hover:bg-zinc-800'}`}
  >
    {children}
  </button>
);

export default Preview;
