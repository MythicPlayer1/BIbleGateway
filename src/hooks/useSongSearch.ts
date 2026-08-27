"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import type { Song } from "@/lib/lyrics";
import { searchSongsFast, type SongSearchOptions } from "@/lib/songSearch/searchEngine";

export interface UseSongSearchProps {
  allSongs: Song[];
  query: string;
  selectedLetter?: string;
  searchLyrics?: boolean;
  debounceMs?: number;
  limit?: number;
}

export function useSongSearch({
  allSongs,
  query,
  selectedLetter,
  searchLyrics = false,
  debounceMs = 120,
  limit = 50
}: UseSongSearchProps) {
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [isSearching, setIsSearching] = useState(false);
  const activeQueryRef = useRef(query);
  activeQueryRef.current = query;

  // Debounce user keystrokes
  useEffect(() => {
    if (!query.trim()) {
      setDebouncedQuery("");
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(() => {
      if (activeQueryRef.current === query) {
        setDebouncedQuery(query);
        setIsSearching(false);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  // Execute fast search on debounced query or letter change
  const results = useMemo(() => {
    return searchSongsFast(allSongs, debouncedQuery, {
      selectedLetter,
      searchLyrics,
      limit
    });
  }, [allSongs, debouncedQuery, selectedLetter, searchLyrics, limit]);

  return {
    results,
    isSearching,
    debouncedQuery
  };
}
