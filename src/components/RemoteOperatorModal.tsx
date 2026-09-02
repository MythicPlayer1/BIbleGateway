"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Smartphone, QrCode, Copy, Check, RefreshCw, 
  ShieldCheck, ShieldAlert, Users, Lock, Unlock, 
  Trash2, X, Activity, Radio, ExternalLink, AlertTriangle, ChevronRight
} from "lucide-react";
import QRCode from "qrcode";
import type { 
  RemoteOperatorSession, ActivityLogItem, PairingRequestMessage, OperatorRole 
} from "@/lib/remoteControl";

interface RemoteOperatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomCode: string;
  pairingToken: string;
  isBroadcasting: boolean;
  isRemoteControlEnabled: boolean;
  onToggleRemoteControl: (enabled: boolean) => void;
  onRegenerateToken: () => void;
  connectedOperators: RemoteOperatorSession[];
  pendingRequests: Array<{ req: PairingRequestMessage; conn: any }>;
  activeControllerId: string | null;
  activityLogs: ActivityLogItem[];
  onApproveOperator: (req: PairingRequestMessage, role: OperatorRole) => void;
  onDenyOperator: (operatorId: string) => void;
  onUpdateRole: (operatorId: string, role: OperatorRole) => void;
  onRevokeOperator: (operatorId: string) => void;
  onRevokeAll: () => void;
  onStartBroadcast?: () => void;
}

export const RemoteOperatorModal: React.FC<RemoteOperatorModalProps> = ({
  isOpen,
  onClose,
  roomCode,
  pairingToken,
  isBroadcasting,
  isRemoteControlEnabled,
  onToggleRemoteControl,
  onRegenerateToken,
  connectedOperators,
  pendingRequests,
  activeControllerId,
  activityLogs,
  onApproveOperator,
  onDenyOperator,
  onUpdateRole,
  onRevokeOperator,
  onRevokeAll,
  onStartBroadcast
}) => {
  const [copied, setCopied] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [activeTab, setActiveTab] = useState<'pair' | 'operators' | 'logs'>('pair');
  const [originUrl, setOriginUrl] = useState<string>("");
  const [lanIp, setLanIp] = useState<string>("");
  const [useLanIp, setUseLanIp] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOriginUrl(window.location.origin);
      // Fetch LAN IP for phone pairing
      fetch("/api/network-ip")
        .then(res => res.json())
        .then(data => {
          if (data?.ip && data.ip !== "localhost" && !data.ip.startsWith("169.254.")) {
            setLanIp(data.ip);
          }
        })
        .catch(() => {});
    }
  }, []);

  const getEffectiveBaseUrl = () => {
    if (typeof window === "undefined") return "";
    if (useLanIp && lanIp && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")) {
      const port = window.location.port ? `:${window.location.port}` : "";
      return `${window.location.protocol}//${lanIp}${port}`;
    }
    return originUrl || "";
  };

  const effectiveOrigin = getEffectiveBaseUrl();
  const remoteUrl = effectiveOrigin
    ? `${effectiveOrigin}/remote?room=${encodeURIComponent(roomCode)}&token=${encodeURIComponent(pairingToken)}`
    : `/remote?room=${encodeURIComponent(roomCode)}&token=${encodeURIComponent(pairingToken)}`;

  useEffect(() => {
    if (!isOpen) return;
    QRCode.toDataURL(remoteUrl, {
      width: 280,
      margin: 1.5,
      color: {
        dark: "#0f172a",
        light: "#ffffff"
      },
      errorCorrectionLevel: 'H'
    })
      .then(url => setQrDataUrl(url))
      .catch(() => {});
  }, [remoteUrl, isOpen]);

  const copyToClipboard = (text: string, label: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 2500);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
        className="w-full max-w-4xl max-h-[92vh] flex flex-col bg-neutral-900 border border-neutral-700/80 rounded-3xl shadow-2xl overflow-hidden text-neutral-100"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-800 bg-neutral-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Smartphone size={22} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight text-white">
                  Proclaim Remote Operator Hub
                </h2>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                  isBroadcasting ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                }`}>
                  {isBroadcasting ? "Host Active" : "Broadcast Off"}
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Control the live worship presentation from any phone or tablet around the sanctuary
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Not Broadcasting Warning */}
        {!isBroadcasting && (
          <div className="px-6 py-3 bg-amber-950/50 border-b border-amber-800/40 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 text-xs text-amber-200">
              <AlertTriangle size={16} className="text-amber-400 shrink-0" />
              <span>Broadcast is currently stopped. Turn on broadcasting to allow phones to connect.</span>
            </div>
            {onStartBroadcast && (
              <button
                type="button"
                onClick={onStartBroadcast}
                className="px-3 py-1.5 rounded-xl bg-amber-500 text-black text-xs font-black hover:bg-amber-400 transition-colors shadow-sm shrink-0"
              >
                Enable Broadcast Now
              </button>
            )}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center justify-between px-6 pt-4 border-b border-neutral-800 bg-neutral-900/50">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('pair')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-colors border-b-2 ${
                activeTab === 'pair'
                  ? "text-indigo-400 border-indigo-500 bg-indigo-500/10"
                  : "text-neutral-400 border-transparent hover:text-white hover:bg-neutral-800/50"
              }`}
            >
              <QrCode size={15} />
              <span>Pair Mobile (QR Code)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('operators')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-colors border-b-2 relative ${
                activeTab === 'operators'
                  ? "text-indigo-400 border-indigo-500 bg-indigo-500/10"
                  : "text-neutral-400 border-transparent hover:text-white hover:bg-neutral-800/50"
              }`}
            >
              <Users size={15} />
              <span>Connected Operators ({connectedOperators.length})</span>
              {pendingRequests.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-black">
                  {pendingRequests.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('logs')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-colors border-b-2 ${
                activeTab === 'logs'
                  ? "text-indigo-400 border-indigo-500 bg-indigo-500/10"
                  : "text-neutral-400 border-transparent hover:text-white hover:bg-neutral-800/50"
              }`}
            >
              <Activity size={15} />
              <span>Live Activity Logs ({activityLogs.length})</span>
            </button>
          </div>

          {/* Active Controller Status Badge */}
          <div className="pb-2 flex items-center gap-2 text-xs">
            <span className="text-neutral-400">Control Lock:</span>
            {activeControllerId ? (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold">
                <Lock size={12} className="text-indigo-400" />
                {connectedOperators.find(o => o.operatorId === activeControllerId)?.name || "Mobile Operator"}
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700 font-medium">
                <Unlock size={12} className="text-neutral-400" />
                Desktop Host (Open)
              </span>
            )}
          </div>
        </div>

        {/* Tab Contents */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: PAIR MOBILE VIA QR CODE */}
          {activeTab === 'pair' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              {/* Left Column: QR Code Container */}
              <div className="md:col-span-5 flex flex-col items-center justify-center p-6 rounded-3xl bg-neutral-950/80 border border-neutral-800 text-center">
                <div className="p-3 bg-white rounded-2xl shadow-xl border border-white/20">
                  {qrDataUrl ? (
                    <img src={qrDataUrl} alt="Pairing QR Code" className="w-52 h-52 rounded-xl" />
                  ) : (
                    <div className="w-52 h-52 flex items-center justify-center text-neutral-400 text-xs">
                      Generating QR...
                    </div>
                  )}
                </div>
                <span className="text-xs font-bold text-neutral-300 mt-4 flex items-center gap-1.5">
                  <QrCode size={14} className="text-indigo-400" />
                  Scan with smartphone camera
                </span>
                <span className="text-[11px] text-neutral-500 mt-1">
                  Works on iOS Safari, Android Chrome, iPad, or any tablet
                </span>
              </div>

              {/* Right Column: Connection Credentials & Instructions */}
              <div className="md:col-span-7 space-y-5">
                {/* Pairing Token Box */}
                <div className="p-5 rounded-2xl bg-neutral-950/60 border border-neutral-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                      Temporary Pairing Token
                    </span>
                    <button
                      type="button"
                      onClick={onRegenerateToken}
                      className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
                    >
                      <RefreshCw size={13} />
                      Regenerate
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 px-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-700 font-mono text-xl font-black text-white tracking-widest text-center shadow-inner">
                      {pairingToken}
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(pairingToken, 'token')}
                      className="px-4 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors border border-neutral-700"
                    >
                      {copied === 'token' ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                      {copied === 'token' ? "Copied!" : "Copy"}
                    </button>
                  </div>
                  <p className="text-[11px] text-neutral-400">
                    Pairing token expires when regenerated. Devices scanning the QR code will be automatically authenticated.
                  </p>
                </div>

                {/* Direct Link Share Box */}
                <div className="p-5 rounded-2xl bg-neutral-950/60 border border-neutral-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                      Direct Web App URL
                    </span>
                    {lanIp && (
                      <div className="flex items-center gap-1 bg-neutral-900 p-0.5 rounded-lg border border-neutral-800 text-[10px]">
                        <button
                          type="button"
                          onClick={() => setUseLanIp(true)}
                          className={`px-2 py-0.5 rounded-md font-bold transition-colors ${
                            useLanIp ? "bg-indigo-600 text-white" : "text-neutral-400 hover:text-white"
                          }`}
                        >
                          📶 Wi-Fi Phone ({lanIp})
                        </button>
                        <button
                          type="button"
                          onClick={() => setUseLanIp(false)}
                          className={`px-2 py-0.5 rounded-md font-bold transition-colors ${
                            !useLanIp ? "bg-indigo-600 text-white" : "text-neutral-400 hover:text-white"
                          }`}
                        >
                          💻 Same PC (localhost)
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={remoteUrl}
                      className="flex-1 px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-xs text-neutral-300 font-mono select-all focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => copyToClipboard(remoteUrl, 'url')}
                      className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shrink-0 shadow-md"
                    >
                      {copied === 'url' ? <Check size={14} className="text-emerald-300" /> : <Copy size={14} />}
                      {copied === 'url' ? "Copied!" : "Copy Link"}
                    </button>
                  </div>
                </div>

                {/* Operator Capabilities Note */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-neutral-950/40 border border-neutral-800/80 space-y-1">
                    <span className="font-bold text-indigo-300 flex items-center gap-1">
                      <ShieldCheck size={13} />
                      Zero App Install
                    </span>
                    <p className="text-[11px] text-neutral-400">
                      PWA technology runs directly in Safari, Chrome, or Firefox.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-neutral-950/40 border border-neutral-800/80 space-y-1">
                    <span className="font-bold text-emerald-300 flex items-center gap-1">
                      <Radio size={13} />
                      Real-time Live Sync
                    </span>
                    <p className="text-[11px] text-neutral-400">
                      Sub-50ms WebRTC link updates slides & preview instantly.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CONNECTED OPERATORS & APPROVALS */}
          {activeTab === 'operators' && (
            <div className="space-y-6">
              {/* Pending Approvals Queue */}
              {pendingRequests.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-black text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle size={14} />
                    Pending Access Requests ({pendingRequests.length})
                  </h3>
                  <div className="space-y-2.5">
                    {pendingRequests.map(({ req }) => (
                      <div
                        key={req.operatorId}
                        className="flex items-center justify-between p-4 rounded-2xl bg-rose-950/30 border border-rose-800/60"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-300">
                            <Smartphone size={20} />
                          </div>
                          <div>
                            <div className="font-black text-sm text-white">
                              {req.name || "Mobile Device"}
                            </div>
                            <div className="text-xs text-rose-300/80">
                              {req.deviceInfo} • Requested Role: <strong className="capitalize">{req.requestedRole || "operator"}</strong>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onApproveOperator(req, 'operator')}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-sm"
                          >
                            Allow as Operator
                          </button>
                          <button
                            type="button"
                            onClick={() => onApproveOperator(req, 'viewer')}
                            className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium text-xs transition-colors"
                          >
                            Allow as Viewer
                          </button>
                          <button
                            type="button"
                            onClick={() => onDenyOperator(req.operatorId)}
                            className="px-3 py-1.5 rounded-xl bg-rose-800/60 hover:bg-rose-700 text-rose-200 font-medium text-xs transition-colors"
                          >
                            Deny
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Connected Operators List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-neutral-400 uppercase tracking-wider">
                    Authorized Devices ({connectedOperators.length})
                  </h3>
                  {connectedOperators.length > 0 && (
                    <button
                      type="button"
                      onClick={onRevokeAll}
                      className="text-xs text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1 transition-colors"
                    >
                      <Trash2 size={13} />
                      Revoke All Devices
                    </button>
                  )}
                </div>

                {connectedOperators.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl bg-neutral-950/40 border border-neutral-800 text-neutral-500 text-xs">
                    No remote mobile operators connected yet. Scan the QR code in the "Pair Mobile" tab to connect a phone.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {connectedOperators.map((op) => (
                      <div
                        key={op.operatorId}
                        className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                          op.operatorId === activeControllerId
                            ? "bg-indigo-950/40 border-indigo-500/50 shadow-md shadow-indigo-950/50"
                            : "bg-neutral-950/60 border-neutral-800"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-xl ${
                            op.operatorId === activeControllerId 
                              ? "bg-indigo-500/20 text-indigo-400" 
                              : "bg-neutral-800 text-neutral-400"
                          }`}>
                            <Smartphone size={20} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-black text-sm text-white">{op.name}</span>
                              {op.operatorId === activeControllerId && (
                                <span className="px-2 py-0.5 rounded-full bg-indigo-500 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                                  <Lock size={10} /> Active Controller
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-neutral-400 mt-0.5">
                              {op.deviceInfo} • Connected {Math.round((Date.now() - op.pairedAt) / 60000)}m ago
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {/* Role Selector */}
                          <select
                            value={op.role}
                            onChange={(e) => onUpdateRole(op.operatorId, e.target.value as OperatorRole)}
                            className="px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-700 text-xs text-neutral-200 font-bold focus:outline-none focus:border-indigo-500"
                          >
                            <option value="viewer">Viewer (Read-Only)</option>
                            <option value="operator">Operator (Standard)</option>
                            <option value="senior_operator">Senior Operator</option>
                            <option value="admin">Admin</option>
                          </select>

                          {/* Revoke Button */}
                          <button
                            type="button"
                            onClick={() => onRevokeOperator(op.operatorId)}
                            className="p-2 rounded-xl text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Revoke device access"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: LIVE ACTIVITY LOGS */}
          {activeTab === 'logs' && (
            <div className="space-y-3">
              <h3 className="text-xs font-black text-neutral-400 uppercase tracking-wider">
                Operator Action Stream
              </h3>
              {activityLogs.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-neutral-950/40 border border-neutral-800 text-neutral-500 text-xs">
                  No operator actions recorded yet. Actions taken on mobile devices will appear here in real-time.
                </div>
              ) : (
                <div className="divide-y divide-neutral-800 rounded-2xl bg-neutral-950/60 border border-neutral-800 overflow-hidden">
                  {activityLogs.map((log) => (
                    <div key={log.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-neutral-900/40 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-[11px] text-neutral-500 shrink-0">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                        <div>
                          <strong className="text-indigo-400">{log.operatorName}</strong>
                          <span className="text-neutral-400 mx-1.5">→</span>
                          <span className="text-neutral-200 font-semibold">{log.action}</span>
                          {log.details && (
                            <span className="text-neutral-400 text-[11px] ml-1.5">({log.details})</span>
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider px-2 py-0.5 rounded-md bg-neutral-900 border border-neutral-800">
                        {log.type}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-800 bg-neutral-950/70">
          <div className="text-xs text-neutral-400">
            Room: <strong className="text-white font-mono">{roomCode}</strong>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-black transition-colors"
          >
            Close Panel
          </button>
        </div>
      </motion.div>
    </div>
  );
};
