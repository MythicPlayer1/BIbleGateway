"use client";

import React from "react";
import { motion } from "framer-motion";
import { Plus, X, Music, BookOpen, Type, Film, Presentation, Globe } from "lucide-react";
import type { Song, ScheduleItemType, SlideLayout, TextAlign, AccentColor, BibleTranslation, PresentationSlide, WebEmbedType } from "@/lib/lyrics";
import { SongItemForm } from "./add-item/SongItemForm";
import { ScriptureItemForm } from "./add-item/ScriptureItemForm";
import { CustomSlideItemForm } from "./add-item/CustomSlideItemForm";
import { MediaItemForm } from "./add-item/MediaItemForm";
import { PdfSlideDeckForm } from "./add-item/PdfSlideDeckForm";
import { WebEmbedItemForm } from "./add-item/WebEmbedItemForm";

export interface NewItemDataState {
  title: string;
  subtitle: string;
  songId: string;
  bookId: number;
  chapter: number;
  verse: number;
  translation?: BibleTranslation;
  translations?: BibleTranslation[];
  slideText: string;
  slideSubtitle: string;
  slideTemplate: string;
  layout: SlideLayout;
  textAlign: TextAlign;
  accentColor: AccentColor;
  qrCodeUrl: string;
  qrCodeFile: File | null;
  bankDetails: string;
  qrBadgeLabel?: string;
  qrInstruction?: string;
  countdownSeconds: number;
  countdownLabel: string;
  mediaType: 'image' | 'video';
  mediaFile: File | null;
  mediaFiles: File[];
  presentationSlides?: PresentationSlide[];
  pdfFile?: File | null;
  embedUrl?: string;
  embedType?: WebEmbedType;
}

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  addItemType: ScheduleItemType;
  setAddItemType: (type: ScheduleItemType) => void;
  newItemData: NewItemDataState;
  setNewItemData: React.Dispatch<React.SetStateAction<NewItemDataState>>;
  modalSongSearch: string;
  setModalSongSearch: (query: string) => void;
  modalFilteredSongs: Song[];
  modalVerses: { verseNumber: number; text: string }[];
  loadingModalVerses: boolean;
  chapterInput: string;
  setChapterInput: (val: string) => void;
  verseInput: string;
  setVerseInput: (val: string) => void;
  timerMinInput: string;
  setTimerMinInput: (val: string) => void;
  timerSecInput: string;
  setTimerSecInput: (val: string) => void;
  updateCountdownTime: (m: number, s: number) => void;
  onAddItemToSchedule: () => void;
  onOpenNewSongModal: () => void;
}

export const AddItemModal: React.FC<AddItemModalProps> = ({
  isOpen,
  onClose,
  addItemType,
  setAddItemType,
  newItemData,
  setNewItemData,
  modalSongSearch,
  setModalSongSearch,
  modalFilteredSongs,
  modalVerses,
  loadingModalVerses,
  chapterInput,
  setChapterInput,
  verseInput,
  setVerseInput,
  timerMinInput,
  setTimerMinInput,
  timerSecInput,
  setTimerSecInput,
  updateCountdownTime,
  onAddItemToSchedule,
  onOpenNewSongModal
}) => {
  if (!isOpen) return null;

  const itemTypes: { id: ScheduleItemType; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'song', label: 'Song', icon: <Music size={16} /> },
    { id: 'scripture', label: 'Scripture', icon: <BookOpen size={16} /> },
    { id: 'slide', label: 'Custom Slide', icon: <Type size={16} /> },
    { id: 'media', label: 'Media / Video', icon: <Film size={16} /> },
    { id: 'presentation', label: 'PDF Slide Deck', icon: <Presentation size={16} />, badge: '🏆 PPT' },
    { id: 'web_embed', label: 'Web Embed', icon: <Globe size={16} />, badge: 'Google / 365' }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-neutral-950 border border-neutral-800 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/60">
          <h3 className="font-bold text-base text-white flex items-center gap-2">
            <Plus size={18} className="text-indigo-400" />
            Add Item to Service Schedule
          </h3>
          <button onClick={onClose} className="text-neutral-400 hover:text-white p-1">
            <X size={20} />
          </button>
        </div>

        {/* Item Type Picker */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {itemTypes.map((item) => {
              const isActive = addItemType === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setAddItemType(item.id)}
                  className={`p-2.5 rounded-2xl border flex flex-col items-center justify-center gap-1.5 font-bold text-xs transition-all relative ${isActive
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-850'
                    }`}
                >
                  {item.icon}
                  <span className="truncate text-[11px]">{item.label}</span>
                  {item.badge && (
                    <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-black/40 text-indigo-200">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Subcomponent Forms */}
          {addItemType === 'song' && (
            <SongItemForm
              modalSongSearch={modalSongSearch}
              setModalSongSearch={setModalSongSearch}
              modalFilteredSongs={modalFilteredSongs}
              newItemData={newItemData}
              setNewItemData={setNewItemData}
              onOpenNewSongModal={onOpenNewSongModal}
              onCloseModal={onClose}
            />
          )}

          {addItemType === 'scripture' && (
            <ScriptureItemForm
              newItemData={newItemData}
              setNewItemData={setNewItemData}
              modalVerses={modalVerses}
              loadingModalVerses={loadingModalVerses}
              chapterInput={chapterInput}
              setChapterInput={setChapterInput}
              verseInput={verseInput}
              setVerseInput={setVerseInput}
            />
          )}

          {addItemType === 'slide' && (
            <CustomSlideItemForm
              newItemData={newItemData}
              setNewItemData={setNewItemData}
              timerMinInput={timerMinInput}
              setTimerMinInput={setTimerMinInput}
              timerSecInput={timerSecInput}
              setTimerSecInput={setTimerSecInput}
              updateCountdownTime={updateCountdownTime}
            />
          )}

          {addItemType === 'media' && (
            <MediaItemForm
              newItemData={newItemData}
              setNewItemData={setNewItemData}
            />
          )}

          {addItemType === 'presentation' && (
            <PdfSlideDeckForm
              newItemData={newItemData}
              setNewItemData={setNewItemData}
            />
          )}

          {addItemType === 'web_embed' && (
            <WebEmbedItemForm
              newItemData={newItemData}
              setNewItemData={setNewItemData}
            />
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-800 bg-neutral-900/60 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-neutral-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onAddItemToSchedule}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30 active:scale-95 transition-all"
          >
            Add to Schedule
          </button>
        </div>
      </motion.div>
    </div>
  );
};
