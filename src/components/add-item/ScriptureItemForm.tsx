"use client";

import React from "react";
import { books } from "@/lib/books";
import { BIBLE_TRANSLATIONS, type BibleTranslation } from "@/lib/lyrics";
import type { NewItemDataState } from "../AddItemModal";

interface ScriptureItemFormProps {
  newItemData: NewItemDataState;
  setNewItemData: React.Dispatch<React.SetStateAction<NewItemDataState>>;
  modalVerses: { verseNumber: number; text: string }[];
  loadingModalVerses: boolean;
  chapterInput: string;
  setChapterInput: (val: string) => void;
  verseInput: string;
  setVerseInput: (val: string) => void;
}

export const ScriptureItemForm: React.FC<ScriptureItemFormProps> = ({
  newItemData,
  setNewItemData,
  modalVerses,
  loadingModalVerses,
  chapterInput,
  setChapterInput,
  verseInput,
  setVerseInput
}) => {
  const modalBook = books.find(b => b.id === newItemData.bookId) || books[0];
  const modalMaxChapters = modalBook?.chapters || 1;
  const modalMaxVerses = modalVerses.length > 0 ? modalVerses.length : 150;
  const currentVerseText = modalVerses.find(v => v.verseNumber === Math.max(1, newItemData.verse || 1))?.text;
  const currentTransList = newItemData.translations && newItemData.translations.length > 0
    ? newItemData.translations
    : [newItemData.translation || 'nepali'];
  const isDual = currentTransList.length === 2;

  const toggleTranslation = (tId: BibleTranslation) => {
    setNewItemData(prev => {
      const current = prev.translations && prev.translations.length > 0
        ? prev.translations
        : [prev.translation || 'nepali'];

      let next: BibleTranslation[];
      if (current.includes(tId)) {
        if (current.length === 1) return prev;
        next = current.filter(t => t !== tId);
      } else {
        if (current.length < 2) {
          next = [...current, tId];
        } else {
          next = [current[0], tId];
        }
      }
      return {
        ...prev,
        translation: next[0],
        translations: next
      };
    });
  };

  return (
    <div className="space-y-4">
      {/* Translation Selector Switcher */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-bold text-neutral-400 uppercase">
            Bible Translation (संस्करण)
          </label>
          <span className="text-[10px] text-neutral-500">
            {isDual ? 'Dual Display (Top / Down)' : 'Click to select up to 2'}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2 bg-neutral-900/90 p-1.5 rounded-xl border border-neutral-800">
          {BIBLE_TRANSLATIONS.map(trans => {
            const isSelected = currentTransList.includes(trans.id);
            const rank = currentTransList.indexOf(trans.id) + 1;
            return (
              <button
                key={trans.id}
                type="button"
                onClick={() => toggleTranslation(trans.id)}
                className={`py-2 px-2 rounded-lg text-xs font-bold text-center transition-all ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/80'
                }`}
                title={`${trans.description} (Click to toggle)`}
              >
                <div className="flex items-center justify-center gap-1">
                  <p className="truncate">{trans.shortName}</p>
                  {isDual && isSelected && (
                    <span className="text-[9px] px-1 py-0.2 bg-black/40 rounded font-mono">
                      {rank === 1 ? 'Top' : 'Down'}
                    </span>
                  )}
                </div>
                <p className={`text-[10px] font-normal truncate ${isSelected ? 'text-indigo-200' : 'text-neutral-500'}`}>
                  {trans.language}
                </p>
              </button>
            );
          })}
        </div>
      </div>
      {/* Book Selector */}
      <div>
        <label className="block text-xs font-bold text-neutral-400 uppercase mb-1.5">
          Bible Book (६६ पुस्तकहरू)
        </label>
        <select
          value={newItemData.bookId}
          onChange={(e) => {
            const newBookId = Number(e.target.value);
            setChapterInput("1");
            setVerseInput("1");
            setNewItemData(prev => ({ ...prev, bookId: newBookId, chapter: 1, verse: 1 }));
          }}
          className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
        >
          {books.map(b => (
            <option key={b.id} value={b.id}>
              {b.name} ({b.englishName}) — {b.chapters} Chapters
            </option>
          ))}
        </select>
      </div>

      {/* Chapter & Verse Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Chapter Dropdown + Manual Input */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold text-neutral-400 uppercase">
              Chapter (१ - {modalMaxChapters})
            </label>
            <span className="text-[10px] text-neutral-500 font-mono">Max: {modalMaxChapters}</span>
          </div>
          <div className="flex gap-2">
            <select
              value={Math.max(1, Math.min(modalMaxChapters, newItemData.chapter || 1))}
              onChange={(e) => {
                const val = Math.max(1, Math.min(modalMaxChapters, parseInt(e.target.value, 10) || 1));
                setChapterInput(val.toString());
                setVerseInput("1");
                setNewItemData(prev => ({ ...prev, chapter: val, verse: 1 }));
              }}
              className="flex-1 bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2.5 text-xs md:text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              {Array.from({ length: modalMaxChapters }, (_, i) => i + 1).map(c => (
                <option key={c} value={c}>Chapter {c}</option>
              ))}
            </select>
            <div className="w-20 shrink-0">
              <input
                type="number"
                min={1}
                max={modalMaxChapters}
                value={chapterInput}
                onChange={(e) => {
                  const raw = e.target.value;
                  setChapterInput(raw);
                  if (raw === '') return;
                  const parsed = parseInt(raw, 10);
                  if (!isNaN(parsed) && parsed >= 1) {
                    const clamped = Math.min(modalMaxChapters, parsed);
                    setNewItemData(prev => ({ ...prev, chapter: clamped, verse: 1 }));
                  }
                }}
                onBlur={() => {
                  let parsed = parseInt(chapterInput, 10);
                  if (isNaN(parsed) || parsed < 1) parsed = 1;
                  const clamped = Math.min(modalMaxChapters, parsed);
                  setChapterInput(clamped.toString());
                  setNewItemData(prev => ({ ...prev, chapter: clamped, verse: 1 }));
                }}
                placeholder="Ch #"
                className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-2 py-2.5 text-xs md:text-sm text-white text-center font-mono outline-none focus:ring-2 focus:ring-indigo-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                title="Type chapter number"
              />
            </div>
          </div>
        </div>

        {/* Verse Dropdown + Manual Input */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold text-neutral-400 uppercase">
              Verse {modalVerses.length > 0 ? `(१ - ${modalVerses.length})` : '(Starts at 1)'}
            </label>
            <span className="text-[10px] text-neutral-500 font-mono">
              {loadingModalVerses ? 'Loading...' : `${modalVerses.length || 0} Verses`}
            </span>
          </div>
          <div className="flex gap-2">
            <select
              value={Math.max(1, Math.min(modalMaxVerses, newItemData.verse || 1))}
              onChange={(e) => {
                const val = Math.max(1, Math.min(modalMaxVerses, parseInt(e.target.value, 10) || 1));
                setVerseInput(val.toString());
                setNewItemData(prev => ({ ...prev, verse: val }));
              }}
              disabled={loadingModalVerses}
              className="flex-1 bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2.5 text-xs md:text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500 font-medium disabled:opacity-50"
            >
              {(modalVerses.length > 0 
                ? modalVerses.map(v => v.verseNumber) 
                : Array.from({ length: 30 }, (_, i) => i + 1)
              ).map(vNum => (
                <option key={vNum} value={vNum}>Verse {vNum}</option>
              ))}
            </select>
            <div className="w-20 shrink-0">
              <input
                type="number"
                min={1}
                max={modalMaxVerses}
                value={verseInput}
                onChange={(e) => {
                  const raw = e.target.value;
                  setVerseInput(raw);
                  if (raw === '') return;
                  const parsed = parseInt(raw, 10);
                  if (!isNaN(parsed) && parsed >= 1) {
                    const clamped = Math.min(modalMaxVerses, parsed);
                    setNewItemData(prev => ({ ...prev, verse: clamped }));
                  }
                }}
                onBlur={() => {
                  let parsed = parseInt(verseInput, 10);
                  if (isNaN(parsed) || parsed < 1) parsed = 1;
                  const clamped = Math.min(modalMaxVerses, parsed);
                  setVerseInput(clamped.toString());
                  setNewItemData(prev => ({ ...prev, verse: clamped }));
                }}
                placeholder="Vs #"
                className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-2 py-2.5 text-xs md:text-sm text-white text-center font-mono outline-none focus:ring-2 focus:ring-indigo-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                title="Type verse number"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Verse Text Preview */}
      <div className="p-3.5 bg-neutral-900/90 rounded-xl border border-neutral-800 space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-bold text-indigo-400">
          <span>{modalBook.name} {newItemData.chapter}:{newItemData.verse}</span>
          <span className="text-neutral-500 font-mono text-[10px]">
            {loadingModalVerses ? 'Fetching scripture...' : isDual ? `${currentTransList.map(t => t.toUpperCase()).join(' + ')}` : 'Ready to add'}
          </span>
        </div>
        <div className="text-xs text-neutral-300 leading-relaxed">
          {loadingModalVerses ? (
            <span className="text-neutral-500 italic">Loading verse text...</span>
          ) : currentVerseText ? (
            currentVerseText.includes('\n───\n') ? (
              <div className="space-y-1">
                <p className="font-medium text-white">{currentVerseText.split('\n───\n')[0]}</p>
                <div className="border-t border-neutral-800 my-1"></div>
                <p className="text-neutral-400 italic text-[11px]">{currentVerseText.split('\n───\n')[1]}</p>
              </div>
            ) : (
              <p>{currentVerseText}</p>
            )
          ) : (
            <span className="text-neutral-500 italic">No text found for this verse number.</span>
          )}
        </div>
      </div>
    </div>
  );
};
