"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sliders, X, Type, Palette, Sparkles, ShieldCheck, 
  RotateCcw, AlignCenter, AlignLeft, AlignRight, Check
} from "lucide-react";
import type { 
  ProjectorDisplayConfig, TextShadowPreset, DisplayFontFamily 
} from "@/lib/lyrics";
import { 
  DEFAULT_DISPLAY_CONFIG, getTextShadowCss, getFontFamilyCss 
} from "@/lib/lyrics";

interface DisplaySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  displayConfig: ProjectorDisplayConfig;
  onUpdateDisplayConfig: (config: ProjectorDisplayConfig) => void;
}

const COLOR_PRESETS = [
  { name: "Pure White", hex: "#FFFFFF", desc: "Standard crisp white" },
  { name: "Warm Cream", hex: "#FEF3C7", desc: "Gentle warm tone" },
  { name: "Holy Gold", hex: "#FDE047", desc: "Vibrant worship gold" },
  { name: "Soft Cyan", hex: "#A5F3FC", desc: "Cool serene cyan" },
  { name: "Vibrant Rose", hex: "#FDA4AF", desc: "Warm soft rose" },
  { name: "Neon Emerald", hex: "#6EE7B7", desc: "Fresh vibrant green" },
  { name: "Electric Violet", hex: "#C4B5FD", desc: "Modern violet tone" },
  { name: "Crisp Slate", hex: "#E2E8F0", desc: "Neutral subtle gray" }
];

const SHADOW_PRESETS: { id: TextShadowPreset; label: string; desc: string }[] = [
  { id: "strong", label: "🛡️ Strong Contrast", desc: "Best for video & bright backgrounds" },
  { id: "deep", label: "🌟 Deep 3D Shadow", desc: "Multi-layer deep drop shadow" },
  { id: "glow", label: "✨ Ambient Glow", desc: "Soft subtle neon illumination" },
  { id: "outline", label: "🔲 Solid Outline", desc: "Crisp black outer stroke" },
  { id: "subtle", label: "☁️ Subtle Shadow", desc: "Soft minimal drop shadow" },
  { id: "none", label: "🚫 Flat / No Shadow", desc: "Clean flat typography" }
];

const FONT_PRESETS: { id: DisplayFontFamily; label: string; preview: string }[] = [
  { id: "default", label: "System Modern Sans", preview: "मेरो हृदयले तपाईंलाई खोज्दछ" },
  { id: "inter", label: "Inter Crisp Sans", preview: "मेरो हृदयले तपाईंलाई खोज्दछ" },
  { id: "poppins", label: "Poppins / Display", preview: "मेरो हृदयले तपाईंलाई खोज्दछ" },
  { id: "serif", label: "Classic Serif", preview: "मेरो हृदयले तपाईंलाई खोज्दछ" },
  { id: "mono", label: "Monospace", preview: "मेरो हृदयले तपाईंलाई खोज्दछ" }
];

export const DisplaySettingsModal: React.FC<DisplaySettingsModalProps> = ({
  isOpen,
  onClose,
  displayConfig = DEFAULT_DISPLAY_CONFIG,
  onUpdateDisplayConfig
}) => {
  const [config, setConfig] = useState<ProjectorDisplayConfig>(displayConfig);

  useEffect(() => {
    setConfig(displayConfig);
  }, [displayConfig]);

  if (!isOpen) return null;

  const updateConfig = (newCfg: ProjectorDisplayConfig) => {
    setConfig(newCfg);
    onUpdateDisplayConfig(newCfg);
  };

  const handleReset = () => {
    updateConfig(DEFAULT_DISPLAY_CONFIG);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-2xl bg-[#121214] border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800/80 bg-neutral-900/40">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
                <Sliders size={18} />
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  Projector Display & Typography
                </h3>
                <p className="text-[11px] text-neutral-400">
                  Customize text size, colors, shadow contrast & prevent overflow
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-1 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded-xl text-xs font-bold transition-all border border-neutral-700/80"
                title="Reset all settings to default"
              >
                <RotateCcw size={12} />
                <span>Reset</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-xl transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            {/* Live Interactive Preview Box */}
            <div className="relative rounded-2xl bg-black/90 border border-neutral-800 p-6 flex flex-col items-center justify-center min-h-[140px] overflow-hidden shadow-inner">
              <div className="absolute top-2.5 left-3 text-[10px] font-mono text-indigo-400 uppercase tracking-widest opacity-80 flex items-center gap-1.5">
                <Sparkles size={11} />
                <span>Live Projector Preview</span>
              </div>

              <div 
                className="w-full text-center transition-all duration-100"
                style={{
                  color: config.textColor,
                  fontFamily: getFontFamilyCss(config.fontFamily),
                  fontSize: `clamp(18px, ${2.2 * config.fontSizeScale}vw, ${54 * config.fontSizeScale}px)`,
                  textShadow: getTextShadowCss(config.textShadow),
                  lineHeight: config.lineHeight,
                  textAlign: config.textAlign,
                  fontWeight: config.textWeight === "black" ? 900 : config.textWeight === "bold" ? 700 : 500
                }}
              >
                <p className="font-bold leading-tight">
                  मेरो हृदयले तपाईंलाई खोज्दछ
                </p>
                <p className="text-xs opacity-75 mt-1 font-medium">
                  Mero Hridayale Tapailai Khojchha • Psalm 42:1
                </p>
              </div>

              {config.autoFit && (
                <div className="absolute bottom-2 right-3 flex items-center gap-1 text-[9px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/40">
                  <ShieldCheck size={10} />
                  <span>Auto-Fit Guard Active</span>
                </div>
              )}
            </div>

            {/* 1. Font Size Scale */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                  <Type size={14} className="text-indigo-400" />
                  <span>Font Size Scale ({Math.round(config.fontSizeScale * 100)}%)</span>
                </label>
                <div className="flex items-center gap-1">
                  {[
                    { label: "Small (80%)", scale: 0.8 },
                    { label: "Default (100%)", scale: 1.0 },
                    { label: "Large (125%)", scale: 1.25 },
                    { label: "X-Large (150%)", scale: 1.5 }
                  ].map((preset) => (
                    <button
                      key={preset.scale}
                      type="button"
                      onClick={() => updateConfig({ ...config, fontSizeScale: preset.scale })}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                        config.fontSizeScale === preset.scale
                          ? "bg-indigo-600 text-white"
                          : "bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 border border-neutral-800"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0.6"
                  max="1.8"
                  step="0.05"
                  value={config.fontSizeScale}
                  onChange={(e) => updateConfig({ ...config, fontSizeScale: parseFloat(e.target.value) })}
                  className="w-full accent-indigo-500 cursor-pointer h-2 bg-neutral-800 rounded-lg"
                />
              </div>
            </div>

            {/* 2. Text Color Palette */}
            <div className="space-y-2.5">
              <label className="text-xs font-black uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                <Palette size={14} className="text-indigo-400" />
                <span>Text Color</span>
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {COLOR_PRESETS.map((col) => (
                  <button
                    key={col.hex}
                    type="button"
                    onClick={() => updateConfig({ ...config, textColor: col.hex })}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all ${
                      config.textColor.toLowerCase() === col.hex.toLowerCase()
                        ? "bg-indigo-950/70 border-indigo-500 shadow-md ring-1 ring-indigo-500/40"
                        : "bg-neutral-900/80 border-neutral-800 hover:bg-neutral-850 hover:border-neutral-700"
                    }`}
                  >
                    <span 
                      className="w-5 h-5 rounded-lg border border-white/20 shrink-0 shadow-sm"
                      style={{ backgroundColor: col.hex }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-white truncate">{col.name}</p>
                      <p className="text-[10px] text-neutral-400 font-mono truncate">{col.hex}</p>
                    </div>
                    {config.textColor.toLowerCase() === col.hex.toLowerCase() && (
                      <Check size={13} className="text-indigo-400 shrink-0" />
                    )}
                  </button>
                ))}
              </div>

              {/* Custom Hex Color Picker */}
              <div className="flex items-center gap-3 pt-1">
                <span className="text-xs text-neutral-400 font-medium">Custom Color:</span>
                <input
                  type="color"
                  value={config.textColor}
                  onChange={(e) => updateConfig({ ...config, textColor: e.target.value })}
                  className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border border-neutral-700"
                />
                <input
                  type="text"
                  value={config.textColor}
                  onChange={(e) => updateConfig({ ...config, textColor: e.target.value })}
                  placeholder="#FFFFFF"
                  className="w-28 bg-neutral-900 border border-neutral-700 rounded-xl px-2.5 py-1 text-xs text-white font-mono uppercase focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            {/* 3. Text Contrast & Shadow Presets */}
            <div className="space-y-2.5">
              <label className="text-xs font-black uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                <Sparkles size={14} className="text-indigo-400" />
                <span>Text Contrast & Drop Shadow</span>
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {SHADOW_PRESETS.map((sh) => (
                  <button
                    key={sh.id}
                    type="button"
                    onClick={() => updateConfig({ ...config, textShadow: sh.id })}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      config.textShadow === sh.id
                        ? "bg-indigo-950/70 border-indigo-500 shadow-md ring-1 ring-indigo-500/40"
                        : "bg-neutral-900/80 border-neutral-800 hover:bg-neutral-850 hover:border-neutral-700"
                    }`}
                  >
                    <p className="text-xs font-bold text-white">{sh.label}</p>
                    <p className="text-[10px] text-neutral-400 mt-0.5 line-clamp-1">{sh.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Font Family & Alignment */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Font Family */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-neutral-300">
                  Font Family
                </label>
                <div className="space-y-1.5">
                  {FONT_PRESETS.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => updateConfig({ ...config, fontFamily: f.id })}
                      className={`w-full px-3 py-2 rounded-xl text-left border text-xs flex items-center justify-between transition-all ${
                        config.fontFamily === f.id
                          ? "bg-indigo-600 text-white font-bold border-indigo-500 shadow-sm"
                          : "bg-neutral-900 border-neutral-800 text-neutral-300 hover:bg-neutral-850"
                      }`}
                    >
                      <span>{f.label}</span>
                      {config.fontFamily === f.id && <Check size={13} />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Alignment & Line Spacing */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-wider text-neutral-300">
                    Text Alignment
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 bg-neutral-900 p-1 rounded-xl border border-neutral-800">
                    {[
                      { id: "left", label: "Left", icon: AlignLeft },
                      { id: "center", label: "Center", icon: AlignCenter },
                      { id: "right", label: "Right", icon: AlignRight }
                    ].map((align) => {
                      const Icon = align.icon;
                      return (
                        <button
                          key={align.id}
                          type="button"
                          onClick={() => updateConfig({ ...config, textAlign: align.id as any })}
                          className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            config.textAlign === align.id
                              ? "bg-indigo-600 text-white shadow-sm"
                              : "text-neutral-400 hover:text-white"
                          }`}
                        >
                          <Icon size={13} />
                          <span>{align.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Line Spacing */}
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-wider text-neutral-300">
                    Line Height / Spacing
                  </label>
                  <div className="grid grid-cols-4 gap-1">
                    {[
                      { label: "1.1x", val: 1.1 },
                      { label: "1.25x", val: 1.25 },
                      { label: "1.4x", val: 1.4 },
                      { label: "1.6x", val: 1.6 }
                    ].map((lh) => (
                      <button
                        key={lh.val}
                        type="button"
                        onClick={() => updateConfig({ ...config, lineHeight: lh.val })}
                        className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                          config.lineHeight === lh.val
                            ? "bg-indigo-600 text-white"
                            : "bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white"
                        }`}
                      >
                        {lh.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 5. Auto-Fit & Overflow Protection (Guaranteed No Overflow) */}
            <div className="p-4 bg-gradient-to-r from-emerald-950/40 via-neutral-900 to-neutral-900 border border-emerald-500/30 rounded-2xl flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-emerald-600/20 text-emerald-400 rounded-xl border border-emerald-500/30 shrink-0 mt-0.5">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>Auto-Fit Overflow Protection</span>
                    <span className="px-1.5 py-0.2 bg-emerald-900/80 text-emerald-300 text-[9px] rounded font-bold uppercase">
                      Recommended
                    </span>
                  </h4>
                  <p className="text-[11px] text-neutral-400 leading-snug mt-0.5">
                    Guarantees text will never clip, cut off, or overflow off-screen on any projector, TV, or display resolution.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => updateConfig({ ...config, autoFit: !config.autoFit })}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  config.autoFit ? "bg-emerald-600" : "bg-neutral-700"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    config.autoFit ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="px-6 py-4 border-t border-neutral-800/80 bg-neutral-900/40 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
            >
              Done & Save
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
