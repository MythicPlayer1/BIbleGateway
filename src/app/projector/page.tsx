"use client";

import { useEffect, useLayoutEffect, useState, useRef } from "react";

export default function ProjectorPage() {
  const [verse, setVerse] = useState({ text: "Welcome. Please select a verse.", reference: "" });
  const [fade, setFade] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);

  // Sync with Control Panel
  useEffect(() => {
    const channel = new BroadcastChannel('bible-projector');
    
    channel.onmessage = (event) => {
      if (event.data.type === 'SET_VERSE') {
        setFade(true);
        setTimeout(() => {
          setVerse({
            text: event.data.text,
            reference: event.data.reference
          });
          setFade(false);
        }, 150);
      }
    };

    return () => {
      channel.close();
    };
  }, []);

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
    
    // Also ensure it shrinks if the line becomes too wide for some reason
    // though the CSS padding and max-w usually handle horizontal wrapping
  }, [verse.text, fade]);

  return (
    <div className="min-h-screen bg-[#030303] text-gray-100 flex flex-col justify-center p-12 lg:p-24 overflow-hidden selection:bg-indigo-900 selection:text-white">
      <div 
        className={`w-full max-w-[90vw] mx-auto flex flex-col items-center text-center transition-opacity duration-300 ease-in-out ${fade ? 'opacity-0 scale-[0.99]' : 'opacity-100 scale-100'}`}
      >
        <p 
          ref={textRef}
          className="font-bold leading-[1.3] tracking-tight mb-10 text-[#F9FAFB] w-full"
          style={{ fontSize: '130px' }} // Initial max size, updated by useLayoutEffect
        >
          {verse.text}
        </p>
        
        {verse.reference && (
          <div className="inline-flex items-center gap-4 mt-4">
            <div className="h-[2px] w-12 bg-indigo-600 rounded-full"></div>
            <p className="text-3xl md:text-4xl lg:text-5xl text-neutral-400 font-medium tracking-wide">
              {verse.reference}
            </p>
            <div className="h-[2px] w-12 bg-indigo-600 rounded-full"></div>
          </div>
        )}
      </div>
    </div>
  );
}
