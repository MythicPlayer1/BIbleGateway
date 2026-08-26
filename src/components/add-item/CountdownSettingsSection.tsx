"use client";

import React from "react";
import { Clock } from "lucide-react";
import type { NewItemDataState } from "../AddItemModal";

interface CountdownSettingsSectionProps {
  newItemData: NewItemDataState;
  setNewItemData: React.Dispatch<React.SetStateAction<NewItemDataState>>;
  timerMinInput: string;
  setTimerMinInput: (val: string) => void;
  timerSecInput: string;
  setTimerSecInput: (val: string) => void;
  updateCountdownTime: (m: number, s: number) => void;
}

export const CountdownSettingsSection: React.FC<CountdownSettingsSectionProps> = ({
  newItemData,
  setNewItemData,
  timerMinInput,
  setTimerMinInput,
  timerSecInput,
  setTimerSecInput,
  updateCountdownTime
}) => {
  return (
    <div className="p-4 bg-indigo-950/40 border border-indigo-500/30 rounded-2xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
          <Clock size={14} />
          <span>Countdown Timer Settings</span>
        </div>
        <span className="text-[11px] font-mono text-indigo-300 font-bold bg-indigo-900/60 px-2.5 py-0.5 rounded-full border border-indigo-500/30">
          {Math.floor((newItemData.countdownSeconds || 300) / 60)}m {((newItemData.countdownSeconds || 300) % 60).toString().padStart(2, '0')}s
        </span>
      </div>

      <div>
        <label className="block text-[11px] font-bold text-neutral-400 uppercase mb-1.5">
          Set Time Manually (Minutes & Seconds)
        </label>
        <div className="flex items-center gap-3">
          <div className="flex-1 flex items-center gap-2 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2">
            <input
              type="number"
              min={0}
              max={180}
              value={timerMinInput}
              onChange={(e) => {
                const raw = e.target.value;
                setTimerMinInput(raw);
                const m = parseInt(raw, 10);
                const s = parseInt(timerSecInput, 10) || 0;
                updateCountdownTime(isNaN(m) ? 0 : m, s);
              }}
              onBlur={() => {
                const m = Math.max(0, parseInt(timerMinInput, 10) || 0);
                setTimerMinInput(m.toString());
                const s = parseInt(timerSecInput, 10) || 0;
                updateCountdownTime(m, s);
              }}
              className="w-full bg-transparent text-sm text-white font-mono text-center outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              placeholder="0"
            />
            <span className="text-xs font-bold text-neutral-500">Min</span>
          </div>

          <span className="text-neutral-500 font-black text-lg">:</span>

          <div className="flex-1 flex items-center gap-2 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2">
            <input
              type="number"
              min={0}
              max={59}
              value={timerSecInput}
              onChange={(e) => {
                const raw = e.target.value;
                setTimerSecInput(raw);
                const s = parseInt(raw, 10);
                const m = parseInt(timerMinInput, 10) || 0;
                updateCountdownTime(m, isNaN(s) ? 0 : s);
              }}
              onBlur={() => {
                const s = Math.max(0, Math.min(59, parseInt(timerSecInput, 10) || 0));
                setTimerSecInput(s.toString());
                const m = parseInt(timerMinInput, 10) || 0;
                updateCountdownTime(m, s);
              }}
              className="w-full bg-transparent text-sm text-white font-mono text-center outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              placeholder="00"
            />
            <span className="text-xs font-bold text-neutral-500">Sec</span>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-[11px] font-bold text-neutral-400 uppercase mb-1.5">Quick Presets</label>
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { label: '1m', sec: 60 },
            { label: '2m', sec: 120 },
            { label: '3m', sec: 180 },
            { label: '5m', sec: 300 },
            { label: '7m', sec: 420 },
            { label: '10m', sec: 600 },
            { label: '15m', sec: 900 }
          ].map((t) => (
            <button
              key={t.sec}
              type="button"
              onClick={() => {
                setNewItemData(prev => ({ ...prev, countdownSeconds: t.sec }));
                setTimerMinInput(Math.floor(t.sec / 60).toString());
                setTimerSecInput((t.sec % 60).toString());
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                newItemData.countdownSeconds === t.sec
                  ? 'bg-indigo-600 border-indigo-400 text-white shadow-md'
                  : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-[11px] font-bold text-neutral-400 uppercase mb-1">Timer Title / Label</label>
        <input
          type="text"
          placeholder="e.g. Service Begins In / संगति सुरु हुन बाँकी समय"
          value={newItemData.countdownLabel || ''}
          onChange={(e) => setNewItemData(prev => ({ ...prev, countdownLabel: e.target.value }))}
          className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
        />
      </div>
    </div>
  );
};
