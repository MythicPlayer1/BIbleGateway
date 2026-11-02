"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  X, Image as ImageIcon, Film, Palette, Upload, Trash2, Plus, Minus,
  Sparkles, Sliders, Check, Camera, Video, VideoOff, RefreshCw,
  FlipHorizontal, Eye, Radio, AlertCircle, Layers, Paintbrush
} from "lucide-react";
import { 
  GlobalBackgroundConfig, BackgroundTransitionEffect, GradientType, 
  GradientAnimation, GRADIENT_PRESETS,
  OverlayEffectType, OverlayBlurLevel, OverlayConfig
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
  const [activeTab, setActiveTab] = useState<'slideshow' | 'gradient' | 'video' | 'camera'>('slideshow');
  const [isUploading, setIsUploading] = useState(false);

  // Live Camera Studio State
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [isDetectingDevices, setIsDetectingDevices] = useState(false);
  const [cameraModalError, setCameraModalError] = useState<string | null>(null);
  const [previewTestText, setPreviewTestText] = useState(true);
  const modalCameraStreamRef = useRef<MediaStream | null>(null);
  const modalVideoRef = useRef<HTMLVideoElement | null>(null);

  const stopModalCameraStream = () => {
    if (modalCameraStreamRef.current) {
      modalCameraStreamRef.current.getTracks().forEach(t => t.stop());
      modalCameraStreamRef.current = null;
    }
    if (modalVideoRef.current) {
      modalVideoRef.current.srcObject = null;
    }
  };

  const startModalPreview = async (deviceId?: string) => {
    setIsDetectingDevices(true);
    setCameraModalError(null);
    try {
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        throw new Error("Live camera is not supported in this browser or environment.");
      }

      stopModalCameraStream();

      const targetDeviceId = deviceId !== undefined ? deviceId : config.camera?.deviceId;
      let stream: MediaStream;

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: targetDeviceId ? { deviceId: { exact: targetDeviceId } } : true,
          audio: false
        });
      } catch (err) {
        if (targetDeviceId) {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
          });
        } else {
          throw err;
        }
      }

      modalCameraStreamRef.current = stream;

      if (modalVideoRef.current) {
        modalVideoRef.current.srcObject = stream;
        modalVideoRef.current.play().catch(() => {});
      }

      // Populate camera list with real labels once permission is acquired
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const vDevices = allDevices.filter(d => d.kind === 'videoinput');
      setVideoDevices(vDevices);

      const activeTrack = stream.getVideoTracks()[0];
      const activeLabel = activeTrack?.label || (vDevices[0]?.label || 'Default Camera');
      const activeId = activeTrack?.getSettings()?.deviceId || (vDevices[0]?.deviceId || '');

      if (!config.camera?.deviceId && activeId) {
        onUpdateConfig({
          ...config,
          camera: {
            ...config.camera,
            deviceId: activeId,
            deviceName: activeLabel,
            mirror: config.camera?.mirror ?? false
          }
        });
      }
    } catch (err: any) {
      console.warn("Live camera preview failed:", err);
      const isDenied = err?.name === 'NotAllowedError';
      setCameraModalError(
        isDenied
          ? "Camera permission was denied. Please allow camera access in your browser address bar."
          : err?.message || "Failed to start camera preview."
      );
    } finally {
      setIsDetectingDevices(false);
    }
  };

  // Launch camera preview when camera tab is opened
  useEffect(() => {
    if (!isOpen || activeTab !== 'camera') {
      stopModalCameraStream();
      return;
    }

    startModalPreview(config.camera?.deviceId);

    return () => {
      stopModalCameraStream();
    };
  }, [isOpen, activeTab]);

  // Keep modal video element bound if re-rendered
  useEffect(() => {
    if (activeTab === 'camera' && modalVideoRef.current && modalCameraStreamRef.current) {
      if (modalVideoRef.current.srcObject !== modalCameraStreamRef.current) {
        modalVideoRef.current.srcObject = modalCameraStreamRef.current;
        modalVideoRef.current.play().catch(() => {});
      }
    }
  });

  const handleSelectCameraDevice = async (deviceId: string) => {
    const found = videoDevices.find(d => d.deviceId === deviceId);
    const label = found?.label || 'Selected Camera';

    onUpdateConfig({
      ...config,
      camera: {
        ...config.camera,
        deviceId,
        deviceName: label,
        mirror: config.camera?.mirror ?? false
      }
    });

    await startModalPreview(deviceId);
  };

  const currentOpacity = config.overlay?.opacity !== undefined
    ? config.overlay.opacity
    : (config.overlayOpacity !== undefined ? config.overlayOpacity : 0.4);

  const updateOverlay = (patch: Partial<OverlayConfig>) => {
    const newOpacity = patch.opacity !== undefined ? Math.min(1, Math.max(0, patch.opacity)) : currentOpacity;
    onUpdateConfig({
      ...config,
      overlayOpacity: newOpacity,
      overlay: {
        opacity: newOpacity,
        color: patch.color !== undefined ? patch.color : (config.overlay?.color || '#000000'),
        type: patch.type !== undefined ? patch.type : (config.overlay?.type || 'uniform'),
        blur: patch.blur !== undefined ? patch.blur : (config.overlay?.blur || 'none')
      }
    });
  };

  const renderOpacityControlSection = () => {
    const activeColor = config.overlay?.color || '#000000';
    const activeType: OverlayEffectType = config.overlay?.type || 'uniform';
    const activeBlur: OverlayBlurLevel = config.overlay?.blur || 'none';

    return (
      <div className="p-5 bg-neutral-950/80 border border-neutral-800 rounded-3xl space-y-5">
        {/* Header & Live Percentage with Steppers */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800/80 pb-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-0.5">
              <h5 className="text-sm font-bold text-white flex items-center gap-2">
                <Sliders size={16} className="text-indigo-400" />
                <span>Universal Background Opacity & Contrast Treatment</span>
              </h5>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-950/80 border border-indigo-500/40 text-indigo-300 text-[10px] font-bold uppercase tracking-wider">
                Applies To: {config.mode === 'slideshow' ? '📸 Slideshow' : config.mode === 'gradient' ? '🎨 Gradient' : config.mode === 'video' ? '🎥 Video' : config.mode === 'camera' ? '📹 Live Camera' : 'Display Screen'}
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              Active across all background modes: fine-tune dimming level, shading masks, color tint, and soft-focus blur
            </p>
          </div>

          <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 rounded-2xl p-1.5 self-start sm:self-auto shadow-inner">
            <button
              type="button"
              onClick={() => updateOverlay({ opacity: Math.max(0, Number((currentOpacity - 0.05).toFixed(2))) })}
              className="w-7 h-7 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white flex items-center justify-center font-bold text-sm transition-all"
              title="Decrease dimming by 5%"
            >
              <Minus size={13} />
            </button>
            <span className="font-mono font-black text-sm text-indigo-400 px-2 min-w-[56px] text-center">
              {Math.round(currentOpacity * 100)}%
            </span>
            <button
              type="button"
              onClick={() => updateOverlay({ opacity: Math.min(1, Number((currentOpacity + 0.05).toFixed(2))) })}
              className="w-7 h-7 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white flex items-center justify-center font-bold text-sm transition-all"
              title="Increase dimming by 5%"
            >
              <Plus size={13} />
            </button>
          </div>
        </div>

        {/* Granular Slider & 7 Quick Presets */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-neutral-400 font-medium">
            <span>0% (Raw / Transparent)</span>
            <span className="text-indigo-400 font-mono text-[11px] font-bold">Standard Worship Range: 35% – 60%</span>
            <span>100% (Solid Blackout)</span>
          </div>

          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={currentOpacity}
            onChange={(e) => updateOverlay({ opacity: parseFloat(e.target.value) })}
            className="w-full accent-indigo-500 cursor-pointer h-2.5 bg-neutral-800 rounded-lg"
          />

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[11px] font-bold text-neutral-400 mr-1 uppercase tracking-wider">Presets:</span>
            {[
              { label: '0% Clear', val: 0 },
              { label: '15% Subtle', val: 0.15 },
              { label: '30% Soft', val: 0.30 },
              { label: '45% Balanced', val: 0.45 },
              { label: '60% Contrast', val: 0.60 },
              { label: '75% Deep Focus', val: 0.75 },
              { label: '90% Max Dark', val: 0.90 }
            ].map(p => (
              <button
                key={p.val}
                type="button"
                onClick={() => updateOverlay({ opacity: p.val })}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                  Math.abs(currentOpacity - p.val) < 0.03
                    ? 'bg-indigo-950 border-indigo-500 text-indigo-300 shadow-md ring-1 ring-indigo-500 scale-[1.02]'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Three Columns: Shading Mask + Tint Color + Soft Focus Blur */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-neutral-800/80">
          
          {/* 1. Shading Mask Style */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block flex items-center gap-1.5">
              <Layers size={13} className="text-indigo-400" />
              <span>Shading Mask Layout</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'uniform' as const, label: 'Full Screen', icon: '⬛', desc: 'Even dimming' },
                { id: 'lower-third' as const, label: 'Lower Third', icon: '🌅', desc: 'Bottom fade' },
                { id: 'vignette' as const, label: 'Vignette', icon: '🎯', desc: 'Edge shadow' },
                { id: 'top-bottom' as const, label: 'Dual Bars', icon: '↕️', desc: 'Top/Bottom' }
              ].map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => updateOverlay({ type: m.id })}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    activeType === m.id
                      ? 'bg-indigo-950/80 border-indigo-500 text-white shadow ring-1 ring-indigo-500'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  <div className="text-sm">{m.icon}</div>
                  <div className="text-xs font-bold text-white mt-0.5">{m.label}</div>
                  <div className="text-[10px] text-neutral-400">{m.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Overlay Tint Color */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block flex items-center gap-1.5">
              <Paintbrush size={13} className="text-indigo-400" />
              <span>Overlay Tint Tone</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { color: '#000000', label: 'Pitch Black' },
                { color: '#030712', label: 'Midnight Navy' },
                { color: '#090924', label: 'Deep Indigo' },
                { color: '#18100c', label: 'Warm Charcoal' },
                { color: '#180520', label: 'Royal Plum' },
                { color: '#03140c', label: 'Emerald Deep' }
              ].map(t => (
                <button
                  key={t.color}
                  type="button"
                  onClick={() => updateOverlay({ color: t.color })}
                  className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all ${
                    activeColor.toLowerCase() === t.color.toLowerCase()
                      ? 'bg-indigo-950/80 border-indigo-500 text-white shadow ring-1 ring-indigo-500'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-white/25 shrink-0 shadow-sm"
                    style={{ backgroundColor: t.color }}
                  />
                  <span className="text-xs font-bold truncate text-neutral-200">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Soft Focus Blur */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block flex items-center gap-1.5">
              <Sparkles size={13} className="text-indigo-400" />
              <span>Soft Focus Blur (Glass)</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'none' as const, label: 'Off (Crisp)', desc: 'Zero blur' },
                { id: 'subtle' as const, label: 'Subtle (4px)', desc: 'Soft edges' },
                { id: 'medium' as const, label: 'Medium (9px)', desc: 'Dreamy soft' },
                { id: 'heavy' as const, label: 'Heavy (16px)', desc: 'Frosted glass' }
              ].map(b => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => updateOverlay({ blur: b.id })}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    activeBlur === b.id
                      ? 'bg-indigo-950/80 border-indigo-500 text-white shadow ring-1 ring-indigo-500'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  <div className="text-xs font-bold text-white">{b.label}</div>
                  <div className="text-[10px] text-neutral-400 mt-0.5">{b.desc}</div>
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    );
  };

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
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-6xl xl:max-w-7xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden">
        
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

            <button
              onClick={() => {
                setActiveTab('camera');
                onUpdateConfig({ ...config, mode: 'camera' });
              }}
              className={`flex items-center gap-2 px-5 py-3 rounded-t-2xl font-bold text-xs md:text-sm transition-all border-t border-x ${
                activeTab === 'camera'
                  ? 'bg-neutral-900 border-neutral-800 text-indigo-400 border-b-transparent shadow-lg'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'
              }`}
            >
              <Camera size={18} />
              <span>Live Camera Feed</span>
            </button>

            {/* Current Active Mode Badge */}
            <div className="ml-auto flex items-center gap-2 pb-2">
              <span className="text-xs text-neutral-400">Active Mode:</span>
              <span className="px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold uppercase tracking-wider">
                {config.mode === 'slideshow' ? '📸 Image Slideshow' : config.mode === 'gradient' ? '🎨 Animated Gradient' : config.mode === 'video' ? '🎥 Video' : config.mode === 'camera' ? '📹 Live Camera' : '🚫 None'}
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

          {/* TAB 4: LIVE CAMERA FEED (WEBCAM / HDMI CAPTURE / OBS) */}
          {activeTab === 'camera' && (
            <div className="space-y-6">
              
              {/* Device Selector & Hardware Controls */}
              <div className="p-5 bg-neutral-950/70 border border-neutral-800 rounded-3xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 rounded-xl bg-indigo-950/80 border border-indigo-500/30 text-indigo-400">
                      <Camera size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>Live Video Input Device</span>
                        {config.mode === 'camera' && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30 uppercase tracking-wider">
                            Active On Projector
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-neutral-400">Select webcam, HDMI capture card (Cam Link), or OBS Virtual Camera</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => startModalPreview()}
                      disabled={isDetectingDevices}
                      className="px-3 py-2 text-xs font-bold rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 flex items-center gap-1.5 transition-all"
                      title="Rescan camera devices"
                    >
                      <RefreshCw size={13} className={isDetectingDevices ? "animate-spin" : ""} />
                      <span>{isDetectingDevices ? "Detecting..." : "Rescan Devices"}</span>
                    </button>

                    {config.mode !== 'camera' ? (
                      <button
                        type="button"
                        onClick={() => {
                          onUpdateConfig({
                            ...config,
                            mode: 'camera',
                            camera: {
                              ...config.camera,
                              deviceId: config.camera?.deviceId || (videoDevices[0]?.deviceId || ''),
                              deviceName: config.camera?.deviceName || (videoDevices[0]?.label || 'Default Camera'),
                              mirror: config.camera?.mirror ?? false
                            }
                          });
                        }}
                        className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg transition-all active:scale-95 flex items-center gap-1.5"
                      >
                        <Radio size={14} className="animate-pulse" />
                        <span>Go Live With Camera</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={onClearBackground}
                        className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-500/30 text-rose-300 hover:text-white transition-all"
                      >
                        Turn Off Camera
                      </button>
                    )}
                  </div>
                </div>

                {/* Device Dropdown & Orientation */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                  <div className="md:col-span-2">
                    <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-1.5">
                      Select Video Source
                    </label>
                    <select
                      value={config.camera?.deviceId || ''}
                      onChange={(e) => handleSelectCameraDevice(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-xs font-medium focus:outline-none focus:border-indigo-500"
                    >
                      {videoDevices.length > 0 ? (
                        videoDevices.map((d, idx) => (
                          <option key={d.deviceId || idx} value={d.deviceId}>
                            {d.label || `Camera ${idx + 1} (${d.deviceId.slice(0, 8)}...)`}
                          </option>
                        ))
                      ) : (
                        <option value="">Default System Camera</option>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-1.5">
                      Orientation
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        onUpdateConfig({
                          ...config,
                          camera: {
                            ...config.camera,
                            mirror: !config.camera?.mirror
                          }
                        });
                      }}
                      className={`w-full py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                        config.camera?.mirror
                          ? 'bg-indigo-950/80 border-indigo-500 text-indigo-300'
                          : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:text-white'
                      }`}
                    >
                      <FlipHorizontal size={15} />
                      <span>{config.camera?.mirror ? 'Mirrored (Flipped)' : 'Normal (Standard)'}</span>
                    </button>
                  </div>
                </div>

                {cameraModalError && (
                  <div className="p-3 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle size={16} className="shrink-0 text-rose-400" />
                    <span>{cameraModalError}</span>
                  </div>
                )}
              </div>

              {/* Live Preview Container with Simulated Overlay */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>Interactive Camera & Lyric Readability Preview</span>
                  </span>

                  <button
                    type="button"
                    onClick={() => setPreviewTestText(!previewTestText)}
                    className={`text-xs px-2.5 py-1 rounded-lg border flex items-center gap-1.5 transition-all ${
                      previewTestText
                        ? 'bg-indigo-950 border-indigo-500/40 text-indigo-300'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-400'
                    }`}
                  >
                    <Eye size={13} />
                    <span>{previewTestText ? "Sample Lyric Overlay: ON" : "Sample Lyric Overlay: OFF"}</span>
                  </button>
                </div>

                <div className="relative rounded-3xl overflow-hidden aspect-video bg-black border border-neutral-800 shadow-2xl flex items-center justify-center max-h-[480px]">
                  {/* Camera Video Stream */}
                  <video
                    ref={modalVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover transition-transform duration-300 ${
                      config.camera?.mirror ? 'scale-x-[-1]' : 'scale-x-100'
                    }`}
                  />

                  {/* Dynamic Opacity & Contrast Dimming Filter */}
                  <div
                    className={`absolute inset-0 pointer-events-none transition-all duration-200 ${
                      (config.overlay?.blur || 'none') === 'subtle' ? 'backdrop-blur-[4px]'
                      : (config.overlay?.blur || 'none') === 'medium' ? 'backdrop-blur-[9px]'
                      : (config.overlay?.blur || 'none') === 'heavy' ? 'backdrop-blur-[16px]'
                      : ''
                    }`}
                    style={{
                      background: (config.overlay?.type || 'uniform') === 'lower-third'
                        ? `linear-gradient(to top, ${config.overlay?.color || '#000000'} 0%, ${config.overlay?.color || '#000000'} 50%, transparent 95%)`
                        : (config.overlay?.type || 'uniform') === 'vignette'
                        ? `radial-gradient(ellipse at center, transparent 25%, ${config.overlay?.color || '#000000'} 100%)`
                        : (config.overlay?.type || 'uniform') === 'top-bottom'
                        ? `linear-gradient(to bottom, ${config.overlay?.color || '#000000'} 0%, transparent 35%, transparent 65%, ${config.overlay?.color || '#000000'} 100%)`
                        : (config.overlay?.color || '#000000'),
                      opacity: currentOpacity
                    }}
                  />

                  {/* Sample Church Lyrics / Scripture Overlay for Realtime Legibility Testing */}
                  {previewTestText && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center select-none pointer-events-none animate-in fade-in duration-200">
                      <div className="max-w-2xl space-y-2">
                        <div className="inline-block px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[11px] font-bold tracking-widest uppercase mb-1 shadow-lg backdrop-blur-sm">
                          भजनसंग्रह २३:१ • PSALM 23:1
                        </div>
                        <h3 className="text-xl md:text-2xl font-black text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)] tracking-tight leading-snug">
                          प्रभु मेरो गोठालो हुनुहुन्छ, मलाई केहीको अभाव हुनेछैन।
                        </h3>
                        <p className="text-xs md:text-sm text-neutral-200 font-medium drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
                          "The Lord is my shepherd; I shall not want."
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Live Feed Status Pill */}
                  <div className="absolute top-3 left-3 z-20 px-3 py-1 rounded-full bg-black/75 border border-white/10 backdrop-blur-md text-[11px] font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>LIVE CAMERA FEED</span>
                    <span className="text-neutral-400 font-mono text-[10px]">
                      {config.camera?.mirror ? '(Mirrored)' : ''}
                    </span>
                  </div>

                  {/* Dimming Level Pill */}
                  <div className="absolute bottom-3 right-3 z-20 px-2.5 py-1 rounded-full bg-black/80 border border-white/10 backdrop-blur-md text-[11px] font-mono text-indigo-300">
                    Dimming: {Math.round(currentOpacity * 100)}% • {config.overlay?.type || 'uniform'}
                  </div>
                </div>
              </div>

              {/* Hardware Guide & Setup Tips */}
              <div className="p-5 rounded-3xl bg-neutral-950/40 border border-neutral-800/80 space-y-2.5">
                <h5 className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-2">
                  <span>💡</span>
                  <span>Sanctuary Camera Setup Options</span>
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-neutral-400">
                  <div className="p-3 rounded-2xl bg-neutral-900/40 border border-neutral-800/60">
                    <span className="font-bold text-white block mb-0.5">🎥 HDMI Capture Card</span>
                    <span>Connect DSLR/Camcorder via Elgato Cam Link or USB HDMI card. Recognized natively by your browser.</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-neutral-900/40 border border-neutral-800/60">
                    <span className="font-bold text-white block mb-0.5">🎛️ OBS Virtual Camera</span>
                    <span>In OBS Studio, click "Start Virtual Camera" to route your live mixed camera feed directly into this background!</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-neutral-900/40 border border-neutral-800/60">
                    <span className="font-bold text-white block mb-0.5">🎙️ Lower Thirds</span>
                    <span>Use the <strong>Lower Third</strong> slide layout in Schedule to overlay words across the lower portion of the live stage feed!</span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* UNIVERSAL MASTER OPACITY & SHADING SUITE (Always shown across ALL background studio modes) */}
          <div className="pt-2">
            {renderOpacityControlSection()}
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-800 flex items-center justify-between bg-neutral-950">
          <div className="text-xs text-neutral-400 font-mono">
            {config.mode === 'slideshow' ? `${config.slideshow.images.length} images loaded` : config.mode === 'gradient' ? `Gradient: ${config.gradient.type} (${config.gradient.animation})` : config.mode === 'video' ? `Video mode` : config.mode === 'camera' ? `Live Camera (${config.camera?.deviceName || 'Active'})` : 'No background'}
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
