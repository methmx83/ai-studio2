
import React, { useState } from 'react';
import { useEditorStore } from '../store';
import { Save, Folder, HardDrive, Cpu, User, Info, Database, Workflow, Monitor, Package, FileCode, CheckCircle2, Layout, Maximize2, Settings2, ShieldCheck, Lock, Unlock, Link, FolderOpen, ChevronRight, Activity, Zap, RefreshCw } from 'lucide-react';
import { fetchInstalledModels } from '../ollamaService';

const SettingsView: React.FC = () => {
  const { projectSettings, updateProjectSettings, saveProject, workspaceHandle, setWorkspaceHandle, systemStatus, setSystemStatus } = useEditorStore();
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [isRefreshingModels, setIsRefreshingModels] = useState(false);

  const handleResChange = (val: string) => {
    updateProjectSettings({
        defaults: { ...projectSettings.defaults, resolution: val }
    });
  };

  const handleOllamaModelChange = (val: string) => {
    updateProjectSettings({
        defaults: { ...projectSettings.defaults, ollamaModel: val }
    });
  };

  const refreshModels = async () => {
    setIsRefreshingModels(true);
    try {
      const models = await fetchInstalledModels();
      setSystemStatus({ ollamaModels: models });
    } finally {
      setIsRefreshingModels(false);
    }
  };

  const authorizeWorkspace = async () => {
    if (!('showDirectoryPicker' in window)) {
        alert("Ihr Browser unterstützt keinen direkten Festplattenzugriff. Bitte nutzen Sie Chrome oder Edge.");
        return;
    }
    setIsAuthorizing(true);
    try {
        const handle = await (window as any).showDirectoryPicker();
        setWorkspaceHandle(handle);
    } catch (err) {
        console.error("Workspace authorization failed", err);
    } finally {
        setIsAuthorizing(false);
    }
  };

  const currentProjectFolder = projectSettings.projectName.replace(/\s+/g, '_');

  return (
    <div className="flex-1 bg-[#09090b] overflow-y-auto no-scrollbar">
      <div className="max-w-6xl mx-auto py-20 px-10 space-y-16">
        
        <header className="space-y-4">
           <h2 className="text-4xl font-black uppercase tracking-widest text-white italic">System <span className="text-blue-600">Control</span></h2>
           <p className="text-zinc-500 text-[11px] font-black uppercase tracking-[0.4em]">Local Neural Studio v3.5 - Diagnostics & Configuration</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-8">
            {/* System Health Dashboard */}
            <section className="grid grid-cols-2 gap-4">
               <StatusTile 
                label="ComfyUI Engine" 
                status={systemStatus.comfy} 
                icon={<Cpu size={20} />} 
                desc="Local Diffusion Server" 
               />
               <StatusTile 
                label="Ollama AI" 
                status={systemStatus.ollama} 
                icon={<Activity size={20} />} 
                desc="Neural Prompt Generator" 
               />
            </section>

            {/* Storage Bridge */}
            <section className="bg-zinc-900/40 rounded-3xl border border-white/5 p-8 space-y-8">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <h3 className="text-xs font-black uppercase tracking-widest text-white">Direct Disk Link</h3>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase">Automated project folder management</p>
                    </div>
                    <button 
                        onClick={authorizeWorkspace}
                        disabled={isAuthorizing}
                        className={`flex items-center gap-3 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                            workspaceHandle ? 'bg-green-600/10 text-green-500 border border-green-500/20' : 'bg-blue-600 text-white shadow-2xl hover:bg-blue-500'
                        }`}
                    >
                        {workspaceHandle ? <CheckCircle2 size={16} /> : <Link size={16} />}
                        {workspaceHandle ? 'Workspace Linked' : 'Authorize Root Folder'}
                    </button>
                </div>

                {workspaceHandle && (
                    <div className="p-6 bg-black/40 rounded-2xl border border-white/5 flex items-center gap-6">
                        <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center text-zinc-500">
                            <FolderOpen size={24} />
                        </div>
                        <div className="flex-1">
                            <div className="text-[10px] font-black text-white uppercase tracking-widest mb-1">{workspaceHandle.name}</div>
                            <div className="flex items-center gap-2 font-mono text-[9px] text-zinc-600">
                                <span>data</span> <ChevronRight size={10} /> 
                                <span>projects</span> <ChevronRight size={10} /> 
                                <span className="text-blue-500">{currentProjectFolder}</span>
                            </div>
                        </div>
                        <div className="text-[8px] font-black text-green-500 uppercase bg-green-500/5 px-3 py-1 rounded-full border border-green-500/20">
                           Auto-Save Active
                        </div>
                    </div>
                )}
            </section>

            {/* Project Details */}
            <section className="bg-zinc-900/40 rounded-3xl border border-white/5 p-8 space-y-6">
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500">Project Telemetry</h3>
                <div className="grid grid-cols-2 gap-6">
                    <SettingInput 
                        label="Project Title" 
                        value={projectSettings.projectName} 
                        onChange={(v) => updateProjectSettings({ projectName: v })}
                    />
                    <SettingInput 
                        label="Author / Director" 
                        value={projectSettings.author} 
                        onChange={(v) => updateProjectSettings({ author: v })}
                    />
                </div>
            </section>
          </div>

          <div className="space-y-8">
             {/* AI Lab Config */}
             <section className="bg-zinc-900/40 rounded-3xl border border-white/5 p-8 space-y-6 shadow-inner">
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500">AI Logic & Specs</h3>
                <div className="space-y-6">
                   <div className="space-y-2">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[8px] text-zinc-600 uppercase font-black">Ollama Model</label>
                        <button 
                          onClick={refreshModels} 
                          className={`text-blue-500 hover:text-blue-400 p-1 transition-all ${isRefreshingModels ? 'animate-spin' : ''}`}
                        >
                          <RefreshCw size={10} />
                        </button>
                      </div>
                      <select 
                        value={projectSettings.defaults.ollamaModel}
                        onChange={(e) => handleOllamaModelChange(e.target.value)}
                        className="w-full bg-zinc-950 border border-white/5 rounded-xl px-4 py-3 text-[11px] font-black text-zinc-300 focus:outline-none focus:border-blue-600 transition-all"
                      >
                         {systemStatus.ollamaModels.length === 0 ? (
                            <option value="llama3:8b">llama3:8b (Default)</option>
                         ) : (
                            systemStatus.ollamaModels.map(m => <option key={m} value={m}>{m}</option>)
                         )}
                      </select>
                   </div>

                   <div className="space-y-2">
                      <label className="text-[8px] text-zinc-600 uppercase font-black">Diffusion Target</label>
                      <select 
                        value={projectSettings.defaults.resolution}
                        onChange={(e) => handleResChange(e.target.value)}
                        className="w-full bg-zinc-950 border border-white/5 rounded-xl px-4 py-3 text-[11px] font-black text-zinc-300 focus:outline-none focus:border-blue-600 transition-all"
                      >
                         <option value="1024x576">1024x576 (Optimal)</option>
                         <option value="1280x720">1280x720 (HD)</option>
                         <option value="1920x1080">1920x1080 (Full HD)</option>
                         <option value="custom">Custom Resolution</option>
                      </select>
                   </div>
                   
                   <div className="space-y-2">
                      <label className="text-[8px] text-zinc-600 uppercase font-black">Timeline Framerate</label>
                      <input 
                        type="number" 
                        value={projectSettings.defaults.fps}
                        onChange={(e) => updateProjectSettings({ defaults: { ...projectSettings.defaults, fps: parseInt(e.target.value) }})}
                        className="w-full bg-zinc-950 border border-white/5 rounded-xl px-4 py-3 text-[11px] font-mono text-blue-500 focus:outline-none"
                      />
                   </div>

                   <button 
                    onClick={() => saveProject(false)}
                    className="w-full py-4 bg-zinc-900 border border-zinc-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white hover:border-zinc-600 transition-all"
                   >
                     Force Export Project Folder
                   </button>
                </div>
             </section>

             <div className="p-8 bg-blue-600/5 border border-blue-500/10 rounded-3xl space-y-4">
                <div className="flex items-center gap-3 text-blue-500">
                   <Zap size={20} fill="currentColor" />
                   <span className="text-[10px] font-black uppercase tracking-widest">Neural Mastery</span>
                </div>
                <p className="text-[10px] text-zinc-500 leading-relaxed font-bold uppercase tracking-tight">
                   Die App ist nun direkt mit deinem lokalen Dateisystem gekoppelt. 
                   Jede Änderung wird sofort in deinem Workspace gesichert.
                </p>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

const StatusTile: React.FC<{ label: string; status: string; icon: React.ReactNode; desc: string }> = ({ label, status, icon, desc }) => {
    const isOnline = status === 'online';
    return (
        <div className={`p-6 rounded-3xl border transition-all ${isOnline ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
            <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg ${isOnline ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                    {icon}
                </div>
                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            </div>
            <div className="text-[10px] font-black text-white uppercase tracking-widest mb-1">{label}</div>
            <div className="text-[8px] text-zinc-500 font-bold uppercase">{desc}</div>
        </div>
    );
};

const SettingInput: React.FC<{ label: string; value: string; onChange: (v: string) => void }> = ({ label, value, onChange }) => (
  <div className="space-y-2">
    <label className="text-[8px] text-zinc-600 uppercase font-black tracking-widest">{label}</label>
    <input 
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-zinc-950 border border-white/5 rounded-xl px-4 py-3 text-[11px] font-black text-zinc-200 focus:outline-none focus:border-blue-600 transition-all"
    />
  </div>
);

export default SettingsView;
