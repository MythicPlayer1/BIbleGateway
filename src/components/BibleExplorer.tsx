"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { 
  BookOpen, ChevronDown, Plus, Globe, Check, 
  Search, Star, Clock, Sparkles, Layers, ArrowRight, 
  Trash2, Bookmark, X, Tag
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { books, Book } from "@/lib/books";
import { BIBLE_TRANSLATIONS, type BibleTranslation } from "@/lib/lyrics";
import { parseBibleReference, ParsedBibleReference } from "@/lib/bibleReference";

export interface BibleBookmarkItem {
  id: string;
  bookId: number;
  bookName: string;
  bookEnglishName: string;
  chapter: number;
  startVerse: number;
  endVerse?: number;
  label?: string;
  snippet?: string;
  createdAt: number;
}

export interface BibleRecentItem {
  id: string;
  bookId: number;
  bookName: string;
  bookEnglishName: string;
  chapter: number;
  startVerse: number;
  endVerse?: number;
  timestamp: number;
}

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
  onAddToSchedule: (options?: {
    startVerse?: number;
    endVerse?: number;
    versesData?: { verseNumber: number; text: string }[];
  }) => void;
}

type ExplorerTab = "explorer" | "bookmarks" | "recents";

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

  // Active Explorer Tab
  const [activeTab, setActiveTab] = useState<ExplorerTab>("explorer");

  // Feature 1: Multi-Verse Range Selection State
  const [isRangeMode, setIsRangeMode] = useState<boolean>(false);
  const [rangeEndVerse, setRangeEndVerse] = useState<number>(selectedVerse);

  // Feature 2: Quick Jump Reference Query
  const [quickJumpQuery, setQuickJumpQuery] = useState<string>("");
  const parsedQuickRef: ParsedBibleReference | null = useMemo(() => {
    return parseBibleReference(quickJumpQuery);
  }, [quickJumpQuery]);

  // Feature 5: Bookmarks and Recents History
  const [bookmarks, setBookmarks] = useState<BibleBookmarkItem[]>([]);
  const [recents, setRecents] = useState<BibleRecentItem[]>([]);
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
  const [customBookmarkLabel, setCustomBookmarkLabel] = useState("");

  // Map to hold verse element references for smooth auto-scrolling
  const verseItemRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const verseListContainerRef = useRef<HTMLDivElement>(null);

  // Load Bookmarks and Recents from LocalStorage on mount
  useEffect(() => {
    try {
      const savedBookmarks = localStorage.getItem("worship_bible_favorites");
      if (savedBookmarks) setBookmarks(JSON.parse(savedBookmarks));

      const savedRecents = localStorage.getItem("worship_bible_recents");
      if (savedRecents) setRecents(JSON.parse(savedRecents));
    } catch {}
  }, []);

  // Save Bookmarks
  const saveBookmarks = (items: BibleBookmarkItem[]) => {
    setBookmarks(items);
    try {
      localStorage.setItem("worship_bible_favorites", JSON.stringify(items));
    } catch {}
  };

  // Save Recents
  const saveRecents = (items: BibleRecentItem[]) => {
    setRecents(items);
    try {
      localStorage.setItem("worship_bible_recents", JSON.stringify(items));
    } catch {}
  };

  // Record Recent Scripture on Selection Change
  useEffect(() => {
    if (!currentBook) return;
    const recentId = `${selectedBook}_${selectedChapter}_${selectedVerse}`;
    const newRecent: BibleRecentItem = {
      id: recentId,
      bookId: selectedBook,
      bookName: currentBook.name,
      bookEnglishName: currentBook.englishName,
      chapter: selectedChapter,
      startVerse: selectedVerse,
      endVerse: isRangeMode && rangeEndVerse > selectedVerse ? rangeEndVerse : undefined,
      timestamp: Date.now()
    };

    setRecents(prev => {
      const filtered = prev.filter(item => !(item.bookId === selectedBook && item.chapter === selectedChapter && item.startVerse === selectedVerse));
      const updated = [newRecent, ...filtered].slice(0, 25);
      try {
        localStorage.setItem("worship_bible_recents", JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, [selectedBook, selectedChapter, selectedVerse, isRangeMode, rangeEndVerse, currentBook]);

  // Keep rangeEndVerse in valid bounds
  useEffect(() => {
    if (rangeEndVerse < selectedVerse) {
      setRangeEndVerse(selectedVerse);
    }
  }, [selectedVerse, rangeEndVerse]);

  // Smoothly auto-scroll to the active verse when selectedVerse changes
  useEffect(() => {
    const activeEl = verseItemRefs.current.get(selectedVerse);
    if (activeEl) {
      activeEl.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest'
      });
    }
  }, [selectedVerse, selectedChapter, selectedBook]);

  // Check if current verse / passage is bookmarked
  const currentBookmark = useMemo(() => {
    return bookmarks.find(b => 
      b.bookId === selectedBook && 
      b.chapter === selectedChapter && 
      b.startVerse === selectedVerse &&
      (!isRangeMode || b.endVerse === rangeEndVerse)
    );
  }, [bookmarks, selectedBook, selectedChapter, selectedVerse, isRangeMode, rangeEndVerse]);

  const isCurrentBookmarked = !!currentBookmark;

  const handleToggleBookmark = () => {
    if (isCurrentBookmarked) {
      const updated = bookmarks.filter(b => b.id !== currentBookmark.id);
      saveBookmarks(updated);
    } else {
      const currentVerseObj = verses.find(v => v.verseNumber === selectedVerse);
      const newBookmark: BibleBookmarkItem = {
        id: `bm-${Date.now()}`,
        bookId: selectedBook,
        bookName: currentBook.name,
        bookEnglishName: currentBook.englishName,
        chapter: selectedChapter,
        startVerse: selectedVerse,
        endVerse: isRangeMode && rangeEndVerse > selectedVerse ? rangeEndVerse : undefined,
        label: customBookmarkLabel.trim() || undefined,
        snippet: currentVerseObj?.text?.slice(0, 90),
        createdAt: Date.now()
      };
      saveBookmarks([newBookmark, ...bookmarks]);
      setCustomBookmarkLabel("");
      setIsLabelModalOpen(false);
    }
  };

  const handleDeleteBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    saveBookmarks(bookmarks.filter(b => b.id !== id));
  };

  const handleClearRecents = () => {
    saveRecents([]);
  };

  // Feature 2: Execute Quick Jump
  const handleExecuteQuickJump = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!parsedQuickRef) return;

    onSelectBook(parsedQuickRef.bookId);
    onSelectChapter(parsedQuickRef.chapter);
    onSelectVerse(parsedQuickRef.startVerse);

    if (parsedQuickRef.endVerse && parsedQuickRef.endVerse > parsedQuickRef.startVerse) {
      setIsRangeMode(true);
      setRangeEndVerse(parsedQuickRef.endVerse);
    } else {
      setIsRangeMode(false);
      setRangeEndVerse(parsedQuickRef.startVerse);
    }

    setQuickJumpQuery("");
    setActiveTab("explorer");
  };

  // Jump from Bookmark / Recent item
  const handleJumpToSavedItem = (item: BibleBookmarkItem | BibleRecentItem) => {
    onSelectBook(item.bookId);
    onSelectChapter(item.chapter);
    onSelectVerse(item.startVerse);
    if (item.endVerse && item.endVerse > item.startVerse) {
      setIsRangeMode(true);
      setRangeEndVerse(item.endVerse);
    } else {
      setIsRangeMode(false);
      setRangeEndVerse(item.startVerse);
    }
    setActiveTab("explorer");
  };

  // Verse click handling with Shift+click range selection
  const handleVerseItemClick = (verseNum: number, e: React.MouseEvent) => {
    if (e.shiftKey) {
      setIsRangeMode(true);
      if (verseNum >= selectedVerse) {
        setRangeEndVerse(verseNum);
      } else {
        setRangeEndVerse(selectedVerse);
        onSelectVerse(verseNum);
      }
    } else {
      onSelectVerse(verseNum);
      if (isRangeMode && verseNum > rangeEndVerse) {
        setRangeEndVerse(verseNum);
      }
    }
  };

  const handleTransClick = (tId: BibleTranslation) => {
    if (onToggleTranslation) {
      onToggleTranslation(tId);
    } else if (onSelectTranslation) {
      onSelectTranslation(tId);
    }
  };

  // Number of verses in current active range
  const activeVerseRangeCount = isRangeMode ? Math.max(1, rangeEndVerse - selectedVerse + 1) : 1;

  return (
    <div className="bg-[#0e0e0e] p-6 rounded-3xl border border-neutral-800 shadow-xl space-y-5">
      {/* Header & Tabs */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 text-indigo-400">
              <BookOpen size={18} />
              <span>Scripture Explorer</span>
            </h2>

            {/* Quick Star Bookmark Button */}
            <button
              type="button"
              onClick={handleToggleBookmark}
              className={`p-1.5 rounded-xl border transition-all flex items-center gap-1 text-xs font-bold ${
                isCurrentBookmarked
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm"
                  : "bg-neutral-900 text-neutral-400 hover:text-amber-300 hover:bg-neutral-800 border-neutral-800"
              }`}
              title={isCurrentBookmarked ? "Remove from Bookmarks" : "Star / Bookmark this scripture"}
            >
              <Star size={14} className={isCurrentBookmarked ? "fill-amber-400 text-amber-400" : ""} />
              <span className="text-[11px] hidden sm:inline">
                {isCurrentBookmarked ? "Bookmarked" : "Star"}
              </span>
            </button>
          </div>

          {/* Navigation Segment Tabs */}
          <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-xl border border-neutral-800">
            <button
              type="button"
              onClick={() => setActiveTab("explorer")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "explorer"
                  ? "bg-indigo-600 text-white shadow-md"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <BookOpen size={13} />
              <span>Explorer</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("bookmarks")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "bookmarks"
                  ? "bg-amber-600 text-white shadow-md"
                  : "text-neutral-400 hover:text-amber-300"
              }`}
            >
              <Star size={13} className={bookmarks.length > 0 ? "fill-amber-400" : ""} />
              <span>Bookmarks ({bookmarks.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("recents")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "recents"
                  ? "bg-neutral-800 text-white shadow-md"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <Clock size={13} />
              <span>History ({recents.length})</span>
            </button>
          </div>
        </div>

        {/* FEATURE 2: ⚡ Quick Reference Jump Bar */}
        {activeTab === "explorer" && (
          <form onSubmit={handleExecuteQuickJump} className="relative">
            <div className="relative flex items-center">
              <div className="absolute left-3.5 text-indigo-400 pointer-events-none">
                <Search size={15} />
              </div>
              <input
                type="text"
                value={quickJumpQuery}
                onChange={(e) => setQuickJumpQuery(e.target.value)}
                placeholder="⚡ Quick Jump (e.g. Jn 3:16, Gen 1, भजन २३:१-६, 1 Cor 13, Rom 8:28)..."
                className="w-full bg-neutral-900/90 border border-neutral-700/80 rounded-2xl pl-10 pr-24 py-2.5 text-xs text-white placeholder-neutral-500 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              />
              {quickJumpQuery && (
                <button
                  type="button"
                  onClick={() => setQuickJumpQuery("")}
                  className="absolute right-20 text-neutral-400 hover:text-white p-1"
                >
                  <X size={13} />
                </button>
              )}
              <button
                type="submit"
                disabled={!parsedQuickRef}
                className={`absolute right-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                  parsedQuickRef
                    ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30"
                    : "bg-neutral-800 text-neutral-500 cursor-not-allowed"
                }`}
              >
                <span>Jump</span>
                <ArrowRight size={12} />
              </button>
            </div>

            {/* Live Parsing Preview Pill */}
            {parsedQuickRef && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 px-3 py-1.5 bg-indigo-950/80 border border-indigo-500/40 rounded-xl flex items-center justify-between text-xs text-indigo-200"
              >
                <div className="flex items-center gap-2">
                  <Sparkles size={13} className="text-indigo-400" />
                  <span>
                    Detected: <strong>{parsedQuickRef.book.name} ({parsedQuickRef.book.englishName})</strong> Chapter {parsedQuickRef.chapter}
                    {parsedQuickRef.endVerse ? `, Verses ${parsedQuickRef.startVerse}–${parsedQuickRef.endVerse}` : `, Verse ${parsedQuickRef.startVerse}`}
                  </span>
                </div>
                <span className="text-[10px] font-mono bg-indigo-900/80 px-2 py-0.5 rounded text-indigo-300">
                  Press Enter ↵
                </span>
              </motion.div>
            )}
          </form>
        )}

        {/* Translation Multi-Select Switcher & Dual Mode Notice */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-neutral-900">
          <div className="flex items-center gap-1.5 bg-neutral-900/90 p-1 rounded-xl border border-neutral-800">
            {BIBLE_TRANSLATIONS.map(trans => {
              const isSelected = activeTransList.includes(trans.id);
              const rank = activeTransList.indexOf(trans.id) + 1;
              return (
                <button
                  key={trans.id}
                  type="button"
                  onClick={() => handleTransClick(trans.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 outline-none focus:outline-none ${
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

          <div className="text-[11px] text-neutral-400">
            {isDual ? (
              <span className="text-indigo-400 font-semibold flex items-center gap-1">
                <Globe size={13} />
                Dual: <strong>{activeTransList[0]?.toUpperCase()} (Top)</strong> + <strong>{activeTransList[1]?.toUpperCase()} (Down)</strong>
              </span>
            ) : (
              <span className="text-neutral-500">💡 Select 2 translations for split view</span>
            )}
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TAB 1: EXPLORER VIEW (WITH MULTI-VERSE RANGE SELECTION)
          ───────────────────────────────────────────────────────────── */}
      {activeTab === "explorer" && (
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

          {/* Chapter & Verse Grid (With FEATURE 1: Passage Mode Support) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-neutral-400 uppercase">
                  {isRangeMode ? "Passage Range" : "Verse"}
                </label>
                <button
                  type="button"
                  onClick={() => setIsRangeMode(!isRangeMode)}
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border transition-all flex items-center gap-1 ${
                    isRangeMode
                      ? "bg-indigo-600 text-white border-indigo-500"
                      : "bg-neutral-900 text-neutral-400 hover:text-white border-neutral-800"
                  }`}
                >
                  <Layers size={11} />
                  <span>{isRangeMode ? "Multi-Verse Active" : "Multi-Verse Mode"}</span>
                </button>
              </div>

              {!isRangeMode ? (
                /* Single Verse Selector */
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
              ) : (
                /* Multi-Verse Range Selector */
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <select
                      value={selectedVerse}
                      onChange={(e) => onSelectVerse(Number(e.target.value))}
                      className="w-full appearance-none bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-3 pr-8 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-neutral-100 font-medium text-xs"
                    >
                      {verses.map(v => (
                        <option key={v.verseNumber} value={v.verseNumber}>From {v.verseNumber}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-neutral-400">
                      <ChevronDown size={14} />
                    </div>
                  </div>

                  <div className="relative">
                    <select
                      value={rangeEndVerse}
                      onChange={(e) => setRangeEndVerse(Number(e.target.value))}
                      className="w-full appearance-none bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-3 pr-8 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-neutral-100 font-medium text-xs"
                    >
                      {verses.filter(v => v.verseNumber >= selectedVerse).map(v => (
                        <option key={v.verseNumber} value={v.verseNumber}>To {v.verseNumber}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-neutral-400">
                      <ChevronDown size={14} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Verses Preview List with Smooth Auto-Scroll and Range Highlights */}
          {verses.length > 0 && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs font-semibold text-neutral-400 uppercase">
                <span>
                  {currentBook.name} {selectedChapter} Verses
                </span>
                <span className="text-[10px] text-indigo-400/90 font-normal">
                  {isRangeMode && rangeEndVerse > selectedVerse
                    ? `Passage: Verses ${selectedVerse}–${rangeEndVerse} (${activeVerseRangeCount} Verses)`
                    : `Verse ${selectedVerse} of ${verses.length} (Shift+Click for Range)`}
                </span>
              </div>

              <div 
                ref={verseListContainerRef}
                className="max-h-64 overflow-y-auto pr-1 space-y-1.5 bg-neutral-950/80 p-2 rounded-2xl border border-neutral-800/80 scroll-smooth shadow-inner"
              >
                {verses.map(v => {
                  const isPrimary = v.verseNumber === selectedVerse;
                  const isInRange = isRangeMode && v.verseNumber >= selectedVerse && v.verseNumber <= rangeEndVerse;
                  const isHighlighted = isPrimary || isInRange;

                  const isDualText = v.text.includes('\n───\n');
                  const [top, bottom] = isDualText ? v.text.split('\n───\n') : [v.text, ''];

                  return (
                    <div
                      key={v.verseNumber}
                      ref={(el) => {
                        if (el) verseItemRefs.current.set(v.verseNumber, el);
                        else verseItemRefs.current.delete(v.verseNumber);
                      }}
                      onClick={(e) => handleVerseItemClick(v.verseNumber, e)}
                      className={`relative p-3 rounded-xl text-xs cursor-pointer select-none transition-colors duration-200 flex items-start gap-3 outline-none focus:outline-none ${
                        isHighlighted 
                          ? 'text-white' 
                          : 'text-neutral-300 hover:text-white hover:bg-neutral-900/60'
                      }`}
                    >
                      {/* Animated smooth highlight background pill */}
                      {isHighlighted && (
                        <motion.div
                          layoutId={isPrimary ? "activeVerseBackground" : undefined}
                          transition={{ type: "spring", stiffness: 450, damping: 35 }}
                          className={`absolute inset-0 rounded-xl border pointer-events-none ${
                            isPrimary
                              ? "bg-gradient-to-r from-indigo-950/90 via-indigo-900/50 to-indigo-950/70 border-indigo-500/50 shadow-md shadow-indigo-950/50"
                              : "bg-indigo-950/40 border-indigo-500/20"
                          }`}
                        />
                      )}

                      {/* Verse Number Badge */}
                      <span 
                        className={`relative z-10 font-mono font-bold shrink-0 px-2 py-0.5 rounded-md text-[11px] transition-all duration-200 ${
                          isPrimary 
                            ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/50 scale-105' 
                            : isInRange 
                              ? 'bg-indigo-900/80 text-indigo-200'
                              : 'bg-neutral-800 text-neutral-400'
                        }`}
                      >
                        {v.verseNumber}
                      </span>

                      {/* Verse Content */}
                      <div className="relative z-10 flex-1 space-y-1 overflow-hidden min-w-0">
                        <p className={`leading-relaxed transition-all duration-150 ${isHighlighted ? 'font-semibold text-white' : 'font-normal text-neutral-300'}`}>
                          {top}
                        </p>
                        {bottom && (
                          <p className="leading-relaxed text-neutral-400 italic text-[11px] border-t border-white/10 pt-1">
                            {bottom}
                          </p>
                        )}
                      </div>

                      {/* Active Check Dot Indicator */}
                      {isPrimary && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.6 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="relative z-10 shrink-0 self-center p-1 bg-indigo-500 text-white rounded-full shadow-sm"
                        >
                          <Check size={11} strokeWidth={3} />
                        </motion.div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 border-t border-neutral-800 flex items-center justify-between flex-wrap gap-2">
            <div className="text-xs text-neutral-400">
              {isRangeMode && rangeEndVerse > selectedVerse ? (
                <span className="text-indigo-400 font-bold">
                  {currentBook.name} {selectedChapter}:{selectedVerse}–{rangeEndVerse} ({activeVerseRangeCount} Verses)
                </span>
              ) : (
                <span>{currentBook.name} {selectedChapter}:{selectedVerse}</span>
              )}
            </div>

            <button
              type="button"
              onClick={() => onAddToSchedule({
                startVerse: selectedVerse,
                endVerse: isRangeMode ? rangeEndVerse : undefined,
                versesData: verses
              })}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md shadow-indigo-600/30 active:scale-95 transition-all outline-none focus:outline-none"
            >
              <Plus size={15} />
              <span>
                {isRangeMode && rangeEndVerse > selectedVerse
                  ? `Add Passage (${selectedVerse}–${rangeEndVerse}) to Schedule`
                  : "Add This Verse to Schedule"}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 2: ⭐ BOOKMARKS / FAVORITES VIEW (FEATURE 5)
          ───────────────────────────────────────────────────────────── */}
      {activeTab === "bookmarks" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span className="font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Star size={14} className="fill-amber-400" />
              <span>Starred Scriptures ({bookmarks.length})</span>
            </span>
            <span className="text-[11px] text-neutral-500">Click to jump instantly</span>
          </div>

          {bookmarks.length === 0 ? (
            <div className="p-8 text-center bg-neutral-950/60 rounded-2xl border border-neutral-800/80 space-y-2">
              <div className="w-10 h-10 mx-auto rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                <Star size={20} />
              </div>
              <p className="text-sm font-bold text-white">No Bookmarks Saved Yet</p>
              <p className="text-xs text-neutral-400 max-w-xs mx-auto">
                Click the Star button at the top while exploring any chapter to bookmark it for your Sunday service.
              </p>
            </div>
          ) : (
            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {bookmarks.map((bm) => (
                <div
                  key={bm.id}
                  onClick={() => handleJumpToSavedItem(bm)}
                  className="p-3 bg-neutral-900/80 hover:bg-neutral-850 border border-neutral-800 hover:border-amber-500/40 rounded-2xl cursor-pointer transition-all flex items-start justify-between gap-3 group"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-amber-300">
                        {bm.bookName} {bm.chapter}:{bm.startVerse}{bm.endVerse ? `–${bm.endVerse}` : ""}
                      </span>
                      <span className="text-[10px] text-neutral-500 font-mono">
                        ({bm.bookEnglishName})
                      </span>
                      {bm.label && (
                        <span className="px-2 py-0.5 bg-indigo-950 text-indigo-300 border border-indigo-500/30 rounded-full text-[10px] font-bold">
                          {bm.label}
                        </span>
                      )}
                    </div>
                    {bm.snippet && (
                      <p className="text-xs text-neutral-400 line-clamp-1 italic">
                        &quot;{bm.snippet}...&quot;
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => handleDeleteBookmark(bm.id, e)}
                      className="p-1.5 text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                      title="Delete bookmark"
                    >
                      <Trash2 size={13} />
                    </button>
                    <div className="p-1.5 text-neutral-400 group-hover:text-amber-400 transition-colors">
                      <ArrowRight size={14} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 3: 🕒 RECENT SCRIPTURES HISTORY (FEATURE 5)
          ───────────────────────────────────────────────────────────── */}
      {activeTab === "recents" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span className="font-semibold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
              <Clock size={14} className="text-neutral-400" />
              <span>Recent Scriptures ({recents.length})</span>
            </span>

            {recents.length > 0 && (
              <button
                type="button"
                onClick={handleClearRecents}
                className="text-[11px] text-neutral-500 hover:text-rose-400 font-bold transition-colors"
              >
                Clear History
              </button>
            )}
          </div>

          {recents.length === 0 ? (
            <div className="p-8 text-center bg-neutral-950/60 rounded-2xl border border-neutral-800/80 space-y-2">
              <div className="w-10 h-10 mx-auto rounded-xl bg-neutral-800/60 text-neutral-400 flex items-center justify-center">
                <Clock size={20} />
              </div>
              <p className="text-sm font-bold text-white">No Recent History</p>
              <p className="text-xs text-neutral-400 max-w-xs mx-auto">
                Scriptures you view or project will automatically appear here for rapid recall.
              </p>
            </div>
          ) : (
            <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
              {recents.map((rc) => (
                <div
                  key={rc.id}
                  onClick={() => handleJumpToSavedItem(rc)}
                  className="p-2.5 bg-neutral-900/70 hover:bg-neutral-850 border border-neutral-800 hover:border-indigo-500/40 rounded-xl cursor-pointer transition-all flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">
                      {rc.bookName} {rc.chapter}:{rc.startVerse}{rc.endVerse ? `–${rc.endVerse}` : ""}
                    </span>
                    <span className="text-[11px] text-neutral-500 font-mono">
                      ({rc.bookEnglishName})
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-neutral-500 group-hover:text-indigo-400 transition-colors">
                    <span>{new Date(rc.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <ArrowRight size={13} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
