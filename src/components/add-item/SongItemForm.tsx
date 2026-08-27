"use client";

import React from "react";
import { Search, Check, Plus } from "lucide-react";
import type { Song } from "@/lib/lyrics";
import type { NewItemDataState } from "../AddItemModal";

interface SongItemFormProps {
  modalSongSearch: string;
  setModalSongSearch: (query: string) => void;
  modalFilteredSongs: Song[];
  newItemData: NewItemDataState;
  setNewItemData: React.Dispatch<React.SetStateAction<NewItemDataState>>;
  onOpenNewSongModal: () => void;
  onCloseModal: () => void;
}

export const SongItemForm: React.FC<SongItemFormProps> = ({
  modalSongSearch,
  setModalSongSearch,
  modalFilteredSongs,
  newItemData,
  setNewItemData,
  onOpenNewSongModal,
  onCloseModal
}) => {
  const [visibleCount, setVisibleCount] = React.useState(30);

  React.useEffect(() => {
    setVisibleCount(30);
  }, [modalSongSearch, modalFilteredSongs]);

  React.useEffect(() => {
    if (!newItemData.songId && modalFilteredSongs.length > 0) {
      setNewItemData(prev => ({ ...prev, songId: modalFilteredSongs[0].id }));
    }
  }, [modalFilteredSongs, newItemData.songId, setNewItemData]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 60) {
      if (visibleCount < modalFilteredSongs.length) {
        setVisibleCount((prev) => Math.min(prev + 30, modalFilteredSongs.length));
      }
    }
  };

  const visibleModalSongs = React.useMemo(() => {
    return modalFilteredSongs.slice(0, visibleCount);
  }, [modalFilteredSongs, visibleCount]);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-bold text-neutral-400 uppercase mb-1.5 flex items-center justify-between">
          <span>Search & Select from 2,101 Worship Songs</span>
          <span className="text-[10px] text-indigo-400 font-mono">({modalFilteredSongs.length} matches)</span>
        </label>
        <div className="relative mb-2">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={modalSongSearch}
            onChange={(e) => setModalSongSearch(e.target.value)}
            placeholder="Search in English or Nepali (e.g. 'dhanyabad', 'agapya', 'kb:s140')..."
            className="w-full bg-neutral-900 border border-neutral-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div 
          onScroll={handleScroll}
          className="max-h-48 overflow-y-auto space-y-1 border border-neutral-800 rounded-xl p-1 bg-neutral-900/60"
        >
          {visibleModalSongs.map(song => (
            <div
              key={song.id}
              onClick={() => setNewItemData(prev => ({ ...prev, songId: song.id }))}
              className={`p-2.5 rounded-lg text-xs cursor-pointer flex items-center justify-between transition-colors ${
                newItemData.songId === song.id
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'text-neutral-300 hover:bg-neutral-800'
              }`}
            >
              <div className="truncate pr-2">
                <p className="truncate font-semibold">{song.title}</p>
                {song.title_en && <p className="text-[10px] opacity-80">{song.title_en}</p>}
              </div>
              {newItemData.songId === song.id && <Check size={14} className="shrink-0" />}
            </div>
          ))}

          {visibleCount < modalFilteredSongs.length && (
            <button
              type="button"
              onClick={() => setVisibleCount(prev => Math.min(prev + 30, modalFilteredSongs.length))}
              className="w-full py-1.5 text-[10px] text-indigo-400 font-bold bg-neutral-900/90 hover:bg-neutral-800 rounded-lg text-center"
            >
              Load more ({modalFilteredSongs.length - visibleCount} remaining)
            </button>
          )}
        </div>
      </div>

      <div className="pt-2 border-t border-neutral-800 flex items-center justify-between">
        <span className="text-xs text-neutral-400">Can't find your song?</span>
        <button
          type="button"
          onClick={() => {
            onCloseModal();
            onOpenNewSongModal();
          }}
          className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 bg-indigo-950/60 border border-indigo-500/30 px-3 py-1.5 rounded-xl hover:bg-indigo-900/60 transition-all"
        >
          <Plus size={14} />
          Write / Create New Song
        </button>
      </div>
    </div>
  );
};
