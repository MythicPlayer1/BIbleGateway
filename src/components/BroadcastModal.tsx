"use client";

import React, { useState, useEffect } from "react";
import { 
  Radio, X, Copy, Check, QrCode, Globe, Tv, 
  Layers, ExternalLink, ShieldCheck, Wifi, Sparkles, RefreshCw
} from "lucide-react";
import QRCode from "qrcode";
import type { ConnectedClientInfo } from "@/lib/broadcastSync";

interface BroadcastModalProps {
  isOpen: boolean;
  onClose: () => void;
  isBroadcasting: boolean;
  onToggleBroadcast: (enabled: boolean) => void;
  roomCode: string;
  onChangeRoomCode: (newRoom: string) => void;
  connectedClients: ConnectedClientInfo[];
}

export const BroadcastModal: React.FC<BroadcastModalProps> = ({
  isOpen,
  onClose,
  isBroadcasting,
  onToggleBroadcast,
  roomCode,
  onChangeRoomCode,
  connectedClients
}) => {
  const [localRoomInput, setLocalRoomInput] = useState(roomCode);
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [originUrl, setOriginUrl] = useState<string>("");

  useEffect(() => {
    setLocalRoomInput(roomCode);
  }, [roomCode]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOriginUrl(window.location.origin);
    }
  }, []);

  const fullShareUrl = originUrl 
    ? `${originUrl}/projector?room=${encodeURIComponent(localRoomInput.trim() || roomCode)}` 
    : `/projector?room=${encodeURIComponent(localRoomInput.trim() || roomCode)}`;

  // Generate HD QR Code on Room change
  useEffect(() => {
    if (!isOpen || !fullShareUrl) return;

    QRCode.toDataURL(fullShareUrl, {
      width: 260,
      margin: 1.5,
      color: {
        dark: "#000000",
        light: "#ffffff"
      }
    })
      .then((url) => setQrDataUrl(url))
      .catch(() => {});
  }, [fullShareUrl, isOpen]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(fullShareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleApplyRoomCode = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = localRoomInput.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "-");
    if (clean) {
      onChangeRoomCode(clean);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0e0e0e] border border-neutral-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800/80 bg-neutral-900/40">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl border ${
              isBroadcasting 
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]" 
                : "bg-neutral-800 text-neutral-400 border-neutral-700"
            }`}>
              <Radio size={18} className={isBroadcasting ? "animate-pulse" : ""} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Online Live Broadcast</span>
                {isBroadcasting && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black uppercase tracking-wider">
                    ON AIR
                  </span>
                )}
              </h2>
              <p className="text-xs text-neutral-400">
                Stream your projector feed to remote TVs, iPads & online viewers anywhere in the world
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
          {/* 1. Main Broadcast Switch Card */}
          <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
            isBroadcasting
              ? "bg-emerald-950/30 border-emerald-500/40 shadow-inner"
              : "bg-neutral-900/50 border-neutral-800"
          }`}>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Wifi size={16} className={isBroadcasting ? "text-emerald-400" : "text-neutral-500"} />
                <span className="text-sm font-bold text-white">
                  {isBroadcasting ? "WebRTC Broadcast Active" : "Broadcast is Currently Offline"}
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                {isBroadcasting
                  ? `Broadcasting live changes to ${connectedClients.length} connected remote screen(s).`
                  : "Turn on broadcast to enable live syncing with remote displays over the internet."}
              </p>
            </div>

            <button
              type="button"
              onClick={() => onToggleBroadcast(!isBroadcasting)}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 flex items-center gap-2 ${
                isBroadcasting
                  ? "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30"
                  : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30"
              }`}
            >
              <Radio size={14} className={isBroadcasting ? "animate-pulse" : ""} />
              <span>{isBroadcasting ? "Stop Broadcast" : "Go Live (Start)"}</span>
            </button>
          </div>

          {/* 2. Room Code Customizer */}
          <form onSubmit={handleApplyRoomCode} className="space-y-1.5">
            <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider">
              Live Room Name / Slug
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={localRoomInput}
                  onChange={(e) => setLocalRoomInput(e.target.value)}
                  placeholder="e.g. grace-church, sunday-service, main-hall"
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white placeholder-neutral-500 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <RefreshCw size={13} />
                <span>Set Room</span>
              </button>
            </div>
            <p className="text-[11px] text-neutral-500">
              Only devices with this room code can tune into your live broadcast.
            </p>
          </form>

          {/* 3. Sharable Link & QR Code */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center bg-neutral-900/60 p-4 rounded-2xl border border-neutral-800">
            {/* Left Column: Direct Link */}
            <div className="sm:col-span-7 space-y-3">
              <div className="space-y-1">
                <span className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
                  <Globe size={14} className="text-indigo-400" />
                  <span>Remote Projector URL</span>
                </span>
                <p className="text-[11px] text-neutral-400">
                  Open this link on any computer, smart TV, or tablet to mirror your presentation:
                </p>
              </div>

              <div className="p-2.5 bg-black/60 border border-neutral-800 rounded-xl flex items-center justify-between gap-2">
                <span className="text-xs font-mono text-indigo-300 truncate select-all">
                  {fullShareUrl}
                </span>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                    copied
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30"
                  }`}
                  title="Copy full broadcast URL"
                >
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copied ? "Copied!" : "Copy Link"}</span>
                </button>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-neutral-400">
                <a
                  href={fullShareUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-bold hover:underline"
                >
                  <span>Open test window</span>
                  <ExternalLink size={11} />
                </a>
                <span>•</span>
                <span>Encrypted P2P WebRTC (&lt; 50ms latency)</span>
              </div>
            </div>

            {/* Right Column: Scannable QR Code */}
            <div className="sm:col-span-5 flex flex-col items-center justify-center p-3 bg-neutral-950 rounded-xl border border-neutral-800/80 text-center space-y-1.5">
              {qrDataUrl ? (
                <div className="p-2 bg-white rounded-xl shadow-lg aspect-square w-32 flex items-center justify-center">
                  <img src={qrDataUrl} alt="Room QR Code" className="w-full h-full object-contain" />
                </div>
              ) : (
                <div className="w-32 h-32 bg-neutral-900 rounded-xl flex items-center justify-center text-neutral-600">
                  <QrCode size={40} />
                </div>
              )}
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1">
                <Tv size={11} className="text-emerald-400" />
                <span>Scan with TV or Phone</span>
              </span>
            </div>
          </div>

          {/* 4. Connected Devices Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-neutral-400">
              <span className="font-bold text-neutral-300 flex items-center gap-1.5">
                <Tv size={14} className="text-indigo-400" />
                <span>Connected Remote Screens ({connectedClients.length})</span>
              </span>
              <span className="text-[11px] text-neutral-500">Auto-syncs on slide change</span>
            </div>

            {connectedClients.length === 0 ? (
              <div className="p-4 rounded-xl bg-neutral-950/60 border border-neutral-800 text-center text-xs text-neutral-500">
                {isBroadcasting
                  ? "Waiting for remote screens or viewers to open the room link..."
                  : "Start the broadcast above to connect remote screens."}
              </div>
            ) : (
              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                {connectedClients.map((client, idx) => (
                  <div
                    key={client.peerId || idx}
                    className="p-2.5 rounded-xl bg-neutral-900/80 border border-neutral-800 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span className="font-bold text-white">{client.label}</span>
                      <span className="text-[10px] text-neutral-500 font-mono">
                        ({client.peerId.slice(0, 16)}...)
                      </span>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                      Live Synced
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-800 bg-neutral-900/40 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-neutral-400">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>Works with OBS Studio, vMix, and Smart TVs</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
