"use client";

import { useEffect, useState, useRef } from "react";
import { books } from "@/lib/books";

export default function Home() {
  const [selectedBook, setSelectedBook] = useState(0);
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [selectedVerse, setSelectedVerse] = useState(1);
  
  const [verses, setVerses] = useState<{verseNumber: number, text: string}[]>([]);
  const [loading, setLoading] = useState(false);
  
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
          // If the selected verse is out of bounds for the new chapter, reset to 1
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

  const activeBookInfo = books.find(b => b.id === selectedBook);
  const totalChapters = activeBookInfo?.chapters || 1;

  return (
    <div className="min-h-screen bg-gray-50 p-8 text-gray-900 font-sans">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        
        {/* Header */}
        <div className="bg-blue-600 text-white p-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Bible Projector Control</h1>
          <button 
            onClick={handleOpenProjector}
            className="bg-white text-blue-600 font-semibold px-4 py-2 rounded shadow hover:bg-blue-50 transition"
          >
            Open Projector Window
          </button>
        </div>

        {/* Controls */}
        <div className="p-6 border-b">
          <div className="flex flex-wrap gap-4">
            
            {/* Book Select */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Book</label>
              <select 
                value={selectedBook} 
                onChange={(e) => {
                  setSelectedBook(Number(e.target.value));
                  setSelectedChapter(1);
                  setSelectedVerse(1);
                }}
                className="w-full border border-gray-300 rounded p-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {books.map(book => (
                  <option key={book.id} value={book.id}>{book.name} ({book.englishName})</option>
                ))}
              </select>
            </div>

            {/* Chapter Select */}
            <div className="flex-1 min-w-[100px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Chapter</label>
              <select 
                value={selectedChapter} 
                onChange={(e) => {
                  setSelectedChapter(Number(e.target.value));
                  setSelectedVerse(1);
                }}
                className="w-full border border-gray-300 rounded p-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {Array.from({ length: totalChapters }, (_, i) => i + 1).map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Verse Select */}
            <div className="flex-1 min-w-[100px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Verse</label>
              <select 
                value={selectedVerse} 
                onChange={(e) => setSelectedVerse(Number(e.target.value))}
                className="w-full border border-gray-300 rounded p-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={verses.length === 0}
              >
                {verses.map(v => (
                  <option key={v.verseNumber} value={v.verseNumber}>{v.verseNumber}</option>
                ))}
              </select>
            </div>

          </div>
        </div>

        {/* Navigation & Preview */}
        <div className="p-8 bg-gray-100 flex flex-col items-center justify-center min-h-[300px] relative">
          
          {loading ? (
            <p className="text-gray-500 animate-pulse">Loading chapter...</p>
          ) : verses.length > 0 ? (
            <div className="text-center w-full max-w-2xl flex flex-col items-center">
              <p className="text-3xl font-semibold mb-4 text-gray-800">
                {verses.find(v => v.verseNumber === selectedVerse)?.text}
              </p>
              <p className="text-xl text-gray-500 font-medium mb-8">
                {activeBookInfo?.name} {selectedChapter}:{selectedVerse}
              </p>

              {/* Prev / Next Buttons */}
              <div className="flex gap-6 w-full justify-center">
                <button 
                  onClick={handlePrevVerse}
                  disabled={selectedVerse <= 1}
                  className="bg-blue-600 disabled:bg-gray-300 text-white font-bold py-3 px-8 rounded-full shadow-md hover:bg-blue-700 hover:shadow-lg transition flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                  Previous Verse
                </button>
                <button 
                  onClick={handleNextVerse}
                  disabled={selectedVerse >= verses.length}
                  className="bg-blue-600 disabled:bg-gray-300 text-white font-bold py-3 px-8 rounded-full shadow-md hover:bg-blue-700 hover:shadow-lg transition flex items-center gap-2"
                >
                  Next Verse
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                </button>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">No verses available.</p>
          )}

        </div>
      </div>
    </div>
  );
}
