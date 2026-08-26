"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Save, Music, BookOpen, Type, Film, Image as ImageIcon, 
  Layers, Sparkles, AlignLeft, AlignCenter, AlignRight, RefreshCw
} from "lucide-react";
import { books } from "@/lib/books";
import { 
  parseLyricsToSlides, parseCustomSlideText, BIBLE_TRANSLATIONS,
  type ScheduleItem, type Song, type SlideLayout, type TextAlign, type AccentColor, type SongSlide, type BibleTranslation
} from "@/lib/lyrics";

interface EditScheduleItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: ScheduleItem | null;
  allSongs: Song[];
  onSave: (updatedItem: ScheduleItem) => void;
}

export const EditScheduleItemModal: React.FC<EditScheduleItemModalProps> = ({
  isOpen,
  onClose,
  item,
  allSongs,
  onSave
}) => {
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [lyricsText, setLyricsText] = useState("");
  
  // Scripture fields
  const [bookId, setBookId] = useState<number>(0);
  const [chapter, setChapter] = useState<number>(1);
  const [verse, setVerse] = useState<number>(1);
  const [translation, setTranslation] = useState<BibleTranslation>('nepali');
  const [selectedTranslations, setSelectedTranslations] = useState<BibleTranslation[]>(['nepali']);
  const [scriptureText, setScriptureText] = useState("");
  const [loadingScripture, setLoadingScripture] = useState(false);

  // Custom slide fields
  const [slideText, setSlideText] = useState("");
  const [layout, setLayout] = useState<SlideLayout>('standard');
  const [textAlign, setTextAlign] = useState<TextAlign>('center');
  const [accentColor, setAccentColor] = useState<AccentColor>('indigo');

  useEffect(() => {
    if (item && isOpen) {
      setTitle(item.title || "");
      setSubtitle(item.subtitle || "");

      if (item.type === 'song') {
        const matchedSong = allSongs.find(s => s.id === item.songId);
        const raw = item.customSlides && item.customSlides.length > 0
          ? item.customSlides.map(s => `[${s.section}]\n${s.lines.join('\n')}`).join('\n\n')
          : (matchedSong?.rawLyrics || (matchedSong as any)?.lyrics || "");
        setLyricsText(raw);
      } else if (item.type === 'scripture') {
        setBookId(item.bookId ?? 0);
        setChapter(item.chapter ?? 1);
        setVerse(item.verse ?? 1);
        const initialTrans = item.translations && item.translations.length > 0
          ? item.translations
          : [item.translation || 'nepali'];
        setSelectedTranslations(initialTrans);
        setTranslation(initialTrans[0]);
        setScriptureText(item.scriptureText || "");
      } else if (item.type === 'slide') {
        setSlideText(item.slideText || "");
        setLayout(item.theme?.layout || 'standard');
        setTextAlign(item.theme?.textAlign || 'center');
        setAccentColor(item.theme?.accentColor || 'indigo');
      }
    }
  }, [item, isOpen, allSongs]);

  if (!isOpen || !item) return null;

  const currentBook = books.find(b => b.id === bookId) || books[0];

  const handleFetchVerse = async (
    newBookId = bookId, 
    newChapter = chapter, 
    newVerse = verse, 
    transList = selectedTranslations
  ) => {
    setLoadingScripture(true);
    try {
      const activeList = transList.length > 0 ? transList.slice(0, 2) : ['nepali'];
      let finalText = '';

      if (activeList.length === 1) {
        const res = await fetch(`/api/bible?bookId=${newBookId}&chapter=${newChapter}&translation=${activeList[0]}`);
        if (res.ok) {
          const data = await res.json();
          const v = data.verses?.find((i: any) => i.verseNumber === newVerse);
          if (v && v.text) finalText = v.text;
        }
      } else {
        const [resP, resS] = await Promise.all([
          fetch(`/api/bible?bookId=${newBookId}&chapter=${newChapter}&translation=${activeList[0]}`),
          fetch(`/api/bible?bookId=${newBookId}&chapter=${newChapter}&translation=${activeList[1]}`)
        ]);
        const [dataP, dataS] = await Promise.all([resP.json(), resS.json()]);
        const vP = dataP.verses?.find((i: any) => i.verseNumber === newVerse);
        const vS = dataS.verses?.find((i: any) => i.verseNumber === newVerse);
        if (vP && vP.text) {
          finalText = vS && vS.text ? `${vP.text}\n───\n${vS.text}` : vP.text;
        }
      }

      if (finalText) {
        setScriptureText(finalText);
        const b = books.find(book => book.id === newBookId);
        if (b) {
          const transBadge = activeList.length === 1 && activeList[0] === 'nepali'
            ? ''
            : ` (${activeList.map(t => t.toUpperCase()).join(' + ')})`;
          setTitle(`${b.name} ${newChapter}:${newVerse}${transBadge}`);
          setSubtitle(`${b.englishName} Scripture Reading${transBadge}`);
        }
      }
    } catch (e) {
    } finally {
      setLoadingScripture(false);
    }
  };

  const handleToggleTranslation = (tId: BibleTranslation) => {
    let next: BibleTranslation[];
    if (selectedTranslations.includes(tId)) {
      if (selectedTranslations.length === 1) return;
      next = selectedTranslations.filter(t => t !== tId);
    } else {
      if (selectedTranslations.length < 2) {
        next = [...selectedTranslations, tId];
      } else {
        next = [selectedTranslations[0], tId];
      }
    }
    setSelectedTranslations(next);
    setTranslation(next[0]);
    handleFetchVerse(bookId, chapter, verse, next);
  };

  const handleInsertTag = (tag: string) => {
    setLyricsText(prev => prev ? `${prev}\n\n${tag}\n` : `${tag}\n`);
  };

  const handleSave = () => {
    let updatedItem: ScheduleItem = {
      ...item,
      title: title.trim() || item.title,
      subtitle: subtitle.trim()
    };

    if (item.type === 'song') {
      const parsedSlides = parseLyricsToSlides(lyricsText);
      updatedItem = {
        ...updatedItem,
        customSlides: parsedSlides.length > 0 ? parsedSlides : undefined
      };
    } else if (item.type === 'scripture') {
      const b = books.find(book => book.id === bookId) || books[0];
      const activeList: BibleTranslation[] = selectedTranslations.length > 0 ? selectedTranslations : ['nepali'];
      const transBadge = activeList.length === 1 && activeList[0] === 'nepali'
        ? ''
        : ` (${activeList.map(t => t.toUpperCase()).join(' + ')})`;
      const safeTitle = title.trim() || `${b.name} ${chapter}:${verse}${transBadge}`;
      const safeSubtitle = subtitle.trim() || `${b.englishName} Scripture Reading${transBadge}`;
      updatedItem = {
        ...updatedItem,
        title: safeTitle,
        subtitle: safeSubtitle,
        bookId,
        chapter,
        verse,
        translation: activeList[0],
        translations: activeList,
        scriptureText: scriptureText.trim(),
        customSlides: [{
          section: safeTitle,
          lines: [scriptureText.trim()],
          text: scriptureText.trim()
        }]
      };
    } else if (item.type === 'slide') {
      const parsedSlides = parseCustomSlideText(slideText || title, title, {
        layout,
        textAlign,
        accentColor,
        ...item.theme
      });
      updatedItem = {
        ...updatedItem,
        slideText,
        theme: {
          ...item.theme,
          layout,
          textAlign,
          accentColor
        },
        customSlides: parsedSlides
      };
    }

    onSave(updatedItem);
    onClose();
  };

  // Preview generated slides count
  let previewSlides: SongSlide[] = [];
  if (item.type === 'song') {
    previewSlides = parseLyricsToSlides(lyricsText);
  } else if (item.type === 'slide') {
    previewSlides = parseCustomSlideText(slideText || title, title, { layout, textAlign, accentColor });
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between p-5 border-b border-neutral-800 bg-neutral-950/60">
            <div className="flex items-center gap-2.5">
              <div className={`p-2 rounded-xl border ${
                item.type === 'song' ? 'bg-indigo-600/20 text-indigo-400 border-indigo-500/30' :
                item.type === 'scripture' ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30' :
                item.type === 'media' ? 'bg-violet-600/20 text-violet-400 border-violet-500/30' :
                'bg-amber-600/20 text-amber-400 border-amber-500/30'
              }`}>
                {item.type === 'song' ? <Music size={18} /> :
                 item.type === 'scripture' ? <BookOpen size={18} /> :
                 item.type === 'media' ? <Film size={18} /> : <Type size={18} />}
              </div>
              <div>
                <h3 className="font-bold text-base text-white">
                  Edit Schedule Item
                </h3>
                <p className="text-xs text-neutral-400">
                  {item.type === 'song' && 'Edit song title and slide lyrics'}
                  {item.type === 'scripture' && 'Edit Scripture passage and verse text'}
                  {item.type === 'slide' && 'Edit announcement text, layout and styles'}
                  {item.type === 'media' && 'Edit media title and captions'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-white p-2 rounded-xl hover:bg-neutral-800 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
            {/* Title & Subtitle Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase mb-1.5">
                  Item Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="e.g. धन्यवाद धन्यवाद or भजनसंग्रह २३:१"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase mb-1.5">
                  Subtitle / Label
                </label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="e.g. Worship Song, Scripture Reading, etc."
                />
              </div>
            </div>

            {/* Song Lyrics Editor */}
            {item.type === 'song' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-neutral-400 uppercase">
                    Song Lyrics & Slide Stanzas
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleInsertTag('[कोरस]')}
                      className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-indigo-300 text-[10px] font-bold rounded-lg transition-colors"
                    >
                      + [कोरस]
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInsertTag('[पद १]')}
                      className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-indigo-300 text-[10px] font-bold rounded-lg transition-colors"
                    >
                      + [पद १]
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInsertTag('[पद २]')}
                      className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-indigo-300 text-[10px] font-bold rounded-lg transition-colors"
                    >
                      + [पद २]
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInsertTag('[Bridge]')}
                      className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-indigo-300 text-[10px] font-bold rounded-lg transition-colors"
                    >
                      + [Bridge]
                    </button>
                  </div>
                </div>

                <textarea
                  rows={8}
                  value={lyricsText}
                  onChange={(e) => setLyricsText(e.target.value)}
                  placeholder={`[कोरस]\nधन्यवाद धन्यवाद येशू तिमीलाई...\n\n[पद १]\nमेरो जीवनको हरेक घडीमा...`}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl p-4 text-sm text-white font-mono leading-relaxed focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                />

                {previewSlides.length > 0 && (
                  <div className="flex items-center gap-2 text-xs text-neutral-400">
                    <Layers size={14} className="text-indigo-400" />
                    <span>Generates <strong>{previewSlides.length}</strong> presentation slides</span>
                  </div>
                )}
              </div>
            )}

            {/* Scripture Verse Editor */}
            {item.type === 'scripture' && (
              <div className="space-y-4">
                {/* Translation Selector Switcher */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-neutral-400 uppercase">
                      Bible Translation (संस्करण)
                    </label>
                    <span className="text-[10px] text-neutral-500">
                      {selectedTranslations.length === 2 ? 'Dual Display (Top / Down)' : 'Click to toggle up to 2'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 bg-neutral-950 p-1.5 rounded-xl border border-neutral-800">
                    {BIBLE_TRANSLATIONS.map(trans => {
                      const isSelected = selectedTranslations.includes(trans.id);
                      const rank = selectedTranslations.indexOf(trans.id) + 1;
                      return (
                        <button
                          key={trans.id}
                          type="button"
                          onClick={() => handleToggleTranslation(trans.id)}
                          className={`py-1.5 px-2 rounded-lg text-xs font-bold text-center transition-all ${
                            isSelected
                              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-850'
                          }`}
                          title={`${trans.description} (Click to toggle)`}
                        >
                          <div className="flex items-center justify-center gap-1">
                            <p className="truncate">{trans.shortName}</p>
                            {selectedTranslations.length === 2 && isSelected && (
                              <span className="text-[9px] px-1 py-0.2 bg-black/40 rounded font-mono">
                                {rank === 1 ? 'Top' : 'Down'}
                              </span>
                            )}
                          </div>
                          <p className={`text-[10px] font-normal truncate ${isSelected ? 'text-emerald-200' : 'text-neutral-500'}`}>
                            {trans.language}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-neutral-400 uppercase mb-1.5">
                      Book
                    </label>
                    <select
                      value={bookId}
                      onChange={(e) => {
                        const newB = Number(e.target.value);
                        setBookId(newB);
                        setChapter(1);
                        setVerse(1);
                        handleFetchVerse(newB, 1, 1, selectedTranslations);
                      }}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      {books.map(b => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.englishName})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-400 uppercase mb-1.5">
                      Chapter
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={currentBook.chapters}
                      value={chapter}
                      onChange={(e) => {
                        const newC = Number(e.target.value);
                        setChapter(newC);
                        handleFetchVerse(bookId, newC, verse, selectedTranslations);
                      }}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-400 uppercase mb-1.5">
                      Verse
                    </label>
                    <div className="flex gap-1.5">
                      <input
                        type="number"
                        min={1}
                        value={verse}
                        onChange={(e) => {
                          const newV = Number(e.target.value);
                          setVerse(newV);
                          handleFetchVerse(bookId, chapter, newV, selectedTranslations);
                        }}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleFetchVerse()}
                        disabled={loadingScripture}
                        className="p-2.5 bg-neutral-800 hover:bg-neutral-700 text-emerald-400 rounded-xl transition-colors disabled:opacity-50"
                        title="Reload verse from Bible API"
                      >
                        <RefreshCw size={14} className={loadingScripture ? "animate-spin" : ""} />
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-400 uppercase mb-1.5">
                    Scripture Text (Editable / Custom Translation)
                  </label>
                  <textarea
                    rows={5}
                    value={scriptureText}
                    onChange={(e) => setScriptureText(e.target.value)}
                    placeholder="Enter or customize scripture text..."
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl p-4 text-sm text-white leading-relaxed focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                  />
                </div>
              </div>
            )}

            {/* Custom Slide / Announcement Editor */}
            {item.type === 'slide' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-400 uppercase mb-1.5">
                    Slide Content Text (Use --- to split multiple slides)
                  </label>
                  <textarea
                    rows={6}
                    value={slideText}
                    onChange={(e) => setSlideText(e.target.value)}
                    placeholder={`[स्वागतम्]\nहाम्रो संगतिमा हार्दिक स्वागत गर्दछौं।\n\n---\n\n[अर्को स्लाइड]\nअर्को सन्देश यहाँ लेख्नुहोस्...`}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl p-4 text-sm text-white font-mono leading-relaxed focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-neutral-400 uppercase mb-1.5">
                      Layout
                    </label>
                    <select
                      value={layout}
                      onChange={(e) => setLayout(e.target.value as SlideLayout)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="standard">Standard Fullscreen</option>
                      <option value="lowerthird">Lower-Third</option>
                      <option value="giving">QR Giving</option>
                      <option value="countdown">Countdown</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-400 uppercase mb-1.5">
                      Text Align
                    </label>
                    <div className="flex bg-neutral-950 p-1 border border-neutral-800 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setTextAlign('left')}
                        className={`flex-1 py-1 flex items-center justify-center rounded-lg ${textAlign === 'left' ? 'bg-indigo-600 text-white' : 'text-neutral-400'}`}
                      >
                        <AlignLeft size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setTextAlign('center')}
                        className={`flex-1 py-1 flex items-center justify-center rounded-lg ${textAlign === 'center' ? 'bg-indigo-600 text-white' : 'text-neutral-400'}`}
                      >
                        <AlignCenter size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setTextAlign('right')}
                        className={`flex-1 py-1 flex items-center justify-center rounded-lg ${textAlign === 'right' ? 'bg-indigo-600 text-white' : 'text-neutral-400'}`}
                      >
                        <AlignRight size={14} />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-400 uppercase mb-1.5">
                      Accent Color
                    </label>
                    <select
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value as AccentColor)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="indigo">Indigo</option>
                      <option value="amber">Amber</option>
                      <option value="emerald">Emerald</option>
                      <option value="rose">Rose</option>
                      <option value="cyan">Cyan</option>
                      <option value="white">White</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 p-5 border-t border-neutral-800 bg-neutral-950/60">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-neutral-700 text-xs font-semibold text-neutral-300 hover:bg-neutral-800 transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 active:scale-95 transition-all"
            >
              <Save size={15} />
              Save Changes
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
