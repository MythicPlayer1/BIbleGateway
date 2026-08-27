"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { books } from "@/lib/books";
import { 
  defaultSongs, parseLyricsToSlides, parseCustomSlideText, 
  DEFAULT_TICKER_CONFIG, QUICK_TICKER_PRESETS, BROADCAST_CHANNEL_NAME,
  type Song, type ScheduleItem, type ScheduleItemType, 
  type SongSlide, type TickerConfig, type TickerTheme, 
  type TickerSpeed, type TickerFontSize, type MediaSlideItem,
  type GlobalBackgroundConfig, DEFAULT_BACKGROUND_CONFIG, type BackgroundImageItem,
  type TextAnimationConfig, DEFAULT_TEXT_ANIMATION_CONFIG, type TextAnimationEffect, type TextAnimationSpeed,
  type ServicePlan
} from "@/lib/lyrics";
import { romanToDevanagariExactMatch, nepaliToRoman } from "@/lib/transliterate";
import { 
  saveScheduleMedia, getScheduleMedia, deleteMultipleScheduleMedia, deleteScheduleMedia
} from "@/lib/mediaStorage";
import type { NewItemDataState } from "@/components/AddItemModal";
import { useWorshipStore, initialSongsLibrary } from "@/store/useWorshipStore";

export function useWorshipState() {
  const {
    appMode, setAppMode,
    selectedBook, setSelectedBook,
    selectedChapter, setSelectedChapter,
    selectedVerse, setSelectedVerse,
    bibleTranslation, setBibleTranslation,
    selectedTranslations, setSelectedTranslations, toggleBibleTranslation,
    verses, setVerses,
    loading, setLoading,
    bgFileName, setBgFileName,
    localBgUrl, setLocalBgUrl,
    localBgType, setLocalBgType,
    globalBgConfig, setGlobalBgConfig,
    isBgStudioModalOpen, setIsBgStudioModalOpen,
    textAnimConfig, setTextAnimConfig,
    isTextHidden, setIsTextHidden,
    isDisplayConnected, setIsDisplayConnected,
    customSongs, setCustomSongs,
    isSongModalOpen, setIsSongModalOpen,
    songFormData, setSongFormData,
    editingSongId, setEditingSongId,
    songSearchQuery, setSongSearchQuery,
    selectedLetter, setSelectedLetter,
    activeLibrarySongId, setActiveLibrarySongId,
    scheduleItems, setScheduleItems,
    selectedItemId, setSelectedItemId,
    selectedSlideIndex, setSelectedSlideIndex,
    selectedScheduleIds, setSelectedScheduleIds,
    isEditScheduleItemModalOpen, setIsEditScheduleItemModalOpen,
    editingScheduleItem, setEditingScheduleItem,
    savedPlans, setSavedPlans,
    isServicePlansModalOpen, setIsServicePlansModalOpen,
    isAddItemModalOpen, setIsAddItemModalOpen,
    addItemType, setAddItemType,
    modalSongSearch, setModalSongSearch,
    newItemData, setNewItemData,
    modalVerses, setModalVerses,
    loadingModalVerses, setLoadingModalVerses,
    chapterInput, setChapterInput,
    verseInput, setVerseInput,
    timerMinInput, setTimerMinInput,
    timerSecInput, setTimerSecInput,
    isTickerModalOpen, setIsTickerModalOpen,
    tickerConfig, setTickerConfig,
    draggedSlideIdx, setDraggedSlideIdx,
    countdownLeft, setCountdownLeft,
    isCountdownRunning, setIsCountdownRunning,
    toastMessage, setToastMessage,
    confirmModalConfig, setConfirmModalConfig,
    isVideoPlaying, setIsVideoPlaying,
    isVideoMuted, setIsVideoMuted
  } = useWorshipStore();

  // References
  const channelRef = useRef<BroadcastChannel | null>(null);
  const currentContentRef = useRef<any>(null);
  const currentBgRef = useRef<any>(null);
  const currentMediaSlideRef = useRef<any>(null);
  const isTextHiddenRef = useRef(isTextHidden);
  const tickerConfigRef = useRef(tickerConfig);
  const globalBgConfigRef = useRef(globalBgConfig);
  const textAnimConfigRef = useRef(textAnimConfig);
  const isDisplayConnectedRef = useRef(isDisplayConnected);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previewContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => { isTextHiddenRef.current = isTextHidden; }, [isTextHidden]);
  useEffect(() => { tickerConfigRef.current = tickerConfig; }, [tickerConfig]);
  useEffect(() => { globalBgConfigRef.current = globalBgConfig; }, [globalBgConfig]);
  useEffect(() => { textAnimConfigRef.current = textAnimConfig; }, [textAnimConfig]);
  useEffect(() => { isDisplayConnectedRef.current = isDisplayConnected; }, [isDisplayConnected]);

  // Auto-disconnect if no heartbeat received in 6s (handles projector tab crash)
  const resetHeartbeatTimeout = () => {
    if (heartbeatTimeoutRef.current) clearTimeout(heartbeatTimeoutRef.current);
    heartbeatTimeoutRef.current = setTimeout(() => {
      setIsDisplayConnected(false);
    }, 6000);
  };

  const showToast = (msg: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => setToastMessage(null), 3000);
  };

  // Broadcast Channel Initialization
  useEffect(() => {
    channelRef.current = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
    
    channelRef.current.onmessage = (event) => {
      const data = event.data;
      if (data.type === 'HEARTBEAT') {
        setIsDisplayConnected(true);
      } else if (data.type === 'DISPLAY_READY' || data.type === 'REQUEST_INIT_STATE') {
        setIsDisplayConnected(true);
        if (channelRef.current) {
          channelRef.current.postMessage({
            type: 'TOGGLE_HIDE',
            hidden: isTextHiddenRef.current
          });
          channelRef.current.postMessage({
            type: 'SET_TEXT_ANIMATION',
            config: textAnimConfigRef.current
          });
          if (globalBgConfigRef.current) {
            channelRef.current.postMessage({
              type: 'SET_BG_CONFIG',
              config: globalBgConfigRef.current
            });
          }
          if (currentBgRef.current) {
            channelRef.current.postMessage({
              type: 'SET_BG',
              ...currentBgRef.current
            });
          }
          if (currentMediaSlideRef.current) {
            channelRef.current.postMessage({
              type: 'SET_MEDIA_SLIDE',
              ...currentMediaSlideRef.current
            });
          } else if (currentContentRef.current) {
            channelRef.current.postMessage({
              type: 'SET_VERSE',
              ...currentContentRef.current
            });
          }
          channelRef.current.postMessage({
            type: 'SET_TICKER',
            config: tickerConfigRef.current
          });
          channelRef.current.postMessage({
            type: 'SET_COUNTDOWN_SYNC',
            secondsLeft: countdownLeft,
            isRunning: isCountdownRunning
          });
        }
      } else if (data.type === 'DISPLAY_CLOSED' || data.type === 'PROJECTOR_CLOSED') {
        setIsDisplayConnected(false);
      }
    };

    return () => {
      if (channelRef.current) channelRef.current.close();
    };
  }, []);

  // Initialize & Hydrate Full 2,101 Nepali Christian Songs Library + Custom User Songs
  useEffect(() => {
    try {
      const savedCustom = localStorage.getItem('worship_custom_songs');
      if (savedCustom) {
        const parsed = JSON.parse(savedCustom);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const userOnly = parsed
            .filter((s: Song) => s.id.startsWith('custom-song-') || s.isCustom)
            .map((s: Song) => ({ ...s, isCustom: true, isDefault: false }));
          setCustomSongs([...userOnly, ...initialSongsLibrary]);
          return;
        }
      }
    } catch (e) {}
    setCustomSongs(initialSongsLibrary);
  }, []);

  // Restore State from LocalStorage and Hydrate IndexedDB media
  useEffect(() => {
    const initStorage = async () => {
      try {
        const savedMode = localStorage.getItem('worship_app_mode');
        if (savedMode && ['schedule', 'bible', 'lyrics'].includes(savedMode)) {
          setAppMode(savedMode as any);
        }

        const savedTicker = localStorage.getItem('worship_ticker_config');
        if (savedTicker) {
          try {
            setTickerConfig(JSON.parse(savedTicker));
          } catch (e) {}
        }

        const savedTextAnimStr = localStorage.getItem('worship_text_anim_config');
        if (savedTextAnimStr) {
          try {
            setTextAnimConfig(JSON.parse(savedTextAnimStr));
          } catch (e) {}
        }

        const savedBgConfigStr = localStorage.getItem('worship_global_bg_config');
        if (savedBgConfigStr) {
          try {
            const parsedBgConfig: GlobalBackgroundConfig = JSON.parse(savedBgConfigStr);
            if (parsedBgConfig.slideshow?.images) {
              const hydratedImages = await Promise.all(
                parsedBgConfig.slideshow.images.map(async (img) => {
                  const rec = await getScheduleMedia(img.id);
                  if (rec) {
                    return {
                      ...img,
                      url: URL.createObjectURL(rec.blob),
                      buffer: rec.buffer,
                      mime: rec.mime
                    };
                  }
                  return img;
                })
              );
              parsedBgConfig.slideshow.images = hydratedImages.filter(img => img.url);
            }
            if (parsedBgConfig.mode === 'video') {
              const rec = await getScheduleMedia('bg_global_video');
              if (rec) {
                parsedBgConfig.video = {
                  name: rec.fileName,
                  url: URL.createObjectURL(rec.blob),
                  buffer: rec.buffer,
                  mime: rec.mime
                };
              }
            }
            setGlobalBgConfig(parsedBgConfig);
          } catch (e) {}
        }

        const savedSched = localStorage.getItem('worship_schedule_items');
        if (savedSched) {
          try {
            const parsedSched = JSON.parse(savedSched);
            const hydratedSched = await Promise.all(
              parsedSched.map(async (item: ScheduleItem) => {
                if (item.type === 'media') {
                  if (item.mediaItems && item.mediaItems.length > 0) {
                    const hydratedMediaItems = await Promise.all(
                      item.mediaItems.map(async (sub) => {
                        const rec = await getScheduleMedia(sub.id);
                        if (rec) {
                          return {
                            ...sub,
                            url: URL.createObjectURL(rec.blob),
                            buffer: rec.buffer,
                            name: rec.fileName,
                            mime: rec.mime,
                            type: rec.fileType
                          };
                        }
                        return sub;
                      })
                    );
                    const slides: SongSlide[] = hydratedMediaItems.map((m, idx) => ({
                      section: `Image ${idx + 1}`,
                      lines: [m.name || `Photo ${idx + 1}`],
                      text: '',
                      mediaUrl: m.url,
                      mediaType: m.type,
                      mediaBuffer: m.buffer,
                      mediaMime: m.mime
                    }));
                    return {
                      ...item,
                      mediaItems: hydratedMediaItems,
                      mediaUrl: hydratedMediaItems[0]?.url,
                      mediaBuffer: hydratedMediaItems[0]?.buffer,
                      mediaMime: hydratedMediaItems[0]?.mime,
                      mediaType: hydratedMediaItems[0]?.type,
                      customSlides: slides
                    };
                  } else {
                    const mediaRecord = await getScheduleMedia(item.id);
                    if (mediaRecord) {
                      const url = URL.createObjectURL(mediaRecord.blob);
                      return {
                        ...item,
                        mediaUrl: url,
                        mediaBuffer: mediaRecord.buffer,
                        mediaMime: mediaRecord.mime,
                        mediaType: mediaRecord.fileType,
                        mediaName: mediaRecord.fileName,
                        customSlides: [{
                          section: mediaRecord.fileType === 'video' ? 'Video Media' : 'Image Media',
                          lines: [mediaRecord.fileName || item.title],
                          text: '',
                          mediaUrl: url,
                          mediaType: mediaRecord.fileType,
                          mediaBuffer: mediaRecord.buffer,
                          mediaMime: mediaRecord.mime
                        }]
                      };
                    }
                  }
                }
                return item;
              })
            );

            setScheduleItems(hydratedSched);
            
            const savedItemId = localStorage.getItem('worship_selected_item_id');
            if (savedItemId && hydratedSched.some((i: any) => i.id === savedItemId)) {
              setSelectedItemId(savedItemId);
            } else if (hydratedSched.length > 0) {
              setSelectedItemId(hydratedSched[0].id);
            } else {
              setSelectedItemId("");
            }

            const savedSlideIdx = localStorage.getItem('worship_selected_slide_index');
            if (savedSlideIdx !== null) {
              setSelectedSlideIndex(parseInt(savedSlideIdx, 10) || 0);
            }
          } catch (e) {}
        }

        const savedPlansStr = localStorage.getItem('worship_saved_service_plans');
        if (savedPlansStr) {
          try {
            const parsedPlans = JSON.parse(savedPlansStr);
            if (Array.isArray(parsedPlans)) {
              setSavedPlans(parsedPlans);
            }
          } catch (e) {}
        }
      } catch (e) {}
    };

    initStorage();
  }, []);

  // Fetch Scripture Verses for Primary Explorer (Supports Dual Parallel Translations)
  useEffect(() => {
    async function fetchVerses() {
      setLoading(true);
      try {
        const transList = selectedTranslations && selectedTranslations.length > 0
          ? selectedTranslations.slice(0, 2)
          : [bibleTranslation || 'nepali'];

        if (transList.length === 1) {
          const res = await fetch(`/api/bible?bookId=${selectedBook}&chapter=${selectedChapter}&translation=${transList[0]}`);
          const data = await res.json();
          setVerses(data.verses || []);
        } else {
          // Parallel fetch for dual translation display (Top / Down)
          const [resPrimary, resSecondary] = await Promise.all([
            fetch(`/api/bible?bookId=${selectedBook}&chapter=${selectedChapter}&translation=${transList[0]}`),
            fetch(`/api/bible?bookId=${selectedBook}&chapter=${selectedChapter}&translation=${transList[1]}`)
          ]);
          const [dataPrimary, dataSecondary] = await Promise.all([resPrimary.json(), resSecondary.json()]);
          const primaryVerses = dataPrimary.verses || [];
          const secondaryVerses = dataSecondary.verses || [];

          const combined = primaryVerses.map((pv: { verseNumber: number; text: string }) => {
            const sv = secondaryVerses.find((item: any) => item.verseNumber === pv.verseNumber);
            const secondaryText = sv?.text || '';
            return {
              verseNumber: pv.verseNumber,
              text: secondaryText ? `${pv.text}\n───\n${secondaryText}` : pv.text
            };
          });
          setVerses(combined);
        }
      } catch (err) {
        setVerses([]);
      } finally {
        setLoading(false);
      }
    }
    fetchVerses();
  }, [selectedBook, selectedChapter, selectedTranslations, bibleTranslation]);

  // Fetch Scripture Verses for Add Item Modal (Supports Dual Translations)
  useEffect(() => {
    async function fetchModalVerses() {
      if (!isAddItemModalOpen || addItemType !== 'scripture') return;
      setLoadingModalVerses(true);
      try {
        const transList = newItemData.translations && newItemData.translations.length > 0
          ? newItemData.translations.slice(0, 2)
          : [newItemData.translation || 'nepali'];

        if (transList.length === 1) {
          const res = await fetch(`/api/bible?bookId=${newItemData.bookId}&chapter=${newItemData.chapter || 1}&translation=${transList[0]}`);
          const data = await res.json();
          setModalVerses(data.verses || []);
        } else {
          const [resP, resS] = await Promise.all([
            fetch(`/api/bible?bookId=${newItemData.bookId}&chapter=${newItemData.chapter || 1}&translation=${transList[0]}`),
            fetch(`/api/bible?bookId=${newItemData.bookId}&chapter=${newItemData.chapter || 1}&translation=${transList[1]}`)
          ]);
          const [dataP, dataS] = await Promise.all([resP.json(), resS.json()]);
          const primaryVerses = dataP.verses || [];
          const secondaryVerses = dataS.verses || [];

          const combined = primaryVerses.map((pv: { verseNumber: number; text: string }) => {
            const sv = secondaryVerses.find((item: any) => item.verseNumber === pv.verseNumber);
            const secondaryText = sv?.text || '';
            return {
              verseNumber: pv.verseNumber,
              text: secondaryText ? `${pv.text}\n───\n${secondaryText}` : pv.text
            };
          });
          setModalVerses(combined);
        }
      } catch (err) {
        setModalVerses([]);
      } finally {
        setLoadingModalVerses(false);
      }
    }
    fetchModalVerses();
  }, [isAddItemModalOpen, addItemType, newItemData.bookId, newItemData.chapter, newItemData.translation, newItemData.translations]);

  // Active Schedule Item & Slides Memo
  const allSongs = useMemo(() => customSongs, [customSongs]);
  const activeScheduleItem = useMemo(() => {
    return scheduleItems.find(i => i.id === selectedItemId) || null;
  }, [scheduleItems, selectedItemId]);

  const activeSongForSchedule = useMemo(() => {
    if (!activeScheduleItem || activeScheduleItem.type !== 'song') return null;
    return allSongs.find(s => s.id === activeScheduleItem.songId) || null;
  }, [activeScheduleItem, allSongs]);

  const activeLibrarySong = useMemo(() => {
    return allSongs.find(s => s.id === activeLibrarySongId) || null;
  }, [allSongs, activeLibrarySongId]);

  const activeSlides = useMemo(() => {
    if (appMode === 'schedule') {
      if (!activeScheduleItem) return [];
      if (activeScheduleItem.customSlides && activeScheduleItem.customSlides.length > 0) {
        return activeScheduleItem.customSlides;
      }
      if (activeScheduleItem.type === 'song' && activeSongForSchedule) {
        return parseLyricsToSlides(activeSongForSchedule.rawLyrics || (activeSongForSchedule as any).lyrics || '');
      }
      if (activeScheduleItem.type === 'slide') {
        if (activeScheduleItem.customSlides && activeScheduleItem.customSlides.length > 0) {
          return activeScheduleItem.customSlides;
        }
        return parseCustomSlideText(
          activeScheduleItem.slideText || activeScheduleItem.title,
          activeScheduleItem.title,
          activeScheduleItem.theme
        );
      }
      if (activeScheduleItem.type === 'scripture') {
        return [{
          section: activeScheduleItem.title,
          lines: [activeScheduleItem.scriptureText || ''],
          text: activeScheduleItem.scriptureText || ''
        }];
      }
      if (activeScheduleItem.type === 'media') {
        if (activeScheduleItem.customSlides && activeScheduleItem.customSlides.length > 0) {
          return activeScheduleItem.customSlides;
        }
        if (activeScheduleItem.mediaItems && activeScheduleItem.mediaItems.length > 0) {
          return activeScheduleItem.mediaItems.map((m, idx) => ({
            section: `Image ${idx + 1}`,
            lines: [m.name || `Photo ${idx + 1}`],
            text: '',
            mediaUrl: m.url,
            mediaType: m.type,
            mediaBuffer: m.buffer,
            mediaMime: m.mime
          }));
        }
        return [{
          section: activeScheduleItem.mediaType === 'video' ? 'Video Media' : 'Image Media',
          lines: [activeScheduleItem.title],
          text: '',
          mediaUrl: activeScheduleItem.mediaUrl,
          mediaType: activeScheduleItem.mediaType,
          mediaBuffer: activeScheduleItem.mediaBuffer,
          mediaMime: activeScheduleItem.mediaMime
        }];
      }
      if (activeScheduleItem.type === 'presentation') {
        if (activeScheduleItem.customSlides && activeScheduleItem.customSlides.length > 0) {
          return activeScheduleItem.customSlides;
        }
        if (activeScheduleItem.presentationSlides && activeScheduleItem.presentationSlides.length > 0) {
          return activeScheduleItem.presentationSlides.map((ps) => ({
            section: `Slide ${ps.pageNumber}`,
            lines: [ps.title || `Slide ${ps.pageNumber}`],
            text: '',
            mediaUrl: ps.imageUrl,
            mediaType: 'image' as const
          }));
        }
      }
      if (activeScheduleItem.type === 'web_embed') {
        return [{
          section: 'Live Web Embed',
          lines: [activeScheduleItem.title],
          text: '',
          title: activeScheduleItem.title,
          subtitle: activeScheduleItem.subtitle
        }];
      }
    } else if (appMode === 'lyrics') {
      if (activeLibrarySong) {
        return parseLyricsToSlides(activeLibrarySong.rawLyrics || (activeLibrarySong as any).lyrics || '');
      }
    }
    return [];
  }, [appMode, activeScheduleItem, activeSongForSchedule, activeLibrarySong]);

  // Persist Schedule helper
  const updateScheduleAndPersist = (newItems: ScheduleItem[], newSelectedId?: string, newSlideIdx?: number) => {
    setScheduleItems(newItems);
    const sanitized = newItems.map(item => ({
      ...item,
      mediaBuffer: undefined,
      mediaUrl: undefined,
      mediaItems: item.mediaItems?.map(m => ({ ...m, buffer: undefined, url: undefined })),
      customSlides: item.customSlides?.map(s => ({ ...s, mediaBuffer: undefined, mediaUrl: undefined }))
    }));
    try {
      localStorage.setItem('worship_schedule_items', JSON.stringify(sanitized));
      if (newSelectedId !== undefined) {
        setSelectedItemId(newSelectedId);
        localStorage.setItem('worship_selected_item_id', newSelectedId);
      }
      if (newSlideIdx !== undefined) {
        setSelectedSlideIndex(newSlideIdx);
        localStorage.setItem('worship_selected_slide_index', newSlideIdx.toString());
      }
    } catch (e) {}
  };

  const selectSlideIndex = (idx: number) => {
    setSelectedSlideIndex(idx);
    try {
      localStorage.setItem('worship_selected_slide_index', idx.toString());
    } catch (e) {}
  };

  // Drag and drop reordering inside slide cards
  const handleSlideDragStart = (e: React.DragEvent, idx: number) => {
    setDraggedSlideIdx(idx);
    e.dataTransfer.setData('text/plain', idx.toString());
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleSlideDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (draggedSlideIdx === null || draggedSlideIdx === idx) return;
    const reordered = [...activeSlides];
    const [moved] = reordered.splice(draggedSlideIdx, 1);
    reordered.splice(idx, 0, moved);
    setDraggedSlideIdx(idx);
    if (activeScheduleItem) {
      const updatedSchedule = scheduleItems.map(item => {
        if (item.id === activeScheduleItem.id) {
          return { ...item, customSlides: reordered };
        }
        return item;
      });
      updateScheduleAndPersist(updatedSchedule, activeScheduleItem.id, idx);
    }
  };

  const handleSlideDragEnd = () => {
    setDraggedSlideIdx(null);
  };

  const handleRemoveSlide = (idx: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!activeScheduleItem) return;
    
    if (activeSlides.length <= 1) {
      showToast("Cannot remove the only slide. Delete the item instead.");
      return;
    }

    const reordered = [...activeSlides];
    reordered.splice(idx, 1);
    
    const updatedSchedule = scheduleItems.map(item => {
      if (item.id === activeScheduleItem.id) {
        const updatedItem = { ...item, customSlides: reordered };
        if (item.type === 'media' && item.mediaItems) {
           const newMediaItems = [...item.mediaItems];
           if (idx < newMediaItems.length) {
              const removedMedia = newMediaItems.splice(idx, 1)[0];
              deleteScheduleMedia(removedMedia.id).catch(() => {});
           }
           updatedItem.mediaItems = newMediaItems;
           if (newMediaItems.length > 0 && idx === 0) {
              updatedItem.mediaUrl = newMediaItems[0].url;
              updatedItem.mediaBuffer = newMediaItems[0].buffer;
              updatedItem.mediaType = newMediaItems[0].type;
              updatedItem.mediaMime = newMediaItems[0].mime;
           }
        }
        return updatedItem;
      }
      return item;
    });

    const newIdx = selectedSlideIndex >= reordered.length ? reordered.length - 1 : selectedSlideIndex;
    updateScheduleAndPersist(updatedSchedule, activeScheduleItem.id, newIdx);
  };

  const handleResetSlidesOrder = () => {
    if (!activeScheduleItem) return;
    const updatedSchedule = scheduleItems.map(item => {
      if (item.id === activeScheduleItem.id) {
        const { customSlides, ...rest } = item;
        return rest;
      }
      return item;
    });
    updateScheduleAndPersist(updatedSchedule, activeScheduleItem.id, 0);
  };

  const toggleMediaPlayPause = () => {
    setIsVideoPlaying(prev => {
      const next = !prev;
      if (channelRef.current) {
        channelRef.current.postMessage({ type: 'MEDIA_PLAY_PAUSE', playing: next });
      }
      return next;
    });
  };

  const toggleMediaMute = () => {
    setIsVideoMuted(prev => {
      const next = !prev;
      if (channelRef.current) {
        channelRef.current.postMessage({ type: 'MEDIA_MUTE_UNMUTE', muted: next });
      }
      return next;
    });
  };

  // Countdown timer controls
  useEffect(() => {
    if (isCountdownRunning) {
      timerIntervalRef.current = setInterval(() => {
        setCountdownLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current!);
            setIsCountdownRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isCountdownRunning]);

  useEffect(() => {
    if (channelRef.current) {
      channelRef.current.postMessage({
        type: 'SET_COUNTDOWN_SYNC',
        secondsLeft: countdownLeft,
        isRunning: isCountdownRunning
      });
    }
  }, [isCountdownRunning, countdownLeft]);

  useEffect(() => {
    if (activeScheduleItem?.theme?.layout === 'countdown' || (activeScheduleItem as any)?.layout === 'countdown') {
      const initialSecs = activeScheduleItem?.theme?.countdownSeconds ?? (activeScheduleItem as any)?.countdownSeconds ?? 300;
      setCountdownLeft(initialSecs);
      setIsCountdownRunning(false);
      if (channelRef.current) {
        channelRef.current.postMessage({
          type: 'SET_COUNTDOWN_SYNC',
          secondsLeft: initialSecs,
          isRunning: false
        });
      }
    }
  }, [activeScheduleItem?.id, activeScheduleItem?.theme?.countdownSeconds]);

  // Broadcast Content to Projector Display
  useEffect(() => {
    if (appMode === 'bible') {
      currentMediaSlideRef.current = null;
      if (channelRef.current) {
        channelRef.current.postMessage({ type: 'CLEAR_MEDIA_SLIDE' });
      }
      if (verses.length > 0) {
        const verseData = verses.find(v => v.verseNumber === selectedVerse);
        if (verseData && channelRef.current) {
          const bookName = books.find(b => b.id === selectedBook)?.name;
          const payload = {
            text: verseData.text,
            reference: `${bookName} ${selectedChapter}:${selectedVerse}`,
            layout: 'standard' as const,
            textAlign: 'center' as const,
            accentColor: 'indigo' as const
          };
          currentContentRef.current = payload;
          channelRef.current.postMessage({ type: 'SET_VERSE', ...payload });
          try {
            localStorage.setItem('worship_live_projector_state', JSON.stringify({
              type: 'verse',
              ...payload,
              isTextHidden: isTextHiddenRef.current,
              ticker: tickerConfigRef.current
            }));
          } catch (e) {}
        }
      }
    } else if (appMode === 'schedule') {
      if (!activeScheduleItem || scheduleItems.length === 0) {
        currentMediaSlideRef.current = null;
        currentContentRef.current = null;
        if (channelRef.current) {
          channelRef.current.postMessage({
            type: 'SET_VERSE',
            text: '',
            reference: '',
            title: '',
            subtitle: '',
            layout: 'standard'
          });
          channelRef.current.postMessage({ type: 'CLEAR_MEDIA_SLIDE' });
        }
        try {
          localStorage.setItem('worship_live_projector_state', JSON.stringify({
            type: 'verse',
            text: '',
            reference: '',
            title: '',
            subtitle: '',
            layout: 'standard',
            isTextHidden: isTextHiddenRef.current,
            ticker: tickerConfigRef.current
          }));
        } catch (e) {}
      } else if (activeScheduleItem?.type === 'media') {
        const currentMedia: any = activeScheduleItem.mediaItems?.[selectedSlideIndex] || activeScheduleItem;
        const currentSlide = activeSlides[selectedSlideIndex];
        const buf = currentMedia.mediaBuffer || currentMedia.buffer || (currentSlide as any)?.mediaBuffer;
        const mime = currentMedia.mediaMime || currentMedia.mime || (currentSlide as any)?.mediaMime || 'image/jpeg';
        const fileType = currentMedia.mediaType || currentMedia.type || (currentSlide as any)?.mediaType || 'image';
        const title = currentMedia.mediaName || currentMedia.name || currentSlide?.lines?.[0] || activeScheduleItem.title;
        const mediaId = currentMedia.id || (activeScheduleItem.mediaItems ? `${activeScheduleItem.id}_media_${selectedSlideIndex}` : activeScheduleItem.id);

        const broadcastMediaPayload = (bufferData: ArrayBuffer) => {
          const mediaPayload = {
            buffer: bufferData,
            mime,
            fileType,
            title
          };
          currentMediaSlideRef.current = mediaPayload;
          currentContentRef.current = null;
          if (channelRef.current) {
            channelRef.current.postMessage({
              type: 'SET_MEDIA_SLIDE',
              ...mediaPayload
            });
            // Reset to playing by default for new media slides
            setIsVideoPlaying(true);
            channelRef.current.postMessage({ type: 'MEDIA_PLAY_PAUSE', playing: true });
          }
          try {
            localStorage.setItem('worship_live_projector_state', JSON.stringify({
              type: 'media',
              mediaId,
              fileType,
              title,
              mime,
              isTextHidden: isTextHiddenRef.current,
              ticker: tickerConfigRef.current
            }));
          } catch (e) {}
        };

        if (buf) {
          broadcastMediaPayload(buf);
        } else {
          getScheduleMedia(mediaId).then(rec => {
            if (rec && rec.buffer) {
              broadcastMediaPayload(rec.buffer);
            }
          }).catch(() => {});
        }
      } else if (activeScheduleItem?.type === 'presentation') {
        const currentSlide = activeSlides[selectedSlideIndex] || activeSlides[0];
        const imageUrl = currentSlide?.mediaUrl || activeScheduleItem.presentationSlides?.[selectedSlideIndex]?.imageUrl || '';
        const title = activeScheduleItem.title;
        const mediaPayload = {
          url: imageUrl,
          fileType: 'image' as const,
          title: `${title} - ${currentSlide?.section || `Slide ${selectedSlideIndex + 1}`}`
        };
        currentMediaSlideRef.current = mediaPayload;
        currentContentRef.current = null;
        if (channelRef.current) {
          channelRef.current.postMessage({
            type: 'SET_MEDIA_SLIDE',
            ...mediaPayload
          });
        }
        try {
          localStorage.setItem('worship_live_projector_state', JSON.stringify({
            type: 'media',
            url: imageUrl,
            fileType: 'image',
            title: mediaPayload.title,
            isTextHidden: isTextHiddenRef.current,
            ticker: tickerConfigRef.current
          }));
        } catch (e) {}
      } else if (activeScheduleItem?.type === 'web_embed') {
        currentMediaSlideRef.current = null;
        if (channelRef.current) {
          channelRef.current.postMessage({ type: 'CLEAR_MEDIA_SLIDE' });
        }
        const payload = {
          text: '',
          reference: '',
          title: activeScheduleItem.title,
          subtitle: activeScheduleItem.subtitle || 'Live Web Presentation',
          layout: 'standard' as const,
          textAlign: 'center' as const,
          accentColor: 'indigo' as const,
          webEmbedUrl: activeScheduleItem.embedUrl,
          embedType: activeScheduleItem.embedType || 'generic'
        };
        currentContentRef.current = payload;
        if (channelRef.current) {
          channelRef.current.postMessage({
            type: 'SET_VERSE',
            ...payload
          });
        }
        try {
          localStorage.setItem('worship_live_projector_state', JSON.stringify({
            type: 'verse',
            ...payload,
            isTextHidden: isTextHiddenRef.current,
            ticker: tickerConfigRef.current
          }));
        } catch (e) {}
      } else if (activeSlides.length > 0) {
        currentMediaSlideRef.current = null;
        if (channelRef.current) {
          channelRef.current.postMessage({ type: 'CLEAR_MEDIA_SLIDE' });
        }
        const currentSlide = activeSlides[selectedSlideIndex] || activeSlides[0];
        if (currentSlide && channelRef.current) {
          const reference = activeScheduleItem?.type === 'song'
            ? `${activeScheduleItem.title} (${currentSlide.section})`
            : activeScheduleItem?.subtitle || activeScheduleItem?.title || '';

          const theme = activeScheduleItem?.theme || (currentSlide as any).theme || {};
          const payload = {
            text: currentSlide.text,
            reference,
            title: activeScheduleItem?.title || (currentSlide as any).title,
            subtitle: activeScheduleItem?.subtitle || (currentSlide as any).subtitle,
            layout: theme.layout || 'standard',
            textAlign: theme.textAlign || 'center',
            accentColor: theme.accentColor || 'indigo',
            qrCodeUrl: theme.qrCodeUrl,
            bankDetails: theme.bankDetails,
            qrBadgeLabel: theme.qrBadgeLabel,
            qrInstruction: theme.qrInstruction,
            countdownSeconds: theme.countdownSeconds ?? 300,
            countdownLeft: countdownLeft,
            countdownRunning: isCountdownRunning,
            countdownLabel: theme.countdownLabel || 'Service Begins In'
          };
          currentContentRef.current = payload;
          channelRef.current.postMessage({
            type: 'SET_VERSE',
            ...payload
          });
          try {
            localStorage.setItem('worship_live_projector_state', JSON.stringify({
              type: 'verse',
              ...payload,
              isTextHidden: isTextHiddenRef.current,
              ticker: tickerConfigRef.current
            }));
          } catch (e) {}
        }
      }
    } else if (appMode === 'lyrics') {
      currentMediaSlideRef.current = null;
      if (channelRef.current) {
        channelRef.current.postMessage({ type: 'CLEAR_MEDIA_SLIDE' });
      }
      if (activeLibrarySong && activeSlides.length > 0) {
        const currentSlide = activeSlides[selectedSlideIndex] || activeSlides[0];
        if (currentSlide && channelRef.current) {
          const payload = {
            text: currentSlide.text,
            reference: `${activeLibrarySong.title} (${currentSlide.section})`,
            title: activeLibrarySong.title,
            subtitle: activeLibrarySong.title_en || activeLibrarySong.artist || 'Worship Song',
            layout: 'standard' as const,
            textAlign: 'center' as const,
            accentColor: 'indigo' as const
          };
          currentContentRef.current = payload;
          channelRef.current.postMessage({
            type: 'SET_VERSE',
            ...payload
          });
          try {
            localStorage.setItem('worship_live_projector_state', JSON.stringify({
              type: 'verse',
              ...payload,
              isTextHidden: isTextHiddenRef.current,
              ticker: tickerConfigRef.current
            }));
          } catch (e) {}
        }
      }
    }
  }, [
    appMode,
    selectedBook,
    selectedChapter,
    selectedVerse,
    verses,
    activeScheduleItem,
    selectedSlideIndex,
    activeSlides,
    activeLibrarySong,
    scheduleItems.length
  ]);

  // Navigation handlers
  const handlePrev = () => {
    if (appMode === 'bible') {
      if (selectedVerse > 1) setSelectedVerse(v => v - 1);
      else if (selectedChapter > 1) {
        setSelectedChapter(c => c - 1);
        setSelectedVerse(1);
      }
    } else {
      if (selectedSlideIndex > 0) selectSlideIndex(selectedSlideIndex - 1);
      else if (appMode === 'schedule') {
        const currentIndex = scheduleItems.findIndex(i => i.id === selectedItemId);
        if (currentIndex > 0) {
          const prevItem = scheduleItems[currentIndex - 1];
          setSelectedItemId(prevItem.id);
          const prevItemSlides = prevItem.customSlides || [];
          selectSlideIndex(prevItemSlides.length > 0 ? prevItemSlides.length - 1 : 0);
        }
      }
    }
  };

  const handleNext = () => {
    if (appMode === 'bible') {
      if (selectedVerse < verses.length) setSelectedVerse(v => v + 1);
      else if (selectedChapter < (books.find(b => b.id === selectedBook)?.chapters || 1)) {
        setSelectedChapter(c => c + 1);
        setSelectedVerse(1);
      }
    } else {
      if (selectedSlideIndex < activeSlides.length - 1) {
        selectSlideIndex(selectedSlideIndex + 1);
      } else if (appMode === 'schedule') {
        const currentIndex = scheduleItems.findIndex(i => i.id === selectedItemId);
        if (currentIndex !== -1 && currentIndex < scheduleItems.length - 1) {
          const nextItem = scheduleItems[currentIndex + 1];
          setSelectedItemId(nextItem.id);
          selectSlideIndex(0);
        }
      }
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'b' || e.key === 'B') {
        toggleHideText();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const toggleHideText = () => {
    const nextVal = !isTextHidden;
    setIsTextHidden(nextVal);
    if (channelRef.current) {
      channelRef.current.postMessage({
        type: 'TOGGLE_HIDE',
        hidden: nextVal
      });
    }
    try {
      const saved = localStorage.getItem('worship_live_projector_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        localStorage.setItem('worship_live_projector_state', JSON.stringify({
          ...parsed,
          isTextHidden: nextVal
        }));
      }
    } catch (e) {}
  };

  const handleOpenProjector = () => {
    window.open('/projector', 'WorshipProjectorWindow', 'width=1280,height=720,menubar=no,toolbar=no,location=no,status=no');
    setIsDisplayConnected(true);
    if (channelRef.current) {
      channelRef.current.postMessage({
        type: 'TOGGLE_HIDE',
        hidden: isTextHiddenRef.current
      });
      if (currentBgRef.current) {
        channelRef.current.postMessage({
          type: 'SET_BG',
          ...currentBgRef.current
        });
      }
      if (currentMediaSlideRef.current) {
        channelRef.current.postMessage({
          type: 'SET_MEDIA_SLIDE',
          ...currentMediaSlideRef.current
        });
      } else if (currentContentRef.current) {
        channelRef.current.postMessage({
          type: 'SET_VERSE',
          ...currentContentRef.current
        });
      }
      channelRef.current.postMessage({
        type: 'SET_TICKER',
        config: tickerConfigRef.current
      });
    }
  };

  const switchAppMode = (mode: 'schedule' | 'bible' | 'lyrics') => {
    setAppMode(mode);
    setSelectedSlideIndex(0);
    try {
      localStorage.setItem('worship_app_mode', mode);
      localStorage.setItem('worship_selected_slide_index', '0');
    } catch (e) {}
  };

  // Ticker Controls
  const handleUpdateTickerText = (text: string) => {
    const updated = { ...tickerConfig, text };
    setTickerConfig(updated);
    try { localStorage.setItem('worship_ticker_config', JSON.stringify(updated)); } catch (e) {}
    if (channelRef.current) channelRef.current.postMessage({ type: 'SET_TICKER', config: updated });
  };

  const handleUpdateTickerBadge = (badgeLabel: string) => {
    const updated = { ...tickerConfig, badgeLabel };
    setTickerConfig(updated);
    try { localStorage.setItem('worship_ticker_config', JSON.stringify(updated)); } catch (e) {}
    if (channelRef.current) channelRef.current.postMessage({ type: 'SET_TICKER', config: updated });
  };

  const handleToggleTickerBadge = () => {
    const updated = { ...tickerConfig, showBadge: !tickerConfig.showBadge };
    setTickerConfig(updated);
    try { localStorage.setItem('worship_ticker_config', JSON.stringify(updated)); } catch (e) {}
    if (channelRef.current) channelRef.current.postMessage({ type: 'SET_TICKER', config: updated });
  };

  const handleUpdateTickerTheme = (theme: TickerTheme) => {
    const updated = { ...tickerConfig, theme };
    setTickerConfig(updated);
    try { localStorage.setItem('worship_ticker_config', JSON.stringify(updated)); } catch (e) {}
    if (channelRef.current) channelRef.current.postMessage({ type: 'SET_TICKER', config: updated });
  };

  const handleUpdateTickerPosition = (position: 'bottom' | 'top') => {
    const updated = { ...tickerConfig, position };
    setTickerConfig(updated);
    try { localStorage.setItem('worship_ticker_config', JSON.stringify(updated)); } catch (e) {}
    if (channelRef.current) channelRef.current.postMessage({ type: 'SET_TICKER', config: updated });
  };

  const handleUpdateTickerSpeed = (speed: TickerSpeed) => {
    const updated = { ...tickerConfig, speed };
    setTickerConfig(updated);
    try { localStorage.setItem('worship_ticker_config', JSON.stringify(updated)); } catch (e) {}
    if (channelRef.current) channelRef.current.postMessage({ type: 'SET_TICKER', config: updated });
  };

  const handleUpdateTickerFontSize = (fontSize: TickerFontSize) => {
    const updated = { ...tickerConfig, fontSize };
    setTickerConfig(updated);
    try { localStorage.setItem('worship_ticker_config', JSON.stringify(updated)); } catch (e) {}
    if (channelRef.current) channelRef.current.postMessage({ type: 'SET_TICKER', config: updated });
  };

  const handleApplyTickerPreset = (preset: typeof QUICK_TICKER_PRESETS[0]) => {
    const updated = { ...tickerConfig, text: preset.text, badgeLabel: preset.badge };
    setTickerConfig(updated);
    try { localStorage.setItem('worship_ticker_config', JSON.stringify(updated)); } catch (e) {}
    if (channelRef.current) channelRef.current.postMessage({ type: 'SET_TICKER', config: updated });
  };

  const handleToggleTicker = () => {
    const updated = { ...tickerConfig, enabled: !tickerConfig.enabled };
    setTickerConfig(updated);
    try { localStorage.setItem('worship_ticker_config', JSON.stringify(updated)); } catch (e) {}
    if (channelRef.current) channelRef.current.postMessage({ type: 'SET_TICKER', config: updated });
  };

  // Schedule Delete Handlers
  const handleDeleteSingleScheduleItem = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    deleteMultipleScheduleMedia([id, ...Array.from({ length: 20 }, (_, i) => `${id}_media_${i}`)]);
    const updated = scheduleItems.filter(i => i.id !== id);
    setSelectedScheduleIds(prev => prev.filter(x => x !== id));
    if (selectedItemId === id) {
      const nextSelectedId = updated[0]?.id || "";
      updateScheduleAndPersist(updated, nextSelectedId, 0);
      if (channelRef.current) {
        channelRef.current.postMessage({ type: 'CLEAR_MEDIA_SLIDE' });
        channelRef.current.postMessage({
          type: 'SET_VERSE',
          text: '',
          reference: '',
          title: '',
          subtitle: '',
          layout: 'standard'
        });
      }
    } else {
      updateScheduleAndPersist(updated);
    }
  };

  // Confirmation Modal Helpers
  const showConfirm = (config: Omit<import("@/components/ConfirmModal").ConfirmModalConfig, "isOpen">) => {
    setConfirmModalConfig({
      ...config,
      isOpen: true
    });
  };

  const closeConfirmModal = () => {
    setConfirmModalConfig(null);
  };

  const handleBulkDeleteSchedule = () => {
    if (selectedScheduleIds.length === 0) return;
    showConfirm({
      title: "Delete Selected Items",
      message: `Are you sure you want to remove ${selectedScheduleIds.length} selected item(s) from the service schedule?`,
      confirmText: `Delete ${selectedScheduleIds.length} Item(s)`,
      variant: "danger",
      onConfirm: () => {
        const mediaIdsToDelete: string[] = [];
        selectedScheduleIds.forEach(id => {
          mediaIdsToDelete.push(id);
          for (let i = 0; i < 20; i++) mediaIdsToDelete.push(`${id}_media_${i}`);
        });
        deleteMultipleScheduleMedia(mediaIdsToDelete);
        const updated = scheduleItems.filter(i => !selectedScheduleIds.includes(i.id));
        const wasActiveDeleted = selectedScheduleIds.includes(selectedItemId);
        setSelectedScheduleIds([]);
        if (wasActiveDeleted || updated.length === 0) {
          const nextSelectedId = updated[0]?.id || "";
          updateScheduleAndPersist(updated, nextSelectedId, 0);
          if (channelRef.current) {
            channelRef.current.postMessage({ type: 'CLEAR_MEDIA_SLIDE' });
            channelRef.current.postMessage({
              type: 'SET_VERSE',
              text: '',
              reference: '',
              title: '',
              subtitle: '',
              layout: 'standard'
            });
          }
        } else {
          updateScheduleAndPersist(updated);
        }
        showToast(`Deleted ${selectedScheduleIds.length} items from schedule`);
      }
    });
  };

  const handleClearAllSchedule = () => {
    if (scheduleItems.length === 0) return;
    showConfirm({
      title: "Clear Order of Service",
      message: "Are you sure you want to clear all items from the current schedule?",
      confirmText: "Clear Schedule",
      variant: "danger",
      onConfirm: () => {
        const allIds: string[] = [];
        scheduleItems.forEach(item => {
          allIds.push(item.id);
          for (let i = 0; i < 20; i++) allIds.push(`${item.id}_media_${i}`);
        });
        deleteMultipleScheduleMedia(allIds);
        setSelectedScheduleIds([]);
        updateScheduleAndPersist([], "", 0);
        if (channelRef.current) {
          channelRef.current.postMessage({ type: 'CLEAR_MEDIA_SLIDE' });
          channelRef.current.postMessage({
            type: 'SET_VERSE',
            text: '',
            reference: '',
            title: '',
            subtitle: '',
            layout: 'standard'
          });
        }
        showToast("Service schedule cleared");
      }
    });
  };

  const toggleSelectScheduleItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedScheduleIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAllSchedule = () => {
    if (selectedScheduleIds.length === scheduleItems.length) {
      setSelectedScheduleIds([]);
    } else {
      setSelectedScheduleIds(scheduleItems.map(i => i.id));
    }
  };

  // Add Item to Schedule
  const handleAddItemToSchedule = async () => {
    let newItem: ScheduleItem | null = null;

    if (addItemType === 'song') {
      const s = allSongs.find(song => song.id === newItemData.songId) || allSongs[0];
      if (!s) return;
      newItem = {
        id: `item-${Date.now()}`,
        title: s.title,
        subtitle: s.title_en || s.artist || 'Worship Song',
        type: 'song',
        songId: s.id
      };
    } else if (addItemType === 'scripture') {
      const book = books.find(b => b.id === newItemData.bookId) || books[0];
      const safeChapter = Math.max(1, Math.min(book.chapters, newItemData.chapter || 1));
      const safeVerse = Math.max(1, newItemData.verse || 1);
      const transList = newItemData.translations && newItemData.translations.length > 0
        ? newItemData.translations
        : [newItemData.translation || 'nepali'];
      const transBadge = transList.length === 1 && transList[0] === 'nepali'
        ? ''
        : ` (${transList.map(t => t.toUpperCase()).join(' + ')})`;
      let verseText = '';
      if (modalVerses.length > 0) {
        const v = modalVerses.find(item => item.verseNumber === safeVerse);
        if (v) verseText = v.text;
      }
      if (!verseText) {
        try {
          if (transList.length === 1) {
            const res = await fetch(`/api/bible?bookId=${newItemData.bookId}&chapter=${safeChapter}&translation=${transList[0]}`);
            const data = await res.json();
            const v = data.verses?.find((item: any) => item.verseNumber === safeVerse);
            if (v) verseText = v.text;
          } else {
            const [resP, resS] = await Promise.all([
              fetch(`/api/bible?bookId=${newItemData.bookId}&chapter=${safeChapter}&translation=${transList[0]}`),
              fetch(`/api/bible?bookId=${newItemData.bookId}&chapter=${safeChapter}&translation=${transList[1]}`)
            ]);
            const [dataP, dataS] = await Promise.all([resP.json(), resS.json()]);
            const vP = dataP.verses?.find((item: any) => item.verseNumber === safeVerse);
            const vS = dataS.verses?.find((item: any) => item.verseNumber === safeVerse);
            if (vP && vP.text) {
              verseText = vS && vS.text ? `${vP.text}\n───\n${vS.text}` : vP.text;
            }
          }
        } catch (e) {}
      }

      newItem = {
        id: `item-${Date.now()}`,
        title: `${book.name} ${safeChapter}:${safeVerse}${transBadge}`,
        subtitle: `${book.englishName} Scripture Reading${transBadge}`,
        type: 'scripture',
        bookId: newItemData.bookId,
        chapter: safeChapter,
        verse: safeVerse,
        translation: transList[0],
        translations: transList,
        scriptureText: verseText
      };
    } else if (addItemType === 'slide') {
      const slideId = `item-${Date.now()}`;
      let qrCodeDataUrl = newItemData.qrCodeUrl;

      if (newItemData.qrCodeFile) {
        try {
          qrCodeDataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.readAsDataURL(newItemData.qrCodeFile!);
          });
        } catch (e) {}
      }

      const generatedSlides = parseCustomSlideText(
        newItemData.slideText || newItemData.title || 'Announcement Slide',
        newItemData.title || 'Announcement Slide',
        {
          layout: newItemData.layout,
          textAlign: newItemData.textAlign,
          accentColor: newItemData.accentColor,
          qrCodeUrl: qrCodeDataUrl,
          bankDetails: newItemData.bankDetails,
          qrBadgeLabel: newItemData.qrBadgeLabel,
          qrInstruction: newItemData.qrInstruction,
          countdownSeconds: newItemData.countdownSeconds,
          countdownLabel: newItemData.countdownLabel
        }
      );

      newItem = {
        id: slideId,
        title: newItemData.title || 'Announcement Slide',
        subtitle: newItemData.slideSubtitle || 'Church Presentation Slide',
        type: 'slide',
        slideText: newItemData.slideText,
        slideSubtitle: newItemData.slideSubtitle,
        slideTemplate: newItemData.slideTemplate,
        theme: {
          layout: newItemData.layout,
          textAlign: newItemData.textAlign,
          accentColor: newItemData.accentColor,
          qrCodeUrl: qrCodeDataUrl,
          bankDetails: newItemData.bankDetails,
          qrBadgeLabel: newItemData.qrBadgeLabel,
          qrInstruction: newItemData.qrInstruction,
          countdownSeconds: newItemData.countdownSeconds,
          countdownLabel: newItemData.countdownLabel
        },
        customSlides: generatedSlides
      };
    } else if (addItemType === 'media' && ((newItemData.mediaFiles && newItemData.mediaFiles.length > 0) || newItemData.mediaFile)) {
      const filesToProcess = (newItemData.mediaFiles && newItemData.mediaFiles.length > 0) 
        ? newItemData.mediaFiles 
        : [newItemData.mediaFile!];
      const newId = `item-${Date.now()}`;
      
      const processedMediaItems: MediaSlideItem[] = [];
      const generatedSlides: SongSlide[] = [];

      for (let idx = 0; idx < filesToProcess.length; idx++) {
        const file = filesToProcess[idx];
        const subId = `${newId}_media_${idx}`;
        const buffer = await file.arrayBuffer();
        const previewUrl = URL.createObjectURL(file);
        const isVideo = file.type.startsWith('video');

        await saveScheduleMedia(subId, file, file.name, isVideo ? 'video' : 'image', file.type);

        const mediaItemObj: MediaSlideItem = {
          id: subId,
          name: file.name,
          type: isVideo ? 'video' : 'image',
          mime: file.type,
          url: previewUrl,
          buffer
        };
        processedMediaItems.push(mediaItemObj);

        generatedSlides.push({
          section: isVideo ? `Video ${idx + 1}` : `Image ${idx + 1}`,
          lines: [file.name],
          text: '',
          mediaUrl: previewUrl,
          mediaType: isVideo ? 'video' : 'image',
          mediaBuffer: buffer,
          mediaMime: file.type
        });
      }

      const firstMedia = processedMediaItems[0];
      const isMultiple = processedMediaItems.length > 1;

      newItem = {
        id: newId,
        title: newItemData.title || (isMultiple ? `Photo Gallery (${processedMediaItems.length} Images)` : firstMedia.name),
        subtitle: isMultiple 
          ? `${processedMediaItems.length} Slide Media Deck` 
          : (firstMedia.type === 'video' ? 'Video Presentation Slide' : 'Image Presentation Slide'),
        type: 'media',
        mediaType: firstMedia.type,
        mediaUrl: firstMedia.url,
        mediaName: firstMedia.name,
        mediaBuffer: firstMedia.buffer,
        mediaMime: firstMedia.mime,
        mediaItems: processedMediaItems,
        customSlides: generatedSlides
      };
    } else if (addItemType === 'presentation' && newItemData.presentationSlides && newItemData.presentationSlides.length > 0) {
      const presId = `item-${Date.now()}`;
      const generatedSlides: SongSlide[] = newItemData.presentationSlides.map((ps) => ({
        section: `Slide ${ps.pageNumber}`,
        lines: [ps.title || `Slide ${ps.pageNumber}`],
        text: '',
        mediaUrl: ps.imageUrl,
        mediaType: 'image'
      }));

      newItem = {
        id: presId,
        title: newItemData.title.trim() || 'Presentation Deck',
        subtitle: newItemData.subtitle.trim() || `${newItemData.presentationSlides.length} Presentation Slides`,
        type: 'presentation',
        presentationSlides: newItemData.presentationSlides,
        customSlides: generatedSlides
      };
    } else if (addItemType === 'web_embed' && newItemData.embedUrl) {
      const embedId = `item-${Date.now()}`;
      newItem = {
        id: embedId,
        title: newItemData.title.trim() || 'Live Web Presentation',
        subtitle: newItemData.subtitle.trim() || 'Interactive Presentation Embed',
        type: 'web_embed',
        embedUrl: newItemData.embedUrl,
        embedType: newItemData.embedType || 'generic'
      };
    }

    if (newItem) {
      const updated = [...scheduleItems, newItem];
      setIsAddItemModalOpen(false);
      updateScheduleAndPersist(updated, newItem.id, 0);

      setNewItemData({
        title: '',
        subtitle: '',
        songId: allSongs[0]?.id || '',
        bookId: 0,
        chapter: 1,
        verse: 1,
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
      });
    }
  };

  const handleAddScriptureToSchedule = () => {
    const book = books.find(b => b.id === selectedBook);
    if (!book) return;
    const currentVerseData = verses.find(v => v.verseNumber === selectedVerse);
    const transList = selectedTranslations && selectedTranslations.length > 0
      ? selectedTranslations
      : [bibleTranslation || 'nepali'];
    const transBadge = transList.length === 1 && transList[0] === 'nepali'
      ? ''
      : ` (${transList.map(t => t.toUpperCase()).join(' + ')})`;
    const scriptureItem: ScheduleItem = {
      id: `item-${Date.now()}`,
      title: `${book.name} ${selectedChapter}:${selectedVerse}${transBadge}`,
      subtitle: `${book.englishName} Scripture Reading${transBadge}`,
      type: 'scripture',
      bookId: selectedBook,
      chapter: selectedChapter,
      verse: selectedVerse,
      translation: transList[0],
      translations: transList,
      scriptureText: currentVerseData?.text || ''
    };
    updateScheduleAndPersist([...scheduleItems, scriptureItem], scriptureItem.id, 0);
    showToast(`Added ${book.name} ${selectedChapter}:${selectedVerse}${transBadge} to Schedule`);
  };

  const handleAddSongToSchedule = (song: Song, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const songItem: ScheduleItem = {
      id: `item-${Date.now()}`,
      title: song.title,
      subtitle: song.title_en || song.artist || 'Worship Song',
      type: 'song',
      songId: song.id
    };
    updateScheduleAndPersist([...scheduleItems, songItem], songItem.id, 0);
    showToast(`Added "${song.title}" to Schedule`);
  };

  // Song Creator Handlers
  const handleOpenNewSongModal = () => {
    setEditingSongId(null);
    setSongFormData({ title: '', artist: '', rawLyrics: '' });
    setIsSongModalOpen(true);
  };

  const handleOpenEditSongModal = (song: Song, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingSongId(song.id);
    setSongFormData({
      title: song.title,
      artist: song.artist || '',
      rawLyrics: song.rawLyrics || ''
    });
    setIsSongModalOpen(true);
  };

  const handleOpenEditScheduleItemModal = (item: ScheduleItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingScheduleItem(item);
    setIsEditScheduleItemModalOpen(true);
  };

  const handleSaveScheduleItem = (updatedItem: ScheduleItem) => {
    const updated = scheduleItems.map(item => item.id === updatedItem.id ? updatedItem : item);
    updateScheduleAndPersist(updated, updatedItem.id, 0);
    showToast(`Updated "${updatedItem.title}" in Schedule`);
  };

  // Service Plans & Schedule Templates Handlers
  const handleOpenServicePlansModal = () => {
    setIsServicePlansModalOpen(true);
  };

  const handleCloseServicePlansModal = () => {
    setIsServicePlansModalOpen(false);
  };

  const handleSaveCurrentServicePlan = (name: string, description?: string, serviceDate?: string) => {
    if (!name.trim()) return;
    const newPlan: ServicePlan = {
      id: `plan-${Date.now()}`,
      name: name.trim(),
      description: description?.trim() || undefined,
      serviceDate: serviceDate || undefined,
      items: scheduleItems,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const updated = [newPlan, ...savedPlans];
    setSavedPlans(updated);
    try {
      localStorage.setItem('worship_saved_service_plans', JSON.stringify(updated));
    } catch (e) {}
    showToast(`Saved service plan "${name}"`);
  };

  const handleLoadServicePlan = (plan: ServicePlan, mode: "replace" | "append") => {
    if (mode === "replace") {
      updateScheduleAndPersist(plan.items, plan.items[0]?.id || "", 0);
      showToast(`Loaded "${plan.name}" into schedule`);
    } else {
      const newItems = plan.items.map((item) => ({
        ...item,
        id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      }));
      const combined = [...scheduleItems, ...newItems];
      updateScheduleAndPersist(combined, scheduleItems[0]?.id || newItems[0]?.id || "", 0);
      showToast(`Appended ${newItems.length} items from "${plan.name}"`);
    }
    setIsServicePlansModalOpen(false);
  };

  const handleDuplicateServicePlan = (plan: ServicePlan) => {
    const duplicated: ServicePlan = {
      ...plan,
      id: `plan-${Date.now()}`,
      name: `${plan.name} (Copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const updated = [duplicated, ...savedPlans];
    setSavedPlans(updated);
    try {
      localStorage.setItem('worship_saved_service_plans', JSON.stringify(updated));
    } catch (e) {}
    showToast(`Duplicated "${plan.name}"`);
  };

  const handleDeleteServicePlan = (planId: string) => {
    const plan = savedPlans.find((p) => p.id === planId);
    if (!plan) return;
    showConfirm({
      title: "Delete Service Plan",
      message: `Are you sure you want to delete "${plan.name}"? This action cannot be undone.`,
      confirmText: "Delete Plan",
      variant: "danger",
      onConfirm: () => {
        const updated = savedPlans.filter((p) => p.id !== planId);
        setSavedPlans(updated);
        try {
          localStorage.setItem('worship_saved_service_plans', JSON.stringify(updated));
        } catch (e) {}
        showToast(`Deleted "${plan.name}"`);
      }
    });
  };

  const handleExportServicePlan = (plan: ServicePlan) => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(plan, null, 2));
      const downloadAnchor = document.createElement("a");
      const cleanName = plan.name.replace(/[^a-zA-Z0-9_-]/g, "_");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `${cleanName || "service"}_plan.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast(`Exported "${plan.name}" to JSON`);
    } catch (e) {
      console.error(e);
      showToast("Failed to export plan");
    }
  };

  const handleImportServicePlan = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        let importedPlans: ServicePlan[] = [];

        if (Array.isArray(parsed)) {
          if (parsed.length > 0 && parsed[0].items) {
            importedPlans = parsed;
          } else {
            importedPlans = [{
              id: `plan-${Date.now()}`,
              name: file.name.replace(/\.json$/i, "").replace(/[_-]/g, " "),
              items: parsed,
              createdAt: Date.now(),
              updatedAt: Date.now()
            }];
          }
        } else if (parsed && parsed.name && parsed.items) {
          importedPlans = [{
            ...parsed,
            id: `plan-${Date.now()}`
          }];
        } else {
          showToast("Invalid service plan JSON format");
          return;
        }

        const updated = [...importedPlans, ...savedPlans];
        setSavedPlans(updated);
        try {
          localStorage.setItem('worship_saved_service_plans', JSON.stringify(updated));
        } catch (e) {}
        showToast(`Imported ${importedPlans.length} service plan(s)`);
      } catch (err) {
        console.error("Failed to parse JSON file", err);
        showToast("Error importing JSON file");
      }
    };
    reader.readAsText(file);
  };

  const handleDeleteSong = (songId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const songToDelete = allSongs.find(s => s.id === songId);
    if (!songToDelete) return;

    const isCustom = Boolean(songToDelete.isCustom || songToDelete.id.startsWith('custom-song-'));
    if (!isCustom) {
      showToast("Default system songs cannot be deleted from the library.");
      return;
    }

    showConfirm({
      title: "Delete Custom Song",
      message: `Are you sure you want to delete "${songToDelete.title}" from your custom library?`,
      confirmText: "Delete Song",
      variant: "danger",
      onConfirm: () => {
        const updated = customSongs.filter(s => s.id !== songId);
        setCustomSongs(updated);
        try {
          const userCustomOnly = updated.filter(s => s.isCustom || s.id.startsWith('custom-song-'));
          localStorage.setItem('worship_custom_songs', JSON.stringify(userCustomOnly));
        } catch (err) {}

        if (activeLibrarySongId === songId) {
          const remaining = allSongs.filter(s => s.id !== songId);
          if (remaining.length > 0) setActiveLibrarySongId(remaining[0].id);
        }

        showToast(`Deleted "${songToDelete.title}"`);
      }
    });
  };

  const handleSaveSong = (addToSchedule: boolean = true) => {
    if (!songFormData.title || !songFormData.rawLyrics) return;
    let updatedSongs: Song[];
    let targetSong: Song;

    if (editingSongId) {
      targetSong = {
        id: editingSongId,
        title: songFormData.title!,
        artist: songFormData.artist || 'Worship Team',
        rawLyrics: songFormData.rawLyrics!,
        title_en: nepaliToRoman(songFormData.title!),
        rawLyrics_en: nepaliToRoman(songFormData.rawLyrics!),
        isCustom: true,
        isDefault: false
      };
      const existsInCustom = customSongs.some(s => s.id === editingSongId);
      if (existsInCustom) {
        updatedSongs = customSongs.map(s => s.id === editingSongId ? targetSong : s);
      } else {
        updatedSongs = [targetSong, ...customSongs];
      }
    } else {
      targetSong = {
        id: `custom-song-${Date.now()}`,
        title: songFormData.title!,
        artist: songFormData.artist || 'Custom Worship',
        rawLyrics: songFormData.rawLyrics!,
        title_en: nepaliToRoman(songFormData.title!),
        rawLyrics_en: nepaliToRoman(songFormData.rawLyrics!),
        isCustom: true,
        isDefault: false
      };
      updatedSongs = [targetSong, ...customSongs];
      setActiveLibrarySongId(targetSong.id);
    }

    setCustomSongs(updatedSongs);
    setIsSongModalOpen(false);

    try {
      const userCustomOnly = updatedSongs.filter(s => s.isCustom || s.id.startsWith('custom-song-'));
      localStorage.setItem('worship_custom_songs', JSON.stringify(userCustomOnly));
    } catch (e) {}

    if (addToSchedule && targetSong) {
      const songItem: ScheduleItem = {
        id: `item-${Date.now()}`,
        title: targetSong.title,
        subtitle: targetSong.title_en || targetSong.artist || 'Worship Song',
        type: 'song',
        songId: targetSong.id
      };
      updateScheduleAndPersist([...scheduleItems, songItem], songItem.id, 0);
      showToast(`Saved "${targetSong.title}" & added to Schedule`);
    } else {
      showToast(`Saved "${targetSong.title}" to Song Library`);
    }
  };

  // Background Media Upload & Studio Handlers
  const updateGlobalBgConfig = (newConfig: GlobalBackgroundConfig) => {
    setGlobalBgConfig(newConfig);
    try {
      const sanitized = {
        ...newConfig,
        slideshow: {
          ...newConfig.slideshow,
          images: newConfig.slideshow.images.map(img => ({ ...img, buffer: undefined, url: img.url }))
        },
        video: newConfig.video ? { ...newConfig.video, buffer: undefined } : undefined
      };
      localStorage.setItem('worship_global_bg_config', JSON.stringify(sanitized));
    } catch (e) {}
    if (channelRef.current) {
      channelRef.current.postMessage({
        type: 'SET_BG_CONFIG',
        config: newConfig
      });
    }
  };

  const handleAddSlideshowImages = async (files: FileList) => {
    const newImages: BackgroundImageItem[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const id = `bg-img-${Date.now()}-${i}`;
      const buffer = await file.arrayBuffer();
      const url = URL.createObjectURL(file);
      await saveScheduleMedia(id, file, file.name, 'image', file.type);
      newImages.push({
        id,
        name: file.name,
        url,
        buffer,
        mime: file.type
      });
    }
    const updatedImages = [...globalBgConfig.slideshow.images, ...newImages];
    const newConfig: GlobalBackgroundConfig = {
      ...globalBgConfig,
      mode: 'slideshow',
      slideshow: {
        ...globalBgConfig.slideshow,
        images: updatedImages
      }
    };
    updateGlobalBgConfig(newConfig);
    showToast(`Added ${files.length} photo(s) to projector background slideshow`);
  };

  const handleRemoveSlideshowImage = (id: string) => {
    deleteScheduleMedia(id).catch(() => {});
    const updatedImages = globalBgConfig.slideshow.images.filter(img => img.id !== id);
    const newConfig: GlobalBackgroundConfig = {
      ...globalBgConfig,
      mode: updatedImages.length > 0 ? 'slideshow' : 'none',
      slideshow: {
        ...globalBgConfig.slideshow,
        images: updatedImages
      }
    };
    updateGlobalBgConfig(newConfig);
  };

  const handleClearSlideshowImages = () => {
    const ids = globalBgConfig.slideshow.images.map(img => img.id);
    deleteMultipleScheduleMedia(ids);
    const newConfig: GlobalBackgroundConfig = {
      ...globalBgConfig,
      mode: 'none',
      slideshow: {
        ...globalBgConfig.slideshow,
        images: []
      }
    };
    updateGlobalBgConfig(newConfig);
    showToast("Cleared background slideshow images");
  };

  const handleUploadVideoBackground = async (file: File) => {
    const id = 'bg_global_video';
    const buffer = await file.arrayBuffer();
    const url = URL.createObjectURL(file);
    await saveScheduleMedia(id, file, file.name, 'video', file.type);
    const newConfig: GlobalBackgroundConfig = {
      ...globalBgConfig,
      mode: 'video',
      video: {
        name: file.name,
        url,
        buffer,
        mime: file.type
      }
    };
    updateGlobalBgConfig(newConfig);
    showToast(`Projector background video updated to ${file.name}`);
  };

  const handleBackgroundUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('video')) {
        await handleUploadVideoBackground(file);
      } else {
        const fileList = e.target.files;
        if (fileList) await handleAddSlideshowImages(fileList);
      }
    }
  };

  const handleClearBackground = () => {
    setBgFileName(null);
    setLocalBgUrl(null);
    setLocalBgType(null);
    currentBgRef.current = null;
    const newConfig: GlobalBackgroundConfig = {
      ...globalBgConfig,
      mode: 'none'
    };
    updateGlobalBgConfig(newConfig);
    if (channelRef.current) {
      channelRef.current.postMessage({ type: 'CLEAR_BG' });
    }
    showToast("Projector background turned off");
  };

  const updateCountdownTime = (m: number, s: number) => {
    const total = m * 60 + s;
    setNewItemData(prev => ({ ...prev, countdownSeconds: total }));
  };

  // Filtered Songs with Transliteration Search
  const filteredSongs = useMemo(() => {
    let result = allSongs;
    if (selectedLetter) {
      result = result.filter(s => {
        const titleStr = s.title || '';
        const titleMatch = titleStr.startsWith(selectedLetter);
        const romanMatch = s.title_en?.toLowerCase().startsWith(selectedLetter.toLowerCase());
        return titleMatch || romanMatch;
      });
    }
    if (songSearchQuery.trim()) {
      const q = songSearchQuery.trim().toLowerCase();
      const devanagariSearch = romanToDevanagariExactMatch(q);
      result = result.filter(s => {
        const titleStr = s.title || '';
        const rawLyricsStr = s.rawLyrics || '';
        const titleMatch = titleStr.toLowerCase().includes(q) || (devanagariSearch && titleStr.includes(devanagariSearch));
        const titleEnMatch = s.title_en?.toLowerCase().includes(q);
        const lyricsMatch = rawLyricsStr.toLowerCase().includes(q) || (devanagariSearch && rawLyricsStr.includes(devanagariSearch));
        const lyricsEnMatch = s.rawLyrics_en?.toLowerCase().includes(q);
        const idMatch = (s.id || '').toLowerCase().includes(q);
        return titleMatch || titleEnMatch || lyricsMatch || lyricsEnMatch || idMatch;
      });
    }
    return result;
  }, [allSongs, selectedLetter, songSearchQuery]);

  const modalFilteredSongs = useMemo(() => {
    if (!modalSongSearch.trim()) return allSongs.slice(0, 30);
    const q = modalSongSearch.trim().toLowerCase();
    const devanagariSearch = romanToDevanagariExactMatch(q);
    return allSongs.filter(s => {
      const titleStr = s.title || '';
      const rawLyricsStr = s.rawLyrics || '';
      const titleMatch = titleStr.toLowerCase().includes(q) || (devanagariSearch && titleStr.includes(devanagariSearch));
      const titleEnMatch = s.title_en?.toLowerCase().includes(q);
      const lyricsMatch = rawLyricsStr.toLowerCase().includes(q) || (devanagariSearch && rawLyricsStr.includes(devanagariSearch));
      const lyricsEnMatch = s.rawLyrics_en?.toLowerCase().includes(q);
      const idMatch = (s.id || '').toLowerCase().includes(q);
      return titleMatch || titleEnMatch || lyricsMatch || lyricsEnMatch || idMatch;
    }).slice(0, 30);
  }, [allSongs, modalSongSearch]);

  // Live Screen Preview text calculations
  const isScheduleMedia = appMode === 'schedule' && (
    activeScheduleItem?.type === 'media' || 
    activeScheduleItem?.type === 'presentation' ||
    Boolean(activeSlides[selectedSlideIndex]?.mediaUrl)
  );
  const currentActiveMedia: any = isScheduleMedia 
    ? (
        activeSlides[selectedSlideIndex]?.mediaUrl
          ? {
              url: activeSlides[selectedSlideIndex].mediaUrl,
              type: activeSlides[selectedSlideIndex].mediaType || 'image',
              name: activeSlides[selectedSlideIndex].lines?.[0] || activeScheduleItem?.title || 'Slide'
            }
          : (activeScheduleItem?.mediaItems?.[selectedSlideIndex] || activeScheduleItem)
      )
    : null;
  const currentPreviewText = appMode === 'bible'
    ? verses.find(v => v.verseNumber === selectedVerse)?.text || ''
    : activeSlides[selectedSlideIndex]?.text || '';

  const currentActiveMediaUrl = appMode === 'schedule' 
    ? (currentActiveMedia?.url || currentActiveMedia?.mediaUrl || activeScheduleItem?.mediaUrl || '')
    : '';
  const currentActiveMediaType = appMode === 'schedule'
    ? (currentActiveMedia?.type || currentActiveMedia?.mediaType || activeScheduleItem?.mediaType || 'image')
    : 'image';
  const currentActiveMediaTitle = appMode === 'schedule'
    ? (currentActiveMedia?.name || currentActiveMedia?.mediaName || activeScheduleItem?.title || 'Media Slide')
    : 'Slide';
  const currentTransList = selectedTranslations && selectedTranslations.length > 0
    ? selectedTranslations
    : [bibleTranslation || 'nepali'];
  const currentTransBadge = currentTransList.length === 1 && currentTransList[0] === 'nepali'
    ? ''
    : ` (${currentTransList.map(t => t.toUpperCase()).join(' + ')})`;

  const currentPreviewReference = appMode === 'bible'
    ? `${books.find(b => b.id === selectedBook)?.name} ${selectedChapter}:${selectedVerse}${currentTransBadge}`
    : appMode === 'schedule'
      ? activeScheduleItem?.type === 'song'
        ? `${activeScheduleItem.title} (${activeSlides[selectedSlideIndex]?.section || 'Lyrics'})`
        : activeScheduleItem?.subtitle || activeScheduleItem?.title || ''
      : `${activeLibrarySong?.title || ''} (${activeSlides[selectedSlideIndex]?.section || 'Lyrics'})`;

  const handleUpdateTextAnimConfig = (newConfig: TextAnimationConfig) => {
    setTextAnimConfig(newConfig);
    try {
      localStorage.setItem('worship_text_anim_config', JSON.stringify(newConfig));
    } catch (e) {}
    if (channelRef.current) {
      channelRef.current.postMessage({
        type: 'SET_TEXT_ANIMATION',
        config: newConfig
      });
    }
  };

  return {
    appMode,
    switchAppMode,
    selectedBook,
    setSelectedBook,
    selectedChapter,
    setSelectedChapter,
    selectedVerse,
    setSelectedVerse,
    bibleTranslation,
    setBibleTranslation,
    selectedTranslations,
    setSelectedTranslations,
    toggleBibleTranslation,
    verses,
    loading,
    totalChapters: books.find(b => b.id === selectedBook)?.chapters || 1,
    allSongs,
    filteredSongs,
    songSearchQuery,
    setSongSearchQuery,
    selectedLetter,
    setSelectedLetter,
    activeLibrarySongId,
    setActiveLibrarySongId,
    activeLibrarySong,
    scheduleItems,
    selectedItemId,
    setSelectedItemId,
    selectedSlideIndex,
    selectSlideIndex,
    selectedScheduleIds,
    activeScheduleItem,
    activeSlides,
    draggedSlideIdx,
    handleSlideDragStart,
    handleSlideDragOver,
    handleSlideDragEnd,
    handleResetSlidesOrder,
    isTextHidden,
    toggleHideText,
    isDisplayConnected,
    handleOpenProjector,
    tickerConfig,
    isTickerModalOpen,
    setIsTickerModalOpen,
    handleUpdateTickerText,
    handleUpdateTickerBadge,
    handleToggleTickerBadge,
    handleUpdateTickerTheme,
    handleUpdateTickerPosition,
    handleUpdateTickerSpeed,
    handleUpdateTickerFontSize,
    handleApplyTickerPreset,
    handleToggleTicker,
    bgFileName,
    localBgUrl,
    localBgType,
    globalBgConfig,
    isBgStudioModalOpen,
    setIsBgStudioModalOpen,
    updateGlobalBgConfig,
    textAnimConfig,
    handleUpdateTextAnimConfig,
    handleAddSlideshowImages,
    handleRemoveSlideshowImage,
    handleClearSlideshowImages,
    handleUploadVideoBackground,
    handleBackgroundUpload,
    handleClearBackground,
    countdownLeft,
    setCountdownLeft,
    isCountdownRunning,
    setIsCountdownRunning,
    toastMessage,
    showToast,
    handleRemoveSlide,
    isAddItemModalOpen,
    setIsAddItemModalOpen,
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
    isSongModalOpen,
    setIsSongModalOpen,
    songFormData,
    setSongFormData,
    editingSongId,
    handleOpenNewSongModal,
    handleOpenEditSongModal,
    handleDeleteSong,
    handleSaveSong,
    handlePrev,
    handleNext,
    isVideoPlaying,
    isVideoMuted,
    toggleMediaPlayPause,
    toggleMediaMute,
    handleDeleteSingleScheduleItem,
    handleBulkDeleteSchedule,
    handleClearAllSchedule,
    toggleSelectScheduleItem,
    toggleSelectAllSchedule,
    isEditScheduleItemModalOpen,
    setIsEditScheduleItemModalOpen,
    editingScheduleItem,
    handleOpenEditScheduleItemModal,
    handleSaveScheduleItem,
    savedPlans,
    isServicePlansModalOpen,
    setIsServicePlansModalOpen,
    confirmModalConfig,
    showConfirm,
    closeConfirmModal,
    handleOpenServicePlansModal,
    handleCloseServicePlansModal,
    handleSaveCurrentServicePlan,
    handleLoadServicePlan,
    handleDuplicateServicePlan,
    handleDeleteServicePlan,
    handleExportServicePlan,
    handleImportServicePlan,
    handleAddItemToSchedule,
    handleAddScriptureToSchedule,
    handleAddSongToSchedule,
    updateScheduleAndPersist,
    previewContainerRef,
    isScheduleMedia,
    currentActiveMediaUrl,
    currentActiveMediaType,
    currentActiveMediaTitle,
    currentPreviewText,
    currentPreviewReference
  };
}
