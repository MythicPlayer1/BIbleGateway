"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Info } from "lucide-react";

interface ToastProps {
  message: string | null;
}

export const Toast: React.FC<ToastProps> = ({ message }) => {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="fixed bottom-6 right-6 z-50 max-w-sm bg-neutral-900/95 backdrop-blur-md border border-neutral-700 text-neutral-200 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3"
        >
          <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl shrink-0">
            <Info size={18} />
          </div>
          <p className="text-xs font-medium leading-relaxed">{message}</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
