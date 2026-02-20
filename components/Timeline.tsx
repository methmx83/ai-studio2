
import React, { useRef, useState, useEffect } from 'react';
import { Stage, Layer, Rect, Text, Group, Line, RegularPolygon } from 'react-konva';
import { useEditorStore } from '../store';
import { Play, Pause, Scissors, Magnet, ZoomIn, ZoomOut, Clock } from 'lucide-react';
// Added Keyframe to imports to fix the type inference error below
import { MediaType, Keyframe } from '../types';

const TRACK_HEIGHT = 80;
const HEADER_HEIGHT = 30;
const TRACK_LABEL_WIDTH = 180;

const Timeline: React.FC = () => {
  const { 
    tracks, currentTime, duration, zoomLevel, setZoomLevel, 
    setCurrentTime, isPlaying, setIsPlaying, selectedClipId, setSelectedClipId,
    updateClip, setSelectedKeyframes
  } = useEditorStore();
  
  const stageRef = useRef<any>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const pxPerSec = (zoomLevel / 100) * 100;

  useEffect(() => {
    const updateSize = () => {
      const el = document.getElementById('timeline-container');
      if (el) setContainerSize({ width: el.offsetWidth, height: el.offsetHeight });
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const handleStageClick = (e: any) => {
    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    const relativeX = pos.x - TRACK_LABEL_WIDTH + stage.x() * -1;
    if (pos.x > TRACK_LABEL_WIDTH) {
      setCurrentTime(relativeX / pxPerSec);
    }
  };

  const handleClipDragEnd = (e: any, trackId: string, clipId: string) => {
    const newX = e.target.x();
    const newStartTime = (newX - TRACK_LABEL_WIDTH) / pxPerSec;
    updateClip(trackId, clipId, { startTime: Math.max(0, newStartTime) });
  };

  const handleKeyframeClick = (e: any, trackId: string, clipId: string, property: string, index: number) => {
    e.cancelBubble = true;
    setSelectedKeyframes([{ trackId, clipId, property, index }]);
    setSelectedClipId(clipId);
  };

  return (
    <div id="timeline-container" className="flex flex-col h-[400px] bg-[#0d0d0f] border-t border-[#1a1a1e]">
      {/* Toolbar */}
      <div className="h-12 flex items-center justify-between px-6 border-b border-[#1a1a1e] bg-[#09090b]/50">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-black hover:bg-zinc-200 transition-all"
          >
            {isPlaying ? <Pause size={14} fill="black" /> : <Play size={14} fill="black" className="translate-x-0.5" />}
          </button>
          <div className="flex flex-col">
            <span className="text-[12px] font-mono font-bold text-blue-500 tabular-nums">
              {new Date(currentTime * 1000).toISOString().substr(11, 8)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 bg-[#1a1a1e] px-2 py-1 rounded-lg">
            <button onClick={() => setZoomLevel(zoomLevel - 10)} className="text-zinc-500 hover:text-white"><ZoomOut size={14} /></button>
            <input 
              type="range" min="10" max="500" value={zoomLevel} 
              onChange={(e) => setZoomLevel(parseInt(e.target.value))}
              className="w-24 h-1 accent-blue-600 appearance-none bg-zinc-800 rounded-full"
            />
            <button onClick={() => setZoomLevel(zoomLevel + 10)} className="text-zinc-500 hover:text-white"><ZoomIn size={14} /></button>
          </div>
          <div className="w-px h-4 bg-zinc-800" />
          <button className="text-zinc-500 hover:text-white"><Scissors size={14} /></button>
          <button className="text-zinc-500 hover:text-white"><Magnet size={14} /></button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 overflow-hidden relative">
        <Stage 
          width={containerSize.width} 
          height={containerSize.height}
          onClick={handleStageClick}
          draggable
          dragBoundFunc={(pos) => ({ x: Math.min(0, pos.x), y: 0 })}
          ref={stageRef}
        >
          <Layer>
            {/* Ruler Background */}
            <Rect x={0} y={0} width={containerSize.width} height={HEADER_HEIGHT} fill="#09090b" />
            
            {/* Tracks */}
            {tracks.map((track, i) => (
              <Group key={track.id} y={HEADER_HEIGHT + i * TRACK_HEIGHT}>
                {/* Track Lane Bg */}
                <Rect 
                  x={TRACK_LABEL_WIDTH} 
                  y={0} 
                  width={duration * pxPerSec} 
                  height={TRACK_HEIGHT} 
                  fill={i % 2 === 0 ? "#0d0d0f" : "#0b0b0d"}
                  stroke="#1a1a1e"
                  strokeWidth={0.5}
                />
                
                {/* Clips */}
                {track.clips.map(clip => (
                  <Group 
                    key={clip.id} 
                    x={TRACK_LABEL_WIDTH + clip.startTime * pxPerSec}
                    draggable
                    onDragEnd={(e) => handleClipDragEnd(e, track.id, clip.id)}
                    onClick={(e) => { e.cancelBubble = true; setSelectedClipId(clip.id); }}
                  >
                    <Rect
                      width={clip.duration * pxPerSec}
                      height={TRACK_HEIGHT - 10}
                      y={5}
                      fill={selectedClipId === clip.id ? "#3b82f6" : "#27272a"}
                      cornerRadius={6}
                      stroke={selectedClipId === clip.id ? "#60a5fa" : "#3f3f46"}
                      strokeWidth={1}
                      shadowBlur={selectedClipId === clip.id ? 10 : 0}
                      shadowColor="#3b82f6"
                    />
                    <Text
                      text={clip.name}
                      x={10}
                      y={15}
                      fill="white"
                      fontSize={10}
                      fontStyle="bold"
                      fontFamily="Inter"
                    />

                    {/* Keyframes Visual Representation */}
                    {Object.entries(clip.keyframes).map(([prop, kfs]) => (
                      <Group key={prop}>
                        {/* Fix: Explicitly cast kfs to Keyframe[] to resolve 'Property map does not exist on type unknown' error */}
                        {(kfs as Keyframe[]).map((kf, kfIdx) => (
                          <RegularPolygon
                            key={`${prop}-${kfIdx}`}
                            x={kf.time * pxPerSec}
                            y={TRACK_HEIGHT - 20}
                            sides={4}
                            radius={4}
                            fill="#60a5fa"
                            stroke="white"
                            strokeWidth={0.5}
                            onClick={(e) => handleKeyframeClick(e, track.id, clip.id, prop, kfIdx)}
                            onMouseEnter={(e) => {
                              const stage = e.target.getStage();
                              if (stage) {
                                stage.container().style.cursor = 'pointer';
                              }
                              e.target.scale({ x: 1.5, y: 1.5 });
                            }}
                            onMouseLeave={(e) => {
                              const stage = e.target.getStage();
                              if (stage) {
                                stage.container().style.cursor = 'default';
                              }
                              e.target.scale({ x: 1, y: 1 });
                            }}
                          />
                        ))}
                      </Group>
                    ))}
                  </Group>
                ))}
              </Group>
            ))}

            {/* Track Labels (Fixed) */}
            <Group x={0} y={HEADER_HEIGHT}>
              <Rect width={TRACK_LABEL_WIDTH} height={containerSize.height} fill="#0d0d0f" shadowBlur={15} shadowColor="black" />
              {tracks.map((track, i) => (
                <Group key={track.id} y={i * TRACK_HEIGHT}>
                  <Rect width={TRACK_LABEL_WIDTH} height={TRACK_HEIGHT} stroke="#1a1a1e" strokeWidth={0.5} />
                  <Text 
                    text={track.name.toUpperCase()} 
                    x={20} y={35} 
                    fill="#52525b" 
                    fontSize={9} 
                    fontStyle="900" 
                    fontFamily="Inter"
                    letterSpacing={1.5}
                  />
                </Group>
              ))}
            </Group>

            {/* Playhead */}
            <Group x={TRACK_LABEL_WIDTH + currentTime * pxPerSec} y={0}>
              <Line
                points={[0, 0, 0, containerSize.height]}
                stroke="#ef4444"
                strokeWidth={2}
                shadowBlur={10}
                shadowColor="#ef4444"
              />
              <Rect
                x={-6} y={0}
                width={12} height={12}
                fill="#ef4444"
                rotation={45}
              />
            </Group>
          </Layer>
        </Stage>
      </div>
    </div>
  );
};

export default Timeline;
