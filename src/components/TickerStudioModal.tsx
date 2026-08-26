"use client";

import React from "react";
import { motion } from "framer-motion";
import { Megaphone, X } from "lucide-react";
import { 
  type TickerConfig, 
  type TickerTheme, 
  type TickerSpeed, 
  type TickerFontSize,
  QUICK_TICKER_PRESETS 
} from "@/lib/lyrics";

interface TickerStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  tickerConfig: TickerConfig;
  onUpdateTickerText: (text: string) => void;
  onUpdateTickerBadge: (badge: string) => void;
  onToggleTickerBadge: () => void;
  onUpdateTickerTheme: (theme: TickerTheme) => void;
  onUpdateTickerPosition: (position: 'bottom' | 'top') => void;
  onUpdateTickerSpeed: (speed: TickerSpeed) => void;
  onUpdateTickerFontSize: (size: TickerFontSize) => void;
  onApplyTickerPreset: (preset: typeof QUICK_TICKER_PRESETS[0]) => void;
  onToggleTicker: () => void;
}

export const TickerStudioModal: React.FC<TickerStudioModalProps> = ({
  isOpen,
  onClose,
  tickerConfig,
  onUpdateTickerText,
  onUpdateTickerBadge,
  onToggleTickerBadge,
  onUpdateTickerTheme,
  onUpdateTickerPosition,
  onUpdateTickerSpeed,
  onUpdateTickerFontSize,
  onApplyTickerPreset,
  onToggleTicker
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 md:p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-neutral-950 border border-neutral-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl my-auto"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-950/80 border border-amber-500/40 text-amber-400 flex items-center justify-center shadow-inner">
              <Megaphone size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm md:text-base text-white flex items-center gap-2">
                <span>Live Notice Ticker Studio</span>
              </h3>
              <p className="text-[11px] text-neutral-400">Broadcast scrolling announcements across the projector screen</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 border ${
              tickerConfig.enabled 
                ? 'bg-amber-950/90 text-amber-300 border-amber-500 ring-2 ring-amber-500/30' 
                : 'bg-neutral-900 text-neutral-400 border-neutral-700'
            }`}>
              <span className={`w-2 h-2 rounded-full ${tickerConfig.enabled ? 'bg-amber-400 animate-ping' : 'bg-neutral-500'}`}></span>
              <span>{tickerConfig.enabled ? 'ON AIR' : 'STANDBY'}</span>
            </span>
            <button onClick={onClose} className="text-neutral-400 hover:text-white p-1.5 rounded-lg hover:bg-neutral-800 transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-5 md:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* 1. Live Animated Preview Strip */}
          <div>
            <label className="block text-[11px] font-bold text-neutral-400 uppercase mb-1.5 flex items-center justify-between">
              <span>Live Projector Preview</span>
              <span className="text-[10px] text-neutral-500 lowercase">speed: {tickerConfig.speed} • pos: {tickerConfig.position}</span>
            </label>
            <div className="p-3 bg-black rounded-2xl border border-neutral-800 overflow-hidden relative shadow-inner">
              <div className="flex items-center gap-3">
                {tickerConfig.showBadge && (
                  <span className={`px-2 py-0.5 rounded-full font-black text-[10px] uppercase tracking-wider shrink-0 ${
                    tickerConfig.theme === 'emerald' ? 'bg-emerald-500 text-black' :
                    tickerConfig.theme === 'cyan' ? 'bg-cyan-500 text-black' :
                    tickerConfig.theme === 'rose' ? 'bg-rose-500 text-white' :
                    tickerConfig.theme === 'indigo' ? 'bg-indigo-500 text-white' :
                    tickerConfig.theme === 'white' ? 'bg-white text-black' :
                    'bg-amber-500 text-black'
                  }`}>
                    {tickerConfig.badgeLabel || 'NOTICE'}
                  </span>
                )}
                <div className="overflow-hidden whitespace-nowrap flex-1">
                  <div 
                    className={`inline-block animate-marquee font-bold tracking-wide ${
                      tickerConfig.theme === 'emerald' ? 'text-emerald-300' :
                      tickerConfig.theme === 'cyan' ? 'text-cyan-300' :
                      tickerConfig.theme === 'rose' ? 'text-rose-300' :
                      tickerConfig.theme === 'indigo' ? 'text-indigo-200' :
                      tickerConfig.theme === 'white' ? 'text-white' :
                      'text-amber-300'
                    }`}
                    style={{
                      animationDuration: tickerConfig.speed === 'slow' ? '36s' : tickerConfig.speed === 'fast' ? '14s' : tickerConfig.speed === 'vfast' ? '8s' : '22s',
                      fontSize: tickerConfig.fontSize === 'sm' ? '12px' : tickerConfig.fontSize === 'lg' ? '17px' : tickerConfig.fontSize === 'xl' ? '20px' : '14px'
                    }}
                  >
                    {tickerConfig.text || "Type your notice message..."} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; {tickerConfig.text || "Type your notice message..."}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. 1-Click Church Quick Presets */}
          <div>
            <label className="block text-[11px] font-bold text-neutral-400 uppercase mb-1.5">
              ⚡ 1-Click Church Presets
            </label>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_TICKER_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onApplyTickerPreset(preset)}
                  className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded-lg text-xs font-semibold border border-neutral-800 transition-all hover:border-amber-500/40 text-left active:scale-95"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Notice Message Textarea */}
          <div>
            <label className="block text-[11px] font-bold text-neutral-400 uppercase mb-1.5">
              Notice Message (Nepali / English)
            </label>
            <textarea
              rows={2}
              value={tickerConfig.text}
              onChange={(e) => onUpdateTickerText(e.target.value)}
              placeholder="Type notice message here..."
              className="w-full bg-neutral-900 border border-neutral-700 rounded-xl p-3 text-xs md:text-sm text-white outline-none focus:ring-2 focus:ring-amber-500 font-medium"
            />
          </div>

          {/* 4. Badge Settings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-neutral-900/60 border border-neutral-800/80 rounded-xl">
            <div>
              <label className="block text-[11px] font-bold text-neutral-400 uppercase mb-1">Badge Text</label>
              <input
                type="text"
                value={tickerConfig.badgeLabel}
                onChange={(e) => onUpdateTickerBadge(e.target.value)}
                placeholder="e.g. NOTICE / सूचना / स्वागतम्"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div className="flex items-center justify-between pt-2 sm:pt-0 sm:self-center">
              <div>
                <span className="text-xs font-bold text-neutral-300 block">Show Badge</span>
                <span className="text-[10px] text-neutral-500">Display pill tag on ticker</span>
              </div>
              <button
                type="button"
                onClick={onToggleTickerBadge}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border ${
                  tickerConfig.showBadge
                    ? 'bg-amber-600 border-amber-400 text-white'
                    : 'bg-neutral-800 border-neutral-700 text-neutral-400'
                }`}
              >
                {tickerConfig.showBadge ? 'Enabled' : 'Disabled'}
              </button>
            </div>
          </div>

          {/* 5. Customization Options (Color Theme, Position, Speed, Size) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Color Theme */}
            <div>
              <label className="block text-[11px] font-bold text-neutral-400 uppercase mb-1.5">Color Theme</label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'amber', label: 'Amber', color: 'bg-amber-500' },
                  { id: 'emerald', label: 'Emerald', color: 'bg-emerald-500' },
                  { id: 'cyan', label: 'Cyan', color: 'bg-cyan-500' },
                  { id: 'rose', label: 'Rose', color: 'bg-rose-500' },
                  { id: 'indigo', label: 'Indigo', color: 'bg-indigo-500' },
                  { id: 'white', label: 'White', color: 'bg-white' }
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => onUpdateTickerTheme(t.id as TickerTheme)}
                    className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                      tickerConfig.theme === t.id
                        ? 'bg-neutral-800 border-amber-400 text-white ring-1 ring-amber-400/50'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full ${t.color}`}></span>
                    <span className="text-[11px]">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Screen Position */}
            <div>
              <label className="block text-[11px] font-bold text-neutral-400 uppercase mb-1.5">Screen Position</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onUpdateTickerPosition('bottom')}
                  className={`p-2 rounded-xl text-xs font-bold border transition-all text-center ${
                    tickerConfig.position === 'bottom'
                      ? 'bg-neutral-800 border-amber-400 text-white'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  Bottom of Screen
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateTickerPosition('top')}
                  className={`p-2 rounded-xl text-xs font-bold border transition-all text-center ${
                    tickerConfig.position === 'top'
                      ? 'bg-neutral-800 border-amber-400 text-white'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  Top of Screen
                </button>
              </div>
            </div>

            {/* Speed Controller */}
            <div>
              <label className="block text-[11px] font-bold text-neutral-400 uppercase mb-1.5">Scroll Speed</label>
              <div className="grid grid-cols-4 gap-1">
                {[
                  { id: 'slow', label: '🐢 Slow' },
                  { id: 'normal', label: '🚶 Norm' },
                  { id: 'fast', label: '⚡ Fast' },
                  { id: 'vfast', label: '🚀 Max' }
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => onUpdateTickerSpeed(s.id as TickerSpeed)}
                    className={`p-1.5 rounded-lg text-[11px] font-bold border text-center transition-all ${
                      tickerConfig.speed === s.id
                        ? 'bg-neutral-800 border-amber-400 text-white'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Font Size */}
            <div>
              <label className="block text-[11px] font-bold text-neutral-400 uppercase mb-1.5">Font Size</label>
              <div className="grid grid-cols-4 gap-1">
                {[
                  { id: 'sm', label: 'Small' },
                  { id: 'md', label: 'Med' },
                  { id: 'lg', label: 'Large' },
                  { id: 'xl', label: 'XL' }
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => onUpdateTickerFontSize(f.id as TickerFontSize)}
                    className={`p-1.5 rounded-lg text-[11px] font-bold border text-center transition-all ${
                      tickerConfig.fontSize === f.id
                        ? 'bg-neutral-800 border-amber-400 text-white'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Action Bar */}
        <div className="px-6 py-4 bg-neutral-900/60 border-t border-neutral-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-400 hover:text-white"
          >
            Close Studio
          </button>

          <button
            type="button"
            onClick={onToggleTicker}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border shadow-lg ${
              tickerConfig.enabled
                ? 'bg-red-600 border-red-400 text-white hover:bg-red-500 shadow-red-600/30'
                : 'bg-gradient-to-r from-amber-600 to-orange-600 border-amber-400 text-white hover:from-amber-500 hover:to-orange-500 shadow-amber-600/30'
            }`}
          >
            <Megaphone size={15} />
            <span>{tickerConfig.enabled ? '🛑 Stop Ticker (Turn OFF)' : '📡 Broadcast Ticker (Go LIVE)'}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
