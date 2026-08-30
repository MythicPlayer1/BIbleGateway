"use client";

import { create } from "zustand";
import { 
  defaultSongs, type Song, type ScheduleItem, type ScheduleItemType, type ServicePlan,
  type TickerConfig, DEFAULT_TICKER_CONFIG,
  type GlobalBackgroundConfig, DEFAULT_BACKGROUND_CONFIG,
  type TextAnimationConfig, DEFAULT_TEXT_ANIMATION_CONFIG,
  type ProjectorDisplayConfig, DEFAULT_DISPLAY_CONFIG,
  type BibleTranslation
} from "@/lib/lyrics";
import { nepaliToRoman } from "@/lib/transliterate";
import rawSongsData from "@/data/nepali_christian_songs.json";
import type { NewItemDataState } from "@/components/AddItemModal";
import type { ConfirmModalConfig } from "@/components/ConfirmModal";

export const initialSongsLibrary: Song[] = (rawSongsData as any[]).map((s: any, idx: number) => ({
  id: s.id || `song-${idx}`,
  title: s.title || '',
  title_en: s.title_en || nepaliToRoman(s.title || ''),
  artist: s.artist || s.authors || 'Worship Team',
  authors: s.authors,
  details: s.details,
  letter: s.letter,
  category: s.category || 'artist',
  songNumber: s.songNumber,
  mainChords: s.mainChords,
  beat: s.beat,
  chordsLyrics: s.chordsLyrics,
  audioUrl: s.audioUrl,
  videoUrl: s.videoUrl,
  rawLyrics: s.rawLyrics || s.lyrics || '',
  rawLyrics_en: s.rawLyrics_en || nepaliToRoman(s.rawLyrics || s.lyrics || ''),
  isDefault: true,
  isCustom: false
}));

export interface WorshipStoreState {
  // Navigation
  appMode: 'schedule' | 'bible' | 'lyrics';
  setAppMode: (mode: 'schedule' | 'bible' | 'lyrics') => void;

  // Bible Explorer
  selectedBook: number;
  selectedChapter: number;
  selectedVerse: number;
  bibleTranslation: BibleTranslation;
  selectedTranslations: BibleTranslation[];
  verses: Array<{ verseNumber: number; text: string }>;
  loading: boolean;
  setSelectedBook: (bookId: number) => void;
  setSelectedChapter: (chapter: number | ((prev: number) => number)) => void;
  setSelectedVerse: (verse: number | ((prev: number) => number)) => void;
  setBibleTranslation: (translation: BibleTranslation) => void;
  setSelectedTranslations: (translations: BibleTranslation[]) => void;
  toggleBibleTranslation: (translation: BibleTranslation) => void;
  setVerses: (verses: Array<{ verseNumber: number; text: string }>) => void;
  setLoading: (loading: boolean) => void;

  // Song Library
  customSongs: Song[];
  allSongs: Song[];
  songSearchQuery: string;
  selectedLetter: string;
  selectedCategory: 'all' | 'bhajan' | 'chorus' | 'artist' | 'custom';
  selectedArtist: string;
  activeLibrarySongId: string;
  isSongModalOpen: boolean;
  songFormData: Partial<Song>;
  editingSongId: string | null;
  setCustomSongs: (songs: Song[]) => void;
  setAllSongs: (songs: Song[]) => void;
  setSongSearchQuery: (query: string) => void;
  setSelectedLetter: (letter: string) => void;
  setSelectedCategory: (category: 'all' | 'bhajan' | 'chorus' | 'artist' | 'custom') => void;
  setSelectedArtist: (artist: string) => void;
  setActiveLibrarySongId: (id: string) => void;
  setIsSongModalOpen: (open: boolean) => void;
  setSongFormData: (data: Partial<Song> | ((prev: Partial<Song>) => Partial<Song>)) => void;
  setEditingSongId: (id: string | null) => void;

  // Schedule Manager
  scheduleItems: ScheduleItem[];
  selectedItemId: string;
  selectedSlideIndex: number;
  selectedScheduleIds: string[];
  draggedSlideIdx: number | null;
  isEditScheduleItemModalOpen: boolean;
  editingScheduleItem: ScheduleItem | null;
  setScheduleItems: (items: ScheduleItem[]) => void;
  setSelectedItemId: (id: string) => void;
  setSelectedSlideIndex: (index: number | ((prev: number) => number)) => void;
  setSelectedScheduleIds: (ids: string[] | ((prev: string[]) => string[])) => void;
  setDraggedSlideIdx: (idx: number | null) => void;
  setIsEditScheduleItemModalOpen: (open: boolean) => void;
  setEditingScheduleItem: (item: ScheduleItem | null) => void;

  // Saved Service Plans
  savedPlans: ServicePlan[];
  isServicePlansModalOpen: boolean;
  setSavedPlans: (plans: ServicePlan[] | ((prev: ServicePlan[]) => ServicePlan[])) => void;
  setIsServicePlansModalOpen: (open: boolean) => void;

  // Display & Broadcast
  isTextHidden: boolean;
  isDisplayConnected: boolean;
  toastMessage: string | null;
  confirmModalConfig: ConfirmModalConfig | null;
  setIsTextHidden: (hidden: boolean | ((prev: boolean) => boolean)) => void;
  setIsDisplayConnected: (connected: boolean) => void;
  setToastMessage: (msg: string | null) => void;
  setConfirmModalConfig: (config: ConfirmModalConfig | null | ((prev: ConfirmModalConfig | null) => ConfirmModalConfig | null)) => void;

  // Background Studio
  bgFileName: string | null;
  localBgUrl: string | null;
  localBgType: 'video' | 'image' | null;
  globalBgConfig: GlobalBackgroundConfig;
  isBgStudioModalOpen: boolean;
  setBgFileName: (name: string | null) => void;
  setLocalBgUrl: (url: string | null) => void;
  setLocalBgType: (type: 'video' | 'image' | null) => void;
  setGlobalBgConfig: (config: GlobalBackgroundConfig | ((prev: GlobalBackgroundConfig) => GlobalBackgroundConfig)) => void;
  setIsBgStudioModalOpen: (open: boolean) => void;

  // Ticker Studio
  tickerConfig: TickerConfig;
  isTickerModalOpen: boolean;
  setTickerConfig: (config: TickerConfig | ((prev: TickerConfig) => TickerConfig)) => void;
  setIsTickerModalOpen: (open: boolean) => void;

  // Text Animation
  textAnimConfig: TextAnimationConfig;
  setTextAnimConfig: (config: TextAnimationConfig | ((prev: TextAnimationConfig) => TextAnimationConfig)) => void;

  // Timers & Media Controls
  countdownLeft: number;
  isCountdownRunning: boolean;
  isVideoPlaying: boolean;
  isVideoMuted: boolean;
  setCountdownLeft: (secs: number | ((prev: number) => number)) => void;
  setIsCountdownRunning: (running: boolean) => void;
  setIsVideoPlaying: (playing: boolean | ((prev: boolean) => boolean)) => void;
  setIsVideoMuted: (muted: boolean | ((prev: boolean) => boolean)) => void;

  // Display & Typography Customization
  displayConfig: ProjectorDisplayConfig;
  isDisplayModalOpen: boolean;
  setDisplayConfig: (config: ProjectorDisplayConfig | ((prev: ProjectorDisplayConfig) => ProjectorDisplayConfig)) => void;
  setIsDisplayModalOpen: (open: boolean) => void;

  // Add Item Modal
  isAddItemModalOpen: boolean;
  addItemType: ScheduleItemType;
  newItemData: NewItemDataState;
  modalSongSearch: string;
  modalVerses: Array<{ verseNumber: number; text: string }>;
  loadingModalVerses: boolean;
  chapterInput: string;
  verseInput: string;
  timerMinInput: string;
  timerSecInput: string;
  setIsAddItemModalOpen: (open: boolean) => void;
  setAddItemType: (type: ScheduleItemType) => void;
  setNewItemData: (data: NewItemDataState | ((prev: NewItemDataState) => NewItemDataState)) => void;
  setModalSongSearch: (query: string) => void;
  setModalVerses: (verses: Array<{ verseNumber: number; text: string }>) => void;
  setLoadingModalVerses: (loading: boolean) => void;
  setChapterInput: (val: string) => void;
  setVerseInput: (val: string) => void;
  setTimerMinInput: (val: string) => void;
  setTimerSecInput: (val: string) => void;
}

export const useWorshipStore = create<WorshipStoreState>((set) => ({
  // Navigation
  appMode: 'schedule',
  setAppMode: (mode) => set({ appMode: mode }),

  // Bible Explorer
  selectedBook: 0,
  selectedChapter: 1,
  selectedVerse: 1,
  bibleTranslation: 'nepali',
  selectedTranslations: ['nepali'],
  verses: [],
  loading: false,
  setSelectedBook: (bookId) => set({ selectedBook: bookId }),
  setSelectedChapter: (updater) => set((state) => ({
    selectedChapter: typeof updater === 'function' ? updater(state.selectedChapter) : updater
  })),
  setSelectedVerse: (updater) => set((state) => ({
    selectedVerse: typeof updater === 'function' ? updater(state.selectedVerse) : updater
  })),
  setBibleTranslation: (translation) => set({ 
    bibleTranslation: translation,
    selectedTranslations: [translation]
  }),
  setSelectedTranslations: (translations) => set({
    selectedTranslations: translations.length > 0 ? translations.slice(0, 2) : ['nepali'],
    bibleTranslation: (translations[0] || 'nepali')
  }),
  toggleBibleTranslation: (translation) => set((state) => {
    const current = state.selectedTranslations || ['nepali'];
    if (current.includes(translation)) {
      if (current.length === 1) return state; // Keep at least one
      const next = current.filter(t => t !== translation);
      return { selectedTranslations: next, bibleTranslation: next[0] };
    } else {
      let next: BibleTranslation[];
      if (current.length < 2) {
        next = [...current, translation];
      } else {
        next = [current[0], translation]; // Replace 2nd
      }
      return { selectedTranslations: next, bibleTranslation: next[0] };
    }
  }),
  setVerses: (verses) => set({ verses }),
  setLoading: (loading) => set({ loading }),

  // Song Library
  customSongs: initialSongsLibrary,
  allSongs: initialSongsLibrary,
  songSearchQuery: '',
  selectedLetter: '',
  selectedCategory: 'all',
  selectedArtist: '',
  activeLibrarySongId: initialSongsLibrary[0]?.id || '',
  isSongModalOpen: false,
  songFormData: { title: '', artist: '', rawLyrics: '' },
  editingSongId: null,
  setCustomSongs: (songs) => set({ customSongs: songs }),
  setAllSongs: (songs) => set({ allSongs: songs }),
  setSongSearchQuery: (query) => set({ songSearchQuery: query }),
  setSelectedLetter: (letter) => set({ selectedLetter: letter }),
  setSelectedCategory: (category) => set((state) => ({
    selectedCategory: category,
    selectedArtist: category === 'artist' ? state.selectedArtist : ''
  })),
  setSelectedArtist: (artist) => set({ selectedArtist: artist }),
  setActiveLibrarySongId: (id) => set({ activeLibrarySongId: id }),
  setIsSongModalOpen: (open) => set({ isSongModalOpen: open }),
  setSongFormData: (updater) => set((state) => ({
    songFormData: typeof updater === 'function' ? updater(state.songFormData) : updater
  })),
  setEditingSongId: (id) => set({ editingSongId: id }),

  // Schedule Manager
  scheduleItems: [],
  selectedItemId: '',
  selectedSlideIndex: 0,
  selectedScheduleIds: [],
  draggedSlideIdx: null,
  isEditScheduleItemModalOpen: false,
  editingScheduleItem: null,
  setScheduleItems: (items) => set({ scheduleItems: items }),
  setSelectedItemId: (id) => set({ selectedItemId: id }),
  setSelectedSlideIndex: (updater) => set((state) => ({
    selectedSlideIndex: typeof updater === 'function' ? updater(state.selectedSlideIndex) : updater
  })),
  setSelectedScheduleIds: (updater) => set((state) => ({
    selectedScheduleIds: typeof updater === 'function' ? updater(state.selectedScheduleIds) : updater
  })),
  setDraggedSlideIdx: (idx) => set({ draggedSlideIdx: idx }),
  setIsEditScheduleItemModalOpen: (open) => set({ isEditScheduleItemModalOpen: open }),
  setEditingScheduleItem: (item) => set({ editingScheduleItem: item }),

  // Saved Service Plans
  savedPlans: [],
  isServicePlansModalOpen: false,
  setSavedPlans: (updater) => set((state) => ({
    savedPlans: typeof updater === 'function' ? updater(state.savedPlans) : updater
  })),
  setIsServicePlansModalOpen: (open) => set({ isServicePlansModalOpen: open }),

  // Display & Broadcast
  isTextHidden: false,
  isDisplayConnected: false,
  toastMessage: null,
  confirmModalConfig: null,
  setIsTextHidden: (updater) => set((state) => ({
    isTextHidden: typeof updater === 'function' ? updater(state.isTextHidden) : updater
  })),
  setIsDisplayConnected: (connected) => set({ isDisplayConnected: connected }),
  setToastMessage: (msg) => set({ toastMessage: msg }),
  setConfirmModalConfig: (updater) => set((state) => ({
    confirmModalConfig: typeof updater === 'function' ? updater(state.confirmModalConfig) : updater
  })),

  // Background Studio
  bgFileName: null,
  localBgUrl: null,
  localBgType: null,
  globalBgConfig: DEFAULT_BACKGROUND_CONFIG,
  isBgStudioModalOpen: false,
  setBgFileName: (name) => set({ bgFileName: name }),
  setLocalBgUrl: (url) => set({ localBgUrl: url }),
  setLocalBgType: (type) => set({ localBgType: type }),
  setGlobalBgConfig: (updater) => set((state) => ({
    globalBgConfig: typeof updater === 'function' ? updater(state.globalBgConfig) : updater
  })),
  setIsBgStudioModalOpen: (open) => set({ isBgStudioModalOpen: open }),

  // Ticker Studio
  tickerConfig: DEFAULT_TICKER_CONFIG,
  isTickerModalOpen: false,
  setTickerConfig: (updater) => set((state) => ({
    tickerConfig: typeof updater === 'function' ? updater(state.tickerConfig) : updater
  })),
  setIsTickerModalOpen: (open) => set({ isTickerModalOpen: open }),

  // Text Animation
  textAnimConfig: DEFAULT_TEXT_ANIMATION_CONFIG,
  setTextAnimConfig: (updater) => set((state) => ({
    textAnimConfig: typeof updater === 'function' ? updater(state.textAnimConfig) : updater
  })),

  // Timers & Media Controls
  countdownLeft: 300,
  isCountdownRunning: false,
  isVideoPlaying: true,
  isVideoMuted: false,
  setCountdownLeft: (updater) => set((state) => ({
    countdownLeft: typeof updater === 'function' ? updater(state.countdownLeft) : updater
  })),
  setIsCountdownRunning: (running) => set({ isCountdownRunning: running }),
  setIsVideoPlaying: (updater) => set((state) => ({
    isVideoPlaying: typeof updater === 'function' ? updater(state.isVideoPlaying) : updater
  })),
  setIsVideoMuted: (updater) => set((state) => ({
    isVideoMuted: typeof updater === 'function' ? updater(state.isVideoMuted) : updater
  })),

  // Display & Typography Customization
  // SSR-safe: always use DEFAULT_DISPLAY_CONFIG. Hydrated from localStorage client-side.
  displayConfig: DEFAULT_DISPLAY_CONFIG,
  isDisplayModalOpen: false,
  setDisplayConfig: (updater) => set((state) => {
    const nextConfig = typeof updater === 'function' ? updater(state.displayConfig) : updater;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('worship_display_config', JSON.stringify(nextConfig));
      } catch {}
    }
    return { displayConfig: nextConfig };
  }),
  setIsDisplayModalOpen: (open) => set({ isDisplayModalOpen: open }),

  // Add Item Modal
  isAddItemModalOpen: false,
  addItemType: 'song',
  newItemData: {
    title: '',
    subtitle: '',
    songId: defaultSongs[0]?.id || '',
    bookId: 0,
    chapter: 1,
    verse: 1,
    translation: 'nepali',
    translations: ['nepali'],
    slideText: '',
    slideSubtitle: '',
    slideTemplate: 'welcome',
    layout: 'standard',
    textAlign: 'center',
    accentColor: 'indigo',
    qrCodeUrl: '',
    qrCodeFile: null,
    bankDetails: '',
    qrBadgeLabel: 'दशांश तथा भेटी',
    qrInstruction: '📱 Scan with Phone Camera or QR Scanner (क्यामेराबाट स्क्यान गर्नुहोस्)',
    countdownSeconds: 300,
    countdownLabel: 'Service Begins In',
    mediaType: 'image',
    mediaFile: null,
    mediaFiles: [],
    presentationSlides: [],
    pdfFile: null,
    embedUrl: '',
    embedType: 'generic'
  },
  modalSongSearch: '',
  modalVerses: [],
  loadingModalVerses: false,
  chapterInput: '1',
  verseInput: '1',
  timerMinInput: '5',
  timerSecInput: '0',
  setIsAddItemModalOpen: (open) => set({ isAddItemModalOpen: open }),
  setAddItemType: (type) => set({ addItemType: type }),
  setNewItemData: (updater) => set((state) => ({
    newItemData: typeof updater === 'function' ? updater(state.newItemData) : updater
  })),
  setModalSongSearch: (query) => set({ modalSongSearch: query }),
  setModalVerses: (verses) => set({ modalVerses: verses }),
  setLoadingModalVerses: (loading) => set({ loadingModalVerses: loading }),
  setChapterInput: (val) => set({ chapterInput: val }),
  setVerseInput: (val) => set({ verseInput: val }),
  setTimerMinInput: (val) => set({ timerMinInput: val }),
  setTimerSecInput: (val) => set({ timerSecInput: val })
}));
