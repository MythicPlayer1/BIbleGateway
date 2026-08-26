"use client";

import React, { useState } from "react";
import { 
  X, Image as ImageIcon, Film, Palette, Upload, Trash2, Plus, 
  Sparkles, Sliders, Check
} from "lucide-react";
import { 
  GlobalBackgroundConfig, BackgroundTransitionEffect, GradientType, 
  GradientAnimation, GRADIENT_PRESETS
} from "@/lib/lyrics";

interface BackgroundStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: GlobalBackgroundConfig;
  onUpdateConfig: (newConfig: GlobalBackgroundConfig) => void;
  onAddSlideshowImages: (files: FileList) => Promise<void>;
  onRemoveSlideshowImage: (id: string) => void;
  onClearSlideshowImages: () => void;
  onUploadVideoBackground: (file: File) => Promise<void>;
  onClearBackground: () => void;
}

export function BackgroundStudioModal({
  isOpen,
  onClose,
  config,
  onUpdateConfig,
  onAddSlideshowImages,
  onRemoveSlideshowImage,
  onClearSlideshowImages,
  onUploadVideoBackground,
  onClearBackground
}: BackgroundStudioModalProps) {
  const [activeTab, setActiveTab] = useState<'slideshow' | 'gradient' | 'video'>('slideshow');
  const [isUploading, setIsUploading] = useState(false);

  if (!isOpen) return null;

  const handleMultipleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsUploading(true);
      try {
        await onAddSlideshowImages(e.target.files);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsUploading(true);
      try {
        await onUploadVideoBackground(e.target.files[0]);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const applyGradientPreset = (preset: typeof GRADIENT_PRESETS[0]) => {
    onUpdateConfig({
      ...config,
      mode: 'gradient',
      gradient: {
        ...config.gradient,
        presetId: preset.id,
        type: preset.type,
        color1: preset.color1,
        color2: preset.color2,
        color3: preset.color3,
        angle: preset.angle
      }
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-950/80 border border-indigo-500/30 text-indigo-400">
              <Sparkles size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Global Projection Background Studio
              </h2>
              <p className="text-xs text-neutral-400">
                Configure auto-sliding images, smooth transition motion, or animated gradients
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white bg-neutral-800/60 hover:bg-neutral-800 rounded-xl transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="px-6 pt-4 bg-neutral-950/40 border-b border-neutral-800/80">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setActiveTab('slideshow');
                if (config.slideshow.images.length > 0) {
                  onUpdateConfig({ ...config, mode: 'slideshow' });
                }
              }}
              className={`flex items-center gap-2 px-5 py-3 rounded-t-2xl font-bold text-xs md:text-sm transition-all border-t border-x ${
                activeTab === 'slideshow'
                  ? 'bg-neutral-900 border-neutral-800 text-indigo-400 border-b-transparent shadow-lg'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'
              }`}
            >
              <ImageIcon size={18} />
              <span>Multi-Image Slideshow</span>
              {config.slideshow.images.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[11px] font-mono">
                  {config.slideshow.images.length}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setActiveTab('gradient');
                onUpdateConfig({ ...config, mode: 'gradient' });
              }}
              className={`flex items-center gap-2 px-5 py-3 rounded-t-2xl font-bold text-xs md:text-sm transition-all border-t border-x ${
                activeTab === 'gradient'
                  ? 'bg-neutral-900 border-neutral-800 text-indigo-400 border-b-transparent shadow-lg'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'
              }`}
            >
              <Palette size={18} />
              <span>Advanced Gradient</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('video');
                if (config.video?.url) {
                  onUpdateConfig({ ...config, mode: 'video' });
                }
              }}
              className={`flex items-center gap-2 px-5 py-3 rounded-t-2xl font-bold text-xs md:text-sm transition-all border-t border-x ${
                activeTab === 'video'
                  ? 'bg-neutral-900 border-neutral-800 text-indigo-400 border-b-transparent shadow-lg'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'
              }`}
            >
              <Film size={18} />
              <span>Video Background</span>
            </button>

            {/* Current Active Mode Badge */}
            <div className="ml-auto flex items-center gap-2 pb-2">
              <span className="text-xs text-neutral-400">Active Mode:</span>
              <span className="px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold uppercase tracking-wider">
                {config.mode === 'slideshow' ? '📸 Image Slideshow' : config.mode === 'gradient' ? '🎨 Animated Gradient' : config.mode === 'video' ? '🎥 Video' : '🚫 None'}
              </span>
              {config.mode !== 'none' && (
                <button
                  onClick={onClearBackground}
                  className="px-2.5 py-1 text-xs font-bold text-rose-400 hover:text-white bg-rose-950/60 hover:bg-rose-900/80 border border-rose-500/30 rounded-lg transition-all"
                  title="Clear Active Background"
                >
                  Turn Off
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tab Contents */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          
          {/* TAB 1: MULTI-IMAGE SLIDESHOW */}
          {activeTab === 'slideshow' && (
            <div className="space-y-6">
              
              {/* Upload Box */}
              <div className="p-6 border-2 border-dashed border-neutral-800 hover:border-indigo-500/60 rounded-3xl bg-neutral-950/60 transition-all text-center flex flex-col items-center justify-center space-y-3 group">
                <div className="p-4 rounded-2xl bg-neutral-900 group-hover:bg-indigo-950 text-neutral-400 group-hover:text-indigo-400 transition-all border border-neutral-800">
                  <Upload size={28} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Upload Images for Background Slideshow</h4>
                  <p className="text-xs text-neutral-400 mt-1">Select one or multiple high-resolution photos (JPG, PNG, WEBP)</p>
                </div>

                <label className="cursor-pointer px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all active:scale-95 flex items-center gap-2">
                  <Plus size={16} />
                  <span>{isUploading ? 'Uploading Photos...' : 'Add Photos to Slideshow'}</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleMultipleImageUpload}
                    disabled={isUploading}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Uploaded Image Gallery Preview */}
              {config.slideshow.images.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                      Slideshow Gallery ({config.slideshow.images.length} Photos)
                    </span>
                    <button
                      onClick={onClearSlideshowImages}
                      className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 font-bold"
                    >
                      <Trash2 size={13} />
                      <span>Clear All</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                    {config.slideshow.images.map((img, idx) => (
                      <div key={img.id} className="relative group rounded-2xl overflow-hidden aspect-video bg-neutral-950 border border-neutral-800 shadow-md">
                        <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            onClick={() => onRemoveSlideshowImage(img.id)}
                            className="p-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition-all shadow"
                            title="Remove Photo"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <span className="absolute bottom-1 left-1.5 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-mono text-white">
                          #{idx + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-amber-950/30 border border-amber-500/30 rounded-2xl text-amber-300 text-xs flex items-center gap-3">
                  <span className="text-base">💡</span>
                  <span>Add 2 or more images above to enable smooth automated background rotation during service.</span>
                </div>
              )}

              {/* SLIDESHOW CONFIG CONTROLS */}
              <div className="p-6 bg-neutral-950/80 border border-neutral-800 rounded-3xl space-y-6">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-neutral-800/80 pb-3">
                  <Sliders size={16} className="text-indigo-400" />
                  <span>Rotation & Motion Controls</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Rotation Interval (Seconds) */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-300 flex items-center justify-between">
                      <span>Change Interval</span>
                      <span className="text-indigo-400 font-mono font-bold text-sm">{config.slideshow.interval} seconds</span>
                    </label>
                    <input
                      type="range"
                      min={2}
                      max={60}
                      step={1}
                      value={config.slideshow.interval}
                      onChange={(e) => {
                        onUpdateConfig({
                          ...config,
                          mode: 'slideshow',
                          slideshow: { ...config.slideshow, interval: parseInt(e.target.value, 10) }
                        });
                      }}
                      className="w-full accent-indigo-500 bg-neutral-800 rounded-lg cursor-pointer h-2"
                    />
                    <div className="flex items-center justify-between text-[10px] text-neutral-500 font-mono">
                      <span>2s (Fast)</span>
                      <span>5s (Default)</span>
                      <span>15s</span>
                      <span>60s (Slow)</span>
                    </div>
                  </div>

                  {/* Transition Duration (Seconds) */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-300 flex items-center justify-between">
                      <span>Transition Motion Speed</span>
                      <span className="text-indigo-400 font-mono font-bold text-sm">{config.slideshow.transitionDuration}s</span>
                    </label>
                    <input
                      type="range"
                      min={0.3}
                      max={3.0}
                      step={0.1}
                      value={config.slideshow.transitionDuration}
                      onChange={(e) => {
                        onUpdateConfig({
                          ...config,
                          mode: 'slideshow',
                          slideshow: { ...config.slideshow, transitionDuration: parseFloat(e.target.value) }
                        });
                      }}
                      className="w-full accent-indigo-500 bg-neutral-800 rounded-lg cursor-pointer h-2"
                    />
                    <div className="flex items-center justify-between text-[10px] text-neutral-500 font-mono">
                      <span>0.3s (Quick)</span>
                      <span>1.2s (Smooth)</span>
                      <span>3.0s (Ultra Slow)</span>
                    </div>
                  </div>
                </div>

                {/* Transition Animation Style Selector */}
                <div className="space-y-3 pt-2">
                  <label className="text-xs font-bold text-neutral-300">Transition Animation Effect</label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                    {[
                      { id: 'zoom', label: 'Ken Burns (Zoom)', icon: '🌊', desc: 'Pan & Smooth Scale' },
                      { id: 'fade', label: 'Crossfade', icon: '✨', desc: 'Seamless Fade In/Out' },
                      { id: 'slide', label: 'Slide Flow', icon: '↔️', desc: 'Horizontal Shift' },
                      { id: 'blur', label: 'Blur Dissolve', icon: '🌫️', desc: 'Soft Blur Melt' },
                      { id: 'scale-fade', label: 'Scale Fade', icon: '🔍', desc: 'Zoom & Dissolve' }
                    ].map(fx => (
                      <button
                        key={fx.id}
                        type="button"
                        onClick={() => {
                          onUpdateConfig({
                            ...config,
                            mode: 'slideshow',
                            slideshow: { ...config.slideshow, transitionEffect: fx.id as BackgroundTransitionEffect }
                          });
                        }}
                        className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                          config.slideshow.transitionEffect === fx.id
                            ? 'bg-indigo-950/80 border-indigo-500 text-white shadow-lg ring-1 ring-indigo-500'
                            : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-lg">{fx.icon}</span>
                          {config.slideshow.transitionEffect === fx.id && (
                            <Check size={14} className="text-indigo-400" />
                          )}
                        </div>
                        <div className="mt-2">
                          <div className="text-xs font-bold text-white">{fx.label}</div>
                          <div className="text-[10px] text-neutral-400">{fx.desc}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Overlay Darkness Opacity Slider */}
                <div className="space-y-2 pt-2 border-t border-neutral-800/60">
                  <label className="text-xs font-bold text-neutral-300 flex items-center justify-between">
                    <span>Background Darkness Overlay</span>
                    <span className="text-indigo-400 font-mono font-bold text-sm">{Math.round(config.overlayOpacity * 100)}%</span>
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={0.9}
                    step={0.05}
                    value={config.overlayOpacity}
                    onChange={(e) => {
                      onUpdateConfig({
                        ...config,
                        overlayOpacity: parseFloat(e.target.value)
                      });
                    }}
                    className="w-full accent-indigo-500 bg-neutral-800 rounded-lg cursor-pointer h-2"
                  />
                  <p className="text-[11px] text-neutral-400">Darkens background photos so worship lyrics and Bible text stand out clearly.</p>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: ADVANCED GRADIENT */}
          {activeTab === 'gradient' && (
            <div className="space-y-6">
              
              {/* Presets Grid */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                  Worship Theme Presets
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {GRADIENT_PRESETS.map(preset => {
                    const isSelected = config.gradient.presetId === preset.id && config.mode === 'gradient';
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => applyGradientPreset(preset)}
                        className={`p-3 rounded-2xl border text-left relative overflow-hidden transition-all group ${
                          isSelected
                            ? 'border-indigo-500 ring-2 ring-indigo-500 shadow-xl scale-[1.02]'
                            : 'border-neutral-800 hover:border-neutral-600'
                        }`}
                      >
                        <div 
                          className="w-full h-14 rounded-xl mb-2.5 shadow-inner"
                          style={{
                            background: preset.type === 'radial'
                              ? `radial-gradient(circle, ${preset.color1}, ${preset.color2}, ${preset.color3})`
                              : `linear-gradient(${preset.angle}deg, ${preset.color1}, ${preset.color2}, ${preset.color3})`
                          }}
                        />
                        <div className="text-xs font-bold text-white flex items-center justify-between">
                          <span>{preset.name}</span>
                          {isSelected && <Check size={14} className="text-indigo-400" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Advanced Controls */}
              <div className="p-6 bg-neutral-950/80 border border-neutral-800 rounded-3xl space-y-6">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-neutral-800/80 pb-3">
                  <Palette size={16} className="text-indigo-400" />
                  <span>Custom Color & Animation Tuning</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Color Stop 1 */}
                  <div className="space-y-1.5 p-3 rounded-2xl bg-neutral-900 border border-neutral-800">
                    <label className="text-[11px] font-bold text-neutral-400">Color Stop 1</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={config.gradient.color1}
                        onChange={(e) => {
                          onUpdateConfig({
                            ...config,
                            mode: 'gradient',
                            gradient: { ...config.gradient, color1: e.target.value, presetId: undefined }
                          });
                        }}
                        className="w-9 h-9 rounded-xl bg-transparent border-0 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={config.gradient.color1}
                        onChange={(e) => {
                          onUpdateConfig({
                            ...config,
                            mode: 'gradient',
                            gradient: { ...config.gradient, color1: e.target.value, presetId: undefined }
                          });
                        }}
                        className="w-full bg-neutral-950 border border-neutral-800 text-white font-mono text-xs px-2.5 py-1.5 rounded-lg"
                      />
                    </div>
                  </div>

                  {/* Color Stop 2 */}
                  <div className="space-y-1.5 p-3 rounded-2xl bg-neutral-900 border border-neutral-800">
                    <label className="text-[11px] font-bold text-neutral-400">Color Stop 2</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={config.gradient.color2}
                        onChange={(e) => {
                          onUpdateConfig({
                            ...config,
                            mode: 'gradient',
                            gradient: { ...config.gradient, color2: e.target.value, presetId: undefined }
                          });
                        }}
                        className="w-9 h-9 rounded-xl bg-transparent border-0 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={config.gradient.color2}
                        onChange={(e) => {
                          onUpdateConfig({
                            ...config,
                            mode: 'gradient',
                            gradient: { ...config.gradient, color2: e.target.value, presetId: undefined }
                          });
                        }}
                        className="w-full bg-neutral-950 border border-neutral-800 text-white font-mono text-xs px-2.5 py-1.5 rounded-lg"
                      />
                    </div>
                  </div>

                  {/* Color Stop 3 */}
                  <div className="space-y-1.5 p-3 rounded-2xl bg-neutral-900 border border-neutral-800">
                    <label className="text-[11px] font-bold text-neutral-400">Color Stop 3</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={config.gradient.color3}
                        onChange={(e) => {
                          onUpdateConfig({
                            ...config,
                            mode: 'gradient',
                            gradient: { ...config.gradient, color3: e.target.value, presetId: undefined }
                          });
                        }}
                        className="w-9 h-9 rounded-xl bg-transparent border-0 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={config.gradient.color3}
                        onChange={(e) => {
                          onUpdateConfig({
                            ...config,
                            mode: 'gradient',
                            gradient: { ...config.gradient, color3: e.target.value, presetId: undefined }
                          });
                        }}
                        className="w-full bg-neutral-950 border border-neutral-800 text-white font-mono text-xs px-2.5 py-1.5 rounded-lg"
                      />
                    </div>
                  </div>
                </div>

                {/* Gradient Type & Angle */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-300">Gradient Geometry</label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { id: 'linear', label: 'Linear' },
                        { id: 'radial', label: 'Radial' },
                        { id: 'conic', label: 'Conic' },
                        { id: 'mesh', label: 'Mesh Glow' }
                      ].map(g => (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => {
                            onUpdateConfig({
                              ...config,
                              mode: 'gradient',
                              gradient: { ...config.gradient, type: g.id as GradientType }
                            });
                          }}
                          className={`py-2 px-2 text-xs font-bold rounded-xl border text-center transition-all ${
                            config.gradient.type === g.id
                              ? 'bg-indigo-600 border-indigo-500 text-white shadow'
                              : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                          }`}
                        >
                          {g.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {config.gradient.type === 'linear' && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-neutral-300 flex items-center justify-between">
                        <span>Gradient Angle</span>
                        <span className="text-indigo-400 font-mono font-bold">{config.gradient.angle}°</span>
                      </label>
                      <input
                        type="range"
                        min={0}
                        max={360}
                        value={config.gradient.angle}
                        onChange={(e) => {
                          onUpdateConfig({
                            ...config,
                            mode: 'gradient',
                            gradient: { ...config.gradient, angle: parseInt(e.target.value, 10) }
                          });
                        }}
                        className="w-full accent-indigo-500 bg-neutral-800 rounded-lg cursor-pointer h-2"
                      />
                    </div>
                  )}
                </div>

                {/* Animation Type */}
                <div className="space-y-2 pt-2">
                  <label className="text-xs font-bold text-neutral-300">Motion Animation</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { id: 'none', label: 'Static', icon: '🛑', desc: 'Fixed gradient' },
                      { id: 'slow-flow', label: 'Rotating Flow', icon: '🌀', desc: 'Slow smooth rotation' },
                      { id: 'pulse', label: 'Breathing Pulse', icon: '💓', desc: 'Soft opacity pulse' },
                      { id: 'wave', label: 'Shifting Wave', icon: '🌊', desc: 'Dynamic color drift' }
                    ].map(anim => (
                      <button
                        key={anim.id}
                        type="button"
                        onClick={() => {
                          onUpdateConfig({
                            ...config,
                            mode: 'gradient',
                            gradient: { ...config.gradient, animation: anim.id as GradientAnimation }
                          });
                        }}
                        className={`p-3 rounded-2xl border text-left transition-all ${
                          config.gradient.animation === anim.id
                            ? 'bg-indigo-950/80 border-indigo-500 text-white shadow ring-1 ring-indigo-500'
                            : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:text-white'
                        }`}
                      >
                        <div className="text-base mb-1">{anim.icon}</div>
                        <div className="text-xs font-bold text-white">{anim.label}</div>
                        <div className="text-[10px] text-neutral-400">{anim.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 3: VIDEO BACKGROUND */}
          {activeTab === 'video' && (
            <div className="space-y-6">
              
              <div className="p-6 border-2 border-dashed border-neutral-800 hover:border-indigo-500/60 rounded-3xl bg-neutral-950/60 transition-all text-center flex flex-col items-center justify-center space-y-3 group">
                <div className="p-4 rounded-2xl bg-neutral-900 group-hover:bg-indigo-950 text-neutral-400 group-hover:text-indigo-400 transition-all border border-neutral-800">
                  <Film size={28} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Upload Motion Background Video</h4>
                  <p className="text-xs text-neutral-400 mt-1">Select loopable MP4 or WebM video asset</p>
                </div>

                <label className="cursor-pointer px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all active:scale-95 flex items-center gap-2">
                  <Upload size={16} />
                  <span>{isUploading ? 'Uploading Video...' : 'Select Video File'}</span>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleVideoUpload}
                    disabled={isUploading}
                    className="hidden"
                  />
                </label>
              </div>

              {config.video?.url && (
                <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-3xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-2">
                      <Film size={14} className="text-indigo-400" />
                      <span>Active Video: {config.video.name || 'Motion Background'}</span>
                    </span>
                    <button
                      onClick={onClearBackground}
                      className="text-xs text-rose-400 hover:text-white flex items-center gap-1 font-bold"
                    >
                      <Trash2 size={13} />
                      <span>Remove Video</span>
                    </button>
                  </div>
                  <div className="rounded-2xl overflow-hidden aspect-video bg-black max-h-[220px]">
                    <video src={config.video.url} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-800 flex items-center justify-between bg-neutral-950">
          <div className="text-xs text-neutral-400 font-mono">
            {config.mode === 'slideshow' ? `${config.slideshow.images.length} images loaded` : config.mode === 'gradient' ? `Gradient: ${config.gradient.type} (${config.gradient.animation})` : config.mode === 'video' ? `Video mode` : 'No background'}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all active:scale-95"
            >
              Done & Apply
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
