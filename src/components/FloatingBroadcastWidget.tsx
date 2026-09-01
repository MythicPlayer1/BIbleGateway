"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Radio, Cast, Sparkles, Smartphone, X
} from "lucide-react";
import type { BroadcastTabOption } from "@/components/BroadcastWonderPickerModal";

interface FloatingBroadcastWidgetProps {
  isBroadcasting: boolean;
  connectedClientsCount: number;
  isDisplayConnected: boolean;
  onOpenWonderPicker: (tab?: BroadcastTabOption) => void;
  onOpenProjector?: () => void;
  onOpenRemoteModal?: () => void;
}

export const FloatingBroadcastWidget: React.FC<FloatingBroadcastWidgetProps> = ({
  isBroadcasting,
  connectedClientsCount,
  isDisplayConnected,
  onOpenWonderPicker,
  onOpenProjector,
  onOpenRemoteModal
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const isDraggingRef = useRef(false);
  const dragStartTimeRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handlePointerDown = () => {
    isDraggingRef.current = false;
    dragStartTimeRef.current = Date.now();
  };

  const handleDragStart = () => {
    isDraggingRef.current = true;
  };

  const handleMainButtonClick = () => {
    // If user dragged, don't trigger toggle
    if (isDraggingRef.current) return;
    setIsOpen(prev => !prev);
  };

  const options = [
    {
      id: 'remote_operator',
      label: 'Remote Phone Control',
      subtitle: 'Scan QR / PWA Remote',
      icon: Smartphone,
      color: 'bg-indigo-600 text-white',
      pillBg: 'bg-gradient-to-r from-indigo-500 to-purple-400 text-white font-black shadow-lg shadow-indigo-900/40 ring-1 ring-white/30',
      action: () => {
        if (onOpenRemoteModal) {
          onOpenRemoteModal();
        } else {
          onOpenWonderPicker('internet_room');
        }
      }
    },
    {
      id: 'all_options' as BroadcastTabOption,
      label: 'Broadcast Studio',
      subtitle: isBroadcasting ? `${connectedClientsCount} Connected` : 'Output Options & Projector',
      icon: Sparkles,
      color: 'bg-amber-600 text-white',
      pillBg: 'bg-gradient-to-r from-amber-300 to-yellow-200 text-amber-950 font-black shadow-lg shadow-amber-900/30',
      action: () => onOpenWonderPicker('internet_room')
    }
  ];

  return (
    <motion.div
      ref={containerRef}
      drag
      dragMomentum={false}
      onPointerDown={handlePointerDown}
      onDragStart={handleDragStart}
      className="fixed bottom-8 right-8 z-40 select-none cursor-grab active:cursor-grabbing"
      style={{ touchAction: "none" }}
    >
      {/* Surrounding Speed-Dial Option Pills (Positioned Absolutely to avoid displacing the button) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="absolute bottom-[calc(100%+12px)] right-0 flex flex-col items-end gap-2.5 pointer-events-auto origin-bottom-right whitespace-nowrap"
            initial={{ opacity: 0, scale: 0.85, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 15 }}
            transition={{ type: "spring", stiffness: 380, damping: 26, staggerChildren: 0.04 }}
          >
            {options.map((opt, index) => {
              const Icon = opt.icon;
              return (
                <motion.button
                  key={opt.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    opt.action();
                  }}
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 15, scale: 0.8 }}
                  transition={{ delay: (options.length - 1 - index) * 0.035 }}
                  whileHover={{ scale: 1.05, x: -3 }}
                  whileTap={{ scale: 0.95 }}
                  className={`flex items-center gap-2.5 px-4 py-2.5 rounded-full border border-white/30 transition-all ${opt.pillBg} cursor-pointer group shadow-xl`}
                >
                  <div className="p-1.5 rounded-full bg-black/15 flex items-center justify-center shrink-0">
                    <Icon size={16} className="text-current" />
                  </div>
                  <div className="flex flex-col text-left pr-1">
                    <span className="text-xs font-black tracking-tight leading-tight">
                      {opt.label}
                    </span>
                    <span className="text-[10px] font-semibold opacity-85 leading-none">
                      {opt.subtitle}
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Draggable Floating Action Circle (FAB) */}
      <motion.button
        type="button"
        onClick={handleMainButtonClick}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        className={`relative w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-colors duration-300 border-2 shrink-0 ${
          isOpen
            ? "bg-[#5b4594] text-white border-purple-400/80 shadow-[0_0_30px_rgba(139,92,246,0.5)]"
            : isBroadcasting
              ? "bg-emerald-950 text-emerald-300 border-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.5)] ring-4 ring-emerald-500/20"
              : isDisplayConnected
                ? "bg-indigo-950 text-indigo-200 border-indigo-400 shadow-[0_0_25px_rgba(99,102,241,0.4)]"
                : "bg-neutral-900/95 text-neutral-100 border-neutral-700 hover:border-indigo-500 shadow-black/90"
        }`}
        title="Broadcast Menu (Drag to move, click to open options)"
      >
        {/* Glowing pulse ring when ON AIR */}
        {isBroadcasting && !isOpen && (
          <span className="absolute -inset-1.5 rounded-full bg-emerald-500/30 animate-ping -z-10"></span>
        )}

        {/* Morphing Icon between Cast/Radio and Close 'X' */}
        <motion.div
          animate={{ rotate: isOpen ? 90 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="flex items-center justify-center"
        >
          {isOpen ? (
            <X size={24} className="text-white stroke-[2.5]" />
          ) : isBroadcasting ? (
            <Radio size={24} className="animate-pulse text-emerald-400" />
          ) : (
            <Cast size={24} className="text-indigo-300" />
          )}
        </motion.div>

        {/* Live connected client counter badge on FAB */}
        {isBroadcasting && !isOpen && (
          <span className="absolute -top-1 -right-1 px-1.5 py-0.5 min-w-[20px] h-5 rounded-full bg-emerald-500 text-black text-[10px] font-black flex items-center justify-center shadow-lg border border-black/40">
            {connectedClientsCount}
          </span>
        )}
      </motion.button>
    </motion.div>
  );
};
