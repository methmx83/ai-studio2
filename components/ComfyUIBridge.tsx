
import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Activity, Layers, Terminal, ChevronRight, Zap, RefreshCw, Box, Cpu, HardDrive, FileJson, Video, Image as ImageIcon, ZapOff, CheckCircle2, AlertCircle, Upload, Trash2, Settings2, SlidersHorizontal, ArrowUpRight } from 'lucide-react';
import { enhancePrompt as ollamaEnhance } from '../ollamaService';
import { useEditorStore, CustomWorkflow } from '../store';
import { scanWorkflowForParams, injectParamsIntoWorkflow, queuePrompt } from '../comfyService';

const COMFY_URL = 'http://127.0.0.1:8188';

const ComfyUIBridge: React.FC = () => {
  const { 
    maskData, customWorkflows, addCustomWorkflow, selectedWorkflowId, 
    setSelectedWorkflowId, updateWorkflowParams, removeWorkflow, setActiveView,
    projectSettings
  } = useEditorStore();
  
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [comfyStatus, setComfyStatus] = useState<'online' | 'offline'>('offline');
  const [gpuLoad, setGpuLoad] = useState(0);
  const [logs, setLogs] = useState<string[]>(["[SYS] Engine Ready.", "[SYS] Listening for local JSON uploads..."]);
  const logEndRef = useRef<HTMLDivElement>(null);

  const selectedWf = customWorkflows.find(wf => wf.id === selectedWorkflowId);

  useEffect(() => {
    checkBackends();
    const interval = setInterval(() => {
        checkBackends();
        setGpuLoad(prev => {
            const base = isRunning ? 88 : 4;
            return Math.min(100, Math.max(0, base + (Math.random() - 0.5) * 10));
        });
    }, 5000);
    return () => clearInterval(interval);
  }, [isRunning]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`].slice(-8));
  };

  const checkBackends = async () => {
    try {
      const cResp = await fetch(`${COMFY_URL}/system_stats`, { cache: 'no-store' });
      setComfyStatus(cResp.ok ? 'online' : 'offline');
    } catch (e) {
      setComfyStatus('offline');
    }
  };

  const handleJsonUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const json = JSON.parse(ev.target?.result as string);
          const initialParams = scanWorkflowForParams(json);
          
          const res = projectSettings.defaults.resolution;
          const w = res === 'custom' ? projectSettings.defaults.customWidth : parseInt(res.split('x')[0]);
          const h = res === 'custom' ? projectSettings.defaults.customHeight : parseInt(res.split('x')[1]);

          const newWf: CustomWorkflow = {
            id: crypto.randomUUID(),
            name: file.name.replace('.json', ''),
            json: json,
            parameters: {
                ...initialParams,
                width: initialParams.width || w,
                height: initialParams.height || h,
                fps: initialParams.fps || projectSettings.defaults.fps
            }
          };
          addCustomWorkflow(newWf);
          addLog(`Success: Loaded custom workflow "${newWf.name}"`);
        } catch (err) {
          addLog("Error: Invalid JSON format.");
        }
      };
      reader.readAsText(file);
    }
  };

  const handleRun = async () => {
    if (!selectedWf) return;
    setIsRunning(true);
    setProgress(0);
    addLog(`Injecting parameters into ${selectedWf.name}...`);
    
    try {
      const finalJson = injectParamsIntoWorkflow(selectedWf.json, selectedWf.parameters);
      addLog("Sending prompt to ComfyUI API...");
      await queuePrompt(finalJson);
      
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsRunning(false);
            addLog("Execution queued.");
            return 100;
          }
          return prev + 5;
        });
      }, 150);
    } catch (e) {
      setIsRunning(false);
      addLog("Critical: ComfyUI API unreachable.");
    }
  };

  const handleEnhance = async () => {
    if (!selectedWf) return;
    setIsEnhancing(true);
    addLog("Ollama: Optimizing cinematic prompt...");
    const result = await ollamaEnhance(selectedWf.parameters.prompt || "");
    updateWorkflowParams(selectedWf.id, { prompt: result });
    setIsEnhancing(false);
    addLog("Ollama: Prompt enhanced.");
  };

  return (
    <div className="h-full flex flex-col bg-[#0c0c0e] border-l border-white/5 shadow-2xl no-scrollbar overflow-y-auto w-85">
      <div className="p-8 border-b border-white/5 bg-zinc-900/10 space-y-6">
        <div className="flex items-center justify-between">
           <h2 className="text-[10px] font-black text-white uppercase tracking-[0.4em] flex items-center gap-3">
            <Cpu size={14} className="text-blue-500 animate-pulse" /> Neural Bridge
           </h2>
           <label className="p-2 text-zinc-600 hover:text-white transition-all bg-zinc-900 rounded-xl border border-white/5 cursor-pointer" title="Upload Custom Workflow (.json)">
              <Upload size={14} />
              <input type="file" className="hidden" accept=".json" onChange={handleJsonUpload} />
           </label>
        </div>
        
        <div className="flex gap-2">
           <div className="flex-1 bg-zinc-900/40 p-3 rounded-2xl border border-white/5 flex items-center gap-3">
              <div className={`w-2.5 h-2.5 rounded-full ${comfyStatus === 'online' ? 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.6)]' : 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.6)]'}`} />
              <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Server API</span>
           </div>
           <div className="flex-1 bg-zinc-900/40 p-3 rounded-2xl border border-white/5 flex flex-col gap-1">
              <span className="text-[7px] font-black text-zinc-600 uppercase">GPU Load</span>
              <div className="h-1 w-full bg-zinc-950 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${gpuLoad}%` }} />
              </div>
           </div>
        </div>
      </div>

      <div className="p-8 space-y-10">
        <section className="space-y-5">
           <label className="text-[10px] text-zinc-500 uppercase font-black tracking-widest block opacity-50">Local Workflows</label>
           <div className="grid grid-cols-1 gap-3">
              {customWorkflows.length === 0 && (
                <div className="p-10 border-2 border-dashed border-zinc-900 rounded-3xl flex flex-col items-center gap-4 text-center">
                   <FileJson size={32} className="text-zinc-800" />
                   <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">No workflows loaded.</p>
                </div>
              )}
              {customWorkflows.map(wf => (
                <div 
                  key={wf.id}
                  onClick={() => setSelectedWorkflowId(wf.id)}
                  className={`flex items-center gap-5 p-4 rounded-2xl border text-left transition-all cursor-pointer group ${
                    selectedWorkflowId === wf.id 
                    ? 'bg-blue-600/10 border-blue-500/40 text-white shadow-lg' 
                    : 'bg-[#121214] border-white/5 text-zinc-500 hover:border-zinc-700'
                  }`}
                >
                  <div className={`p-3 rounded-xl transition-all ${selectedWorkflowId === wf.id ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-400 group-hover:text-white'}`}>
                    <FileJson size={16} />
                  </div>
                  <div className="flex-1 truncate">
                    <div className="text-[10px] font-black uppercase tracking-tight truncate">{wf.name}</div>
                    <div className="text-[8px] opacity-40 font-medium">{Object.keys(wf.parameters).length} Params</div>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); removeWorkflow(wf.id); }}
                    className="opacity-0 group-hover:opacity-100 p-2 hover:text-red-500 transition-all"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
           </div>
        </section>

        {selectedWf && (
          <section className="space-y-6 animate-in slide-in-from-right duration-300">
            <label className="text-[10px] text-zinc-500 uppercase font-black tracking-widest flex items-center gap-2">
              <SlidersHorizontal size={12} className="text-blue-500" /> Config
            </label>

            <div className="bg-[#121214] border border-white/5 rounded-3xl p-6 space-y-6 shadow-inner">
               <div className="space-y-2">
                  <label className="text-[8px] text-zinc-600 uppercase font-black flex justify-between">
                     Prompt
                     <button onClick={handleEnhance} className="text-blue-500 hover:text-blue-400 flex items-center gap-1 transition-colors">
                        <Zap size={8} fill="currentColor" /> Ollama Enhance
                     </button>
                  </label>
                  <textarea 
                    value={selectedWf.parameters.prompt || ""}
                    onChange={(e) => updateWorkflowParams(selectedWf.id, { prompt: e.target.value })}
                    className="w-full h-24 bg-zinc-950 border border-white/5 rounded-xl p-3 text-[11px] text-zinc-200 focus:outline-none focus:border-blue-500 transition-all resize-none font-sans"
                    placeholder="Describe scene..."
                  />
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <ParamInput label="Width" value={selectedWf.parameters.width} onChange={(v) => updateWorkflowParams(selectedWf.id, { width: v })} />
                  <ParamInput label="Height" value={selectedWf.parameters.height} onChange={(v) => updateWorkflowParams(selectedWf.id, { height: v })} />
               </div>

               <button 
                onClick={handleRun}
                disabled={isRunning}
                className="w-full flex items-center justify-center gap-3 py-3.5 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_10px_30px_rgba(59,130,246,0.3)] active:scale-95 disabled:opacity-50"
               >
                {isRunning ? <RefreshCw size={14} className="animate-spin" /> : <ArrowUpRight size={14} />} 
                Queue Prompt
               </button>
               
               {isRunning && (
                <div className="h-1 w-full bg-zinc-900 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
               )}
            </div>
          </section>
        )}

        <div className="bg-black border border-white/5 rounded-2xl p-4 font-mono text-[9px] text-green-500/80 space-y-1 h-28 overflow-hidden shadow-inner flex flex-col">
           <div className="flex justify-between items-center pb-2 border-b border-white/5 mb-1 opacity-50">
              <span className="text-[7px] uppercase tracking-widest font-black">Debug Logs</span>
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
           </div>
           <div className="flex-1 overflow-y-auto no-scrollbar">
              {logs.map((log, i) => (
                <div key={i} className="flex gap-2 opacity-80">
                   <span className="opacity-30">[{i}]</span>
                   <span>{log}</span>
                </div>
              ))}
              <div ref={logEndRef} />
           </div>
        </div>
      </div>
    </div>
  );
};

const ParamInput: React.FC<{ label: string; value?: number; onChange: (v: number) => void }> = ({ label, value, onChange }) => (
  <div className="space-y-1">
    <label className="text-[7px] text-zinc-600 uppercase font-black">{label}</label>
    <input 
      type="number"
      value={value || 0}
      onChange={(e) => onChange(parseInt(e.target.value) || 0)}
      className="w-full bg-zinc-950 border border-white/5 rounded-lg p-2 text-[10px] font-mono text-blue-400 focus:outline-none focus:border-blue-500"
    />
  </div>
);

export default ComfyUIBridge;
