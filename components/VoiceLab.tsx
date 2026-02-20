
import React, { useState, useRef } from 'react';
import { useEditorStore } from '../store';
import { VoiceProfile, MediaType, AssetTag } from '../types';
import { Mic, Play, Plus, Trash2, Wand2, Volume2, Save, Music, RefreshCw, Sparkles, UserPlus, Activity, Bookmark } from 'lucide-react';
import { GoogleGenAI, Modality } from "@google/genai";

const VoiceLab: React.FC = () => {
  const { voiceProfiles, voicePresets, addVoiceProfile, updateVoiceProfile, removeVoiceProfile, addVoicePreset, removeVoicePreset, addAsset } = useEditorStore();
  const [isCloning, setIsCloning] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [text, setText] = useState("");
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [newProfileName, setNewProfileName] = useState("");
  const [newPresetName, setNewPresetName] = useState("");
  const [showPresetInput, setShowPresetInput] = useState(false);
  const [clonedVoiceBase, setClonedVoiceBase] = useState<'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr'>('Zephyr');
  const [audioSample, setAudioSample] = useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [isAnalyzingQuality, setIsAnalyzingQuality] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [qualityReport, setQualityReport] = useState<{
    audioQuality: string;
    pitchConsistency: string;
    clarity: string;
    overallScore: number;
    suggestions: string[];
  } | null>(null);
  
  // Speech Characteristics
  const [pitch, setPitch] = useState(0); // -20 to 20
  const [speed, setSpeed] = useState(1); // 0.5 to 2.0
  const [accent, setAccent] = useState("Neutral");

  const audioRef = useRef<HTMLAudioElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const selectedProfile = voiceProfiles.find(p => p.id === selectedProfileId);

  const handleSelectProfile = (id: string) => {
    setSelectedProfileId(id);
    const profile = voiceProfiles.find(p => p.id === id);
    if (profile) {
      setPitch(profile.pitch ?? 0);
      setSpeed(profile.speed ?? 1);
      setAccent(profile.accent ?? "Neutral");
    }
  };

  const handleUpdateProfile = async () => {
    if (!selectedProfileId) return;
    setIsUpdating(true);
    updateVoiceProfile(selectedProfileId, {
      name: editName || undefined,
      pitch,
      speed,
      accent
    });
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsUpdating(false);
    setEditingProfileId(null);
  };

  const handleDeleteProfile = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete the voice profile "${name}"? This action cannot be undone.`)) {
      removeVoiceProfile(id);
      if (selectedProfileId === id) setSelectedProfileId(null);
    }
  };

  const handleSavePreset = () => {
    if (!newPresetName) return;
    addVoicePreset({
      id: crypto.randomUUID(),
      name: newPresetName,
      pitch,
      speed,
      accent
    });
    setNewPresetName("");
    setShowPresetInput(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      setAudioSample(file);
    }
  };

  const handleAnalyzeQuality = async () => {
    if (!audioSample) return;
    setIsAnalyzingQuality(true);
    setQualityReport(null);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
      });
      reader.readAsDataURL(audioSample);
      const base64Audio = await base64Promise;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType: audioSample.type,
                  data: base64Audio
                }
              },
              {
                text: `Perform an advanced technical analysis of this voice sample for high-fidelity neural cloning. 
                Provide deep technical feedback on:
                1. Audio Quality: Analyze noise floor, clipping, room acoustics/reverb, and bit-depth artifacts.
                2. Pitch Consistency: Evaluate vocal stability, emotional range, and frequency variance.
                3. Clarity: Assess enunciation, plosives, and sibilance.
                4. Overall Score: A technical score from 0-100.
                5. Suggestions: Provide 3-4 specific, actionable steps to improve the recording for better cloning results.
                
                Return the analysis as a strictly valid JSON object with these keys: audioQuality, pitchConsistency, clarity, overallScore, suggestions (array of strings).`
              }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json"
        }
      });

      const result = JSON.parse(response.text || "{}");
      setQualityReport(result);
    } catch (error) {
      console.error("Quality analysis failed", error);
    } finally {
      setIsAnalyzingQuality(false);
    }
  };

  const handleCloneVoice = async () => {
    if (!newProfileName || !audioSample) return;
    setIsCloning(true);
    setAnalysisResult("Analyzing vocal patterns...");
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      // Convert audio to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
      });
      reader.readAsDataURL(audioSample);
      const base64Audio = await base64Promise;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType: audioSample.type,
                  data: base64Audio
                }
              },
              {
                text: `Analyze this voice sample. 
                1. Identify which of these base voices it most closely matches: Puck, Charon, Kore, Fenrir, Zephyr.
                2. Estimate the pitch shift (-20 to 20) and speed (0.5 to 2.0) to match it.
                3. Describe its characteristics (e.g., husky, bright, authoritative).
                Return the result as JSON with keys: baseVoice, pitch, speed, characteristics.`
              }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json"
        }
      });

      const result = JSON.parse(response.text || "{}");
      
      const newProfile: VoiceProfile = {
        id: crypto.randomUUID(),
        name: newProfileName,
        baseVoice: result.baseVoice || clonedVoiceBase,
        characteristics: result.characteristics || ['Cloned', 'Neural'],
        pitch: result.pitch || 0,
        speed: result.speed || 1,
        accent: "Neutral"
      };
      
      addVoiceProfile(newProfile);
      setPitch(newProfile.pitch || 0);
      setSpeed(newProfile.speed || 1);
      setAccent(newProfile.accent || "Neutral");
      setNewProfileName("");
      setAudioSample(null);
      setAnalysisResult(`Analysis Complete: Matched with ${newProfile.baseVoice}. Characteristics: ${newProfile.characteristics.join(', ')}`);
      setSelectedProfileId(newProfile.id);
    } catch (error) {
      console.error("Voice cloning failed", error);
      setAnalysisResult("Analysis failed. Using default neural profile.");
      
      const newProfile: VoiceProfile = {
        id: crypto.randomUUID(),
        name: newProfileName,
        baseVoice: clonedVoiceBase,
        characteristics: ['Default', 'Neural']
      };
      addVoiceProfile(newProfile);
    } finally {
      setIsCloning(false);
    }
  };

  const handleGenerateSpeech = async () => {
    if (!text || !selectedProfile) return;
    setIsGenerating(true);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      // Construct SSML-like prompt or use neural hints
      const pitchStr = pitch >= 0 ? `+${pitch}%` : `${pitch}%`;
      const speedStr = `${speed}x`;
      const accentHint = accent !== "Neutral" ? `[Accent: ${accent}] ` : "";
      
      // Wrapping in a simulated SSML structure for the neural engine
      const prompt = `${accentHint}<prosody pitch="${pitchStr}" rate="${speedStr}">${text}</prosody>`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: selectedProfile.baseVoice },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const audioUrl = `data:audio/mp3;base64,${base64Audio}`;
        setPreviewUrl(audioUrl);
        if (audioRef.current) {
          audioRef.current.src = audioUrl;
          audioRef.current.play();
        }
      }
    } catch (error) {
      console.error("Speech generation failed", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddToLibrary = () => {
    if (!previewUrl || !selectedProfile) return;
    
    const id = crypto.randomUUID();
    const newAsset = {
      id: id,
      name: `VOICE_${selectedProfile.name.toUpperCase()}_${Date.now()}`,
      type: MediaType.AUDIO,
      startTime: 0,
      duration: 5, // Default duration, will be updated if we had real metadata
      offset: 0,
      sourceUrl: previewUrl,
      thumbnailUrl: '', // Will be generated by AssetLibrary logic if we used the same flow
      tag: AssetTag.KI,
      properties: { scale: 100, posX: 0, posY: 0, opacity: 100, blur: 0 },
      keyframes: {}
    };
    
    addAsset(newAsset);
    alert("Voiceover added to Asset Library");
  };

  return (
    <div className="flex-1 bg-[#09090b] overflow-y-auto no-scrollbar p-10">
      <div className="max-w-5xl mx-auto space-y-12">
        <header className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-600/20 rounded-2xl border border-purple-500/20 text-purple-500">
              <Mic size={32} />
            </div>
            <div>
              <h2 className="text-4xl font-black uppercase tracking-widest text-white italic">Neural <span className="text-purple-600">Voice</span> Lab</h2>
              <p className="text-zinc-500 text-[11px] font-black uppercase tracking-[0.4em]">Advanced Voice Cloning & Synthesis Engine</p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Voice Profiles List */}
          <div className="space-y-6">
            <div className="bg-zinc-900/40 rounded-3xl border border-white/5 p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Voice Profiles</h3>
                <UserPlus size={14} className="text-zinc-700" />
              </div>

              <div className="space-y-2">
                {voiceProfiles.map(profile => (
                  <div key={profile.id} className="group relative">
                    <button
                      onClick={() => handleSelectProfile(profile.id)}
                      className={`w-full p-4 rounded-2xl border flex items-center gap-4 transition-all ${
                        selectedProfileId === profile.id 
                        ? 'bg-purple-600/10 border-purple-500/30 text-white' 
                        : 'bg-black/40 border-white/5 text-zinc-500 hover:border-white/10'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedProfileId === profile.id ? 'bg-purple-600 text-white' : 'bg-zinc-800 text-zinc-600'}`}>
                        <Volume2 size={20} />
                      </div>
                      <div className="flex-1 text-left overflow-hidden">
                        {editingProfileId === profile.id ? (
                          <input 
                            autoFocus
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onBlur={() => handleUpdateProfile()}
                            onKeyDown={(e) => e.key === 'Enter' && handleUpdateProfile()}
                            className="bg-black/60 border border-purple-500/50 rounded px-2 py-1 text-[10px] font-black text-white w-full uppercase focus:outline-none"
                          />
                        ) : (
                          <>
                            <div className="text-[10px] font-black uppercase tracking-widest truncate">{profile.name}</div>
                            <div className="text-[8px] font-bold text-zinc-600 uppercase">{profile.baseVoice} Neural Engine</div>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setEditingProfileId(profile.id);
                            setEditName(profile.name);
                          }}
                          className="p-2 hover:text-purple-400 transition-colors"
                          title="Edit Name"
                        >
                          <Wand2 size={12} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDeleteProfile(profile.id, profile.name); }}
                          className="p-2 hover:text-red-500 transition-colors"
                          title="Delete Profile"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </button>
                  </div>
                ))}

                <div className="pt-4 border-t border-white/5 space-y-4">
                  <div className="space-y-2">
                    <label className="text-[8px] text-zinc-600 uppercase font-black tracking-widest">Clone New Voice</label>
                    <input 
                      type="text"
                      placeholder="PROFILE NAME"
                      value={newProfileName}
                      onChange={(e) => setNewProfileName(e.target.value)}
                      className="w-full bg-black border border-white/5 rounded-xl px-4 py-3 text-[10px] font-black text-white focus:outline-none focus:border-purple-600 transition-all uppercase"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[8px] text-zinc-600 uppercase font-black tracking-widest">Voice Sample (Audio File)</label>
                    <label 
                      onDragOver={handleDragOver}
                      onDragEnter={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                        isDragging ? 'border-purple-500 bg-purple-500/10 scale-[1.02]' : 
                        audioSample ? 'border-purple-500/50 bg-purple-500/5' : 
                        'border-white/5 hover:border-white/10 bg-black'
                      }`}
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Plus size={20} className={isDragging || audioSample ? 'text-purple-500' : 'text-zinc-600'} />
                        <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest mt-2">
                          {isDragging ? 'Drop to Upload' : audioSample ? audioSample.name : 'Upload or Drag Sample'}
                        </p>
                      </div>
                      <input type="file" className="hidden" accept="audio/*" onChange={(e) => setAudioSample(e.target.files?.[0] || null)} />
                    </label>
                  </div>

                  {analysisResult && (
                    <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                      <p className="text-[8px] text-purple-400 font-bold uppercase leading-relaxed">{analysisResult}</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button 
                      onClick={handleAnalyzeQuality}
                      disabled={isAnalyzingQuality || !audioSample}
                      className="flex-1 py-4 bg-zinc-800 text-zinc-300 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 border border-white/5"
                    >
                      {isAnalyzingQuality ? <RefreshCw size={14} className="animate-spin" /> : <Activity size={14} />}
                      {isAnalyzingQuality ? 'Analyzing...' : 'Pre-check Quality'}
                    </button>
                    
                    <button 
                      onClick={handleCloneVoice}
                      disabled={isCloning || !newProfileName || !audioSample}
                      className="flex-[2] py-4 bg-purple-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-500 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isCloning ? <RefreshCw size={14} className="animate-spin" /> : <Wand2 size={14} />}
                      {isCloning ? 'Analyzing Vocal Patterns...' : 'Clone Voice Sample'}
                    </button>
                  </div>

                  {qualityReport && (
                    <div className="p-4 bg-purple-600/5 rounded-2xl border border-purple-500/10 space-y-3 animate-in fade-in zoom-in duration-300">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black text-white uppercase tracking-widest">Quality Report</span>
                        <div className="flex items-center gap-1.5">
                          <div className="w-16 h-1 bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full bg-purple-500" style={{ width: `${qualityReport.overallScore}%` }} />
                          </div>
                          <span className="text-[8px] font-mono text-purple-400">{qualityReport.overallScore}%</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-2">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[7px] text-zinc-500 font-black uppercase tracking-tighter">Audio Quality</span>
                          <p className="text-[8px] text-zinc-300 leading-tight">{qualityReport.audioQuality}</p>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[7px] text-zinc-500 font-black uppercase tracking-tighter">Pitch Consistency</span>
                          <p className="text-[8px] text-zinc-300 leading-tight">{qualityReport.pitchConsistency}</p>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[7px] text-zinc-500 font-black uppercase tracking-tighter">Clarity</span>
                          <p className="text-[8px] text-zinc-300 leading-tight">{qualityReport.clarity}</p>
                        </div>
                      </div>

                      {qualityReport.suggestions.length > 0 && (
                        <div className="pt-3 border-t border-white/5 space-y-2">
                          <span className="text-[7px] text-purple-400 font-black uppercase tracking-widest">Improvement Roadmap</span>
                          <ul className="space-y-1.5">
                            {qualityReport.suggestions.map((suggestion, idx) => (
                              <li key={idx} className="flex gap-2 text-[8px] text-zinc-400 leading-tight">
                                <span className="text-purple-500 font-bold">•</span>
                                {suggestion}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Generation Workspace */}
          <div className="lg:col-span-2 space-y-8">
            <section className="bg-zinc-900/40 rounded-3xl border border-white/5 p-8 space-y-8">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-xs font-black uppercase tracking-widest text-white">Neural Synthesis</h3>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase">Generate high-fidelity narration from text</p>
                </div>
                {selectedProfile && (
                  <div className="flex items-center gap-3">
                    {(pitch !== (selectedProfile.pitch ?? 0) || speed !== (selectedProfile.speed ?? 1) || accent !== (selectedProfile.accent ?? "Neutral")) && (
                      <button 
                        onClick={handleUpdateProfile}
                        disabled={isUpdating}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600/20 rounded-full border border-emerald-500/30 text-emerald-500 text-[9px] font-black uppercase tracking-widest hover:bg-emerald-600/30 transition-all"
                      >
                        {isUpdating ? <RefreshCw size={12} className="animate-spin" /> : <Save size={12} />}
                        Save Settings
                      </button>
                    )}
                    <div className="flex items-center gap-2 px-4 py-2 bg-purple-600/10 rounded-full border border-purple-500/20 text-purple-500 text-[9px] font-black uppercase tracking-widest">
                      <Sparkles size={12} />
                      Active: {selectedProfile.name}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-6 bg-black/20 rounded-2xl border border-white/5">
                 <div className="space-y-3">
                    <div className="flex justify-between text-[8px] text-zinc-500 font-black uppercase tracking-widest">
                       <span>Pitch Shift</span>
                       <span className="text-purple-400 font-mono">{pitch > 0 ? '+' : ''}{pitch}%</span>
                    </div>
                    <input 
                      type="range" min="-20" max="20" value={pitch} 
                      onChange={(e) => setPitch(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-zinc-900 rounded-full appearance-none cursor-pointer accent-purple-600"
                    />
                 </div>

                 <div className="space-y-3">
                    <div className="flex justify-between text-[8px] text-zinc-500 font-black uppercase tracking-widest">
                       <span>Speech Rate</span>
                       <span className="text-purple-400 font-mono">{speed}x</span>
                    </div>
                    <input 
                      type="range" min="0.5" max="2.0" step="0.1" value={speed} 
                      onChange={(e) => setSpeed(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-zinc-900 rounded-full appearance-none cursor-pointer accent-purple-600"
                    />
                 </div>

                 <div className="space-y-2">
                    <label className="text-[8px] text-zinc-600 uppercase font-black tracking-widest">Neural Accent Hint</label>
                    <select 
                      value={accent}
                      onChange={(e) => setAccent(e.target.value)}
                      className="w-full bg-black border border-white/5 rounded-xl px-4 py-2.5 text-[10px] font-black text-zinc-400 focus:outline-none focus:border-purple-600 transition-all"
                    >
                       <option value="Neutral">Neutral</option>
                       <option value="British">British (RP)</option>
                       <option value="American">American (General)</option>
                       <option value="Australian">Australian</option>
                       <option value="Indian">Indian</option>
                    </select>
                 </div>
              </div>

              {/* Voice Presets */}
              <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[8px] text-zinc-500 font-black uppercase tracking-widest">
                      <Bookmark size={10} />
                      Vocal Style Presets
                    </div>
                    <button 
                      onClick={() => setShowPresetInput(!showPresetInput)}
                      className="text-[8px] font-black text-purple-500 uppercase hover:text-purple-400 transition-colors"
                    >
                      {showPresetInput ? 'Cancel' : '+ New Preset'}
                    </button>
                  </div>

                  {showPresetInput && (
                    <div className="flex gap-2 animate-in slide-in-from-top duration-200">
                      <input 
                        type="text"
                        placeholder="PRESET NAME (e.g. EXCITED)"
                        value={newPresetName}
                        onChange={(e) => setNewPresetName(e.target.value)}
                        className="flex-1 bg-black border border-white/5 rounded-lg px-3 py-2 text-[9px] font-black text-white focus:outline-none focus:border-purple-600 transition-all uppercase"
                      />
                      <button 
                        onClick={handleSavePreset}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-purple-500 transition-all"
                      >
                        Save
                      </button>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {voicePresets.length === 0 && !showPresetInput && (
                      <p className="text-[8px] text-zinc-700 uppercase font-bold italic">No presets saved yet</p>
                    )}
                    {voicePresets.map(preset => (
                      <div key={preset.id} className="group relative">
                        <button 
                          onClick={() => {
                            setPitch(preset.pitch);
                            setSpeed(preset.speed);
                            setAccent(preset.accent);
                          }}
                          className="px-3 py-1.5 bg-zinc-900 border border-white/5 rounded-lg text-[8px] font-black text-zinc-400 uppercase tracking-widest hover:border-purple-500/50 hover:text-white transition-all flex items-center gap-2"
                        >
                          {preset.name}
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              removeVoicePreset(preset.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-red-500 transition-all"
                          >
                            <Trash2 size={8} />
                          </button>
                        </button>
                      </div>
                    ))}
                  </div>
              </div>

              <div className="space-y-6">
                <textarea 
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Enter narration text here..."
                  className="w-full h-48 bg-black/40 border border-white/5 rounded-2xl p-6 text-sm font-medium text-zinc-300 focus:outline-none focus:border-purple-600 transition-all resize-none"
                />

                <div className="flex items-center gap-4">
                  <button 
                    onClick={handleGenerateSpeech}
                    disabled={isGenerating || !text || !selectedProfile}
                    className="flex-1 py-5 bg-purple-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-purple-500 transition-all disabled:opacity-30 flex items-center justify-center gap-3 shadow-2xl shadow-purple-900/20"
                  >
                    {isGenerating ? <RefreshCw size={18} className="animate-spin" /> : <Play size={18} fill="currentColor" />}
                    {isGenerating ? 'Synthesizing...' : 'Generate Voiceover'}
                  </button>

                  {previewUrl && (
                    <button 
                      onClick={handleAddToLibrary}
                      className="px-8 py-5 bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white hover:border-white/20 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-3"
                    >
                      <Save size={18} />
                      Commit to Library
                    </button>
                  )}
                </div>
              </div>

              {previewUrl && (
                <div className="p-6 bg-purple-600/5 rounded-2xl border border-purple-500/10 flex items-center gap-6 animate-in fade-in slide-in-from-bottom duration-500">
                  <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                    <Music size={24} />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-[10px] font-black text-white uppercase tracking-widest">Synthesis Preview</div>
                      <div className="text-[8px] font-mono text-purple-400 uppercase">24kHz Neural PCM</div>
                    </div>
                    <audio ref={audioRef} controls className="w-full h-8 accent-purple-600" />
                  </div>
                </div>
              )}
            </section>

            <div className="grid grid-cols-2 gap-6">
              <div className="p-8 bg-zinc-900/40 rounded-3xl border border-white/5 space-y-4">
                <div className="flex items-center gap-3 text-zinc-500">
                  <RefreshCw size={20} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Batch Processing</span>
                </div>
                <p className="text-[10px] text-zinc-600 leading-relaxed font-bold uppercase tracking-tight">
                  Upload a CSV of narration lines to generate entire scene voiceovers in one pass.
                </p>
              </div>
              <div className="p-8 bg-zinc-900/40 rounded-3xl border border-white/5 space-y-4">
                <div className="flex items-center gap-3 text-zinc-500">
                  <Sparkles size={20} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Emotion Mapping</span>
                </div>
                <p className="text-[10px] text-zinc-600 leading-relaxed font-bold uppercase tracking-tight">
                  Use SSML tags to inject specific emotions (Joy, Anger, Sadness) into the neural output.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceLab;
