"use client";

import React from "react";
import { Music, Plus, Search, X, Languages, Layers, Edit3, Trash2 } from "lucide-react";
import type { Song, SongSlide } from "@/lib/lyrics";

export const NEPALI_ALPHABETS = [
  { label: "सबै (All)", value: "" },
  { label: "अ (A)", value: "a" },
  { label: "आ (Aa)", value: "aa" },
  { label: "इ (I)", value: "i" },
  { label: "ई (Ee)", value: "ii" },
  { label: "उ (U)", value: "u" },
  { label: "ए (E)", value: "e" },
  { label: "ऐ (Ai)", value: "ai" },
  { label: "ओ (O)", value: "o" },
  { label: "औ (Au)", value: "au" },
  { label: "क (K)", value: "k" },
  { label: "ख (Kh)", value: "kh" },
  { label: "ग (G)", value: "g" },
  { label: "घ (Gh)", value: "gh" },
  { label: "च (Ch)", value: "ch" },
  { label: "छ (Chh)", value: "chh" },
  { label: "ज (J)", value: "j" },
  { label: "झ (Jh)", value: "jh" },
  { label: "ट (T)", value: "T_" },
  { label: "ड (D)", value: "D_" },
  { label: "त (T)", value: "t" },
  { label: "थ (Th)", value: "th" },
  { label: "द (D)", value: "d" },
  { label: "ध (Dh)", value: "dh" },
  { label: "न (N)", value: "n" },
  { label: "प (P)", value: "p" },
  { label: "फ (Ph)", value: "ph" },
  { label: "ब (B)", value: "b" },
  { label: "भ (Bh)", value: "bh" },
  { label: "म (M)", value: "m" },
  { label: "य (Y)", value: "y" },
  { label: "र (R)", value: "r" },
  { label: "ल (L)", value: "l" },
  { label: "व (W)", value: "w" },
  { label: "श (Sh)", value: "sh" },
  { label: "स (S)", value: "s" },
  { label: "ह (H)", value: "h" }
];

interface SongLibraryProps {
  filteredSongs: Song[];
  songSearchQuery: string;
  setSongSearchQuery: (query: string) => void;
  selectedLetter: string;
  setSelectedLetter: (letter: string) => void;
  activeLibrarySongId: string;
  onSelectSong: (songId: string) => void;
  onAddSongToSchedule: (song: Song, e?: React.MouseEvent) => void;
  onOpenNewSongModal: () => void;
  onEditSong?: (song: Song, e?: React.MouseEvent) => void;
  onDeleteSong?: (songId: string, e?: React.MouseEvent) => void;
  activeLibrarySong: Song | null;
  activeSlides: SongSlide[];
  selectedSlideIndex: number;
  onSelectSlideIndex: (index: number) => void;
}

export const SongLibrary: React.FC<SongLibraryProps> = ({
  filteredSongs,
  songSearchQuery,
  setSongSearchQuery,
  selectedLetter,
  setSelectedLetter,
  activeLibrarySongId,
  onSelectSong,
  onAddSongToSchedule,
  onOpenNewSongModal,
  onEditSong,
  onDeleteSong,
  activeLibrarySong,
  activeSlides,
  selectedSlideIndex,
  onSelectSlideIndex
}) => {
  const [visibleCount, setVisibleCount] = React.useState(50);

  // Reset pagination on search or letter filter change
  React.useEffect(() => {
    setVisibleCount(50);
  }, [filteredSongs, songSearchQuery, selectedLetter]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 120) {
      if (visibleCount < filteredSongs.length) {
        setVisibleCount((prev) => Math.min(prev + 50, filteredSongs.length));
      }
    }
  };

  const visibleSongs = React.useMemo(() => {
    return filteredSongs.slice(0, visibleCount);
  }, [filteredSongs, visibleCount]);

  return (
    <div className="bg-[#0e0e0e] p-6 rounded-3xl border border-neutral-800 shadow-xl space-y-4 flex-1 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
        <div>
          <h2 className="text-sm font-black uppercase tracking-wider flex items-center gap-2 text-indigo-400">
            <Music size={18} />
            Nepali Worship Songs ({filteredSongs.length})
          </h2>
          <p className="text-[11px] text-neutral-400">Search in English (Roman) or Nepali (e.g. "dhanyabad", "येशू")</p>
        </div>
        <button
          onClick={onOpenNewSongModal}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 active:scale-95 transition-all"
        >
          <Plus size={14} />
          New Song
        </button>
      </div>

      {/* Enhanced Search Bar */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
        <input
          type="text"
          value={songSearchQuery}
          onChange={(e) => setSongSearchQuery(e.target.value)}
          placeholder="खोज्नुहोस् / Type in Roman Nepali or Devanagari (e.g. 'mero hridayale', 'dhanyabad', 'kb:140')..."
          className="w-full bg-neutral-900/90 border border-neutral-700 rounded-2xl pl-10 pr-10 py-3 text-xs text-white placeholder-neutral-500 focus:ring-2 focus:ring-indigo-500 outline-none shadow-inner"
        />
        {songSearchQuery && (
          <button 
            onClick={() => setSongSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white p-1"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* Instant Search Result Count Badge */}
      {songSearchQuery.trim() && (
        <div className="flex items-center justify-between px-1 text-[11px] text-neutral-400 font-medium">
          <span>Found <strong className="text-indigo-400">{filteredSongs.length}</strong> matching songs</span>
          <button
            onClick={() => setSongSearchQuery("")}
            className="text-neutral-500 hover:text-neutral-300 text-[10px] underline"
          >
            Clear Search
          </button>
        </div>
      )}

      {/* Alphabet Filter Scroll */}
      <div className="flex gap-1.5 overflow-x-auto pb-1.5 pt-0.5 no-scrollbar">
        {NEPALI_ALPHABETS.map((alpha) => (
          <button
            key={alpha.value}
            onClick={() => setSelectedLetter(alpha.value)}
            className={`px-3 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all ${
              selectedLetter === alpha.value
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-850'
            }`}
          >
            {alpha.label}
          </button>
        ))}
      </div>

      {/* Songs List with Transliterated English Titles */}
      <div 
        onScroll={handleScroll}
        className="space-y-2 flex-1 max-h-[260px] overflow-y-auto pr-1"
      >
        {visibleSongs.map(song => {
          const isActive = song.id === activeLibrarySongId;
          return (
            <div
              key={song.id}
              onClick={() => onSelectSong(song.id)}
              className={`group flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                isActive
                  ? 'bg-indigo-950/70 border-indigo-500 text-white shadow-md ring-1 ring-indigo-500/40'
                  : 'bg-neutral-900/70 border-neutral-800 text-neutral-300 hover:bg-neutral-900 hover:border-neutral-700'
              }`}
            >
              <div className="min-w-0 pr-2 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-sm text-white truncate">{song.title}</p>
                  {Boolean(song.isCustom || song.id.startsWith('custom-song-')) ? (
                    <span className="px-1.5 py-0.2 bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 rounded text-[9px] font-bold shrink-0">
                      Custom
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.2 bg-neutral-800 text-neutral-400 border border-neutral-700/80 rounded text-[9px] font-mono shrink-0">
                      System
                    </span>
                  )}
                </div>

                {/* English Romanized Transliteration */}
                {song.title_en && (
                  <p className="text-[11px] font-medium text-indigo-400/90 truncate flex items-center gap-1 mt-0.5">
                    <Languages size={11} className="shrink-0 opacity-70" />
                    <span>{song.title_en}</span>
                  </p>
                )}

                <p className="text-[11px] text-neutral-400 line-clamp-1 mt-0.5">
                  {(song.rawLyrics || (song as any).lyrics || '').replace(/\n+/g, ' • ')}
                </p>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {/* Custom Songs can be edited and deleted in Song Library */}
                {Boolean(song.isCustom || song.id.startsWith('custom-song-')) ? (
                  <>
                    {onEditSong && (
                      <button
                        type="button"
                        onClick={(e) => onEditSong(song, e)}
                        className="p-1.5 bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded-xl transition-all"
                        title="Edit custom song details"
                      >
                        <Edit3 size={13} />
                      </button>
                    )}
                    {onDeleteSong && (
                      <button
                        type="button"
                        onClick={(e) => onDeleteSong(song.id, e)}
                        className="p-1.5 bg-neutral-800/80 hover:bg-red-600/80 text-neutral-400 hover:text-white rounded-xl transition-all"
                        title="Delete custom song from library"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </>
                ) : null}

                <button
                  type="button"
                  onClick={(e) => onAddSongToSchedule(song, e)}
                  className="flex items-center gap-1 bg-neutral-800 hover:bg-indigo-600 text-neutral-300 hover:text-white px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all shadow-sm"
                  title="Add to service schedule (can be edited/customized in schedule)"
                >
                  <Plus size={13} />
                  <span>Schedule</span>
                </button>
              </div>
            </div>
          );
        })}

        {/* Load More Pagination / Infinite Scroll Trigger */}
        {visibleCount < filteredSongs.length && (
          <div className="py-2 flex items-center justify-center">
            <button
              type="button"
              onClick={() => setVisibleCount((prev) => Math.min(prev + 50, filteredSongs.length))}
              className="w-full py-2 bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-indigo-400 hover:text-indigo-300 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
            >
              <span>Load More ({filteredSongs.length - visibleCount} songs remaining)</span>
            </button>
          </div>
        )}

        {filteredSongs.length === 0 && (
          <div className="py-12 flex flex-col items-center justify-center text-neutral-500 gap-2 border-2 border-dashed border-neutral-800 rounded-2xl">
            <Search size={28} className="opacity-40" />
            <p className="text-xs font-semibold">No songs found matching "{songSearchQuery}"</p>
            <button
              onClick={() => {
                setSongSearchQuery("");
                setSelectedLetter("");
              }}
              className="text-xs text-indigo-400 font-bold hover:underline"
            >
              Clear search filters
            </button>
          </div>
        )}
      </div>

      {/* Active Song Lyrics Slides Preview */}
      {activeLibrarySong && activeSlides.length > 0 && (
        <div className="pt-3 border-t border-neutral-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1 pr-2">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5 truncate">
                  <Layers size={14} />
                  {activeLibrarySong.title}
                </h3>
                {onEditSong && (
                  <button
                    type="button"
                    onClick={(e) => onEditSong(activeLibrarySong, e)}
                    className="p-1 text-neutral-400 hover:text-indigo-300 rounded transition-colors"
                    title="Edit active song"
                  >
                    <Edit3 size={12} />
                  </button>
                )}
                {onDeleteSong && (
                  <button
                    type="button"
                    onClick={(e) => onDeleteSong(activeLibrarySong.id, e)}
                    className="p-1 text-neutral-400 hover:text-red-400 rounded transition-colors"
                    title="Delete active song"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
              {activeLibrarySong.title_en && (
                <p className="text-[11px] text-neutral-400 truncate">{activeLibrarySong.title_en}</p>
              )}
            </div>
            <span className="text-[11px] text-neutral-400 font-semibold shrink-0">
              Slide {selectedSlideIndex + 1} of {activeSlides.length}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
            {activeSlides.map((slide, sIdx) => {
              const isActive = sIdx === selectedSlideIndex;
              return (
                <div
                  key={sIdx}
                  onClick={() => onSelectSlideIndex(sIdx)}
                  className={`p-2.5 rounded-xl border cursor-pointer flex flex-col justify-between text-left transition-all ${
                    isActive
                      ? 'bg-indigo-900/60 border-indigo-500 text-white ring-2 ring-indigo-500/40 shadow-md'
                      : 'bg-neutral-900/80 border-neutral-800 text-neutral-300 hover:border-neutral-700 hover:bg-neutral-900'
                  }`}
                >
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full inline-block mb-1 w-fit ${
                    isActive ? 'bg-indigo-600 text-white' : 'bg-neutral-800 text-neutral-400'
                  }`}>
                    {slide.section}
                  </span>
                  <p className="text-xs line-clamp-2 leading-relaxed opacity-90 font-medium whitespace-pre-line">
                    {slide.text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
