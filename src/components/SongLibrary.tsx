"use client";

import React from "react";
import { Music, Plus, Search, X, Languages, Layers, Edit3, Trash2, BookOpen, Mic2, Sparkles, Filter, ChevronDown } from "lucide-react";
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
  selectedCategory?: 'all' | 'bhajan' | 'chorus' | 'artist' | 'custom';
  setSelectedCategory?: (category: 'all' | 'bhajan' | 'chorus' | 'artist' | 'custom') => void;
  selectedArtist?: string;
  setSelectedArtist?: (artist: string) => void;
  allArtists?: string[];
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
  selectedCategory = 'all',
  setSelectedCategory,
  selectedArtist = '',
  setSelectedArtist,
  allArtists = [],
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
  const [isArtistDropdownOpen, setIsArtistDropdownOpen] = React.useState(false);
  const [artistSearchTerm, setArtistSearchTerm] = React.useState("");

  // Reset pagination on search or filter change
  React.useEffect(() => {
    setVisibleCount(50);
  }, [filteredSongs, songSearchQuery, selectedLetter, selectedCategory, selectedArtist]);

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

  const filteredArtists = React.useMemo(() => {
    if (!artistSearchTerm.trim()) return allArtists;
    const term = artistSearchTerm.toLowerCase();
    return allArtists.filter(a => a.toLowerCase().includes(term));
  }, [allArtists, artistSearchTerm]);

  return (
    <div className="bg-[#0e0e0e] p-6 rounded-3xl border border-neutral-800 shadow-xl space-y-4 flex-1 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
        <div>
          <h2 className="text-sm font-black uppercase tracking-wider flex items-center gap-2 text-indigo-400">
            <Music size={18} />
            Nepali Worship Catalog ({filteredSongs.length})
          </h2>
          <p className="text-[11px] text-neutral-400">
            Search in Roman Nepali, Devanagari, or Bhajan numbers (e.g. &quot;509&quot;, &quot;dhanyabad&quot;, &quot;येशू&quot;)
          </p>
        </div>
        <button
          onClick={onOpenNewSongModal}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 active:scale-95 transition-all"
        >
          <Plus size={14} />
          New Song
        </button>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <button
          type="button"
          onClick={() => {
            setSelectedCategory?.('all');
            setSelectedArtist?.('');
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            selectedCategory === 'all' && !selectedArtist
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-850'
          }`}
        >
          <Sparkles size={13} />
          <span>All (सबै)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setSelectedCategory?.('bhajan');
            setSelectedArtist?.('');
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            selectedCategory === 'bhajan'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
              : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-amber-300 hover:bg-neutral-850'
          }`}
        >
          <BookOpen size={13} />
          <span>📖 Bhajan (भजन)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setSelectedCategory?.('chorus');
            setSelectedArtist?.('');
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            selectedCategory === 'chorus'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-emerald-300 hover:bg-neutral-850'
          }`}
        >
          <Music size={13} />
          <span>🎵 Chorus (कोरस)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setSelectedCategory?.('artist');
            setIsArtistDropdownOpen(prev => !prev);
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            selectedCategory === 'artist' || selectedArtist
              ? 'bg-violet-600 text-white shadow-md shadow-violet-600/20'
              : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-violet-300 hover:bg-neutral-850'
          }`}
        >
          <Mic2 size={13} />
          <span>🎤 {selectedArtist ? selectedArtist : 'By Artist (कलाकार)'}</span>
          <ChevronDown size={12} className={`transition-transform ${isArtistDropdownOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Artist Dropdown / Filter Bar (when By Artist is active or opened) */}
      {(isArtistDropdownOpen || selectedArtist) && (
        <div className="p-3 bg-neutral-900/90 border border-neutral-800 rounded-2xl space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-violet-400">
              <Filter size={13} />
              <span>Select from {allArtists.length} Artists:</span>
            </div>
            {selectedArtist && (
              <button
                type="button"
                onClick={() => {
                  setSelectedArtist?.('');
                  setSelectedCategory?.('all');
                }}
                className="text-[11px] font-bold text-neutral-400 hover:text-red-400 transition-colors flex items-center gap-1"
              >
                <X size={12} />
                <span>Clear Artist Filter</span>
              </button>
            )}
          </div>

          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              value={artistSearchTerm}
              onChange={(e) => setArtistSearchTerm(e.target.value)}
              placeholder="Filter artist name (e.g. 'Adrian Dewan', 'Rohit Thapa', 'Deborah Singh')..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 outline-none focus:border-violet-500"
            />
          </div>

          <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1 no-scrollbar">
            {filteredArtists.slice(0, 40).map((artist) => (
              <button
                key={artist}
                type="button"
                onClick={() => {
                  setSelectedArtist?.(artist);
                  setSelectedCategory?.('artist');
                  setIsArtistDropdownOpen(false);
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                  selectedArtist === artist
                    ? 'bg-violet-600 text-white font-bold shadow-sm'
                    : 'bg-neutral-950/80 border border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-800 hover:border-neutral-700'
                }`}
              >
                {artist}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Enhanced Search Bar */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
        <input
          type="text"
          value={songSearchQuery}
          onChange={(e) => setSongSearchQuery(e.target.value)}
          placeholder="खोज्नुहोस् / Search Roman, Devanagari, Bhajan or Chorus # (e.g. '509', 'c188', 'b188', 'येशू')..."
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

      {/* Songs List with Transliterated English Titles & Category Badges */}
      <div 
        onScroll={handleScroll}
        className="space-y-2 flex-1 max-h-[260px] overflow-y-auto pr-1"
      >
        {visibleSongs.map(song => {
          const isActive = song.id === activeLibrarySongId;
          const isBhajan = song.category === 'bhajan' || Boolean(song.songNumber && String(song.id).startsWith('bhajan-'));
          const isChorus = song.category === 'chorus' || Boolean(String(song.id).startsWith('chorus-'));
          
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
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-sm text-white truncate">{song.title}</p>
                  
                  {/* Category & Origin Badges */}
                  {isBhajan ? (
                    <span className="px-2 py-0.5 bg-amber-950/70 text-amber-300 border border-amber-600/40 rounded-md text-[9px] font-bold shrink-0 flex items-center gap-1">
                      <BookOpen size={9} />
                      <span>Bhajan #{song.songNumber}</span>
                    </span>
                  ) : isChorus ? (
                    <span className="px-2 py-0.5 bg-emerald-950/70 text-emerald-300 border border-emerald-600/40 rounded-md text-[9px] font-bold shrink-0 flex items-center gap-1">
                      <Music size={9} />
                      <span>Chorus {song.songNumber ? `#${song.songNumber}` : ''}</span>
                    </span>
                  ) : song.artist && song.artist !== 'Bhajan' && song.artist !== 'Chorus' && song.artist !== 'Unknown Artist' ? (
                    <span className="px-2 py-0.5 bg-violet-950/70 text-violet-300 border border-violet-600/40 rounded-md text-[9px] font-semibold shrink-0 flex items-center gap-1">
                      <Mic2 size={9} />
                      <span>{song.artist}</span>
                    </span>
                  ) : Boolean(song.isCustom || song.id.startsWith('custom-song-')) ? (
                    <span className="px-2 py-0.5 bg-cyan-950/80 text-cyan-400 border border-cyan-500/40 rounded-md text-[9px] font-bold shrink-0">
                      Custom
                    </span>
                  ) : null}

                  {/* Chord Key Badge */}
                  {song.mainChords && (
                    <span className="px-1.5 py-0.2 bg-neutral-800/90 text-neutral-300 border border-neutral-700 rounded text-[9px] font-mono shrink-0">
                      Key: {song.mainChords}
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
            <p className="text-xs font-semibold">No songs found matching filters</p>
            <button
              onClick={() => {
                setSongSearchQuery("");
                setSelectedLetter("");
                setSelectedCategory?.('all');
                setSelectedArtist?.('');
              }}
              className="text-xs text-indigo-400 font-bold hover:underline"
            >
              Clear all filters
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
                {activeLibrarySong.category === 'bhajan' && (
                  <span className="px-2 py-0.5 bg-amber-950 text-amber-300 border border-amber-600/40 rounded text-[9px] font-bold">
                    Bhajan #{activeLibrarySong.songNumber}
                  </span>
                )}
                {activeLibrarySong.category === 'chorus' && (
                  <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-600/40 rounded text-[9px] font-bold">
                    Chorus #{activeLibrarySong.songNumber}
                  </span>
                )}
                {activeLibrarySong.mainChords && (
                  <span className="px-1.5 py-0.2 bg-neutral-800 text-neutral-400 border border-neutral-700 rounded text-[9px] font-mono">
                    Chord: {activeLibrarySong.mainChords}
                  </span>
                )}
              </div>
              {activeLibrarySong.title_en && (
                <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                  {activeLibrarySong.title_en}
                </p>
              )}
            </div>
            <button
              onClick={(e) => onAddSongToSchedule(activeLibrarySong, e)}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 active:scale-95 transition-all shrink-0"
            >
              <Plus size={14} />
              Add Song to Schedule
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {activeSlides.map((slide, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onSelectSlideIndex(idx)}
                className={`p-2.5 rounded-xl text-left border transition-all text-xs flex flex-col justify-between h-20 ${
                  selectedSlideIndex === idx
                    ? 'bg-indigo-600 text-white border-indigo-400 shadow-md ring-1 ring-indigo-300/50'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:bg-neutral-850 hover:border-neutral-700'
                }`}
              >
                <span className="text-[10px] font-black uppercase opacity-75 truncate">{slide.section}</span>
                <span className="line-clamp-2 text-[11px] font-medium leading-snug">{slide.text}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
