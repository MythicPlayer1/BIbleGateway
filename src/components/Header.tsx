"use client";

import React from "react";
import { 
  BookOpen, Calendar, Music, Megaphone, 
  EyeOff, Radio, MonitorPlay, Sparkles 
} from "lucide-react";
import type { TickerConfig } from "@/lib/lyrics";

interface HeaderProps {
  appMode: 'schedule' | 'bible' | 'lyrics';
  switchAppMode: (mode: 'schedule' | 'bible' | 'lyrics') => void;
  songsCount: number;
  tickerConfig: TickerConfig;
  onOpenTickerModal: () => void;
  onOpenBgStudioModal?: () => void;
  isTextHidden: boolean;
  onToggleHideText: () => void;
  isDisplayConnected: boolean;
  onOpenProjector: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  appMode,
  switchAppMode,
  songsCount,
  tickerConfig,
  onOpenTickerModal,
  onOpenBgStudioModal,
  isTextHidden,
  onToggleHideText,
  isDisplayConnected,
  onOpenProjector
}) => {
  return (
    <header className="bg-[#0c0c0c] border-b border-neutral-800/80 sticky top-0 z-30 shadow-md">
      <div className="max-w-[1700px] mx-auto px-6 h-20 flex items-center justify-between">
        {/* App Title & Logo */}
        <div className="flex items-center gap-3.5">
          <div className="bg-gradient-to-tr from-indigo-600 to-violet-500 text-white p-2.5 rounded-2xl shadow-lg shadow-indigo-500/20">
            <BookOpen size={22} />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 via-white to-violet-300">
              PROCLAIM PROJECTION
            </h1>
            <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
              Bible & Worship Service Suite
            </p>
          </div>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex bg-neutral-900/90 p-1.5 rounded-2xl border border-neutral-800 shadow-inner">
          <button
            onClick={() => switchAppMode('schedule')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all relative ${
              appMode === 'schedule'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Calendar size={15} />
            Service Schedule
          </button>
          <button
            onClick={() => switchAppMode('bible')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all relative ${
              appMode === 'bible'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <BookOpen size={15} />
            Scripture
          </button>
          <button
            onClick={() => switchAppMode('lyrics')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all relative ${
              appMode === 'lyrics'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Music size={15} />
            Song Library ({songsCount})
          </button>
        </div>

        {/* Top Live Actions */}
        <div className="flex items-center gap-3">
          {/* Background Studio Button */}
          {onOpenBgStudioModal && (
            <button
              onClick={onOpenBgStudioModal}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-full font-bold text-xs uppercase tracking-wider transition-all border shadow-sm active:scale-95 bg-indigo-950/90 hover:bg-indigo-900 text-indigo-300 border-indigo-500/50"
              title="Open Global Projection Background Studio (Slideshow, Animated Gradient, Video)"
            >
              <Sparkles size={14} className="text-indigo-400" />
              <span>BG STUDIO</span>
            </button>
          )}

          {/* Live Marquee Notice Ticker Button */}
          <button
            onClick={onOpenTickerModal}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-full font-bold text-xs uppercase tracking-wider transition-all border shadow-sm active:scale-95 ${
              tickerConfig.enabled
                ? 'bg-amber-950/90 text-amber-300 border-amber-500 ring-2 ring-amber-500/30'
                : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border-neutral-700'
            }`}
            title="Broadcast Live Scrolling Notice / Ticker"
          >
            <Megaphone size={14} className={tickerConfig.enabled ? "text-amber-400 animate-bounce" : "text-neutral-400"} />
            <span>{tickerConfig.enabled ? 'TICKER ON AIR' : 'NOTICE TICKER'}</span>
          </button>

          {/* Blackout / Hide Text Button */}
          <button
            onClick={onToggleHideText}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-full font-bold text-xs uppercase tracking-wider transition-all shadow-sm active:scale-95 border ${
              isTextHidden
                ? 'bg-amber-950/80 text-amber-300 border-amber-500/50 hover:bg-amber-900'
                : 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50 hover:bg-emerald-900'
            }`}
            title={isTextHidden ? "Text is hidden on projector. Click to go LIVE." : "Text is live. Click to MUTE / HIDE text."}
          >
            {isTextHidden ? (
              <>
                <EyeOff size={15} className="text-amber-400" />
                <span>TEXT MUTED</span>
              </>
            ) : (
              <>
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <Radio size={15} className="text-emerald-400" />
                <span>LIVE</span>
              </>
            )}
          </button>

          {/* Launch Display Button */}
          <button 
            onClick={onOpenProjector}
            className={`group flex items-center gap-2.5 font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-full shadow-lg transition-all active:scale-95 border ${
              isDisplayConnected
                ? isTextHidden
                  ? 'bg-amber-900/90 text-amber-200 border-amber-600 hover:bg-amber-800'
                  : 'bg-emerald-900/90 text-emerald-100 border-emerald-500 hover:bg-emerald-800'
                : 'bg-neutral-800 text-neutral-200 border-neutral-700 hover:bg-neutral-700'
            }`}
          >
            {isDisplayConnected ? (
              <>
                <span className={`w-2.5 h-2.5 rounded-full animate-pulse ${isTextHidden ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
                <span>{isTextHidden ? 'Display Live (Hidden)' : 'Display Live (On Air)'}</span>
              </>
            ) : (
              <>
                <MonitorPlay size={16} className="group-hover:text-indigo-400 transition-colors" />
                <span>Launch Display</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
