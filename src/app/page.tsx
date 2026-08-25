"use client";

import { useEffect, useState, useRef } from "react";
import { books } from "@/lib/books";
import { MonitorPlay, ChevronLeft, ChevronRight, BookOpen, Hash, List, Image as ImageIcon, Trash2, EyeOff, Eye } from "lucide-react";

export default function Home() {
  const [selectedBook, setSelectedBook] = useState(0);
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [selectedVerse, setSelectedVerse] = useState(1);
  
  const [verses, setVerses] = useState<{verseNumber: number, text: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const [bgFileName, setBgFileName] = useState<string | null>(null);
  const [isTextHidden, setIsTextHidden] = useState(false);
  
  const channelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    channelRef.current = new BroadcastChannel('bible-projector');
    return () => {
      channelRef.current?.close();
    };
  }, []);

  useEffect(() => {
    async function fetchChapter() {
      setLoading(true);
      try {
        const res = await fetch(`/api/bible?book=${selectedBook}&chapter=${selectedChapter}`);
        const data = await res.json();
        if (data.verses) {
          setVerses(data.verses);
          if (selectedVerse > data.verses.length) {
            setSelectedVerse(1);
          }
        }
      } catch (err) {
        console.error("Failed to fetch chapter", err);
      } finally {
        setLoading(false);
      }
    }
    fetchChapter();
  }, [selectedBook, selectedChapter]);

  // Sync to projector automatically when verse changes
  useEffect(() => {
    if (verses.length > 0) {
      const verseData = verses.find(v => v.verseNumber === selectedVerse);
      if (verseData && channelRef.current) {
        const bookName = books.find(b => b.id === selectedBook)?.name;
        // Un-hide the text automatically if they select a new verse
        setIsTextHidden(false);
        channelRef.current.postMessage({
          type: 'SET_VERSE',
          text: verseData.text,
          reference: `${bookName} ${selectedChapter}:${selectedVerse}`
        });
      }
    }
  }, [selectedVerse, verses, selectedBook, selectedChapter]);

  const handlePrevVerse = () => {
    if (selectedVerse > 1) {
      setSelectedVerse(prev => prev - 1);
    }
  };

  const handleNextVerse = () => {
    if (selectedVerse < verses.length) {
      setSelectedVerse(prev => prev + 1);
    }
  };

  const handleOpenProjector = () => {
    window.open(
      '/projector', 
      'projectorWindow', 
      'width=1024,height=768,popup=yes,menubar=no,toolbar=no,location=no,status=no,resizable=yes'
    );
  };

  const handleBackgroundUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && channelRef.current) {
      setBgFileName(file.name);
      
      try {
        const buffer = await file.arrayBuffer();
        channelRef.current.postMessage({
          type: 'SET_BACKGROUND',
          buffer: buffer,
          mime: file.type,
          fileType: file.type.startsWith('video') ? 'video' : 'image'
        });
      } catch (err) {
        console.error("Failed to read file for background", err);
      }
    }
  };

  const handleClearBackground = () => {
    setBgFileName(null);
    if (channelRef.current) {
      channelRef.current.postMessage({
        type: 'CLEAR_BACKGROUND'
      });
    }
  };

  const toggleHideText = () => {
    const newState = !isTextHidden;
    setIsTextHidden(newState);
    if (channelRef.current) {
      channelRef.current.postMessage({
        type: newState ? 'HIDE_TEXT' : 'SHOW_TEXT'
      });
    }
  };

  const activeBookInfo = books.find(b => b.id === selectedBook);
  const totalChapters = activeBookInfo?.chapters || 1;

  const currentVerseText = verses.find(v => v.verseNumber === selectedVerse)?.text || "";

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Navbar */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 text-white p-2.5 rounded-xl shadow-md shadow-indigo-200">
              <BookOpen size={24} />
            </div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
              Bible Projector
            </h1>
          </div>
          <button 
            onClick={handleOpenProjector}
            className="group flex items-center gap-2 bg-neutral-900 text-white font-medium px-5 py-2.5 rounded-full shadow hover:bg-neutral-800 hover:shadow-lg transition-all active:scale-95"
          >
            <MonitorPlay size={18} className="group-hover:text-indigo-400 transition-colors" />
            Launch Display
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10 grid lg:grid-cols-12 gap-10">
        
        {/* Left Column: Controls */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200/60">
            <h2 className="text-lg font-semibold mb-6 flex items-center gap-2 text-neutral-800">
              <List size={20} className="text-indigo-500" />
              Scripture Selection
            </h2>
            
            <div className="space-y-5">
              {/* Book Select */}
              <div>
                <label className="block text-sm font-medium text-neutral-600 mb-2">Book</label>
                <div className="relative">
                  <select 
                    value={selectedBook} 
                    onChange={(e) => {
                      setSelectedBook(Number(e.target.value));
                      setSelectedChapter(1);
                      setSelectedVerse(1);
                    }}
                    className="w-full appearance-none bg-neutral-50 border border-neutral-300 rounded-xl px-4 py-3 pr-10 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow outline-none text-neutral-800 font-medium"
                  >
                    {books.map(book => (
                      <option key={book.id} value={book.id}>{book.name} ({book.englishName})</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-neutral-500">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>

              {/* Chapter Select */}
              <div>
                <label className="block text-sm font-medium text-neutral-600 mb-2">Chapter</label>
                <div className="relative">
                  <select 
                    value={selectedChapter} 
                    onChange={(e) => {
                      setSelectedChapter(Number(e.target.value));
                      setSelectedVerse(1);
                    }}
                    className="w-full appearance-none bg-neutral-50 border border-neutral-300 rounded-xl px-4 py-3 pr-10 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow outline-none text-neutral-800 font-medium"
                  >
                    {Array.from({ length: totalChapters }, (_, i) => i + 1).map(c => (
                      <option key={c} value={c}>Chapter {c}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-neutral-500">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>

              {/* Verse Select */}
              <div>
                <label className="block text-sm font-medium text-neutral-600 mb-2">Verse</label>
                <div className="relative">
                  <select 
                    value={selectedVerse} 
                    onChange={(e) => setSelectedVerse(Number(e.target.value))}
                    className="w-full appearance-none bg-neutral-50 border border-neutral-300 rounded-xl px-4 py-3 pr-10 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow outline-none text-neutral-800 font-medium"
                    disabled={verses.length === 0}
                  >
                    {verses.map(v => (
                      <option key={v.verseNumber} value={v.verseNumber}>Verse {v.verseNumber}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-neutral-500">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Background Media Controls */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200/60">
            <h2 className="text-lg font-semibold mb-6 flex items-center gap-2 text-neutral-800">
              <ImageIcon size={20} className="text-indigo-500" />
              Projector Background
            </h2>
            <div className="space-y-4">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-indigo-200 rounded-xl cursor-pointer bg-indigo-50/50 hover:bg-indigo-50 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <ImageIcon className="w-8 h-8 text-indigo-400 mb-2" />
                  <p className="text-sm text-indigo-700 font-medium">Click to upload photo or video</p>
                  <p className="text-xs text-indigo-500 mt-1">MP4, JPG, PNG</p>
                </div>
                <input type="file" className="hidden" accept="image/*,video/*" onChange={handleBackgroundUpload} />
              </label>

              {bgFileName && (
                <div className="flex items-center justify-between bg-neutral-100 px-4 py-3 rounded-xl border border-neutral-200">
                  <span className="text-sm text-neutral-700 truncate max-w-[200px] font-medium">{bgFileName}</span>
                  <button onClick={handleClearBackground} className="text-red-500 hover:text-red-600 transition-colors p-1" title="Remove Background">
                    <Trash2 size={18} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Live Preview & Navigation */}
        <div className="lg:col-span-8 flex flex-col">
          <div className="bg-white rounded-3xl shadow-sm border border-neutral-200/60 flex-1 flex flex-col overflow-hidden">
            
            {/* Display Header */}
            <div className="bg-neutral-50 border-b border-neutral-200/60 px-6 py-4 flex items-center justify-between">
              <span className="text-sm font-semibold text-neutral-500 tracking-wider uppercase">Live Preview</span>
              <div className="flex items-center gap-4">
                <button 
                  onClick={toggleHideText}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${isTextHidden ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300'}`}
                >
                  {isTextHidden ? <EyeOff size={16} /> : <Eye size={16} />}
                  {isTextHidden ? 'TEXT HIDDEN' : 'HIDE TEXT'}
                </button>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  SYNC ACTIVE
                </span>
              </div>
            </div>

            {/* Display Screen Mimic */}
            <div className={`flex-1 bg-[#0a0a0a] m-6 rounded-2xl relative flex flex-col items-center justify-center p-12 overflow-hidden shadow-inner transition-opacity duration-300 ${isTextHidden ? 'opacity-40' : 'opacity-100'}`}>
              {loading ? (
                <div className="flex flex-col items-center gap-4 text-neutral-500 relative z-20">
                  <div className="w-8 h-8 border-4 border-neutral-600 border-t-neutral-300 rounded-full animate-spin"></div>
                  <p className="animate-pulse font-medium">Loading scripture...</p>
                </div>
              ) : verses.length > 0 ? (
                <div className="w-full max-w-3xl flex flex-col items-center text-center relative z-20">
                  <p className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight mb-8">
                    {currentVerseText}
                  </p>
                  <p className="text-xl md:text-2xl text-neutral-400 font-medium">
                    {activeBookInfo?.name} {selectedChapter}:{selectedVerse}
                  </p>
                </div>
              ) : (
                <p className="text-neutral-500 text-lg relative z-20">No verses available in this chapter.</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="p-6 border-t border-neutral-100 flex items-center justify-center gap-4">
              <button 
                onClick={handlePrevVerse}
                disabled={selectedVerse <= 1 || loading}
                className="flex-1 max-w-[240px] flex items-center justify-center gap-2 bg-white border-2 border-neutral-200 text-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed font-bold py-3.5 px-6 rounded-xl hover:border-indigo-600 hover:text-indigo-600 active:bg-indigo-50 transition-all"
              >
                <ChevronLeft size={20} />
                Previous Verse
              </button>
              
              <div className="w-12 h-12 flex items-center justify-center bg-indigo-50 rounded-full text-indigo-600 font-bold">
                <Hash size={20} />
              </div>

              <button 
                onClick={handleNextVerse}
                disabled={selectedVerse >= verses.length || loading}
                className="flex-1 max-w-[240px] flex items-center justify-center gap-2 bg-indigo-600 border-2 border-indigo-600 text-white disabled:opacity-50 disabled:cursor-not-allowed font-bold py-3.5 px-6 rounded-xl hover:bg-indigo-700 hover:border-indigo-700 active:scale-[0.98] transition-all shadow-md shadow-indigo-200"
              >
                Next Verse
                <ChevronRight size={20} />
              </button>
            </div>
            
          </div>
        </div>
        
      </main>
    </div>
  );
}
