"use client";

import { useEffect, useLayoutEffect, useState, useRef } from "react";

export default function ProjectorPage() {
  const [verse, setVerse] = useState({ text: "Welcome. Please select a verse.", reference: "" });
  const [fade, setFade] = useState(false);
  const [isTextHidden, setIsTextHidden] = useState(false);
  
  // Background state
  const [bgUrl, setBgUrl] = useState<string | null>(null);
  const [bgType, setBgType] = useState<'video' | 'image' | null>(null);

  const textRef = useRef<HTMLParagraphElement>(null);

  // Sync with Control Panel
  useEffect(() => {
    const channel = new BroadcastChannel('bible-projector');
    
    channel.onmessage = (event) => {
      if (event.data.type === 'SET_VERSE') {
        setIsTextHidden(false); // Unhide text when changing verses
        setFade(true);
        setTimeout(() => {
          setVerse({
            text: event.data.text,
            reference: event.data.reference
          });
          setFade(false);
        }, 150);
      }
      else if (event.data.type === 'SET_BACKGROUND') {
        if (bgUrl) URL.revokeObjectURL(bgUrl);
        const blob = new Blob([event.data.buffer], { type: event.data.mime });
        const newUrl = URL.createObjectURL(blob);
        setBgUrl(newUrl);
        setBgType(event.data.fileType);
      }
      else if (event.data.type === 'CLEAR_BACKGROUND') {
        if (bgUrl) URL.revokeObjectURL(bgUrl);
        setBgUrl(null);
        setBgType(null);
      }
      else if (event.data.type === 'HIDE_TEXT') {
        setIsTextHidden(true);
      }
      else if (event.data.type === 'SHOW_TEXT') {
        setIsTextHidden(false);
      }
    };

    return () => {
      channel.close();
      if (bgUrl) URL.revokeObjectURL(bgUrl);
    };
  }, [bgUrl]);

  // Auto-scale font size to perfectly fit the screen without scrolling
  useLayoutEffect(() => {
    if (!textRef.current || fade) return;
    
    const textEl = textRef.current;
    let fontSize = 130; // Maximum font size in pixels
    
    // Reset font size before measuring
    textEl.style.fontSize = `${fontSize}px`;
    
    // Maximum height allowed for the text (80% of window height)
    const maxHeight = window.innerHeight * 0.75;
    
    // Shrink font size until it fits
    while (textEl.scrollHeight > maxHeight && fontSize > 30) {
      fontSize -= 2;
      textEl.style.fontSize = `${fontSize}px`;
    }
  }, [verse.text, fade]);

  return (
    <div className="min-h-screen bg-[#030303] text-gray-100 flex flex-col justify-center p-12 lg:p-24 overflow-hidden selection:bg-indigo-900 selection:text-white relative">
      
      {/* Background Media */}
      {bgUrl && (
        <div className="absolute inset-0 z-0">
          {bgType === 'video' ? (
            <video 
              src={bgUrl} 
              autoPlay 
              loop 
              muted 
              className="w-full h-full object-cover"
            />
          ) : (
            <img 
              src={bgUrl} 
              alt="Projector Background" 
              className="w-full h-full object-cover"
            />
          )}
          {/* Black transparency overlay for readability */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"></div>
        </div>
      )}

      {/* Main Content */}
      <div 
        className={`w-full max-w-[90vw] mx-auto flex flex-col items-center text-center transition-opacity duration-500 ease-in-out relative z-10 ${
          isTextHidden ? 'opacity-0 scale-95' : fade ? 'opacity-0 scale-[0.99]' : 'opacity-100 scale-100'
        }`}
      >
        <p 
          ref={textRef}
          className="font-bold leading-[1.3] tracking-tight mb-10 text-[#F9FAFB] w-full drop-shadow-2xl"
          style={{ fontSize: '130px' }} 
        >
          {verse.text}
        </p>
        
        {verse.reference && (
          <div className="inline-flex items-center gap-4 mt-4 drop-shadow-lg">
            <div className="h-[2px] w-12 bg-indigo-500 rounded-full"></div>
            <p className="text-3xl md:text-4xl lg:text-5xl text-gray-300 font-medium tracking-wide">
              {verse.reference}
            </p>
            <div className="h-[2px] w-12 bg-indigo-500 rounded-full"></div>
          </div>
        )}
      </div>
    </div>
  );
}
