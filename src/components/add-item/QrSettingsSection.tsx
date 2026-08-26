"use client";

import React from "react";
import { QrCode, Upload } from "lucide-react";
import type { NewItemDataState } from "../AddItemModal";

interface QrSettingsSectionProps {
  newItemData: NewItemDataState;
  setNewItemData: React.Dispatch<React.SetStateAction<NewItemDataState>>;
}

export const QrSettingsSection: React.FC<QrSettingsSectionProps> = ({
  newItemData,
  setNewItemData
}) => {
  return (
    <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl space-y-4">
      <div className="flex items-center justify-between text-emerald-400 text-xs font-bold uppercase tracking-wider">
        <div className="flex items-center gap-2">
          <QrCode size={14} />
          <span>QR Code & Information (Giving / Website / WiFi / Form)</span>
        </div>
      </div>

      <div>
        <label className="block text-[11px] font-bold text-neutral-400 uppercase mb-1.5">
          QR Purpose & Quick Presets
        </label>
        <div className="flex flex-wrap gap-1.5 mb-2.5">
          {[
            { label: '📱 Camera / QR Scanner', badge: 'स्क्यान गर्नुहोस् (SCAN)', instr: '📱 Scan with Phone Camera or QR Scanner (क्यामेराबाट स्क्यान गर्नुहोस्)' },
            { label: '💰 eSewa / Fonepay Giving', badge: 'दशांश तथा भेटी', instr: '📱 Scan with eSewa • Fonepay • Khalti • Mobile Banking' },
            { label: '🌐 Website / Form Link', badge: 'वेबसाइट / दर्ता', instr: '📱 Scan with Phone Camera to Open Link (फारम भर्नुहोस्)' },
            { label: '📶 Church Wi-Fi', badge: 'CHURCH WI-FI', instr: '📶 Scan with Phone Camera to Connect Church Wi-Fi' }
          ].map((opt, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setNewItemData(prev => ({
                  ...prev,
                  qrBadgeLabel: opt.badge,
                  qrInstruction: opt.instr
                }));
              }}
              className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded-lg text-xs font-semibold border border-neutral-800 transition-all hover:border-emerald-500/50 active:scale-95"
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1">Top Badge Text</label>
            <input
              type="text"
              value={newItemData.qrBadgeLabel || ''}
              onChange={(e) => setNewItemData(prev => ({ ...prev, qrBadgeLabel: e.target.value }))}
              placeholder="e.g. दशांश तथा भेटी / स्क्यान गर्नुहोस् / WiFi"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1">Bottom Scan Instruction Banner</label>
            <input
              type="text"
              value={newItemData.qrInstruction || ''}
              onChange={(e) => setNewItemData(prev => ({ ...prev, qrInstruction: e.target.value }))}
              placeholder="e.g. Scan with Phone Camera or QR Scanner"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-neutral-800/60">
        <div>
          <label className="block text-[11px] font-bold text-neutral-400 mb-1">Bank / Account / URL Details</label>
          <textarea
            rows={3}
            placeholder="Bank Name: ...\nAccount No: ...\nAccount Name: ...\neSewa ID: ...\nWebsite URL: ..."
            value={newItemData.bankDetails}
            onChange={(e) => setNewItemData(prev => ({ ...prev, bankDetails: e.target.value }))}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-xs font-mono text-neutral-200 outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-neutral-400 mb-1">QR Code Image (eSewa / URL / Wi-Fi)</label>
          <div className="flex items-center gap-3">
            <label className="flex-1 flex flex-col items-center justify-center h-20 border-2 border-dashed border-neutral-700 rounded-xl cursor-pointer bg-neutral-950 hover:bg-neutral-900 transition-colors">
              <Upload size={16} className="text-emerald-400 mb-1" />
              <span className="text-[11px] text-neutral-400 font-medium truncate max-w-[130px]">
                {newItemData.qrCodeFile ? newItemData.qrCodeFile.name : 'Upload QR Code'}
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setNewItemData(prev => ({ ...prev, qrCodeFile: file }));
                }}
              />
            </label>
            {newItemData.qrCodeFile && (
              <div className="w-28 h-28 bg-white rounded-2xl p-1.5 shrink-0 overflow-hidden shadow-lg border border-neutral-700">
                <img
                  src={URL.createObjectURL(newItemData.qrCodeFile)}
                  alt="QR Preview"
                  className="w-full h-full object-contain"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
