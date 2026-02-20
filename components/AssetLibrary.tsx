
import React, { useState } from 'react';
import { useEditorStore } from '../store';
import { AssetTag, MediaType } from '../types';
import { Search, Film, Type as TypeIcon, Plus, Edit2, Music, Check, X } from 'lucide-react';
import { getAssetMetadata } from '../utils/assetUtils';

const AssetLibrary: React.FC = () => {
  const { assets, addAsset, updateAsset } = useEditorStore();
  const [filter, setFilter] = useState<AssetTag | 'All'>('All');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempName, setTempName] = useState("");

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(async (file: File) => {
        const id = crypto.randomUUID();
        let type = MediaType.IMAGE;
        if (file.type.includes('video')) type = MediaType.VIDEO;
        else if (file.type.includes('audio')) type = MediaType.AUDIO;

        const { thumbnailUrl, duration, metadata } = await getAssetMetadata(file, type);

        const newAsset = {
          id: id,
          name: file.name,
          type: type,
          startTime: 0,
          duration: duration || 5,
          offset: 0,
          sourceUrl: URL.createObjectURL(file),
          thumbnailUrl: thumbnailUrl,
          tag: AssetTag.LOCAL,
          metadata: metadata,
          properties: { scale: 100, posX: 0, posY: 0, opacity: 100, blur: 0 },
          keyframes: {}
        };
        addAsset(newAsset);
        // Automatically enter rename mode for the new asset to encourage clean naming
        setEditingId(id);
        setTempName(file.name);
      });
    }
  };

  const createTextAsset = () => {
    const id = crypto.randomUUID();
    const defaultName = "TITLE_OVERLAY";
    const newAsset = {
      id: id,
      name: defaultName,
      type: MediaType.TEXT,
      startTime: 0,
      duration: 3,
      offset: 0,
      sourceUrl: '',
      thumbnailUrl: '',
      tag: AssetTag.LOCAL,
      properties: { 
        scale: 100, posX: 0, posY: 0, opacity: 100, blur: 0,
        text: 'ENTER TEXT', fontSize: 48, color: '#ffffff'
      },
      keyframes: {}
    };
    addAsset(newAsset);
    setEditingId(id);
    setTempName(defaultName);
  };

  const startRename = (e: React.MouseEvent, id: string, currentName: string) => {
    e.stopPropagation();
    setEditingId(id);
    setTempName(currentName);
  };

  const saveRename = (id: string) => {
    if (tempName.trim()) {
      updateAsset(id, { name: tempName.trim() });
    }
    setEditingId(null);
  };

  const cancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900 border-r border-zinc-800 w-64">
      <div className="p-4 border-b border-zinc-800 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-[10px] tracking-[0.2em] uppercase text-zinc-500">Library</h2>
          <div className="flex gap-1">
            <button onClick={createTextAsset} title="Add Text Overlay" className="p-1.5 rounded-md hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-white border border-zinc-800">
              <TypeIcon size={14} />
            </button>
            <label className="cursor-pointer p-1.5 rounded-md hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-white border border-zinc-800">
              <Plus size={14} />
              <input type="file" className="hidden" multiple onChange={handleFileUpload} accept="video/*,image/*,audio/*" />
            </label>
          </div>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={12} />
          <input 
            type="text" 
            placeholder="Search assets..." 
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-1.5 pl-9 pr-3 text-[10px] focus:outline-none focus:border-blue-500 transition-all font-mono"
          />
        </div>
      </div>

      <div className="flex p-2 gap-1 border-b border-zinc-800 overflow-x-auto no-scrollbar bg-zinc-900/50">
        {['All', AssetTag.LOCAL, AssetTag.KI, AssetTag.STOCK].map(tag => (
          <button
            key={tag}
            onClick={() => setFilter(tag as any)}
            className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter transition-all ${
              filter === tag ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'bg-zinc-800 text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {assets.filter(a => filter === 'All' || a.tag === filter).map(asset => (
          <div 
            key={asset.id} 
            draggable 
            onDragStart={(e) => {
              if (editingId === asset.id) {
                e.preventDefault();
                return;
              }
              e.dataTransfer.setData('asset', JSON.stringify(asset));
            }}
            className="group relative rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800 aspect-video cursor-grab active:cursor-grabbing hover:border-blue-500 transition-all shadow-lg"
          >
            {asset.type === MediaType.TEXT ? (
              <div className="w-full h-full flex items-center justify-center bg-zinc-900 font-black text-2xl italic text-zinc-800 select-none uppercase tracking-tighter">
                Aa
              </div>
            ) : (
              <img src={asset.thumbnailUrl} alt={asset.name} className="w-full h-full object-cover opacity-40 group-hover:opacity-100 transition-opacity" />
            )}

            {/* Metadata Overlay */}
            <div className="absolute top-2 right-2 flex flex-col items-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
              {asset.metadata?.width && asset.metadata?.height && (
                <div className="bg-black/80 backdrop-blur-sm px-1.5 py-0.5 rounded-md text-[7px] font-black text-zinc-300 border border-white/5 uppercase tracking-tighter">
                  {asset.metadata.width}×{asset.metadata.height}
                </div>
              )}
              {asset.duration > 0 && (
                <div className="bg-blue-600/80 backdrop-blur-sm px-1.5 py-0.5 rounded-md text-[7px] font-black text-white border border-blue-400/20 uppercase tracking-tighter">
                  {asset.duration.toFixed(2)}s
                </div>
              )}
              {asset.metadata?.fileSize && (
                <div className="bg-zinc-800/80 backdrop-blur-sm px-1.5 py-0.5 rounded-md text-[7px] font-black text-zinc-400 border border-white/5 uppercase tracking-tighter">
                  {(asset.metadata.fileSize / (1024 * 1024)).toFixed(2)} MB
                </div>
              )}
            </div>
            
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent flex flex-col justify-end p-2 opacity-90 group-hover:opacity-100">
              <div className="flex items-center justify-between gap-1 text-[9px] text-zinc-300 font-bold uppercase tracking-widest">
                <div className="flex items-center gap-1.5 truncate flex-1">
                  {asset.type === MediaType.TEXT ? (
                    <TypeIcon size={10} className="text-blue-400" />
                  ) : asset.type === MediaType.AUDIO ? (
                    <Music size={10} className="text-purple-400" />
                  ) : (
                    <Film size={10} />
                  )}
                  
                  {editingId === asset.id ? (
                    <div className="flex items-center gap-1 w-full" onClick={(e) => e.stopPropagation()}>
                      <input 
                        autoFocus
                        className="bg-zinc-900 border border-blue-500 rounded px-1 outline-none text-white w-full text-[9px] font-mono"
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        onBlur={() => saveRename(asset.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveRename(asset.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                      />
                    </div>
                  ) : (
                    <span 
                      className="truncate cursor-text hover:text-white transition-colors"
                      onClick={(e) => startRename(e, asset.id, asset.name)}
                    >
                      {asset.name}
                    </span>
                  )}
                </div>

                {!editingId && (
                  <button 
                    onClick={(e) => startRename(e, asset.id, asset.name)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-blue-400 transition-all"
                    title="Rename Asset"
                  >
                    <Edit2 size={10} />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {assets.length === 0 && (
          <div className="h-32 border-2 border-dashed border-zinc-800 rounded-2xl flex flex-col items-center justify-center text-center p-4">
             <Plus size={20} className="text-zinc-700 mb-2" />
             <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest">Drag Media Here</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssetLibrary;
