"use client";

import { useEffect, useState } from "react";

export default function ProjectorPage() {
  const [verse, setVerse] = useState({ text: "Welcome. Please select a verse.", reference: "" });
  const [fade, setFade] = useState(false);

  useEffect(() => {
    const channel = new BroadcastChannel('bible-projector');
    
    channel.onmessage = (event) => {
      if (event.data.type === 'SET_VERSE') {
        // Trigger a tiny fade effect
        setFade(true);
        setTimeout(() => {
          setVerse({
            text: event.data.text,
            reference: event.data.reference
          });
          setFade(false);
        }, 150); // 150ms fade duration
      }
    };

    return () => {
      channel.close();
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#030303] text-gray-100 flex flex-col justify-center p-12 lg:p-24 overflow-hidden selection:bg-indigo-900 selection:text-white">
      <div 
        className={`w-full max-w-[90vw] mx-auto flex flex-col items-center text-center transition-opacity duration-300 ease-in-out ${fade ? 'opacity-0 scale-[0.99]' : 'opacity-100 scale-100'}`}
      >
        <p className="text-5xl md:text-7xl lg:text-8xl xl:text-[6.5rem] font-bold leading-[1.3] tracking-tight mb-10 text-[#F9FAFB]">
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
