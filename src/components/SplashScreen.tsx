"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BookOpen, Sparkles, Music, Cast, Smartphone, 
  ArrowRight, X, CheckCircle2
} from "lucide-react";

interface SplashScreenProps {
  isOpen?: boolean;
  onClose?: () => void;
  /** Force display even if already seen (e.g. for preview / replay) */
  isManualPreview?: boolean;
}

const INITIALIZATION_STEPS = [
  { progress: 20, message: "Initializing sanctuary presentation engine...", icon: Sparkles },
  { progress: 45, message: "Indexing Scripture & multi-version translations...", icon: BookOpen },
  { progress: 75, message: "Loading 1,000+ Nepali & English Christian hymns...", icon: Music },
  { progress: 92, message: "Configuring wireless projection & operator sync...", icon: Cast },
  { progress: 100, message: "Proclaim Sanctuary ready to lead worship!", icon: CheckCircle2 }
];

const HIGHLIGHT_CARDS = [
  {
    icon: BookOpen,
    title: "Holy Scripture",
    desc: "Instant 66-book navigation with dual-translation split projection.",
    tag: "Bilingual Ready"
  },
  {
    icon: Music,
    title: "1,000+ Hymns & Chords",
    desc: "Romanized search, key transposition, and custom worship slides.",
    tag: "Fast Search"
  },
  {
    icon: Cast,
    title: "Wireless Projection",
    desc: "Zero-lag dual monitor output & internet streaming to TVs and beamers.",
    tag: "Multi-Screen"
  },
  {
    icon: Smartphone,
    title: "Mobile Remote Operator",
    desc: "QR code pairing for worship leaders & media operators.",
    tag: "Instant Sync"
  }
];

export const SplashScreen: React.FC<SplashScreenProps> = ({
  isOpen: controlledIsOpen,
  onClose,
  isManualPreview = false
}) => {
  const [mounted, setMounted] = useState(false);
  const [internalVisible, setInternalVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [alwaysShowOnStartup, setAlwaysShowOnStartup] = useState(false);

  // Client-side detection for first-time launch
  useEffect(() => {
    setMounted(true);

    const alwaysShowSaved = localStorage.getItem("proclaim_splash_always_show") === "true";
    setAlwaysShowOnStartup(alwaysShowSaved);

    if (isManualPreview) {
      setInternalVisible(true);
      return;
    }

    if (controlledIsOpen !== undefined) {
      setInternalVisible(controlledIsOpen);
      return;
    }

    // Automatic check: first-time launch OR user set always show
    const hasSeen = localStorage.getItem("proclaim_splash_seen");
    if (!hasSeen || alwaysShowSaved) {
      setInternalVisible(true);
    }
  }, [controlledIsOpen, isManualPreview]);

  // Synchronize when controlledIsOpen changes
  useEffect(() => {
    if (controlledIsOpen !== undefined) {
      setInternalVisible(controlledIsOpen);
    }
  }, [controlledIsOpen]);

  // Progress simulation animation
  useEffect(() => {
    if (!internalVisible) {
      setProgress(0);
      setCurrentStepIdx(0);
      setIsReady(false);
      return;
    }

    let currentProgress = 0;
    const interval = setInterval(() => {
      // Faster progression at start, pauses smoothly near end
      const increment = currentProgress < 60 ? Math.random() * 15 + 8 : Math.random() * 10 + 4;
      currentProgress = Math.min(100, currentProgress + increment);
      setProgress(Math.round(currentProgress));

      // Match current step
      const stepIdx = INITIALIZATION_STEPS.findIndex(s => s.progress >= currentProgress);
      if (stepIdx !== -1) {
        setCurrentStepIdx(stepIdx);
      }

      if (currentProgress >= 100) {
        setIsReady(true);
        clearInterval(interval);
      }
    }, 180);

    return () => clearInterval(interval);
  }, [internalVisible]);

  // Handle dismissal
  const handleDismiss = () => {
    try {
      localStorage.setItem("proclaim_splash_seen", "true");
      localStorage.setItem("proclaim_splash_always_show", String(alwaysShowOnStartup));
    } catch {
      // ignore storage errors
    }

    setInternalVisible(false);
    if (onClose) {
      onClose();
    }
  };

  // Keyboard shortcut listener (Enter, Space, Escape to dismiss)
  useEffect(() => {
    if (!internalVisible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || (isReady && (e.key === "Enter" || e.key === " "))) {
        e.preventDefault();
        handleDismiss();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [internalVisible, isReady, alwaysShowOnStartup]);

  if (!mounted) return null;

  const ActiveStepIcon = INITIALIZATION_STEPS[currentStepIdx]?.icon || Sparkles;

  return (
    <AnimatePresence>
      {internalVisible && (
        <motion.div
          key="splash-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.02, filter: "blur(8px)" }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-y-auto overflow-x-hidden bg-[#07070a]/95 backdrop-blur-2xl text-neutral-100 p-4 sm:p-6 select-none"
        >
          {/* Ambient Background Aura Lights */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-indigo-600/20 rounded-full blur-[130px] animate-pulse" />
            <div className="absolute top-1/3 -left-32 w-[500px] h-[500px] bg-violet-600/15 rounded-full blur-[140px]" />
            <div className="absolute bottom-10 -right-32 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[140px]" />
            {/* Subtle Grid overlay */}
            <div 
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)`,
                backgroundSize: "28px 28px"
              }}
            />
          </div>

          {/* Top Skip Button */}
          <div className="absolute top-5 right-5 sm:top-7 sm:right-8 z-20">
            <button
              onClick={handleDismiss}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-neutral-900/80 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800/80 text-xs font-semibold tracking-wider uppercase transition-all active:scale-95 shadow-md"
              title="Skip splash screen (Esc)"
            >
              <span>Skip</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-neutral-700">ESC</span>
              <X size={14} />
            </button>
          </div>

          {/* Central Container */}
          <motion.div
            initial={{ scale: 0.94, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="relative z-10 w-full max-w-2xl flex flex-col items-center text-center my-auto py-6"
          >
            {/* Animated Logo Emblem */}
            <div className="relative mb-6">
              {/* Pulsing halo */}
              <div className="absolute -inset-3 rounded-3xl bg-gradient-to-tr from-indigo-500 via-violet-500 to-amber-400 opacity-35 blur-xl animate-pulse" />
              
              {/* Outer rotating decorative ring */}
              <div className="relative p-1 rounded-3xl bg-gradient-to-b from-indigo-400/40 via-violet-500/20 to-transparent shadow-2xl">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-[22px] bg-gradient-to-tr from-indigo-700 via-indigo-600 to-violet-600 flex items-center justify-center shadow-inner relative overflow-hidden group">
                  {/* Subtle shimmer highlight */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2.5s_infinite]" />
                  <BookOpen className="w-10 h-10 sm:w-12 sm:h-12 text-white drop-shadow-[0_2px_12px_rgba(255,255,255,0.4)]" />
                </div>
              </div>

              {/* Little floating holy sparkles badge */}
              <div className="absolute -bottom-1.5 -right-1.5 p-1.5 rounded-full bg-neutral-900 border border-indigo-400/40 text-amber-300 shadow-lg shadow-black/60">
                <Sparkles size={14} className="animate-spin-slow" />
              </div>
            </div>

            {/* Version / Category Badge */}
            <motion.div 
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/70 border border-indigo-500/30 text-[11px] font-bold text-indigo-300 tracking-wider uppercase mb-3 shadow-inner"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>Next-Gen Sanctuary Suite • v2.4</span>
            </motion.div>

            {/* Main App Title */}
            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-200 via-white to-violet-200 drop-shadow-sm mb-2"
            >
              PROCLAIM SANCTUARY
            </motion.h1>

            {/* Subtitle */}
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="text-sm sm:text-base text-neutral-300 font-medium max-w-lg mb-6 leading-relaxed"
            >
              Elevating church worship with seamless Scripture projection, 1,000+ hymns, and wireless sanctuary broadcast.
            </motion.p>

            {/* Progress Bar & Status Engine */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="w-full max-w-md bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4 shadow-xl mb-6 backdrop-blur-md"
            >
              <div className="flex items-center justify-between text-xs mb-2">
                <div className="flex items-center gap-2 text-indigo-300 font-medium truncate pr-2">
                  <ActiveStepIcon size={14} className={isReady ? "text-emerald-400" : "animate-spin text-indigo-400"} />
                  <span className="truncate">{INITIALIZATION_STEPS[currentStepIdx]?.message}</span>
                </div>
                <span className="font-mono font-bold text-neutral-400 shrink-0">{progress}%</span>
              </div>

              {/* The Glowing Progress Bar */}
              <div className="w-full h-2 rounded-full bg-neutral-950 overflow-hidden p-0.5 border border-neutral-800/80">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-amber-400 shadow-[0_0_12px_rgba(99,102,241,0.6)] transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </motion.div>

            {/* Feature Highlights Grid */}
            <motion.div 
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left mb-6"
            >
              {HIGHLIGHT_CARDS.map((card, idx) => {
                const Icon = card.icon;
                return (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-neutral-900/60 hover:bg-neutral-900/90 border border-neutral-800/80 hover:border-indigo-500/40 transition-all duration-200 flex items-start gap-3 group shadow-sm"
                  >
                    <div className="p-2 rounded-lg bg-indigo-950/80 text-indigo-400 border border-indigo-800/40 group-hover:scale-105 transition-transform shrink-0">
                      <Icon size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <h4 className="text-xs font-bold text-neutral-200 group-hover:text-white transition-colors truncate">
                          {card.title}
                        </h4>
                        <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-neutral-700/60 shrink-0">
                          {card.tag}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed">
                        {card.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </motion.div>

            {/* Launch / Enter Sanctuary Action Button */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center"
            >
              <button
                id="enter-sanctuary-btn"
                onClick={handleDismiss}
                className="w-full sm:w-auto min-w-[220px] px-8 py-3.5 rounded-xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-3 bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-xl shadow-indigo-600/30 active:scale-95 transition-all cursor-pointer border border-indigo-400/30 group"
              >
                <span>Enter Sanctuary</span>
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                <span className="text-[10px] py-0.5 px-1.5 rounded bg-white/20 text-white/90 border border-white/20 font-semibold font-mono ml-1 hidden sm:inline-block">
                  ↵ ENTER
                </span>
              </button>

              {/* Startup Preference Checkbox */}
              <label className="flex items-center gap-2 text-xs text-neutral-400 hover:text-neutral-300 cursor-pointer select-none transition-colors">
                <input
                  type="checkbox"
                  checked={alwaysShowOnStartup}
                  onChange={(e) => {
                    setAlwaysShowOnStartup(e.target.checked);
                    try {
                      localStorage.setItem("proclaim_splash_always_show", String(e.target.checked));
                    } catch {}
                  }}
                  className="w-4 h-4 rounded bg-neutral-800 border-neutral-700 text-indigo-600 focus:ring-indigo-500 accent-indigo-600 cursor-pointer"
                />
                <span>Show splash screen on app launch</span>
              </label>
            </motion.div>

            {/* Bottom Footer Note */}
            <p className="text-[10px] text-neutral-500 mt-5">
              Proclaim Sanctuary Presentation Platform • Press <kbd className="px-1 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-neutral-700 text-[9px]">Space</kbd> or <kbd className="px-1 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-neutral-700 text-[9px]">Enter</kbd> to launch immediately
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
