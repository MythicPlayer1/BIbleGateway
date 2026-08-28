"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MonitorPlay, Maximize2, Film, Image as ImageIcon,
  Play, Pause, RotateCcw, QrCode, Sparkles, ChevronLeft, ChevronRight,
  Volume2, VolumeX, Wand2, Sliders, Globe, Presentation, Radio
} from "lucide-react";
import type {
  ScheduleItem, GlobalBackgroundConfig, TextAnimationConfig, TextAnimationEffect, TextAnimationSpeed,
  ProjectorDisplayConfig
} from "@/lib/lyrics";
import {
  getTextAnimationVariants, getTextAnimationDuration, DEFAULT_TEXT_ANIMATION_CONFIG,
  DEFAULT_DISPLAY_CONFIG, getTextShadowCss, getFontFamilyCss
} from "@/lib/lyrics";
import { GlobalBackgroundLayer } from "@/components/GlobalBackgroundLayer";

function getResponsivePreviewFontSize(text: string, scale: number = 1.0) {
  if (!text) return `${24 * scale}px`;
  const lines = text.trim().split('\n').filter(Boolean);
  const lineCount = lines.length;
  const longestLine = Math.max(...lines.map(l => l.length), 0);

  if (lineCount <= 1 && longestLine < 35) {
    return `clamp(${Math.round(26 * scale)}px, ${3.2 * scale}vw, ${Math.round(44 * scale)}px)`;
  } else if (lineCount <= 2 && longestLine < 50) {
    return `clamp(${Math.round(22 * scale)}px, ${2.6 * scale}vw, ${Math.round(36 * scale)}px)`;
  } else if (lineCount <= 3 && longestLine < 65) {
    return `clamp(${Math.round(19 * scale)}px, ${2.2 * scale}vw, ${Math.round(30 * scale)}px)`;
  } else if (lineCount <= 4) {
    return `clamp(${Math.round(17 * scale)}px, ${1.8 * scale}vw, ${Math.round(26 * scale)}px)`;
  } else if (lineCount <= 6) {
    return `clamp(${Math.round(14 * scale)}px, ${1.5 * scale}vw, ${Math.round(22 * scale)}px)`;
  } else {
    return `clamp(${Math.round(13 * scale)}px, ${1.3 * scale}vw, ${Math.round(19 * scale)}px)`;
  }
}

interface LiveScreenMonitorProps {
  isTextHidden: boolean;
  globalBgConfig?: GlobalBackgroundConfig;
  textAnimConfig?: TextAnimationConfig;
  onUpdateTextAnimConfig?: (config: TextAnimationConfig) => void;
  displayConfig?: ProjectorDisplayConfig;
  onOpenDisplaySettingsModal?: () => void;
  isBroadcasting?: boolean;
  connectedClientsCount?: number;
  onOpenBroadcastModal?: () => void;
  localBgUrl: string | null;
  localBgType: 'video' | 'image' | null;
  loading: boolean;
  appMode: 'schedule' | 'bible' | 'lyrics';
  isScheduleMedia: boolean;
  currentActiveMediaUrl: string;
  currentActiveMediaType: string;
  currentActiveMediaTitle: string;
  selectedSlideIndex: number;
  activeScheduleItem: ScheduleItem | null;
  isCountdownRunning: boolean;
  countdownLeft: number;
  onStartTimer: () => void;
  onPauseTimer: () => void;
  onResetTimer: (secs: number) => void;
  onAdjustLiveTime: (deltaSecs: number) => void;
  currentPreviewText: string;
  currentPreviewReference: string;
  onPrev: () => void;
  onNext: () => void;
  previewContainerRef: React.RefObject<HTMLDivElement | null>;
  previewContentRef?: React.RefObject<HTMLDivElement | null>;
  previewTextRef?: React.RefObject<HTMLParagraphElement | null>;
  isVideoPlaying?: boolean;
  isVideoMuted?: boolean;
  isDisplayConnected?: boolean;
  onToggleMediaPlayPause?: () => void;
  onToggleMediaMute?: () => void;
}

export const LiveScreenMonitor: React.FC<LiveScreenMonitorProps> = ({
  isTextHidden,
  globalBgConfig,
  textAnimConfig = DEFAULT_TEXT_ANIMATION_CONFIG,
  onUpdateTextAnimConfig,
  displayConfig = DEFAULT_DISPLAY_CONFIG,
  onOpenDisplaySettingsModal,
  isBroadcasting = false,
  connectedClientsCount = 0,
  onOpenBroadcastModal,
  localBgUrl,
  localBgType,
  loading,
  appMode,
  isScheduleMedia,
  currentActiveMediaUrl,
  currentActiveMediaType,
  currentActiveMediaTitle,
  selectedSlideIndex,
  activeScheduleItem,
  isCountdownRunning,
  countdownLeft,
  onStartTimer,
  onPauseTimer,
  onResetTimer,
  onAdjustLiveTime,
  currentPreviewText,
  currentPreviewReference,
  onPrev,
  onNext,
  previewContainerRef,
  previewContentRef,
  previewTextRef,
  isVideoPlaying,
  isVideoMuted,
  isDisplayConnected,
  onToggleMediaPlayPause,
  onToggleMediaMute
}) => {
  const previewVideoRef = React.useRef<HTMLVideoElement | null>(null);

  // Auto-mute preview when the launched screen is open (prevent double audio)
  React.useEffect(() => {
    const vid = previewVideoRef.current;
    if (!vid) return;
    vid.muted = !!isDisplayConnected || !!isVideoMuted;
  }, [isDisplayConnected, isVideoMuted]);

  // Imperatively sync play/pause on preview video
  React.useEffect(() => {
    const vid = previewVideoRef.current;
    if (!vid) return;
    if (isVideoPlaying) {
      vid.play().catch(() => { });
    } else {
      vid.pause();
    }
  }, [isVideoPlaying]);

  return (
    <div className="lg:col-span-7 lg:sticky lg:top-24 self-start flex flex-col space-y-4">
      <div className="bg-[#0e0e0e] rounded-3xl border border-neutral-800 shadow-2xl flex flex-col overflow-hidden">

        {/* Live Screen Header Bar */}
        <div className="bg-neutral-900/70 border-b border-neutral-800 px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs font-black text-white tracking-wider uppercase flex items-center gap-2">
              <MonitorPlay size={16} className="text-indigo-400" />
              Live Presentation Screen
            </span>
            <span className="text-[11px] text-neutral-500 hidden sm:inline">• (Arrows ← → or Spacebar)</span>
          </div>

          <div className="flex items-center gap-2.5">
            {onOpenBroadcastModal && (
              <button
                type="button"
                onClick={onOpenBroadcastModal}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-sm ${
                  isBroadcasting
                    ? "bg-emerald-950/90 text-emerald-300 border-emerald-500/50 hover:bg-emerald-900 shadow-emerald-900/20"
                    : "bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white border-neutral-700"
                }`}
                title="Broadcast projector feed online to TVs, iPads, and OBS"
              >
                <Radio size={13} className={isBroadcasting ? "text-emerald-400 animate-pulse" : "text-neutral-400"} />
                <span>{isBroadcasting ? `ON AIR (${connectedClientsCount})` : "Broadcast"}</span>
              </button>
            )}

            {onOpenDisplaySettingsModal && (
              <button
                type="button"
                onClick={onOpenDisplaySettingsModal}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white rounded-xl border border-neutral-700 text-xs font-bold transition-all shadow-sm group"
                title="Customize Font Size, Text Color, Shadows & Auto-Fit"
              >
                <Sliders size={13} className="text-indigo-400 group-hover:rotate-45 transition-transform" />
                <span>Typography ({Math.round(displayConfig.fontSizeScale * 100)}%)</span>
                <span
                  className="w-3 h-3 rounded-full border border-white/30 ml-0.5 shadow-sm"
                  style={{ backgroundColor: displayConfig.textColor }}
                />
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                if (previewContainerRef.current) {
                  if (!document.fullscreenElement) {
                    previewContainerRef.current.requestFullscreen().catch(() => { });
                  } else {
                    document.exitFullscreen().catch(() => { });
                  }
                }
              }}
              className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded-lg transition-colors border border-neutral-700 shadow-sm"
              title="Fullscreen Live Presentation Screen"
            >
              <Maximize2 size={14} />
            </button>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              SYNC ACTIVE
            </span>
          </div>
        </div>

        {/* Interactive Text Motion Animation Control Bar */}
        {onUpdateTextAnimConfig && (
          <div className="bg-neutral-950/80 border-b border-neutral-800/80 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-neutral-300 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                <Wand2 size={14} className="text-indigo-400" />
                Text Motion:
              </span>

              {/* Effect Selector Pills */}
              <div className="flex items-center gap-1 bg-neutral-900/90 p-1 rounded-xl border border-neutral-800">
                {[
                  { id: 'slide-up', label: '⬆️ Slide Up' },
                  { id: 'fade', label: '✨ Fade' },
                  { id: 'slide-down', label: '⬇️ Slide Down' },
                  { id: 'zoom-in', label: '🔍 Zoom' },
                  { id: 'flip', label: '🔄 3D Flip' },
                  { id: 'blur', label: '🌫️ Blur' },
                  { id: 'pop', label: '💥 Pop' }
                ].map(fx => (
                  <button
                    key={fx.id}
                    type="button"
                    onClick={() => onUpdateTextAnimConfig({ ...textAnimConfig, effect: fx.id as TextAnimationEffect })}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${textAnimConfig.effect === fx.id
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                      }`}
                  >
                    {fx.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Speed Selector Pills */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Speed:</span>
              <div className="flex items-center gap-1 bg-neutral-900/90 p-1 rounded-xl border border-neutral-800">
                {[
                  { id: 'fast', label: '⚡ Fast (0.25s)' },
                  { id: 'normal', label: '✨ Cinematic (0.45s)' },
                  { id: 'slow', label: '🐢 Gentle (0.75s)' }
                ].map(sp => (
                  <button
                    key={sp.id}
                    type="button"
                    onClick={() => onUpdateTextAnimConfig({ ...textAnimConfig, speed: sp.id as TextAnimationSpeed })}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${textAnimConfig.speed === sp.id
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                      }`}
                  >
                    {sp.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Widescreen 16:9 Presentation Display Box */}
        <div className="p-5 flex flex-col justify-center">
          <div
            ref={previewContainerRef}
            className={`w-full aspect-video min-h-[380px] md:min-h-[460px] max-h-[600px] bg-[#030303] rounded-2xl relative flex flex-col items-center justify-center p-6 md:p-12 overflow-hidden shadow-2xl border border-neutral-800/80 ${isTextHidden ? 'opacity-40' : 'opacity-100'}`}
          >
            {/* 1. Global Projector Background Media Layer */}
            <GlobalBackgroundLayer config={globalBgConfig} legacyBgUrl={localBgUrl} legacyBgType={localBgType} />

            {/* 2. Foreground Presentation Slides */}
            <AnimatePresence mode="popLayout" initial={false}>
              {loading && appMode === 'bible' ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-3 text-neutral-400 relative z-20"
                >
                  <div className="w-9 h-9 border-4 border-neutral-700 border-t-indigo-500 rounded-full animate-spin"></div>
                  <p className="font-semibold text-xs uppercase tracking-wider">Loading scripture...</p>
                </motion.div>
              ) : isScheduleMedia ? (
                <motion.div
                  key={`media-${activeScheduleItem?.id}-${selectedSlideIndex}`}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  transition={{ duration: 0.28, ease: "easeOut" }}
                  className="absolute inset-0 z-20 w-full h-full p-0 m-0 bg-black flex items-center justify-center overflow-hidden rounded-3xl"
                >
                  {currentActiveMediaType === 'video' ? (
                    <>
                      <video
                        ref={previewVideoRef}
                        src={currentActiveMediaUrl}
                        autoPlay={isVideoPlaying}
                        loop
                        muted={!!isVideoMuted || !!isDisplayConnected}
                        playsInline
                        className="w-full h-full object-contain pointer-events-none"
                      />
                      <div className="absolute inset-0 bg-black/10 hover:bg-black/30 transition-colors z-20 flex items-center justify-center opacity-0 hover:opacity-100 group">
                        <div className="flex items-center gap-4 bg-black/60 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10 shadow-2xl scale-95 group-hover:scale-100 transition-transform">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onToggleMediaPlayPause?.(); }}
                            className="p-3 bg-white text-black hover:bg-indigo-50 rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95"
                            title={isVideoPlaying ? "Pause Video" : "Play Video"}
                          >
                            {isVideoPlaying ? <Pause size={24} className="fill-black" /> : <Play size={24} className="fill-black ml-1" />}
                          </button>
                          <div className="w-px h-8 bg-white/20"></div>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onToggleMediaMute?.(); }}
                            className="p-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-full transition-colors"
                            title={isVideoMuted ? "Unmute Video" : "Mute Video"}
                          >
                            {isVideoMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <img
                      src={currentActiveMediaUrl}
                      alt={currentActiveMediaTitle}
                      className="w-full h-full object-contain"
                    />
                  )}

                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none z-30">
                    <span className="px-3 py-1 bg-black/80 backdrop-blur-md rounded-full text-xs font-bold text-white border border-neutral-700/80 shadow-lg flex items-center gap-2 max-w-[70%] truncate pointer-events-auto">
                      {currentActiveMediaType === 'video' ? <Film size={13} className="text-violet-400 shrink-0" /> : <ImageIcon size={13} className="text-violet-400 shrink-0" />}
                      <span className="truncate">{currentActiveMediaTitle}</span>
                      {activeScheduleItem?.mediaItems && activeScheduleItem.mediaItems.length > 1 && (
                        <span className="text-[10px] font-mono text-indigo-300 bg-indigo-950 px-1.5 py-0.2 rounded border border-indigo-500/40 shrink-0">
                          {selectedSlideIndex + 1}/{activeScheduleItem.mediaItems.length}
                        </span>
                      )}
                    </span>
                    <span className="px-2.5 py-0.5 bg-emerald-950/90 text-emerald-300 border border-emerald-500/50 rounded-full text-[10px] font-bold shadow-lg shrink-0">
                      FOREGROUND ON AIR
                    </span>
                  </div>
                </motion.div>
              ) : activeScheduleItem?.type === 'web_embed' && activeScheduleItem?.embedUrl ? (
                <motion.div
                  key={`web-embed-${activeScheduleItem.id}`}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  transition={{ duration: 0.28, ease: "easeOut" }}
                  className="absolute inset-0 z-20 w-full h-full p-0 m-0 bg-black flex items-center justify-center overflow-hidden rounded-3xl"
                >
                  <iframe
                    src={activeScheduleItem.embedUrl}
                    title={activeScheduleItem.title || 'Live Web Presentation'}
                    className="w-full h-full border-0"
                    allowFullScreen
                  />
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none z-30">
                    <span className="px-3 py-1 bg-black/80 backdrop-blur-md rounded-full text-xs font-bold text-white border border-neutral-700/80 shadow-lg flex items-center gap-2 max-w-[70%] truncate pointer-events-auto">
                      <Globe size={13} className="text-indigo-400 shrink-0" />
                      <span className="truncate">{activeScheduleItem.title}</span>
                    </span>
                    <span className="px-2.5 py-0.5 bg-indigo-950/90 text-indigo-300 border border-indigo-500/50 rounded-full text-[10px] font-bold shadow-lg shrink-0">
                      LIVE WEB EMBED
                    </span>
                  </div>
                </motion.div>
              ) : activeScheduleItem?.theme?.layout === 'countdown' ? (
                <motion.div
                  key="countdown-preview"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center text-center p-4 space-y-3 relative z-20"
                >
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/90 border border-indigo-500/40 text-indigo-300 text-xs font-bold uppercase">
                    <span className={`w-2 h-2 rounded-full ${isCountdownRunning ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`}></span>
                    <span>{activeScheduleItem?.theme?.countdownLabel || 'Service Begins In'}</span>
                  </div>
                  <span className="text-5xl md:text-6xl font-black font-mono tracking-wider text-white drop-shadow-2xl">
                    {Math.floor(countdownLeft / 60).toString().padStart(2, '0')}:{(countdownLeft % 60).toString().padStart(2, '0')}
                  </span>

                  {/* Live Timer Action Controls */}
                  <div className="flex items-center gap-2 pt-1">
                    {!isCountdownRunning ? (
                      <button
                        onClick={onStartTimer}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all active:scale-95"
                      >
                        <Play size={12} fill="currentColor" />
                        <span>Start Timer</span>
                      </button>
                    ) : (
                      <button
                        onClick={onPauseTimer}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-amber-600/30 transition-all active:scale-95"
                      >
                        <Pause size={12} fill="currentColor" />
                        <span>Pause Timer</span>
                      </button>
                    )}
                    <button
                      onClick={() => onResetTimer(activeScheduleItem?.theme?.countdownSeconds || 300)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs font-bold border border-neutral-700 transition-all active:scale-95"
                    >
                      <RotateCcw size={12} />
                      <span>Reset</span>
                    </button>
                  </div>

                  {/* On-the-fly Time Adjusters */}
                  <div className="flex items-center gap-1.5 pt-1">
                    {[-60, -30, 30, 60, 300].map(delta => (
                      <button
                        key={delta}
                        onClick={() => onAdjustLiveTime(delta)}
                        className="px-2.5 py-1 bg-neutral-900/90 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-lg text-[11px] font-mono font-bold border border-neutral-800 transition-all active:scale-95"
                        title={`${delta > 0 ? 'Add' : 'Subtract'} ${Math.abs(delta)}s`}
                      >
                        {delta > 0 ? `+${delta >= 60 ? `${delta / 60}m` : `${delta}s`}` : `-${Math.abs(delta) >= 60 ? `${Math.abs(delta) / 60}m` : `${Math.abs(delta)}s`}`}
                      </button>
                    ))}
                  </div>
                </motion.div>
              ) : appMode === 'schedule' && activeScheduleItem?.theme?.layout === 'giving' ? (
                <motion.div
                  key="giving-preview"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full max-w-[94%] grid grid-cols-12 gap-3 items-center justify-center p-4 bg-black/75 backdrop-blur-md rounded-2xl border border-white/15 relative z-20 text-left"
                >
                  <div className="col-span-6 space-y-1.5">
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/40">
                      {activeScheduleItem?.theme?.qrBadgeLabel || 'दशांश तथा भेटी'}
                    </span>
                    <h4 className="text-sm md:text-base font-bold text-white leading-tight line-clamp-1">
                      {activeScheduleItem.title}
                    </h4>
                    <p className="text-[11px] text-neutral-300 italic line-clamp-2">
                      {currentPreviewText}
                    </p>
                    {activeScheduleItem?.theme?.bankDetails && (
                      <div className="p-2 bg-neutral-950 rounded-lg text-[10px] font-mono text-neutral-300 whitespace-pre-line border border-neutral-800 line-clamp-3">
                        {activeScheduleItem.theme.bankDetails}
                      </div>
                    )}
                  </div>
                  <div className="col-span-6 flex flex-col items-center justify-center">
                    <div className="p-2 bg-white rounded-2xl shadow-xl aspect-square w-full max-w-[170px] flex items-center justify-center ring-4 ring-emerald-500/20">
                      {activeScheduleItem?.theme?.qrCodeUrl ? (
                        <img src={activeScheduleItem.theme.qrCodeUrl} alt="QR" className="w-full h-full object-contain rounded-lg" />
                      ) : (
                        <QrCode size={90} className="text-black opacity-85" />
                      )}
                    </div>
                    <span className="text-[10px] text-emerald-400 font-bold mt-1.5 text-center truncate max-w-full">
                      {activeScheduleItem?.theme?.qrInstruction || '📱 Scan with Phone Camera or QR Scanner'}
                    </span>
                  </div>
                </motion.div>
              ) : currentPreviewText ? (
                <motion.div
                  key={`${currentPreviewReference}-${currentPreviewText}`}
                  ref={previewContentRef}
                  initial={getTextAnimationVariants(textAnimConfig.effect).initial}
                  animate={getTextAnimationVariants(textAnimConfig.effect).animate}
                  exit={getTextAnimationVariants(textAnimConfig.effect).exit}
                  transition={{ duration: getTextAnimationDuration(textAnimConfig.speed), ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    willChange: 'transform, opacity',
                    transform: 'translateZ(0)',
                    fontFamily: getFontFamilyCss(displayConfig.fontFamily),
                    color: displayConfig.textColor
                  }}
                  className={`w-full max-w-[94%] flex flex-col relative z-20 ${displayConfig.textAlign === 'left' ? 'items-start text-left' : displayConfig.textAlign === 'right' ? 'items-end text-right' : 'items-center text-center'
                    }`}
                >
                  {currentPreviewText.includes('\n───\n') || currentPreviewText.includes('\n---\n') ? (() => {
                    const parts = currentPreviewText.split(/\n───\n|\n---\n/);
                    const top = parts[0] || '';
                    const bottom = parts[1] || '';
                    return (
                      <div className="w-full flex flex-col items-center justify-center gap-2 md:gap-3 mb-3">
                        <p
                          className={`font-black leading-snug whitespace-pre-line tracking-tight w-full ${displayConfig.textAlign === 'left' ? 'text-left' : displayConfig.textAlign === 'right' ? 'text-right' : 'text-center'
                            }`}
                          style={{
                            fontSize: getResponsivePreviewFontSize(top, displayConfig.fontSizeScale),
                            color: displayConfig.textColor,
                            textShadow: getTextShadowCss(displayConfig.textShadow),
                            lineHeight: displayConfig.lineHeight
                          }}
                        >
                          {top}
                        </p>

                        <div className="w-full flex items-center justify-center gap-3 my-0.5 opacity-80">
                          <div className="h-[1.5px] flex-1 max-w-[120px] bg-gradient-to-r from-transparent via-indigo-400 to-transparent"></div>
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.8)]"></span>
                          <div className="h-[1.5px] flex-1 max-w-[120px] bg-gradient-to-r from-transparent via-indigo-400 to-transparent"></div>
                        </div>

                        <p
                          className={`font-semibold italic leading-snug whitespace-pre-line tracking-normal w-full opacity-95 ${displayConfig.textAlign === 'left' ? 'text-left' : displayConfig.textAlign === 'right' ? 'text-right' : 'text-center'
                            }`}
                          style={{
                            fontSize: getResponsivePreviewFontSize(bottom, displayConfig.fontSizeScale * 0.85),
                            color: displayConfig.textColor,
                            textShadow: getTextShadowCss(displayConfig.textShadow),
                            lineHeight: displayConfig.lineHeight
                          }}
                        >
                          {bottom}
                        </p>
                      </div>
                    );
                  })() : (
                    <p
                      ref={previewTextRef}
                      className={`font-black leading-snug mb-4 whitespace-pre-line tracking-tight w-full ${displayConfig.textAlign === 'left' ? 'text-left' : displayConfig.textAlign === 'right' ? 'text-right' : 'text-center'
                        }`}
                      style={{
                        fontSize: getResponsivePreviewFontSize(currentPreviewText, displayConfig.fontSizeScale),
                        color: displayConfig.textColor,
                        textShadow: getTextShadowCss(displayConfig.textShadow),
                        lineHeight: displayConfig.lineHeight,
                        fontWeight: displayConfig.textWeight === 'black' ? 900 : displayConfig.textWeight === 'bold' ? 700 : 500
                      }}
                    >
                      {currentPreviewText}
                    </p>
                  )}

                  {currentPreviewReference && (
                    <div className="inline-flex items-center gap-2.5 mt-1">
                      <div className="h-[2.5px] w-8 bg-indigo-500 rounded-full"></div>
                      <p
                        className="text-xs md:text-sm font-bold tracking-wide"
                        style={{
                          color: displayConfig.textColor,
                          textShadow: getTextShadowCss(displayConfig.textShadow)
                        }}
                      >
                        {currentPreviewReference}
                      </p>
                      <div className="h-[2.5px] w-8 bg-indigo-500 rounded-full"></div>
                    </div>
                  )}
                </motion.div>
              ) : (
                <div className="text-neutral-500 text-sm relative z-20 flex flex-col items-center gap-2">
                  <Sparkles size={24} className="opacity-40" />
                  <p>Select a verse, lyrics slide, or schedule item to project.</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Large Navigation & Slide Advancement Deck */}
        <div className="p-6 bg-neutral-900/80 border-t border-neutral-800 flex items-center justify-between gap-6">
          <button
            onClick={onPrev}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-3 bg-neutral-800 border border-neutral-700 text-white disabled:opacity-40 font-bold py-4 px-6 rounded-2xl hover:border-indigo-500 active:scale-[0.98] text-xs uppercase tracking-wider shadow-lg hover:bg-neutral-750 transition-all"
          >
            <ChevronLeft size={20} />
            {appMode === 'bible' ? 'Previous Verse (←)' : 'Previous Slide (←)'}
          </button>

          <button
            onClick={onNext}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-3 bg-gradient-to-r from-indigo-600 to-violet-600 border border-indigo-400/50 text-white disabled:opacity-40 font-bold py-4 px-6 rounded-2xl hover:from-indigo-500 hover:to-violet-500 active:scale-[0.98] shadow-xl shadow-indigo-600/30 text-xs uppercase tracking-wider transition-all"
          >
            {appMode === 'bible' ? 'Next Verse (→)' : 'Next Slide (→)'}
            <ChevronRight size={20} />
          </button>
        </div>

      </div>
    </div>
  );
};
