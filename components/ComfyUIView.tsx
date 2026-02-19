
import React from 'react';
import { ExternalLink, RefreshCw, Terminal, AlertTriangle } from 'lucide-react';
import { useEditorStore } from '../store';

const ComfyUIView: React.FC = () => {
  const { systemStatus } = useEditorStore();

  if (systemStatus.comfy === 'offline') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-20 text-center bg-zinc-950">
        <div className="w-24 h-24 rounded-full bg-red-500/10 flex items-center justify-center mb-8 border border-red-500/20">
          <AlertTriangle size={48} className="text-red-500" />
        </div>
        <h2 className="text-2xl font-black uppercase tracking-widest text-white mb-4">ComfyUI Offline</h2>
        <p className="text-zinc-500 max-w-md mb-8 text-sm leading-relaxed">
          The AI Lab requires a local ComfyUI instance running on <code className="bg-zinc-900 px-2 py-1 rounded text-blue-400">127.0.0.1:8188</code>. 
          Please start your server and refresh.
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="px-8 py-3 bg-white text-black font-black uppercase tracking-widest rounded-xl hover:bg-zinc-200 transition-all flex items-center gap-3"
        >
          <RefreshCw size={18} /> Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-zinc-950 relative overflow-hidden">
      {/* ComfyUI Header Overlay for the tab view */}
      <div className="absolute top-4 left-4 right-4 h-12 bg-black/60 backdrop-blur-xl border border-white/5 rounded-2xl flex items-center justify-between px-6 z-10 pointer-events-none">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,1)]" />
            <span className="text-[10px] font-black text-white uppercase tracking-widest">Live Lab Access</span>
          </div>
          <div className="w-px h-4 bg-zinc-800" />
          <span className="text-[10px] font-mono text-zinc-500 uppercase">Localhost:8188</span>
        </div>
        <div className="flex items-center gap-4 pointer-events-auto">
          <a 
            href="http://127.0.0.1:8188" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-[9px] font-black text-zinc-400 hover:text-white transition-all uppercase tracking-widest group"
          >
            Open in Browser <ExternalLink size={12} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </a>
        </div>
      </div>

      <iframe 
        src="http://127.0.0.1:8188" 
        className="flex-1 w-full border-none"
        title="ComfyUI Native Interface"
      />

      <div className="absolute bottom-4 left-4 bg-zinc-900/80 backdrop-blur-md border border-white/10 rounded-xl px-4 py-2 flex items-center gap-3 animate-in slide-in-from-left">
          <Terminal size={12} className="text-blue-500" />
          <span className="text-[9px] font-black text-zinc-300 uppercase tracking-tighter">Iframe sandbox: Interaction enabled</span>
      </div>
    </div>
  );
};

export default ComfyUIView;
