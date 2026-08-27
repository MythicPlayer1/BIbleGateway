/**
 * High-Performance Client-Side Song Search Engine
 * - Leverages pre-indexed song metadata + Fuse.js fuzzy search
 * - Separates ultra-fast title/roman/alias search (< 5-15ms) from deep lyric search
 * - Singleton cache to prevent rebuilding index on React re-renders
 */

import Fuse from "fuse.js";
import type { Song } from "@/lib/lyrics";
import precomputedIndex from "@/data/song_search_index.json";
import { normalizeSearchQuery, romanizeNepaliNatural, stripDevanagariMatras } from "./normalization";

export interface IndexedSongItem {
  id: string;
  title: string;
  title_roman: string;
  search_normalized: string;
  aliases: string;
  letter: string;
  category?: string;
  artist?: string;
  songNumber?: number;
}

export interface SongSearchOptions {
  selectedLetter?: string;
  selectedCategory?: string;
  selectedArtist?: string;
  limit?: number;
  searchLyrics?: boolean;
  customSongs?: Song[];
  allRawSongs?: Song[];
}

export interface SongSearchResult {
  id: string;
  score: number;
  matchedField?: string;
}

class SongSearchEngine {
  private fuse: Fuse<IndexedSongItem>;
  private indexItems: IndexedSongItem[];
  private songIdMap: Map<string, IndexedSongItem>;
  private queryCache: Map<string, string[]>;
  private customSongCacheKey: string = "";

  constructor() {
    this.indexItems = precomputedIndex as IndexedSongItem[];
    this.songIdMap = new Map();
    this.queryCache = new Map();

    this.indexItems.forEach((item) => {
      this.songIdMap.set(item.id, item);
    });

    this.fuse = this.createFuseInstance(this.indexItems);
  }

  private createFuseInstance(items: IndexedSongItem[]): Fuse<IndexedSongItem> {
    return new Fuse(items, {
      keys: [
        { name: "title", weight: 0.45 },
        { name: "title_roman", weight: 0.35 },
        { name: "artist", weight: 0.20 },
        { name: "aliases", weight: 0.15 },
        { name: "search_normalized", weight: 0.05 }
      ],
      threshold: 0.35,
      ignoreLocation: true,
      includeScore: true,
      shouldSort: true,
      minMatchCharLength: 1
    });
  }

  /**
   * Dynamically merge any user custom songs into search index
   */
  public updateCustomSongs(customSongs?: Song[]) {
    if (!customSongs || customSongs.length === 0) return;
    const currentKey = customSongs.map(s => `${s.id}-${s.title}`).join("|");
    if (currentKey === this.customSongCacheKey) return;

    this.customSongCacheKey = currentKey;
    const customIndexed: IndexedSongItem[] = customSongs.map(song => {
      const title = song.title || "";
      const title_roman = song.title_en || romanizeNepaliNatural(title);
      const search_normalized = normalizeSearchQuery(`${title} ${title_roman} ${song.artist || ""}`);
      return {
        id: song.id,
        title,
        title_roman,
        search_normalized,
        aliases: `${song.id} ${title_roman} ${song.artist || ""} ${song.details || ""}`,
        letter: song.letter || "",
        category: song.category || (song.isCustom ? "custom" : "artist"),
        artist: song.artist || "",
        songNumber: song.songNumber
      };
    });

    const combined = [...customIndexed, ...(precomputedIndex as IndexedSongItem[])];
    this.indexItems = combined;
    this.songIdMap.clear();
    this.queryCache.clear();
    this.indexItems.forEach((item) => this.songIdMap.set(item.id, item));
    this.fuse = this.createFuseInstance(this.indexItems);
  }

  /**
   * High-Speed Search
   */
  public search(query: string, options: SongSearchOptions = {}): string[] {
    const rawQuery = query.trim();
    const limit = options.limit;

    // Update custom songs if passed
    if (options.customSongs) {
      this.updateCustomSongs(options.customSongs);
    }

    const matchesCategoryAndArtist = (item: IndexedSongItem): boolean => {
      if (options.selectedCategory && options.selectedCategory !== "all") {
        if (options.selectedCategory === "bhajan" && item.category !== "bhajan") return false;
        if (options.selectedCategory === "chorus" && item.category !== "chorus") return false;
        if (options.selectedCategory === "artist" && item.category !== "artist") return false;
        if (options.selectedCategory === "custom" && item.category !== "custom" && !item.id.startsWith("custom-song-")) return false;
      }
      if (options.selectedArtist && item.artist !== options.selectedArtist) {
        return false;
      }
      return true;
    };

    // 1. Empty Query -> Filtered by Category, Artist & Letter
    if (!rawQuery) {
      let filtered = this.indexItems.filter(matchesCategoryAndArtist);
      if (options.selectedLetter) {
        const l = options.selectedLetter.toLowerCase();
        filtered = filtered.filter((i) => {
          return (
            (i.letter && i.letter.toLowerCase() === l) ||
            i.title.startsWith(options.selectedLetter!) ||
            i.title_roman.toLowerCase().startsWith(l)
          );
        });
      }
      return limit ? filtered.slice(0, limit).map((i) => i.id) : filtered.map((i) => i.id);
    }

    // Cache lookup
    const cacheKey = `${rawQuery.toLowerCase()}__${options.selectedCategory || "all"}__${options.selectedArtist || ""}__${options.selectedLetter || ""}__${limit || "all"}__${Boolean(options.searchLyrics)}`;
    if (this.queryCache.has(cacheKey)) {
      return this.queryCache.get(cacheKey)!;
    }

    const normalizedQuery = normalizeSearchQuery(rawQuery);
    const numericOnly = rawQuery.replace(/[^0-9]/g, "");
    const isDevanagari = /[\u0900-\u097F]/.test(rawQuery);
    const devanagariStem = isDevanagari ? stripDevanagariMatras(rawQuery) : "";

    const tokens = normalizedQuery.split(/\s+/).filter(Boolean);

    const exactMatches: string[] = [];
    const tokenMatches: string[] = [];
    const matchedSet = new Set<string>();

    // 2. High-speed Direct, Prefix & Multi-Token Scan (< 1-2ms)
    for (const item of this.indexItems) {
      if (!matchesCategoryAndArtist(item)) continue;

      // Direct Hymnal / Song ID Match
      if (numericOnly) {
        if (item.aliases.includes(rawQuery.toLowerCase()) || item.aliases.includes(numericOnly)) {
          if (!matchedSet.has(item.id)) {
            matchedSet.add(item.id);
            exactMatches.push(item.id);
          }
          continue;
        }
      }

      // Exact Title Match (Nepali or Roman)
      if (item.title === rawQuery || item.title_roman === normalizedQuery) {
        if (!matchedSet.has(item.id)) {
          matchedSet.add(item.id);
          exactMatches.push(item.id);
        }
        continue;
      }

      // Title Starts With
      if (item.title.startsWith(rawQuery) || item.title_roman.startsWith(normalizedQuery)) {
        if (!matchedSet.has(item.id)) {
          matchedSet.add(item.id);
          tokenMatches.push(item.id);
        }
        continue;
      }

      // Multi-Token Substring Scan
      if (tokens.length > 0) {
        const allInItem = tokens.every(
          (t) =>
            item.search_normalized.includes(t) ||
            item.title_roman.includes(t) ||
            item.title.includes(t) ||
            item.aliases.includes(t)
        );
        if (allInItem) {
          if (!matchedSet.has(item.id)) {
            matchedSet.add(item.id);
            tokenMatches.push(item.id);
          }
        }
      }
    }

    let finalIds = [...exactMatches, ...tokenMatches];

    // 3. Fuzzy Fallback via Fuse.js ONLY when 0 exact/token matches are found
    if (finalIds.length === 0 && normalizedQuery.length >= 2) {
      const fuseResults = this.fuse.search(normalizedQuery, limit ? { limit } : undefined);
      for (const res of fuseResults) {
        if (matchesCategoryAndArtist(res.item) && !matchedSet.has(res.item.id)) {
          matchedSet.add(res.item.id);
          finalIds.push(res.item.id);
        }
      }
    }

    // 4. Secondary Lyric Search (Only when requested OR 0 title results found)
    if ((options.searchLyrics || finalIds.length === 0) && options.allRawSongs) {
      const lyricMatches: string[] = [];
      const queryLower = rawQuery.toLowerCase();

      for (const song of options.allRawSongs) {
        if (matchedSet.has(song.id)) continue;
        const lyrics = (song.rawLyrics || (song as any).lyrics || "").toLowerCase();
        if (lyrics.includes(queryLower) || (isDevanagari && devanagariStem && stripDevanagariMatras(lyrics).includes(devanagariStem))) {
          matchedSet.add(song.id);
          lyricMatches.push(song.id);
          if (limit && finalIds.length + lyricMatches.length >= limit) break;
        }
      }
      finalIds = [...finalIds, ...lyricMatches];
    }

    const trimmedResults = limit ? finalIds.slice(0, limit) : finalIds;
    this.queryCache.set(cacheKey, trimmedResults);
    return trimmedResults;
  }
}

// Global Singleton Search Engine
let searchEngineInstance: SongSearchEngine | null = null;

export function getSongSearchEngine(): SongSearchEngine {
  if (!searchEngineInstance) {
    searchEngineInstance = new SongSearchEngine();
  }
  return searchEngineInstance;
}

/**
 * Convenience search function that maps search IDs back to full Song objects
 */
export function searchSongsFast(
  allSongs: Song[],
  query: string,
  options: Omit<SongSearchOptions, "allRawSongs"> = {}
): Song[] {
  const engine = getSongSearchEngine();
  const customSongs = allSongs.filter(s => s.isCustom || s.id.startsWith("custom-song-"));
  
  const matchedIds = engine.search(query, {
    ...options,
    customSongs,
    allRawSongs: allSongs
  });

  const songMap = new Map<string, Song>();
  allSongs.forEach((s) => songMap.set(s.id, s));

  return matchedIds.map((id) => songMap.get(id)).filter(Boolean) as Song[];
}
