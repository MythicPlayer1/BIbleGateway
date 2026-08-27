"use client";

import React from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Trash2, Info, X } from "lucide-react";

export interface ConfirmModalConfig {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  onConfirm: () => void;
  onCancel?: () => void;
}

interface ConfirmModalProps {
  config: ConfirmModalConfig | null;
  onClose: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({ config, onClose }) => {
  if (!config || !config.isOpen) return null;

  const variant = config.variant || "danger";

  const getIcon = () => {
    switch (variant) {
      case "danger":
        return <Trash2 size={22} className="text-red-400" />;
      case "warning":
        return <AlertTriangle size={22} className="text-amber-400" />;
      default:
        return <Info size={22} className="text-indigo-400" />;
    }
  };

  const getIconBg = () => {
    switch (variant) {
      case "danger":
        return "bg-red-950/80 border-red-500/30 text-red-400";
      case "warning":
        return "bg-amber-950/80 border-amber-500/30 text-amber-400";
      default:
        return "bg-indigo-950/80 border-indigo-500/30 text-indigo-400";
    }
  };

  const getConfirmButtonClass = () => {
    switch (variant) {
      case "danger":
        return "bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30";
      case "warning":
        return "bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/30";
      default:
        return "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30";
    }
  };

  const handleConfirm = () => {
    config.onConfirm();
    onClose();
  };

  const handleCancel = () => {
    if (config.onCancel) config.onCancel();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-neutral-950 border border-neutral-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-5"
      >
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-2xl border flex items-center justify-center shrink-0 ${getIconBg()}`}>
            {getIcon()}
          </div>
          <div className="flex-1 min-w-0 pr-2">
            <h3 className="font-bold text-base text-white">{config.title}</h3>
            <p className="text-xs text-neutral-400 mt-1 leading-relaxed">{config.message}</p>
          </div>
          <button
            onClick={handleCancel}
            className="text-neutral-500 hover:text-white p-1 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-neutral-800/80">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded-xl text-xs font-bold transition-all"
          >
            {config.cancelText || "Cancel"}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${getConfirmButtonClass()}`}
          >
            {config.confirmText || "Confirm"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
