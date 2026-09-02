"use client";

import React from "react";
import { 
  BookOpen, Calendar, Music, Megaphone, 
  EyeOff, Radio, MonitorPlay, Sparkles, Cast 
} from "lucide-react";
import type { TickerConfig, ProjectorDisplayConfig } from "@/lib/lyrics";
import { Sliders } from "lucide-react";

interface HeaderProps {
  appMode: 'schedule' | 'bible' | 'lyrics';
  switchAppMode: (mode: 'schedule' | 'bible' | 'lyrics') => void;
  songsCount: number;
  tickerConfig: TickerConfig;
  onOpenTickerModal: () => void;
  onOpenBgStudioModal?: () => void;
  onOpenDisplayModal?: () => void;
  displayConfig?: ProjectorDisplayConfig;
  isTextHidden: boolean;
  onToggleHideText: () => void;
  isDisplayConnected: boolean;
  onOpenProjector: () => void;
  isHostScreenSharing?: boolean;
  onToggleScreenShare?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  appMode,
  switchAppMode,
  songsCount,
  tickerConfig,
  onOpenTickerModal,
  onOpenBgStudioModal,
  onOpenDisplayModal,
  displayConfig,
  isTextHidden,
  onToggleHideText,
  isDisplayConnected,
  onOpenProjector,
  isHostScreenSharing,
  onToggleScreenShare
}) => {
  return (
    <header className="bg-[#0c0c0c] border-b border-neutral-800/80 sticky top-0 z-30 shadow-md">
      <div className="max-w-[1700px] mx-auto px-5 h-16 flex items-center justify-between gap-3">
        {/* App Title & Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="bg-gradient-to-tr from-indigo-600 to-violet-500 text-white p-2 rounded-xl shadow-md shadow-indigo-500/20">
            <BookOpen size={18} />
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 via-white to-violet-300 leading-tight">
              PROCLAIM SANCTUARY
            </h1>
            <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider leading-none mt-0.5">
              Bible & Worship Suite
            </p>
          </div>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex bg-neutral-900/90 p-1 rounded-xl border border-neutral-800 shadow-inner">
          <button
            onClick={() => switchAppMode('schedule')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${
              appMode === 'schedule'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Calendar size={14} />
            <span>Service Schedule</span>
          </button>
          <button
            onClick={() => switchAppMode('bible')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${
              appMode === 'bible'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <BookOpen size={14} />
            <span>Scripture</span>
          </button>
          <button
            onClick={() => switchAppMode('lyrics')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${
              appMode === 'lyrics'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Music size={14} />
            <span>Song Library ({songsCount})</span>
          </button>
        </div>

        {/* Top Live Actions */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
          {/* Display & Typography Customizer Button */}
          {onOpenDisplayModal && (
            <button
              onClick={onOpenDisplayModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold text-[11px] uppercase tracking-wider transition-all border shadow-sm active:scale-95 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border-neutral-700"
              title="Customize Display Typography, Colors & Contrast"
            >
              <Sliders size={13} className="text-indigo-400" />
              <span>DISPLAY</span>
              {displayConfig && (
                <span 
                  className="w-2.5 h-2.5 rounded-full border border-white/40"
                  style={{ backgroundColor: displayConfig.textColor }}
                />
              )}
            </button>
          )}

          {/* Background Studio Button */}
          {onOpenBgStudioModal && (
            <button
              onClick={onOpenBgStudioModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold text-[11px] uppercase tracking-wider transition-all border shadow-sm active:scale-95 bg-indigo-950/90 hover:bg-indigo-900 text-indigo-300 border-indigo-500/50"
              title="Global Background Studio (Video, Gradients, Slideshow)"
            >
              <Sparkles size={13} className="text-indigo-400" />
              <span>BG STUDIO</span>
            </button>
          )}

          {/* Screen Share with Audio Cast Button */}
          {onToggleScreenShare && (
            <button
              onClick={onToggleScreenShare}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold text-[11px] uppercase tracking-wider transition-all border shadow-sm active:scale-95 ${
                isHostScreenSharing
                  ? 'bg-rose-950/90 text-rose-300 border-rose-500 ring-1 ring-rose-500/30 animate-pulse'
                  : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border-neutral-700'
              }`}
              title="Cast Screen/Tab to Projector"
            >
              <Cast size={13} className={isHostScreenSharing ? "text-rose-400" : "text-emerald-400"} />
              <span>{isHostScreenSharing ? 'CASTING' : 'SHARE SCREEN'}</span>
            </button>
          )}

          {/* Live Marquee Notice Ticker Button */}
          <button
            onClick={onOpenTickerModal}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold text-[11px] uppercase tracking-wider transition-all border shadow-sm active:scale-95 ${
              tickerConfig.enabled
                ? 'bg-amber-950/90 text-amber-300 border-amber-500 ring-1 ring-amber-500/30'
                : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border-neutral-700'
            }`}
            title="Live Scrolling Notice / Ticker"
          >
            <Megaphone size={13} className={tickerConfig.enabled ? "text-amber-400 animate-bounce" : "text-neutral-400"} />
            <span>{tickerConfig.enabled ? 'TICKER ON' : 'NOTICE TICKER'}</span>
          </button>

          {/* Blackout / Hide Text Button */}
          <button
            onClick={onToggleHideText}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full font-bold text-[11px] uppercase tracking-wider transition-all shadow-sm active:scale-95 border ${
              isTextHidden
                ? 'bg-amber-950/80 text-amber-300 border-amber-500/50 hover:bg-amber-900'
                : 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50 hover:bg-emerald-900'
            }`}
            title={isTextHidden ? "Text is hidden. Click to go LIVE." : "Text is live. Click to MUTE text."}
          >
            {isTextHidden ? (
              <>
                <EyeOff size={13} className="text-amber-400" />
                <span>TEXT MUTED</span>
              </>
            ) : (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <Radio size={13} className="text-emerald-400" />
                <span>LIVE</span>
              </>
            )}
          </button>

          {/* Launch Display Button */}
          <button 
            onClick={onOpenProjector}
            className={`group flex items-center gap-2 font-bold text-[11px] uppercase tracking-wider px-4 py-1.5 rounded-full shadow-md transition-all active:scale-95 border ${
              isDisplayConnected
                ? isTextHidden
                  ? 'bg-amber-900/90 text-amber-200 border-amber-600 hover:bg-amber-800'
                  : 'bg-emerald-900/90 text-emerald-100 border-emerald-500 hover:bg-emerald-800'
                : 'bg-neutral-800 text-neutral-200 border-neutral-700 hover:bg-neutral-700'
            }`}
          >
            {isDisplayConnected ? (
              <>
                <span className={`w-2 h-2 rounded-full animate-pulse ${isTextHidden ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
                <span>{isTextHidden ? 'Display (Hidden)' : 'Display Live'}</span>
              </>
            ) : (
              <>
                <MonitorPlay size={14} className="group-hover:text-indigo-400 transition-colors" />
                <span>Launch Display</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
