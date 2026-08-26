"use client";

import React, { useRef } from "react";
import { 
  Maximize2, SlidersHorizontal, QrCode, Clock, 
  AlignLeft, AlignCenter, AlignRight, Plus 
} from "lucide-react";
import { 
  SLIDE_TEMPLATES, 
  parseCustomSlideText, 
  type SlideLayout, 
  type TextAlign, 
  type AccentColor 
} from "@/lib/lyrics";
import type { NewItemDataState } from "../AddItemModal";
import { QrSettingsSection } from "./QrSettingsSection";
import { CountdownSettingsSection } from "./CountdownSettingsSection";

interface CustomSlideItemFormProps {
  newItemData: NewItemDataState;
  setNewItemData: React.Dispatch<React.SetStateAction<NewItemDataState>>;
  timerMinInput: string;
  setTimerMinInput: (val: string) => void;
  timerSecInput: string;
  setTimerSecInput: (val: string) => void;
  updateCountdownTime: (m: number, s: number) => void;
}

export const CustomSlideItemForm: React.FC<CustomSlideItemFormProps> = ({
  newItemData,
  setNewItemData,
  timerMinInput,
  setTimerMinInput,
  timerSecInput,
  setTimerSecInput,
  updateCountdownTime
}) => {
  const slideTextareaRef = useRef<HTMLTextAreaElement>(null);

  const applySlideTemplate = (templateId: string) => {
    const tmpl = SLIDE_TEMPLATES.find(t => t.id === templateId);
    if (!tmpl) return;
    const secs = tmpl.theme.countdownSeconds ?? 300;
    setTimerMinInput(Math.floor(secs / 60).toString());
    setTimerSecInput((secs % 60).toString().padStart(2, '0'));
    setNewItemData(prev => ({
      ...prev,
      slideTemplate: tmpl.id,
      title: tmpl.name_ne,
      slideSubtitle: tmpl.name,
      slideText: tmpl.defaultText,
      layout: tmpl.theme.layout || 'standard',
      textAlign: tmpl.theme.textAlign || 'center',
      accentColor: tmpl.theme.accentColor || 'indigo',
      bankDetails: tmpl.theme.bankDetails || '',
      qrBadgeLabel: tmpl.theme.qrBadgeLabel || 'दशांश तथा भेटी',
      qrInstruction: tmpl.theme.qrInstruction || '📱 Scan with Phone Camera or QR Scanner (क्यामेराबाट स्क्यान गर्नुहोस्)',
      countdownSeconds: secs,
      countdownLabel: tmpl.theme.countdownLabel || 'Service Begins In'
    }));
  };

  const insertSlideSplitAtCursor = () => {
    if (!slideTextareaRef.current) {
      setNewItemData(prev => ({
        ...prev,
        slideText: prev.slideText ? `${prev.slideText.trim()}\n\n---\n\n` : ''
      }));
      return;
    }
    const ta = slideTextareaRef.current;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const val = ta.value;
    const splitText = "\n\n---\n\n";
    const nextVal = val.substring(0, start) + splitText + val.substring(end);
    setNewItemData(prev => ({ ...prev, slideText: nextVal }));
    setTimeout(() => {
      ta.focus();
      ta.selectionStart = ta.selectionEnd = start + splitText.length;
    }, 10);
  };

  const insertCustomTagAtCursor = (tag: string) => {
    if (!slideTextareaRef.current) return;
    const ta = slideTextareaRef.current;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const val = ta.value;
    const nextVal = val.substring(0, start) + `${tag} ` + val.substring(end);
    setNewItemData(prev => ({ ...prev, slideText: nextVal }));
    setTimeout(() => {
      ta.focus();
      ta.selectionStart = ta.selectionEnd = start + tag.length + 1;
    }, 10);
  };

  return (
    <div className="space-y-4">
      {/* Template Presets */}
      <div>
        <label className="block text-xs font-bold text-neutral-400 uppercase mb-1.5">
          1-Click Slide Templates
        </label>
        <div className="flex gap-1.5 overflow-x-auto pb-1.5 no-scrollbar">
          {SLIDE_TEMPLATES.map((tmpl) => {
            const isSelected = newItemData.slideTemplate === tmpl.id;
            return (
              <button
                key={tmpl.id}
                type="button"
                onClick={() => applySlideTemplate(tmpl.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-indigo-600 border-indigo-400 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-850'
                }`}
              >
                <span>{tmpl.name_ne}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Layout Mode & Formatting Controls */}
      <div className="p-3.5 bg-neutral-900/80 border border-neutral-800 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-neutral-300 uppercase">Slide Layout</span>
          <span className="text-[10px] text-neutral-500">Display Style</span>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { id: 'standard', label: 'Full Screen', icon: Maximize2, disabled: false },
            { id: 'lowerthird', label: 'Lower Third (OBS)', icon: SlidersHorizontal, disabled: true },
            { id: 'giving', label: 'Giving & QR', icon: QrCode, disabled: false },
            { id: 'countdown', label: 'Countdown', icon: Clock, disabled: false }
          ].map((mode) => {
            const isDisabled = mode.disabled;
            return (
              <button
                key={mode.id}
                type="button"
                disabled={isDisabled}
                onClick={() => {
                  if (isDisabled) return;
                  setNewItemData(prev => ({ ...prev, layout: mode.id as SlideLayout }));
                }}
                className={`flex items-center justify-center gap-1.5 p-2 rounded-xl text-xs font-bold border transition-all ${
                  isDisabled
                    ? 'bg-neutral-950/40 border-neutral-900 text-neutral-600 cursor-not-allowed opacity-50'
                    : newItemData.layout === mode.id
                      ? 'bg-indigo-900/80 border-indigo-500 text-indigo-200 ring-2 ring-indigo-500/30'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                }`}
                title={isDisabled ? "Lower Third (OBS) is disabled" : mode.label}
              >
                <mode.icon size={13} />
                <span>{mode.label}</span>
              </button>
            );
          })}
        </div>

        {/* Text Alignment & Accent Color */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-800/80">
          <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800">
            {(['left', 'center', 'right'] as TextAlign[]).map((align) => (
              <button
                key={align}
                type="button"
                onClick={() => setNewItemData(prev => ({ ...prev, textAlign: align }))}
                className={`p-1.5 rounded-lg transition-all ${
                  newItemData.textAlign === align ? 'bg-neutral-800 text-white shadow' : 'text-neutral-500 hover:text-neutral-300'
                }`}
                title={`Align ${align}`}
              >
                {align === 'left' ? <AlignLeft size={14} /> : align === 'right' ? <AlignRight size={14} /> : <AlignCenter size={14} />}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 bg-neutral-950 px-2 py-1 rounded-xl border border-neutral-800">
            {[
              { id: 'indigo', bg: 'bg-indigo-500' },
              { id: 'amber', bg: 'bg-amber-500' },
              { id: 'emerald', bg: 'bg-emerald-500' },
              { id: 'rose', bg: 'bg-rose-500' },
              { id: 'cyan', bg: 'bg-cyan-500' }
            ].map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setNewItemData(prev => ({ ...prev, accentColor: c.id as AccentColor }))}
                className={`w-5 h-5 rounded-full ${c.bg} transition-all flex items-center justify-center ${
                  newItemData.accentColor === c.id ? 'ring-2 ring-white scale-110' : 'opacity-60 hover:opacity-100'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Title & Subtitle */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-neutral-400 uppercase mb-1">Slide Title / Heading *</label>
          <input
            type="text"
            placeholder="e.g. Welcome / Sermon / Tithes"
            value={newItemData.title}
            onChange={(e) => setNewItemData(prev => ({ ...prev, title: e.target.value }))}
            className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3.5 py-2 text-xs md:text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-neutral-400 uppercase mb-1">Subtitle / Category</label>
          <input
            type="text"
            placeholder="e.g. Sunday Morning Service"
            value={newItemData.slideSubtitle}
            onChange={(e) => setNewItemData(prev => ({ ...prev, slideSubtitle: e.target.value }))}
            className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3.5 py-2 text-xs md:text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
          />
        </div>
      </div>

      {/* Slide Content & Multi-Slide Toolbar */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-bold text-neutral-400 uppercase">Slide Content</label>
          <span className="text-[11px] font-mono text-indigo-400 font-bold bg-indigo-950/80 px-2 py-0.5 rounded-full border border-indigo-500/30">
            {parseCustomSlideText(newItemData.slideText, newItemData.title).length} Slide(s) in Deck
          </span>
        </div>

        <div className="flex items-center gap-1.5 mb-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={insertSlideSplitAtCursor}
            className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-indigo-300 rounded-lg text-xs font-bold flex items-center gap-1.5 border border-neutral-700 shadow-sm"
            title="Split content into multiple consecutive slides"
          >
            <Plus size={12} />
            <span>Split Slide (---)</span>
          </button>
          <button
            type="button"
            onClick={() => insertCustomTagAtCursor('[१. बुँदा १]')}
            className="px-2 py-1 bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs font-medium border border-neutral-700/60"
          >
            + [बुँदा १]
          </button>
          <button
            type="button"
            onClick={() => insertCustomTagAtCursor('[२. बुँदा २]')}
            className="px-2 py-1 bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs font-medium border border-neutral-700/60"
          >
            + [बुँदा २]
          </button>
          <button
            type="button"
            onClick={() => insertCustomTagAtCursor('[निष्कर्ष]')}
            className="px-2 py-1 bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs font-medium border border-neutral-700/60"
          >
            + [निष्कर्ष]
          </button>
        </div>

        <textarea
          ref={slideTextareaRef}
          rows={5}
          placeholder="Type slide text here. Use '---' to split into multiple slides..."
          value={newItemData.slideText}
          onChange={(e) => setNewItemData(prev => ({ ...prev, slideText: e.target.value }))}
          className="w-full bg-neutral-900 border border-neutral-700 rounded-xl p-3.5 text-xs md:text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500 font-sans leading-relaxed"
        />
      </div>

      {/* QR Code / Giving Settings Section */}
      {newItemData.layout === 'giving' && (
        <QrSettingsSection
          newItemData={newItemData}
          setNewItemData={setNewItemData}
        />
      )}

      {/* Countdown Timer Settings Section */}
      {newItemData.layout === 'countdown' && (
        <CountdownSettingsSection
          newItemData={newItemData}
          setNewItemData={setNewItemData}
          timerMinInput={timerMinInput}
          setTimerMinInput={setTimerMinInput}
          timerSecInput={timerSecInput}
          setTimerSecInput={setTimerSecInput}
          updateCountdownTime={updateCountdownTime}
        />
      )}
    </div>
  );
};
