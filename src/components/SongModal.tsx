"use client";

import React, { useRef } from "react";
import { motion } from "framer-motion";
import { Music, X, Check } from "lucide-react";
import type { Song } from "@/lib/lyrics";

interface SongModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingSongId: string | null;
  songFormData: Partial<Song>;
  setSongFormData: React.Dispatch<React.SetStateAction<Partial<Song>>>;
  onSaveSong: (addToSchedule?: boolean) => void;
}

export const SongModal: React.FC<SongModalProps> = ({
  isOpen,
  onClose,
  editingSongId,
  songFormData,
  setSongFormData,
  onSaveSong
}) => {
  const lyricsTextareaRef = useRef<HTMLTextAreaElement>(null);

  if (!isOpen) return null;

  const insertTagAtCursor = (tag: string) => {
    if (!lyricsTextareaRef.current) {
      setSongFormData(prev => ({
        ...prev,
        rawLyrics: prev.rawLyrics ? `${prev.rawLyrics}\n\n${tag}\n` : `${tag}\n`
      }));
      return;
    }
    const ta = lyricsTextareaRef.current;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const text = ta.value;
    const insertText = (start > 0 && text[start - 1] !== '\n' ? '\n\n' : '') + tag + '\n';
    const nextVal = text.substring(0, start) + insertText + text.substring(end);
    setSongFormData(prev => ({ ...prev, rawLyrics: nextVal }));
    setTimeout(() => {
      ta.focus();
      ta.selectionStart = ta.selectionEnd = start + insertText.length;
    }, 10);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-neutral-950 border border-neutral-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/60">
          <h3 className="font-bold text-base text-white flex items-center gap-2">
            <Music size={18} className="text-indigo-400" />
            {editingSongId ? 'Edit Worship Song' : 'Write / Create New Song'}
          </h3>
          <button onClick={onClose} className="text-neutral-400 hover:text-white p-1">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-neutral-400 uppercase mb-1">Song Title *</label>
              <input
                type="text"
                value={songFormData.title || ''}
                onChange={(e) => setSongFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g. धन्यवाद धन्यवाद or Amazing Grace"
                className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-400 uppercase mb-1">Artist / Author</label>
              <input
                type="text"
                value={songFormData.artist || ''}
                onChange={(e) => setSongFormData(prev => ({ ...prev, artist: e.target.value }))}
                placeholder="e.g. Worship Team / Traditional"
                className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
              <label className="block text-xs font-bold text-neutral-400 uppercase">Lyrics (Formatted with Section Tags)</label>
              <div className="flex flex-wrap gap-1">
                {['[कोरस]', '[पद १]', '[पद २]', '[Chorus]', '[Verse 1]', '[Verse 2]', '[Bridge]'].map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => insertTagAtCursor(tag)}
                    className="px-2 py-0.5 bg-neutral-800 hover:bg-indigo-600 text-neutral-300 hover:text-white rounded text-[11px] font-semibold transition-colors"
                    title={`Insert ${tag} at cursor position`}
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>
            <textarea
              ref={lyricsTextareaRef}
              rows={10}
              value={songFormData.rawLyrics || ''}
              onChange={(e) => setSongFormData(prev => ({ ...prev, rawLyrics: e.target.value }))}
              placeholder={`[कोरस]\nयहाँ कोरस लेख्नुहोस्\n\n[पद १]\nयहाँ पद १ लेख्नुहोस्`}
              className="w-full bg-neutral-900 border border-neutral-700 rounded-xl p-4 text-sm text-white font-mono leading-relaxed focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-neutral-800 bg-neutral-900/60 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-neutral-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSaveSong(false)}
            className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 rounded-xl text-xs font-bold transition-all"
          >
            Save to Library Only
          </button>
          <button
            type="button"
            onClick={() => onSaveSong(true)}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 active:scale-95 transition-all"
          >
            <Check size={16} />
            Save & Add to Schedule
          </button>
        </div>
      </motion.div>
    </div>
  );
};
