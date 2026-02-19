
import React, { useState } from 'react';
import { X, Download, Cpu, Video, Settings, Copy, Check, Terminal, Play, Activity } from 'lucide-react';
import { useEditorStore } from '../store';

const ExportModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { tracks } = useEditorStore();
  const [format, setFormat] = useState('mp4');
  const [resolution, setResolution] = useState('3840x2160');
  const [codec, setCodec] = useState('h264_nvenc'); // Optimized for 5090
  const [isCopied, setIsCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  // Generate a professional FFmpeg command based on the timeline
  const generateFFmpegCommand = () => {
    const inputs = tracks.flatMap(t => t.clips).map((c, i) => `-i "${c.name}.mp4"`).join(' ');
    return `ffmpeg ${inputs} -filter_complex "[0:v][1:v]overlay=shortest=1" -c:v ${codec} -preset p7 -b:v 50M output_4k.mp4`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateFFmpegCommand());
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const startLocalRender = () => {
    setIsExporting(true);
    // Simulation of a local render process
    setTimeout(() => {
      setIsExporting(false);
      onClose();
      alert("Local Render Plan generated! Run the FFmpeg command to finalize.");
    }, 3000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-3xl shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-zinc-900 flex items-center justify-between bg-zinc-900/20">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-900/20">
                 <Download size={20} />
              </div>
              <div>
                <h2 className="text-sm font-black uppercase tracking-widest text-white">Export Studio</h2>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter">RTX 5090 NVENC Accelerated</p>
              </div>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full text-zinc-500 hover:text-white transition-all"><X size={20} /></button>
        </div>

        <div className="p-8 grid grid-cols-2 gap-8">
           <div className="space-y-6">
              <ExportOption label="Resolution" value={resolution} onChange={setResolution} options={['1920x1080', '2560x1440', '3840x2160', '7680x4320']} />
              <ExportOption label="Encoder" value={codec} onChange={setCodec} options={['h264_nvenc', 'hevc_nvenc', 'av1_nvenc', 'libx264']} />
              <ExportOption label="Bitrate" value="50 Mbps" onChange={()=>{}} options={['10 Mbps', '25 Mbps', '50 Mbps', '100 Mbps']} />
           </div>

           <div className="space-y-6">
              <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-3">
                 <div className="flex items-center justify-between">
                    <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest flex items-center gap-2"><Terminal size={12} /> Render Script</span>
                    <button onClick={handleCopy} className="text-zinc-500 hover:text-white transition-all">
                       {isCopied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                    </button>
                 </div>
                 <div className="text-[9px] font-mono text-zinc-400 bg-black p-3 rounded-lg break-all leading-relaxed h-24 overflow-y-auto border border-white/5">
                    {generateFFmpegCommand()}
                 </div>
              </div>

              <div className="bg-blue-600/5 border border-blue-500/20 rounded-2xl p-4 flex gap-4">
                 <Cpu className="text-blue-500 shrink-0" size={24} />
                 <div>
                    <h4 className="text-[10px] font-black text-blue-400 uppercase">Hardware Engine</h4>
                    <p className="text-[9px] text-zinc-500 leading-normal mt-1">Using NVIDIA RTX 5090 (32GB VRAM). Expected render time for 4K/60fps: ~0.2x realtime.</p>
                 </div>
              </div>
           </div>
        </div>

        <div className="p-6 bg-zinc-900/30 border-t border-zinc-900 flex justify-end gap-3">
           <button onClick={onClose} className="px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-all">Cancel</button>
           <button 
            onClick={startLocalRender}
            disabled={isExporting}
            className="px-8 py-2.5 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
           >
            {isExporting ? <Activity className="animate-spin" size={14} /> : <Play size={14} fill="black" />}
            {isExporting ? 'Preparing...' : 'Start Render'}
           </button>
        </div>
      </div>
    </div>
  );
};

const ExportOption: React.FC<{ label: string; value: string; onChange: (v: string) => void; options: string[] }> = ({ label, value, onChange, options }) => (
  <div className="space-y-2">
    <label className="text-[9px] text-zinc-600 uppercase font-black tracking-widest">{label}</label>
    <select 
      value={value} 
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs font-bold text-zinc-200 focus:outline-none focus:border-blue-600 transition-all appearance-none cursor-pointer"
    >
      {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  </div>
);

export default ExportModal;
