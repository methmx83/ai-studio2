
import React, { useEffect, useState } from 'react';
import { useEditorStore } from '../store';
import { Cpu, Activity, ShieldCheck, AlertCircle, RefreshCw, Layers, CheckCircle2, Server, Terminal, ArrowRight, ZapOff } from 'lucide-react';
import { fetchInstalledModels } from '../ollamaService';

const REQUIRED_NODES = ['SVD_img2vid', 'ControlNetApply', 'UltimateSDUpscale', 'RMBG'];
const COMFY_URL = 'http://127.0.0.1:8188';
const OLLAMA_URL = 'http://127.0.0.1:11434';

const SystemCheckOverlay: React.FC = () => {
  const { systemStatus, setSystemStatus } = useEditorStore();
  const [logs, setLogs] = useState<string[]>([]);
  const [isOverridden, setIsOverridden] = useState(false);

  const addLog = (msg: string) => setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`].slice(-10));

  const performCheck = async () => {
    setSystemStatus({ isChecking: true, comfy: 'pending', ollama: 'pending' });
    addLog("Starte Hardware-Diagnose (RTX 5090 optimiert)...");

    // 1. Check ComfyUI
    try {
      addLog(`Prüfe ComfyUI auf ${COMFY_URL}...`);
      const comfyResp = await fetch(`${COMFY_URL}/system_stats`, { cache: 'no-store' });
      if (comfyResp.ok) {
        setSystemStatus({ comfy: 'online' });
        addLog("ComfyUI Core: ONLINE.");
        
        const infoResp = await fetch(`${COMFY_URL}/object_info`);
        const info = await infoResp.json();
        const nodesStatus = REQUIRED_NODES.map(node => ({
          name: node,
          installed: !!info[node]
        }));
        setSystemStatus({ nodes: nodesStatus });
      } else {
        throw new Error(`HTTP ${comfyResp.status}`);
      }
    } catch (e: any) {
      setSystemStatus({ comfy: 'offline' });
      addLog("ComfyUI: OFFLINE oder CORS blockiert.");
      addLog("Tipp: Starte ComfyUI mit --enable-cors-header");
    }

    // 2. Check Ollama & Fetch Models
    try {
      addLog(`Prüfe Ollama auf ${OLLAMA_URL}...`);
      const ollamaResp = await fetch(`${OLLAMA_URL}/api/tags`, { method: 'GET', cache: 'no-store' });
      if (ollamaResp.ok) {
        addLog("Ollama Engine: ONLINE.");
        const models = await fetchInstalledModels();
        setSystemStatus({ 
          ollama: 'online', 
          ollamaModels: models 
        });
        addLog(`Gefundene Modelle: ${models.length > 0 ? models.join(', ') : 'Keine'}`);
      } else {
        throw new Error(`HTTP ${ollamaResp.status}`);
      }
    } catch (e: any) {
      setSystemStatus({ ollama: 'offline', ollamaModels: [] });
      addLog("Ollama: OFFLINE oder CORS blockiert.");
      addLog("WICHTIG: Setze OLLAMA_ORIGINS=\"*\" in deinen Umgebungsvariablen!");
    }

    setSystemStatus({ isChecking: false });
  };

  useEffect(() => {
    performCheck();
  }, []);

  if (isOverridden || (!systemStatus.isChecking && systemStatus.comfy === 'online' && systemStatus.ollama === 'online')) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-black flex items-center justify-center p-6 backdrop-blur-3xl bg-opacity-95">
      <div className="w-full max-w-xl space-y-8 animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center space-y-4">
           <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-blue-600/10 border border-blue-500/20 text-blue-500 mb-4 shadow-[0_0_40px_rgba(59,130,246,0.2)]">
              <Cpu size={40} className={systemStatus.isChecking ? "animate-pulse" : ""} />
           </div>
           <h1 className="text-2xl font-black uppercase tracking-[0.4em] text-white">System Diagnostics</h1>
           <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Local Neural Studio V3.5-PRO</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
           <StatusCard icon={<Server size={16} />} label="ComfyUI Core" status={systemStatus.comfy} />
           <StatusCard icon={<Activity size={16} />} label="Ollama Engine" status={systemStatus.ollama} />
        </div>

        <div className="bg-black border border-white/5 rounded-2xl p-4 font-mono text-[10px] h-40 overflow-hidden shadow-inner flex flex-col">
           <div className="flex justify-between items-center pb-2 border-b border-white/5 mb-2 opacity-50">
              <span className="text-[8px] uppercase tracking-widest font-black text-zinc-600 flex items-center gap-2"><Terminal size={10} /> Boot sequence log</span>
           </div>
           <div className="flex-1 overflow-y-auto no-scrollbar space-y-1 text-blue-400/80">
              {logs.map((log, i) => <div key={i}>{log}</div>)}
           </div>
        </div>

        <div className="flex flex-col w-full gap-3">
          <button onClick={performCheck} className="w-full flex items-center justify-center gap-3 px-8 py-3.5 bg-white text-black text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-zinc-200 transition-all active:scale-[0.98]">
             <RefreshCw size={16} className={systemStatus.isChecking ? "animate-spin" : ""} /> Re-Diagnose
          </button>
          <button onClick={() => setIsOverridden(true)} className="w-full flex items-center justify-center gap-3 px-8 py-3.5 bg-zinc-900 border border-zinc-800 text-zinc-500 text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl hover:text-white transition-all">
             <ZapOff size={16} /> Enter Studio (Restricted Mode)
          </button>
        </div>
      </div>
    </div>
  );
};

const StatusCard: React.FC<{ icon: React.ReactNode; label: string; status: 'pending' | 'online' | 'offline' }> = ({ icon, label, status }) => {
  const isOnline = status === 'online';
  const isPending = status === 'pending';
  return (
    <div className={`p-5 rounded-3xl border transition-all duration-500 flex flex-col items-center gap-3 ${
      isPending ? 'bg-zinc-900/40 border-zinc-800' : isOnline ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'
    }`}>
      <div className={`p-2.5 rounded-xl ${isPending ? 'bg-zinc-800 text-zinc-500' : isOnline ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
        {icon}
      </div>
      <div className="text-center">
        <div className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1">{label}</div>
        <div className={`text-[10px] font-black uppercase tracking-widest ${isPending ? 'text-zinc-600 animate-pulse' : isOnline ? 'text-green-500' : 'text-red-500'}`}>
          {isPending ? 'Checking...' : status.toUpperCase()}
        </div>
      </div>
    </div>
  );
};

export default SystemCheckOverlay;
