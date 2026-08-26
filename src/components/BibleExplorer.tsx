"use client";

import React from "react";
import { BookOpen, ChevronDown, Plus, Globe } from "lucide-react";
import { books } from "@/lib/books";
import { BIBLE_TRANSLATIONS, type BibleTranslation } from "@/lib/lyrics";

interface BibleExplorerProps {
  selectedBook: number;
  selectedChapter: number;
  selectedVerse: number;
  bibleTranslation?: BibleTranslation;
  selectedTranslations?: BibleTranslation[];
  verses: { verseNumber: number; text: string }[];
  loading: boolean;
  totalChapters: number;
  onSelectBook: (bookId: number) => void;
  onSelectChapter: (chapter: number) => void;
  onSelectVerse: (verse: number) => void;
  onSelectTranslation?: (translation: BibleTranslation) => void;
  onToggleTranslation?: (translation: BibleTranslation) => void;
  onAddToSchedule: () => void;
}

export const BibleExplorer: React.FC<BibleExplorerProps> = ({
  selectedBook,
  selectedChapter,
  selectedVerse,
  bibleTranslation = 'nepali',
  selectedTranslations = ['nepali'],
  verses,
  loading,
  totalChapters,
  onSelectBook,
  onSelectChapter,
  onSelectVerse,
  onSelectTranslation,
  onToggleTranslation,
  onAddToSchedule
}) => {
  const currentBook = books.find(b => b.id === selectedBook) || books[0];
  const activeTransList = selectedTranslations && selectedTranslations.length > 0
    ? selectedTranslations
    : [bibleTranslation || 'nepali'];
  const isDual = activeTransList.length === 2;

  const handleTransClick = (tId: BibleTranslation) => {
    if (onToggleTranslation) {
      onToggleTranslation(tId);
    } else if (onSelectTranslation) {
      onSelectTranslation(tId);
    }
  };

  return (
    <div className="bg-[#0e0e0e] p-6 rounded-3xl border border-neutral-800 shadow-xl space-y-5">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 text-indigo-400">
            <BookOpen size={18} />
            Scripture Explorer
          </h2>

          {/* Translation Multi-Select Switcher */}
          <div className="flex items-center gap-1.5 bg-neutral-900/90 p-1 rounded-xl border border-neutral-800">
            {BIBLE_TRANSLATIONS.map(trans => {
              const isSelected = activeTransList.includes(trans.id);
              const rank = activeTransList.indexOf(trans.id) + 1;
              return (
                <button
                  key={trans.id}
                  type="button"
                  onClick={() => handleTransClick(trans.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/80'
                  }`}
                  title={`${trans.description} (Click to toggle)`}
                >
                  <span>{trans.shortName}</span>
                  {isDual && isSelected && (
                    <span className="text-[10px] px-1 py-0.2 bg-black/40 rounded font-mono">
                      {rank === 1 ? 'Top' : 'Down'}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dual Translation Mode Indicator */}
        <div className="flex items-center justify-between text-[11px] px-1 text-neutral-400">
          <span>
            {isDual ? (
              <span className="text-indigo-400 font-semibold flex items-center gap-1">
                <Globe size={13} />
                Dual Translation Active: <strong>{activeTransList[0]?.toUpperCase()} (Top)</strong> + <strong>{activeTransList[1]?.toUpperCase()} (Down)</strong>
              </span>
            ) : (
              <span className="text-neutral-500">
                💡 Click any 2 translations to show both on screen (Top & Down)
              </span>
            )}
          </span>
        </div>
      </div>
      
      <div className="space-y-4">
        {/* Book Selector */}
        <div>
          <label className="block text-xs font-semibold text-neutral-400 mb-1.5 uppercase">
            Book ({currentBook.id < 39 ? 'Old Testament' : 'New Testament'})
          </label>
          <div className="relative">
            <select 
              value={selectedBook} 
              onChange={(e) => onSelectBook(Number(e.target.value))}
              className="w-full appearance-none bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 pr-10 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-neutral-100 font-medium text-sm"
            >
              <optgroup label="Old Testament (पुरानो करार)">
                {books.filter(b => b.id < 39).map(book => (
                  <option key={book.id} value={book.id}>
                    {book.name} ({book.englishName})
                  </option>
                ))}
              </optgroup>
              <optgroup label="New Testament (नयाँ करार)">
                {books.filter(b => b.id >= 39).map(book => (
                  <option key={book.id} value={book.id}>
                    {book.name} ({book.englishName})
                  </option>
                ))}
              </optgroup>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-neutral-400">
              <ChevronDown size={16} />
            </div>
          </div>
        </div>

        {/* Chapter & Verse Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-1.5 uppercase">Chapter</label>
            <div className="relative">
              <select 
                value={selectedChapter} 
                onChange={(e) => onSelectChapter(Number(e.target.value))}
                className="w-full appearance-none bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 pr-10 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-neutral-100 font-medium text-sm"
              >
                {Array.from({ length: totalChapters }, (_, i) => i + 1).map(c => (
                  <option key={c} value={c}>Chapter {c}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-neutral-400">
                <ChevronDown size={16} />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-1.5 uppercase">Verse</label>
            <div className="relative">
              <select 
                value={selectedVerse} 
                onChange={(e) => onSelectVerse(Number(e.target.value))}
                className="w-full appearance-none bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 pr-10 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-neutral-100 font-medium text-sm"
                disabled={verses.length === 0}
              >
                {verses.length > 0 ? (
                  verses.map(v => (
                    <option key={v.verseNumber} value={v.verseNumber}>Verse {v.verseNumber}</option>
                  ))
                ) : (
                  <option value={1}>Loading verses...</option>
                )}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-neutral-400">
                <ChevronDown size={16} />
              </div>
            </div>
          </div>
        </div>

        {/* Verses Preview List */}
        {verses.length > 0 && (
          <div className="space-y-2 pt-2">
            <label className="block text-xs font-semibold text-neutral-400 uppercase flex items-center justify-between">
              <span>{currentBook.name} {selectedChapter} Verses</span>
              {isDual && (
                <span className="text-[10px] text-indigo-400 font-normal">Showing {activeTransList.map(t => t.toUpperCase()).join(' + ')}</span>
              )}
            </label>
            <div className="max-h-52 overflow-y-auto pr-1 space-y-1.5 bg-neutral-950/60 p-2.5 rounded-xl border border-neutral-800">
              {verses.map(v => {
                const isSelected = v.verseNumber === selectedVerse;
                const isDualText = v.text.includes('\n───\n');
                const [top, bottom] = isDualText ? v.text.split('\n───\n') : [v.text, ''];

                return (
                  <div
                    key={v.verseNumber}
                    onClick={() => onSelectVerse(v.verseNumber)}
                    className={`p-2.5 rounded-xl text-xs cursor-pointer transition-all flex items-start gap-2.5 ${
                      isSelected 
                        ? 'bg-indigo-950/90 border border-indigo-500/50 text-white shadow-sm' 
                        : 'hover:bg-neutral-900 text-neutral-300'
                    }`}
                  >
                    <span className={`font-mono font-bold shrink-0 px-1.5 py-0.5 rounded text-[10px] ${
                      isSelected ? 'bg-indigo-600 text-white' : 'bg-neutral-800 text-neutral-400'
                    }`}>
                      {v.verseNumber}
                    </span>
                    <div className="flex-1 space-y-1 overflow-hidden">
                      <p className="leading-relaxed font-medium">{top}</p>
                      {bottom && (
                        <p className="leading-relaxed text-neutral-400 italic text-[11px] border-t border-neutral-800/80 pt-1">
                          {bottom}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="pt-2 border-t border-neutral-800 flex items-center justify-end">
          <button
            type="button"
            onClick={onAddToSchedule}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md shadow-indigo-600/30 active:scale-95 transition-all"
          >
            <Plus size={15} />
            Add This Verse to Service Schedule
          </button>
        </div>
      </div>
    </div>
  );
};
