"use client";

import React, { useState, useEffect } from "react";
import {
  Radio, X, Copy, Check, QrCode, Globe, Tv,
  Layers, ExternalLink, ShieldCheck, Wifi, Sparkles, RefreshCw,
  Monitor, Video, Smartphone, ArrowRight, Cast, CheckCircle2
} from "lucide-react";
import QRCode from "qrcode";
import type { ConnectedClientInfo } from "@/lib/broadcastSync";

export type BroadcastTabOption = 'internet_room' | 'local_display' | 'obs_stream' | 'lan_wifi' | 'stage_monitor';

interface BroadcastWonderPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  isBroadcasting: boolean;
  onToggleBroadcast: (enabled: boolean) => void;
  roomCode: string;
  onChangeRoomCode: (newRoom: string) => void;
  connectedClients: ConnectedClientInfo[];
  isDisplayConnected: boolean;
  onOpenProjector: () => void;
  initialTab?: BroadcastTabOption;
  onOpenRemoteModal?: () => void;
}

export const BroadcastWonderPickerModal: React.FC<BroadcastWonderPickerModalProps> = ({
  isOpen,
  onClose,
  isBroadcasting,
  onToggleBroadcast,
  roomCode,
  onChangeRoomCode,
  connectedClients,
  isDisplayConnected,
  onOpenProjector,
  initialTab = 'internet_room',
  onOpenRemoteModal
}) => {
  const [activeTab, setActiveTab] = useState<BroadcastTabOption>(initialTab);
  const [localRoomInput, setLocalRoomInput] = useState(roomCode);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [originUrl, setOriginUrl] = useState<string>("");
  const [lanIp, setLanIp] = useState<string>("");
  const [allIps, setAllIps] = useState<Array<{ name: string; ip: string }>>([]);
  const [hostMode, setHostMode] = useState<'domain' | 'lan' | 'localhost' | 'custom'>('domain');
  const [customHost, setCustomHost] = useState<string>("");
  const [isDomainMode, setIsDomainMode] = useState(false);

  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  useEffect(() => {
    setLocalRoomInput(roomCode);
  }, [roomCode]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOriginUrl(window.location.origin);
      const isPublicDomain = window.location.hostname !== "localhost" &&
        window.location.hostname !== "127.0.0.1" &&
        !/^\d+\.\d+\.\d+\.\d+$/.test(window.location.hostname);

      setIsDomainMode(isPublicDomain);
      if (isPublicDomain) {
        setHostMode('domain');
      } else {
        setHostMode('lan');
      }

      fetch("/api/network-ip")
        .then(res => res.json())
        .then(data => {
          if (data?.ip && data.ip !== "localhost" && !data.ip.startsWith("169.254.")) {
            setLanIp(data.ip);
          }
          if (data?.interfaces) {
            setAllIps(data.interfaces);
          }
        })
        .catch(() => { });
    }
  }, []);

  const getEffectiveOrigin = () => {
    if (typeof window === "undefined") return "";
    const port = window.location.port ? `:${window.location.port}` : "";
    const protocol = window.location.protocol;

    if (hostMode === 'domain' || (isDomainMode && hostMode !== 'custom' && hostMode !== 'lan' && hostMode !== 'localhost')) {
      return window.location.origin;
    }
    if (hostMode === 'lan' && lanIp && !lanIp.startsWith("169.254.")) {
      return `${protocol}//${lanIp}${port}`;
    }
    if (hostMode === 'custom' && customHost.trim()) {
      const cleanCustom = customHost.trim().replace(/^https?:\/\//, "");
      return `${protocol}//${cleanCustom}`;
    }
    return originUrl || `${protocol}//localhost${port}`;
  };

  const effectiveOrigin = getEffectiveOrigin();

  const fullShareUrl = effectiveOrigin
    ? `${effectiveOrigin}/projector?room=${encodeURIComponent(localRoomInput.trim() || roomCode)}`
    : `/projector?room=${encodeURIComponent(localRoomInput.trim() || roomCode)}`;

  const localProjectorUrl = effectiveOrigin ? `${effectiveOrigin}/projector` : `/projector`;

  const remotePhoneUrl = effectiveOrigin
    ? `${effectiveOrigin}/remote?room=${encodeURIComponent(localRoomInput.trim() || roomCode)}`
    : `/remote?room=${encodeURIComponent(localRoomInput.trim() || roomCode)}`;

  // Generate HD QR Code on Room or IP change
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
      .catch(() => { });
  }, [fullShareUrl, isOpen]);

  if (!isOpen) return null;

  const handleCopyLink = (url: string, key: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(key);
    setTimeout(() => setCopiedUrl(null), 2500);
  };

  const handleApplyRoomCode = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = localRoomInput.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "-");
    if (clean) {
      onChangeRoomCode(clean);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0e0e0e] border border-neutral-800 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">

        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800/80 bg-neutral-900/50">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl border ${isBroadcasting
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.25)]"
                : "bg-neutral-800 text-neutral-300 border-neutral-700"
              }`}>
              <Cast size={20} className={isBroadcasting ? "animate-pulse text-emerald-400" : ""} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white tracking-wide">
                  Broadcast Wonder Picker
                </h2>
                {isBroadcasting ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    ON AIR ({connectedClients.length})
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 border border-neutral-700 text-[10px] font-bold uppercase tracking-wider">
                    OFFLINE
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-400">
                Select your broadcast destination: Online Rooms, Secondary Screen, OBS Streaming, or Wi-Fi TVs
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

        {/* Destination Option Tabs */}
        <div className="px-6 pt-4 pb-2 bg-neutral-950 border-b border-neutral-800/80">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">

            {/* Tab 1: Online Room */}
            <button
              type="button"
              onClick={() => setActiveTab('internet_room')}
              className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${activeTab === 'internet_room'
                  ? "bg-indigo-950/60 border-indigo-500/60 text-white shadow-lg ring-1 ring-indigo-500/30"
                  : "bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:bg-neutral-850 hover:text-neutral-200"
                }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <Globe size={16} className={activeTab === 'internet_room' ? "text-indigo-400" : "text-neutral-500"} />
                {isBroadcasting && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                )}
              </div>
              <div>
                <p className="text-xs font-bold leading-tight">Internet Live Room</p>
                <p className="text-[10px] text-neutral-500 mt-0.5">WebRTC • Worldwide</p>
              </div>
            </button>

            {/* Tab 2: Local Projector Screen */}
            <button
              type="button"
              onClick={() => setActiveTab('local_display')}
              className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${activeTab === 'local_display'
                  ? "bg-indigo-950/60 border-indigo-500/60 text-white shadow-lg ring-1 ring-indigo-500/30"
                  : "bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:bg-neutral-850 hover:text-neutral-200"
                }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <Monitor size={16} className={activeTab === 'local_display' ? "text-indigo-400" : "text-neutral-500"} />
                {isDisplayConnected && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                )}
              </div>
              <div>
                <p className="text-xs font-bold leading-tight">Physical Projector</p>
                <p className="text-[10px] text-neutral-500 mt-0.5">Dual HDMI Screen</p>
              </div>
            </button>

            {/* Tab 3: OBS / Live Streaming */}
            <button
              type="button"
              onClick={() => setActiveTab('obs_stream')}
              className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${activeTab === 'obs_stream'
                  ? "bg-indigo-950/60 border-indigo-500/60 text-white shadow-lg ring-1 ring-indigo-500/30"
                  : "bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:bg-neutral-850 hover:text-neutral-200"
                }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <Video size={16} className={activeTab === 'obs_stream' ? "text-indigo-400" : "text-neutral-500"} />
                <span className="text-[9px] font-mono px-1.5 py-0.2 bg-neutral-800 text-neutral-400 rounded">1080p</span>
              </div>
              <div>
                <p className="text-xs font-bold leading-tight">OBS & vMix Stream</p>
                <p className="text-[10px] text-neutral-500 mt-0.5">YouTube / Facebook</p>
              </div>
            </button>

            {/* Tab 4: Church Wi-Fi LAN */}
            <button
              type="button"
              onClick={() => setActiveTab('lan_wifi')}
              className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${activeTab === 'lan_wifi'
                  ? "bg-indigo-950/60 border-indigo-500/60 text-white shadow-lg ring-1 ring-indigo-500/30"
                  : "bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:bg-neutral-850 hover:text-neutral-200"
                }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <Wifi size={16} className={activeTab === 'lan_wifi' ? "text-indigo-400" : "text-neutral-500"} />
                <span className="text-[9px] font-mono px-1.5 py-0.2 bg-emerald-950 text-emerald-300 rounded">Wi-Fi</span>
              </div>
              <div>
                <p className="text-xs font-bold leading-tight">Church Wi-Fi LAN</p>
                <p className="text-[10px] text-neutral-500 mt-0.5">Local Sanctuary TVs</p>
              </div>
            </button>
          </div>
        </div>

        {/* Tab Detail Contents */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 custom-scrollbar">

          {/* =================================================================== */}
          {/* TAB 1: INTERNET LIVE ROOM (WebRTC P2P) */}
          {/* =================================================================== */}
          {activeTab === 'internet_room' && (
            <div className="space-y-5">
              {/* Broadcast ON/OFF Action Switch */}
              <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${isBroadcasting
                  ? "bg-emerald-950/30 border-emerald-500/40 shadow-inner"
                  : "bg-neutral-900/50 border-neutral-800"
                }`}>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Radio size={16} className={isBroadcasting ? "text-emerald-400 animate-pulse" : "text-neutral-500"} />
                    <span className="text-sm font-bold text-white">
                      {isBroadcasting ? "WebRTC Online Broadcast is Live" : "Broadcast is Currently Offline"}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400">
                    {isBroadcasting
                      ? `Syncing live with ${connectedClients.length} connected remote screen(s) worldwide.`
                      : "Start broadcast to stream live slides, scriptures, and videos over the internet."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onToggleBroadcast(!isBroadcasting)}
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 flex items-center gap-2 shrink-0 ${isBroadcasting
                      ? "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30"
                      : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30"
                    }`}
                >
                  <Radio size={14} className={isBroadcasting ? "animate-pulse" : ""} />
                  <span>{isBroadcasting ? "Stop Broadcast" : "Go Live (Start)"}</span>
                </button>
              </div>

              {/* Room Code Customizer */}
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
              </form>

              {/* Address Mode Selector (LAN Wi-Fi IP vs Localhost vs Custom) */}
              <div className="space-y-2 p-3.5 bg-neutral-950/80 rounded-2xl border border-neutral-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-neutral-300 flex items-center gap-1.5">
                    <Wifi size={14} className="text-emerald-400" />
                    <span>Broadcast Host Address / IP:</span>
                  </span>
                  <span className="text-[10px] text-neutral-500 font-medium">
                    {hostMode === 'lan' ? 'Recommended for TVs, Phones & iPads' : hostMode === 'localhost' ? 'This Machine Only' : 'Custom IP'}
                  </span>
                </div>

                <div className={`grid ${isDomainMode ? "grid-cols-4" : "grid-cols-3"} gap-2`}>
                  {isDomainMode && (
                    <button
                      type="button"
                      onClick={() => setHostMode('domain')}
                      className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 border ${hostMode === 'domain'
                          ? "bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400/50"
                          : "bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-neutral-200"
                        }`}
                    >
                      <span className="flex items-center gap-1">
                        <Globe size={12} className={hostMode === 'domain' ? "text-white" : "text-indigo-400"} />
                        <span>Domain</span>
                      </span>
                      <span className="text-[10px] font-mono opacity-80 truncate max-w-[90px]">
                        {typeof window !== "undefined" ? window.location.hostname : "Domain"}
                      </span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setHostMode('lan')}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 border ${hostMode === 'lan'
                        ? "bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400/50"
                        : "bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-neutral-200"
                      }`}
                  >
                    <span className="flex items-center gap-1">
                      <Wifi size={12} className={hostMode === 'lan' ? "text-white" : "text-emerald-400"} />
                      <span>Wi-Fi / LAN IP</span>
                    </span>
                    <span className="text-[10px] font-mono opacity-80 truncate max-w-[140px]">
                      {lanIp || "Detecting..."}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setHostMode('localhost')}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 border ${hostMode === 'localhost'
                        ? "bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400/50"
                        : "bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-neutral-200"
                      }`}
                  >
                    <span>Localhost</span>
                    <span className="text-[10px] font-mono opacity-80">localhost:3000</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setHostMode('custom')}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 border ${hostMode === 'custom'
                        ? "bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400/50"
                        : "bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-neutral-200"
                      }`}
                  >
                    <span>Custom</span>
                    <span className="text-[10px] font-mono opacity-80">Enter Host</span>
                  </button>
                </div>

                {hostMode === 'custom' && (
                  <div className="pt-1">
                    <input
                      type="text"
                      value={customHost}
                      onChange={(e) => setCustomHost(e.target.value)}
                      placeholder="Enter IP:port (e.g. 172.20.10.2:3000 or mychurch.com)"
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-neutral-500 outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                )}
              </div>

              {/* Link & QR Code Card */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center bg-neutral-900/60 p-4 rounded-2xl border border-neutral-800">
                <div className="sm:col-span-7 space-y-3">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
                      <Globe size={14} className="text-indigo-400" />
                      <span>Remote Projector URL</span>
                    </span>
                    <p className="text-[11px] text-neutral-400">
                      Open this URL on any computer, TV browser, or tablet anywhere:
                    </p>
                  </div>

                  <div className="p-2.5 bg-black/60 border border-neutral-800 rounded-xl flex items-center justify-between gap-2">
                    <span className="text-xs font-mono text-indigo-300 truncate select-all">
                      {fullShareUrl}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyLink(fullShareUrl, 'internet_room')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${copiedUrl === 'internet_room'
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30"
                        }`}
                    >
                      {copiedUrl === 'internet_room' ? <Check size={13} /> : <Copy size={13} />}
                      <span>{copiedUrl === 'internet_room' ? "Copied!" : "Copy Link"}</span>
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
                    <span>Encrypted P2P (&lt; 50ms latency)</span>
                  </div>
                </div>

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
                    <span>Scan with TV / Phone</span>
                  </span>
                </div>
              </div>

              {/* Connected Devices List */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
                  <Tv size={14} className="text-indigo-400" />
                  <span>Connected Remote Displays ({connectedClients.length})</span>
                </span>
                {connectedClients.length === 0 ? (
                  <div className="p-3.5 rounded-xl bg-neutral-950/60 border border-neutral-800 text-center text-xs text-neutral-500">
                    {isBroadcasting
                      ? "Waiting for remote screens or viewers to tune into the room link..."
                      : "Click 'Go Live (Start)' above to enable connections."}
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                    {connectedClients.map((client, idx) => (
                      <div
                        key={client.peerId || idx}
                        className="p-2 rounded-xl bg-neutral-900/80 border border-neutral-800 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                          <span className="font-bold text-white">{client.label}</span>
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
          )}

          {/* =================================================================== */}
          {/* TAB 2: PHYSICAL PROJECTOR SCREEN (Local HDMI Dual Screen) */}
          {/* =================================================================== */}
          {activeTab === 'local_display' && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Monitor size={18} className="text-indigo-400" />
                      <span>Dedicated Sanctuary Projector Screen</span>
                    </h3>
                    <p className="text-xs text-neutral-400">
                      Launches a clean full-screen display window on your secondary HDMI / DisplayPort projector monitor.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${isDisplayConnected
                        ? "bg-emerald-950 text-emerald-300 border-emerald-500/40"
                        : "bg-neutral-800 text-neutral-400 border-neutral-700"
                      }`}>
                      <span className={`w-2 h-2 rounded-full ${isDisplayConnected ? "bg-emerald-400 animate-pulse" : "bg-neutral-500"}`}></span>
                      <span>{isDisplayConnected ? "Display Active" : "Not Launched"}</span>
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onOpenProjector}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2"
                  >
                    <ExternalLink size={14} />
                    <span>{isDisplayConnected ? "Re-open / Focus Projector Window" : "Launch Projector Screen"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCopyLink(localProjectorUrl, 'local_projector')}
                    className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white rounded-xl text-xs font-bold transition-all border border-neutral-700 flex items-center gap-1.5"
                  >
                    {copiedUrl === 'local_projector' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    <span>{copiedUrl === 'local_projector' ? "URL Copied!" : "Copy Display URL"}</span>
                  </button>
                </div>
              </div>

              {/* Quick Setup Checklist */}
              <div className="p-4 rounded-xl bg-black/40 border border-neutral-800/80 space-y-2 text-xs text-neutral-300">
                <span className="font-bold text-neutral-200 uppercase tracking-wider text-[11px] block">
                  Dual-Monitor Sanctuary Setup Tip:
                </span>
                <div className="space-y-1.5 text-neutral-400">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                    <span>Click <strong>Launch Projector Screen</strong> to open the clean display window.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                    <span>Drag the window onto your church projector / sanctuary TV screen.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                    <span>Double-click or press <strong>F11</strong> on that window to make it borderless Fullscreen.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =================================================================== */}
          {/* TAB 3: OBS STUDIO / VMIX LIVE STREAMING */}
          {/* =================================================================== */}
          {activeTab === 'obs_stream' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-3">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Video size={18} className="text-indigo-400" />
                    <span>OBS Studio & vMix Live Stream Overlay</span>
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Embed your live lyrics, Bible verses, and lower-third scriptures directly into OBS Studio for YouTube & Facebook Live streams.
                  </p>
                </div>

                <div className="p-3 bg-black/60 border border-neutral-800 rounded-xl flex items-center justify-between gap-2">
                  <span className="text-xs font-mono text-indigo-300 truncate select-all">
                    {fullShareUrl}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyLink(fullShareUrl, 'obs_url')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${copiedUrl === 'obs_url'
                        ? "bg-emerald-600 text-white"
                        : "bg-indigo-600 hover:bg-indigo-500 text-white"
                      }`}
                  >
                    {copiedUrl === 'obs_url' ? <Check size={13} /> : <Copy size={13} />}
                    <span>{copiedUrl === 'obs_url' ? "Copied!" : "Copy Browser Source URL"}</span>
                  </button>
                </div>
              </div>

              {/* OBS Step-by-Step Guide */}
              <div className="p-4 rounded-xl bg-black/40 border border-neutral-800/80 space-y-2.5 text-xs text-neutral-300">
                <span className="font-bold text-neutral-200 uppercase tracking-wider text-[11px] block">
                  3-Step OBS Studio Setup:
                </span>
                <ol className="space-y-2 text-neutral-400 list-decimal list-inside">
                  <li>In OBS Studio, click <strong>+ (Add Source)</strong> $\rightarrow$ Select <strong>Browser</strong>.</li>
                  <li>Paste the copied URL above into the <strong>URL</strong> field.</li>
                  <li>Set <strong>Width: 1920</strong> and <strong>Height: 1080</strong>, then check <em>"Shutdown source when not visible"</em>.</li>
                </ol>
              </div>
            </div>
          )}

          {/* =================================================================== */}
          {/* TAB 4: CHURCH WI-FI LAN */}
          {/* =================================================================== */}
          {activeTab === 'lan_wifi' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-3">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Wifi size={18} className="text-emerald-400" />
                    <span>Church Local Network (Wi-Fi LAN IP)</span>
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Connect Smart TVs, iPads, and mobile phones on your local Wi-Fi router (IP: <span className="font-mono text-emerald-300 font-bold">{lanIp || "172.20.10.2"}</span>).
                  </p>
                </div>

                {/* 1. Projector Display LAN Link */}
                <div className="p-3 bg-black/60 border border-neutral-800 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-neutral-400">
                    <span className="font-bold text-neutral-300 flex items-center gap-1.5">
                      <Tv size={13} className="text-indigo-400" />
                      <span>1. Local Wi-Fi Projector Screen:</span>
                    </span>
                    <span className="text-[11px] text-emerald-400 font-bold">For Smart TVs & Projectors</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono text-indigo-300 truncate select-all">
                      {fullShareUrl}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyLink(fullShareUrl, 'wifi_url')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${copiedUrl === 'wifi_url'
                          ? "bg-emerald-600 text-white"
                          : "bg-indigo-600 hover:bg-indigo-500 text-white"
                        }`}
                    >
                      {copiedUrl === 'wifi_url' ? <Check size={13} /> : <Copy size={13} />}
                      <span>{copiedUrl === 'wifi_url' ? "Copied!" : "Copy Link"}</span>
                    </button>
                  </div>
                </div>

                {/* 2. Mobile Remote Control LAN Link */}
                <div className="p-3 bg-black/60 border border-neutral-800 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-neutral-400">
                    <span className="font-bold text-neutral-300 flex items-center gap-1.5">
                      <Smartphone size={13} className="text-purple-400" />
                      <span>2. Local Mobile Remote Control:</span>
                    </span>
                    <span className="text-[11px] text-purple-400 font-bold">For Phones & Tablets</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono text-purple-300 truncate select-all">
                      {remotePhoneUrl}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyLink(remotePhoneUrl, 'remote_wifi_url')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${copiedUrl === 'remote_wifi_url'
                          ? "bg-purple-600 text-white"
                          : "bg-purple-700 hover:bg-purple-600 text-white"
                        }`}
                    >
                      {copiedUrl === 'remote_wifi_url' ? <Check size={13} /> : <Copy size={13} />}
                      <span>{copiedUrl === 'remote_wifi_url' ? "Copied!" : "Copy Remote URL"}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                {onOpenRemoteModal && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenRemoteModal();
                    }}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    <QrCode size={15} />
                    <span>Show Mobile Remote QR Code</span>
                  </button>
                )}
              </div>

              <div className="p-4 rounded-xl bg-black/40 border border-neutral-800/80 space-y-2 text-xs text-neutral-400">
                <span className="font-bold text-neutral-200 uppercase tracking-wider text-[11px] block">
                  How Local Wi-Fi Displays Work:
                </span>
                <p>
                  Any TV browser (Samsung, LG, Sony, Fire TV Stick, Apple TV) or mobile phone on the church Wi-Fi can scan the QR code in the <strong>Internet Live Room</strong> tab or open the local IP link above to stream or control slides without consuming internet data.
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-800 bg-neutral-900/50 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-neutral-400">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>Encrypted WebRTC P2P & Multi-Output Ready</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
