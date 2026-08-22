"use client";

import { useEffect, useState } from "react";

export default function ProjectorPage() {
  const [verse, setVerse] = useState({ text: "Welcome. Please select a verse.", reference: "" });

  useEffect(() => {
    // Setup Broadcast Channel
    const channel = new BroadcastChannel('bible-projector');
    
    channel.onmessage = (event) => {
      if (event.data.type === 'SET_VERSE') {
        setVerse({
          text: event.data.text,
          reference: event.data.reference
        });
      }
    };

    return () => {
      channel.close();
    };
  }, []);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8 overflow-hidden">
      <div className="max-w-[90vw] text-center flex flex-col gap-8 animate-fade-in">
        <p className="text-5xl md:text-7xl lg:text-8xl font-bold leading-snug drop-shadow-lg">
          {verse.text}
        </p>
        <p className="text-3xl md:text-5xl lg:text-6xl text-gray-400 font-semibold tracking-wide drop-shadow-md">
          {verse.reference}
        </p>
      </div>
    </div>
  );
}
