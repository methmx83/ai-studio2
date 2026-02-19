
import React, { useEffect, useState } from 'react';
import { useEditorStore } from './store';
import AssetLibrary from './components/AssetLibrary';
import Timeline from './components/Timeline';
import Inspector from './components/Inspector';
import Preview from './components/Preview';
import ComfyUIBridge from './components/ComfyUIBridge';
import ComfyUIView from './components/ComfyUIView';
import SettingsView from './components/SettingsView';
import { Layout, FlaskConical, Settings, Save, Terminal, Cpu, Database, ChevronRight, Activity, Zap } from 'lucide-react';

const App: React.FC = () => {
  const { isPlaying, setCurrentTime, activeView, setActiveView, projectSettings, systemStatus } = useEditorStore();

  useEffect(() => {
    let frameId: number;
    const tick = () => {
      if (isPlaying) {
        setCurrentTime(useEditorStore.getState().currentTime + 0.0416); // ~24fps
      }
      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [isPlaying, setCurrentTime]);

  return (
    <div className="flex flex-col h-screen bg-[#050506] text-zinc-100 select-none font-sans overflow-hidden">
      {/* Top Professional Toolbar */}
      <header className="h-14 border-b border-[#1a1a1e] bg-[#0d0d0f] flex items-center justify-between px-6 shrink-0 z-50">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-black text-white italic shadow-lg shadow-blue-500/20">S</div>
            <div className="flex flex-col">
              <h1 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">SceneEditor <span className="text-blue-500">Ultra Pro</span></h1>
              <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest flex items-center gap-1">
                <Database size={8} /> {projectSettings.projectName}
              </span>
            </div>
          </div>

          <div className="flex items-center bg-[#050506] rounded-xl p-1 border border-[#1a1a1e]">
            <NavBtn active={activeView === 'studio'} onClick={() => setActiveView('studio')} icon={<Layout size={14} />} label="Studio" />
            <NavBtn active={activeView === 'lab'} onClick={() => setActiveView('lab')} icon={<FlaskConical size={14} />} label="AI Lab" />
            <NavBtn active={activeView === 'settings'} onClick={() => setActiveView('settings')} icon={<Settings size={14} />} label="Configs" />
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4 bg-[#1a1a1e]/50 px-3 py-1.5 rounded-xl border border-white/5">
             <div className="flex items-center gap-2">
               <div className={`w-1.5 h-1.5 rounded-full ${systemStatus.comfy === 'online' ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
               <span className="text-[8px] font-black uppercase text-zinc-500">Comfy Bridge</span>
             </div>
             <div className="w-px h-3 bg-zinc-800" />
             <div className="flex items-center gap-2 text-blue-500">
               <Cpu size={10} />
               <span className="text-[8px] font-black uppercase">RTX 5090 Ready</span>
             </div>
          </div>
          <button className="flex items-center gap-2 px-5 py-2 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-all active:scale-95 shadow-xl shadow-white/5">
            Render Scene
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 flex overflow-hidden">
        {activeView === 'studio' ? (
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex-1 flex overflow-hidden">
              <AssetLibrary />
              <div className="flex-1 flex flex-col min-w-0 border-x border-[#1a1a1e]">
                 <Preview />
              </div>
              <div className="w-[340px] hidden xl:block shrink-0">
                 <ComfyUIBridge />
              </div>
            </div>
            <Timeline />
          </div>
        ) : activeView === 'lab' ? (
          <ComfyUIView />
        ) : (
          <SettingsView />
        )}
        
        {activeView === 'studio' && <Inspector />}
      </main>

      {/* Dynamic Status Bar */}
      <footer className="h-6 bg-[#0d0d0f] border-t border-[#1a1a1e] px-4 flex items-center justify-between text-[8px] text-zinc-600 font-bold uppercase tracking-[0.2em]">
        <div className="flex gap-6 items-center">
          <span className="flex items-center gap-2"><Zap size={10} className="text-yellow-500" /> Neural Pipeline: Stable</span>
          <span className="flex items-center gap-2"><Terminal size={10} /> IO Bridge: Authorised</span>
        </div>
        <div className="flex gap-6 items-center">
          <span className="text-zinc-500 italic">V3.5.0-PRO-CANVAS</span>
          <div className="w-24 h-1 bg-zinc-900 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 w-1/4" />
          </div>
        </div>
      </footer>
    </div>
  );
};

const NavBtn: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${active ? 'bg-[#1a1a1e] text-white shadow-md' : 'text-zinc-500 hover:text-zinc-300'}`}
  >
    {icon} {label}
  </button>
);

export default App;
