"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Smartphone, Radio, Wifi, Lock, Unlock, Play, Pause, RotateCcw, 
  EyeOff, Eye, ChevronLeft, ChevronRight, Sparkles, AlertCircle, 
  CheckCircle2, Layers, Clock, Megaphone, Send, ShieldAlert, Monitor
} from "lucide-react";
import { RemoteOperatorClient } from "@/lib/broadcastSync";
import type { 
  CanonicalPresentationState, PairingResponseMessage, OperatorRole, RemoteCommandType 
} from "@/lib/remoteControl";
import { ROLE_PERMISSIONS } from "@/lib/remoteControl";
import { getTextShadowCss, getFontFamilyCss } from "@/lib/lyrics";

function RemoteOperatorApp() {
  const searchParams = useSearchParams();
  const initialRoom = searchParams.get("room") || "sunday-worship";
  const initialToken = searchParams.get("token") || "";

  // Operator Identification (SSR-safe initial defaults)
  const [operatorName, setOperatorName] = useState("Mobile Operator");
  const [operatorId, setOperatorId] = useState("");
  const [isClientReady, setIsClientReady] = useState(false);

  useEffect(() => {
    try {
      const savedName = localStorage.getItem("proclaim_operator_name") || "Mobile Operator";
      let savedId = localStorage.getItem("proclaim_operator_id");
      if (!savedId) {
        savedId = `op_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
        localStorage.setItem("proclaim_operator_id", savedId);
      }
      setOperatorName(savedName);
      setOperatorId(savedId);
    } catch {}
    setIsClientReady(true);
  }, []);

  const [roomCode, setRoomCode] = useState(initialRoom);
  const [pairingToken, setPairingToken] = useState(initialToken);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'pending' | 'paired' | 'revoked'>('connecting');
  const [operatorRole, setOperatorRole] = useState<OperatorRole>('operator');
  const [hasControlLock, setHasControlLock] = useState(false);
  const [activeControllerId, setActiveControllerId] = useState<string | null>(null);
  const [isWebRtcLive, setIsWebRtcLive] = useState(false);

  // Canonical Presentation State from Host
  const [liveState, setLiveState] = useState<CanonicalPresentationState | null>(null);

  // Local Mobile Preview State (Preview vs Go Live)
  const [previewItemId, setPreviewItemId] = useState<string | null>(null);
  const [previewSlideIndex, setPreviewSlideIndex] = useState<number>(0);
  const [isInPreviewMode, setIsInPreviewMode] = useState(false);

  // UI state
  const [activeTab, setActiveTab] = useState<'live' | 'schedule' | 'actions'>('live');
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  const [swipeStartX, setSwipeStartX] = useState<number | null>(null);

  const clientRef = useRef<RemoteOperatorClient | null>(null);
  const toastTimeoutRef = useRef<any>(null);

  const showToast = (msg: string, isError = false) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setFeedbackToast(msg);
    if (isError) setErrorDetail(msg);
    toastTimeoutRef.current = setTimeout(() => setFeedbackToast(null), isError ? 6000 : 2500);
  };

  // HTTP Fast LAN Pairing & Sync
  const pairViaHttp = async (targetToken?: string, targetRoom?: string) => {
    const activeToken = targetToken !== undefined ? targetToken : pairingToken;
    const activeRoom = targetRoom || roomCode;
    setErrorDetail(null);
    try {
      const res = await fetch("/api/remote-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "PAIR",
          roomCode: activeRoom,
          operatorId,
          name: operatorName,
          token: activeToken,
          deviceInfo: typeof navigator !== "undefined" ? (navigator.platform || "Mobile") : "Mobile"
        })
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => `HTTP ${res.status}`);
        showToast(`❌ Server error ${res.status}: ${errText.slice(0, 80)}`, true);
        setConnectionStatus('disconnected');
        return false;
      }

      const data = await res.json();
      if (data.status === "approved" || (data.status === "pending" && activeToken)) {
        setOperatorRole(data.role || "operator");
        setConnectionStatus("paired");
        if (data.state) {
          setLiveState(data.state);
          setActiveControllerId(data.state.activeControllerId || null);
          if (!isInPreviewMode) {
            setPreviewItemId(data.state.activeItemId);
            setPreviewSlideIndex(data.state.activeSlideIndex);
          }
        }
        showToast("✅ Connected to Proclaim Sanctuary!");
        return true;
      } else if (data.status === "pending") {
        setConnectionStatus("pending");
        showToast("⏳ Waiting for host desktop approval...");
        return false;
      } else if (data.status === "invalid_token" || data.status === "invalid") {
        showToast(`❌ Invalid token: ${activeToken}. Re-scan QR code.`, true);
        setConnectionStatus('disconnected');
        return false;
      } else {
        showToast(`❌ Unexpected response: ${data.status || JSON.stringify(data).slice(0,60)}`, true);
        setConnectionStatus('disconnected');
        return false;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(`❌ Network error: ${msg}`, true);
      setConnectionStatus('disconnected');
      return false;
    }
  };

  // Delayed HTTP fallback auto-pair (only if WebRTC does not connect within 3s)
  useEffect(() => {
    if (!isClientReady || !operatorId || isWebRtcLive) return;

    const timer = setTimeout(() => {
      if (!isWebRtcLive) {
        pairViaHttp(initialToken, initialRoom);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [isClientReady, operatorId, isWebRtcLive]);

  // HTTP live state sync: ONLY runs if WebRTC is NOT active
  useEffect(() => {
    // Zero HTTP polling if WebRTC DataChannel is alive
    if (isWebRtcLive) return;
    if (connectionStatus !== 'paired' && connectionStatus !== 'pending') return;

    let isCancelled = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const fetchLiveState = async () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      try {
        const res = await fetch(`/api/remote-sync?room=${encodeURIComponent(roomCode)}`);
        if (res.ok) {
          const data = await res.json();
          if (isCancelled) return;

          // Sync our operator session (role updates, approval, revocation)
          const mySession = data.operators?.find((o: any) => o.operatorId === operatorId);
          if (mySession) {
            if (mySession.role && mySession.role !== operatorRole) {
              setOperatorRole(mySession.role);
            }
            if (mySession.isApproved && connectionStatus === 'pending') {
              setOperatorRole(mySession.role || 'operator');
              setConnectionStatus('paired');
              showToast("Approved by host desktop!");
            }
            setHasControlLock(data.activeControllerId === operatorId || !!mySession.hasControlLock);
          } else if (connectionStatus === 'paired' && data.operators && data.operators.length > 0) {
            // Operator was revoked by desktop host
            setConnectionStatus('revoked');
            showToast("❌ Session access was revoked by host", true);
          }

          if (data.state) {
            setLiveState(data.state);
            setActiveControllerId(data.state.activeControllerId || null);
            if (!isInPreviewMode) {
              setPreviewItemId(data.state.activeItemId);
              setPreviewSlideIndex(data.state.activeSlideIndex);
            }
          }
        }
      } catch {}
    };

    // Stop/resume polling based on tab visibility
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        if (intervalId) { clearInterval(intervalId); intervalId = null; }
      } else {
        if (!intervalId && !isCancelled) {
          fetchLiveState();
          intervalId = setInterval(fetchLiveState, 1500);
        }
      }
    };

    fetchLiveState();
    intervalId = setInterval(fetchLiveState, 1500);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isCancelled = true;
      if (intervalId) clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isWebRtcLive, connectionStatus, roomCode, operatorId, isInPreviewMode]);

  // Initialize WebRTC Remote Operator Client (for P2P DataChannel)
  useEffect(() => {
    if (!roomCode || !operatorId) return;

    const client = new RemoteOperatorClient(
      roomCode,
      operatorId,
      operatorName,
      pairingToken,
      {
        onCanonicalState: (state) => {
          setIsWebRtcLive(true);
          setLiveState(state);
          setActiveControllerId(state.activeControllerId);
          if (!isInPreviewMode) {
            setPreviewItemId(state.activeItemId);
            setPreviewSlideIndex(state.activeSlideIndex);
          }
        },
        onPairingStatus: (resp: PairingResponseMessage) => {
          setIsWebRtcLive(true);
          if (resp.status === "approved") {
            setOperatorRole(resp.role);
            setHasControlLock(resp.hasControlLock);
            setConnectionStatus("paired");
            showToast("Connected via direct WebRTC!");
          } else if (resp.status === "pending") {
            setConnectionStatus("pending");
            showToast("Waiting for host desktop approval...");
          } else if (resp.status === "denied") {
            showToast("Access was denied by the host.");
          } else if (resp.status === "revoked") {
            showToast("Session was revoked by host.");
          }
        },
        onStatusChange: (status) => {
          if (status === 'paired' || status === 'connected') {
            setIsWebRtcLive(true);
            setConnectionStatus(status === 'connected' ? 'paired' : status);
          } else if (status === 'pending') {
            setIsWebRtcLive(true);
            setConnectionStatus(status);
          } else if (status === 'disconnected') {
            setIsWebRtcLive(false);
          }
        },
        onControlLockChange: (hasLock, controllerId) => {
          setHasControlLock(hasLock);
          setActiveControllerId(controllerId);
          if (hasLock) {
            showToast("🔒 You now have active control");
          }
        },
        onErrorMessage: () => {
          setIsWebRtcLive(false);
        }
      }
    );

    clientRef.current = client;

    return () => {
      client.destroy();
      clientRef.current = null;
      setIsWebRtcLive(false);
    };
  }, [roomCode, operatorId]);

  // Dispatch Remote Command (Prioritizes WebRTC DataChannel; fallbacks to HTTP LAN API if offline)
  const sendCommand = async (type: RemoteCommandType, params?: any) => {
    // 1. If WebRTC is connected, send instantly over P2P DataChannel (0 HTTP requests)
    if (isWebRtcLive && clientRef.current && clientRef.current.isConnected) {
      try {
        await clientRef.current.sendCommand(type, params);
        return;
      } catch {
        // Fall through to HTTP fallback if WebRTC send threw an exception
      }
    }

    // 2. Fallback: Dispatch over local HTTP LAN API
    const requestId = `cmd_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const payload = {
      type,
      requestId,
      operatorId,
      timestamp: Date.now(),
      params
    };

    try {
      fetch("/api/remote-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "COMMAND",
          roomCode,
          command: payload
        })
      }).then(res => res.json()).then(data => {
        if (data && !data.success && data.reason) {
          showToast(`❌ ${data.reason}`);
        }
      }).catch(() => {});
    } catch {}
  };

  // Quick Action Handlers
  const handleNext = () => {
    if (!currentPermissions.canControlSlides) {
      showToast("👁️ View-Only Mode: Cannot change slides");
      return;
    }
    sendCommand('PRESENTATION_NEXT');
  };

  const handlePrev = () => {
    if (!currentPermissions.canControlSlides) {
      showToast("👁️ View-Only Mode: Cannot change slides");
      return;
    }
    sendCommand('PRESENTATION_PREVIOUS');
  };

  const handleGoLivePreview = () => {
    if (!currentPermissions.canControlSlides) {
      showToast("👁️ View-Only Mode: Cannot push slides live");
      return;
    }
    if (!previewItemId) return;
    sendCommand('PRESENTATION_GO_LIVE', {
      itemId: previewItemId,
      slideIndex: previewSlideIndex
    });
    setIsInPreviewMode(false);
    showToast("Live slide updated!");
  };

  const handleToggleHideText = () => {
    if (!currentPermissions.canBlackout) {
      showToast("🚫 Permission Denied: Cannot blackout screen");
      return;
    }
    if (liveState?.isTextHidden) {
      sendCommand('PRESENTATION_TEXT_SHOW');
    } else {
      sendCommand('PRESENTATION_TEXT_MUTE');
    }
  };

  const handleToggleTimer = () => {
    if (!currentPermissions.canControlTimer) {
      showToast("🚫 Permission Denied: Cannot control timer");
      return;
    }
    if (liveState?.isCountdownRunning) {
      sendCommand('COUNTDOWN_PAUSE');
    } else {
      sendCommand('COUNTDOWN_START');
    }
  };

  const handleAdjustTimer = (delta: number) => {
    if (!currentPermissions.canControlTimer) {
      showToast("🚫 Permission Denied: Cannot adjust timer");
      return;
    }
    sendCommand('COUNTDOWN_ADJUST', { delta });
  };

  const handleResetTimer = () => {
    if (!currentPermissions.canControlTimer) {
      showToast("🚫 Permission Denied: Cannot reset timer");
      return;
    }
    sendCommand('COUNTDOWN_RESET', { seconds: 300 });
  };

  const handleToggleTicker = () => {
    if (!currentPermissions.canControlTicker) {
      showToast("🚫 Permission Denied: Cannot toggle ticker");
      return;
    }
    sendCommand('TICKER_TOGGLE');
  };

  const handleRequestControl = () => {
    if (!currentPermissions.canRequestControlLock) {
      showToast("🚫 Permission Denied: Cannot request control lock");
      return;
    }
    sendCommand('REQUEST_CONTROL_LOCK');
  };

  const handleReleaseControl = () => {
    sendCommand('RELEASE_CONTROL_LOCK');
  };

  // RBAC Permissions for the current operator
  const currentPermissions = ROLE_PERMISSIONS[operatorRole] || ROLE_PERMISSIONS.viewer;

  // Touch Swipe on Live Preview Card
  const handleTouchStart = (e: React.TouchEvent) => {
    setSwipeStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (swipeStartX === null) return;
    const diff = e.changedTouches[0].clientX - swipeStartX;
    if (diff > 50) {
      // Swiped Right -> Previous
      if (!currentPermissions.canControlSlides) {
        showToast("👁️ View-Only Mode: Cannot change slides");
        return;
      }
      handlePrev();
    } else if (diff < -50) {
      // Swiped Left -> Next
      if (!currentPermissions.canControlSlides) {
        showToast("👁️ View-Only Mode: Cannot change slides");
        return;
      }
      handleNext();
    }
    setSwipeStartX(null);
  };

  // Current previewed slide info (either in local preview mode or live)
  const currentItemInView = liveState?.scheduleItems?.find(
    i => i.id === (isInPreviewMode ? previewItemId : liveState?.activeItemId)
  );
  const currentSlideInView = currentItemInView?.slides?.[
    isInPreviewMode ? previewSlideIndex : (liveState?.activeSlideIndex || 0)
  ];

  // Helper formatting for countdown
  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isConnectedAndPaired = connectionStatus === 'paired' || (liveState !== null && (connectionStatus as string) !== 'revoked');

  const getRoleBadge = () => {
    switch (operatorRole) {
      case 'admin':
        return { label: 'Admin', color: 'bg-purple-500/20 text-purple-300 border-purple-500/40' };
      case 'senior_operator':
        return { label: 'Sr. Operator', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' };
      case 'operator':
        return { label: 'Operator', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' };
      case 'viewer':
      default:
        return { label: 'Viewer (Read-Only)', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' };
    }
  };

  const roleBadge = getRoleBadge();

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans flex flex-col select-none pb-28">
      {/* Top Mobile Operator Header */}
      <header className="sticky top-0 z-40 bg-neutral-900/90 backdrop-blur-md border-b border-neutral-800 px-4 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-xl bg-indigo-600/30 text-indigo-400 border border-indigo-500/40">
            <Smartphone size={18} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-black tracking-tight text-white">PROCLAIM REMOTE</h1>
              {isConnectedAndPaired && (
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              )}
            </div>
            <span className="text-[10px] text-neutral-400 font-medium">
              Room: <strong className="text-neutral-200">{roomCode}</strong> • {operatorName}
            </span>
          </div>
        </div>

        {/* Connection & Role Badge */}
        <div className="flex items-center gap-1.5">
          {isConnectedAndPaired ? (
            <div className="flex items-center gap-1.5">
              <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${roleBadge.color}`}>
                {roleBadge.label}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                <Radio size={10} className="animate-pulse" /> Live
              </span>
            </div>
          ) : connectionStatus === 'pending' ? (
            <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[10px] font-bold animate-pulse">
              Approval Pending
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 text-[10px] font-bold">
              {connectionStatus}
            </span>
          )}
        </div>
      </header>

      {/* Viewer Read-Only Warning Notice Banner */}
      {isConnectedAndPaired && !currentPermissions.canControlSlides && (
        <div className="px-4 py-2 bg-amber-950/60 border-b border-amber-700/50 text-amber-300 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <AlertCircle size={14} className="text-amber-400 shrink-0" />
            <span>View-Only Mode: Ask the desktop operator to upgrade your role to control slides.</span>
          </div>
        </div>
      )}

      {/* Control Lock Status Banner */}
      {isConnectedAndPaired && (
        <div className={`px-4 py-2 text-xs flex items-center justify-between border-b ${
          hasControlLock
            ? "bg-indigo-950/80 border-indigo-800/60 text-indigo-200 font-bold"
            : activeControllerId
              ? "bg-neutral-900 border-neutral-800 text-neutral-400"
              : "bg-neutral-900/60 border-neutral-800 text-neutral-300"
        }`}>
          <div className="flex items-center gap-2">
            {hasControlLock ? (
              <>
                <Lock size={13} className="text-indigo-400" />
                <span>You have active control lock</span>
              </>
            ) : activeControllerId ? (
              <>
                <Lock size={13} className="text-neutral-500" />
                <span>Controlled by another operator</span>
              </>
            ) : (
              <>
                <Unlock size={13} className="text-emerald-400" />
                <span>Control is open (Desktop primary)</span>
              </>
            )}
          </div>

          {hasControlLock ? (
            <button
              type="button"
              onClick={handleReleaseControl}
              className="px-2 py-0.5 rounded-lg bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-[11px] font-semibold"
            >
              Release Lock
            </button>
          ) : (
            <button
              type="button"
              onClick={handleRequestControl}
              className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[11px] shadow-sm transition-colors"
            >
              Request Control
            </button>
          )}
        </div>
      )}

      {/* Feedback Toast Notification */}
      <AnimatePresence>
        {feedbackToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full text-white text-xs font-black shadow-2xl border ${
              feedbackToast.startsWith('❌')
                ? 'bg-rose-600 border-rose-400/50'
                : feedbackToast.startsWith('✅')
                  ? 'bg-emerald-600 border-emerald-400/50'
                  : 'bg-indigo-600 border-indigo-400/50'
            }`}
          >
            {feedbackToast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* CONNECTING / PENDING APPROVAL OVERLAY */}
      {!isConnectedAndPaired && (
        <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] text-center space-y-5">
          <div className="p-4 rounded-3xl bg-neutral-900 border border-neutral-800 shadow-2xl">
            <Radio size={40} className="text-indigo-400 animate-pulse" />
          </div>
          <div className="space-y-1 max-w-sm">
            <h2 className="text-lg font-black text-white">
              {connectionStatus === 'pending'
                ? "Waiting for Host Approval"
                : connectionStatus === 'revoked'
                  ? "Session Expired or Revoked"
                  : "Connecting to Proclaim Host..."}
            </h2>
            <p className="text-xs text-neutral-400">
              {connectionStatus === 'pending'
                ? "The technician at the desktop computer has received your access request. Please wait a moment."
                : connectionStatus === 'revoked'
                  ? "Please ask the desktop technician to generate a new pairing QR code."
                  : `Connecting to room "${roomCode}". Make sure the desktop host has broadcast enabled.`}
            </p>
          </div>

          {/* Persistent Error Box */}
          {errorDetail && (
            <div className="w-full max-w-xs p-3 rounded-2xl bg-rose-950/80 border border-rose-700/60 text-left space-y-1">
              <div className="flex items-center gap-1.5 text-rose-400 text-xs font-bold">
                <AlertCircle size={13} />
                <span>Connection Error</span>
              </div>
              <p className="text-[11px] text-rose-300 font-mono break-all leading-relaxed">{errorDetail}</p>
              <p className="text-[10px] text-rose-400/70 pt-0.5" suppressHydrationWarning>Attempting: POST /api/remote-sync on {typeof window !== 'undefined' ? window.location.host : 'server'}</p>
            </div>
          )}

          {/* Quick Token Re-pair Input */}
          <div className="w-full max-w-xs p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3">
            <div className="space-y-1 text-left">
              <label className="text-[10px] font-bold text-neutral-400 uppercase">Room Name</label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "-"))}
                className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-700 text-xs font-mono text-white"
                placeholder="sunday-worship"
              />
            </div>
            <div className="space-y-1 text-left">
              <label className="text-[10px] font-bold text-neutral-400 uppercase">Your Name</label>
              <input
                type="text"
                value={operatorName}
                onChange={(e) => {
                  setOperatorName(e.target.value);
                  localStorage.setItem("proclaim_operator_name", e.target.value);
                }}
                className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-700 text-xs text-white"
                placeholder="e.g. Ashish (Worship Team)"
              />
            </div>
            <div className="space-y-1 text-left">
              <label className="text-[10px] font-bold text-neutral-400 uppercase">6-Digit Pairing Token</label>
              <input
                type="text"
                value={pairingToken}
                onChange={(e) => setPairingToken(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-700 text-xs font-mono font-bold text-white tracking-widest text-center"
                placeholder="TOKEN"
              />
            </div>
            <button
              type="button"
              onClick={async () => {
                showToast("⏳ Connecting to Proclaim Host...");
                await pairViaHttp(pairingToken, roomCode);
                clientRef.current?.updateCredentials(operatorName, pairingToken, roomCode);
              }}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-black transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <Radio size={14} className="animate-pulse" />
              <span>Connect to Host</span>
            </button>
          </div>
        </div>
      )}

      {/* PAIRED OPERATOR MAIN DASHBOARD */}
      {isConnectedAndPaired && (
        <main className="flex-1 flex flex-col p-4 space-y-4 max-w-lg mx-auto w-full">
          
          {/* Sub Navigation Tabs */}
          <div className="flex rounded-2xl bg-neutral-900/90 p-1 border border-neutral-800/80">
            <button
              type="button"
              onClick={() => setActiveTab('live')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'live'
                  ? "bg-indigo-600 text-white shadow-md"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Live Monitor
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('schedule')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'schedule'
                  ? "bg-indigo-600 text-white shadow-md"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Schedule ({liveState?.scheduleItems?.length || 0})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('actions')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'actions'
                  ? "bg-indigo-600 text-white shadow-md"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Quick Actions
            </button>
          </div>

          {/* TAB 1: LIVE MONITOR & PREVIEW */}
          {activeTab === 'live' && (
            <div className="space-y-4 flex-1 flex flex-col">
              {/* Synchronized Real-Time Live Projector Preview Card */}
              <div 
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                className="relative aspect-video w-full rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl overflow-hidden flex flex-col justify-center items-center p-5 text-center transition-all cursor-grab"
              >
                {/* Background Layer Representation */}
                <div 
                  className="absolute inset-0 z-0 bg-cover bg-center"
                  style={{
                    background: liveState?.globalBgConfig?.mode === 'gradient'
                      ? `linear-gradient(135deg, ${liveState.globalBgConfig.gradient?.color1 || '#0f172a'}, ${liveState.globalBgConfig.gradient?.color2 || '#1e1b4b'})`
                      : '#0a0a0c'
                  }}
                >
                  <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px]"></div>
                </div>

                {/* Blackout / Text Mute Overlay */}
                {liveState?.isTextHidden && (
                  <div className="absolute inset-0 z-20 bg-black/90 flex flex-col items-center justify-center text-neutral-400 space-y-1">
                    <EyeOff size={28} className="text-amber-400 animate-pulse" />
                    <span className="text-[11px] font-black tracking-wider uppercase text-amber-300">
                      TEXT MUTED (BLACKOUT)
                    </span>
                  </div>
                )}

                {/* Slide Text Content */}
                <div className="relative z-10 max-h-full overflow-hidden flex flex-col justify-center items-center">
                  <p 
                    className="text-white font-bold leading-relaxed whitespace-pre-wrap select-none text-base drop-shadow-lg"
                    style={{
                      fontFamily: getFontFamilyCss(liveState?.displayConfig?.fontFamily),
                      textShadow: getTextShadowCss(liveState?.displayConfig?.textShadow || 'strong')
                    }}
                  >
                    {liveState?.activeSlideText || "No active slide text"}
                  </p>
                  {liveState?.activeSlideCitation && (
                    <span className="text-xs font-semibold text-indigo-300 mt-2">
                      {liveState.activeSlideCitation}
                    </span>
                  )}
                </div>

                {/* Live Countdown Overlay Badge */}
                {liveState?.isCountdownRunning && (
                  <div className="absolute top-2.5 right-2.5 z-20 px-2.5 py-1 rounded-lg bg-black/80 border border-amber-500/50 text-amber-400 font-mono font-black text-xs">
                    ⏱️ {formatTimer(liveState.countdownLeft)}
                  </div>
                )}

                {/* Swipe Helper Pill */}
                <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[9px] text-neutral-500 font-medium z-10 pointer-events-none">
                  Swipe left/right to change slides
                </span>
              </div>

              {/* Current & Upcoming Slide Details */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-neutral-900/90 border border-neutral-800 space-y-1">
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-wider">
                    CURRENT
                  </span>
                  <div className="font-black text-xs text-white truncate">
                    {liveState?.activeItemTitle || "None"}
                  </div>
                  <div className="text-[11px] text-neutral-400 font-medium">
                    {liveState?.activeSlideSection} • ({liveState?.activeSlideIndex !== undefined ? liveState.activeSlideIndex + 1 : 1}/{liveState?.totalSlidesInItem || 1})
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-neutral-900/90 border border-neutral-800 space-y-1">
                  <span className="text-[10px] font-black text-neutral-400 uppercase tracking-wider">
                    NEXT UP
                  </span>
                  <div className="font-black text-xs text-neutral-300 truncate">
                    {liveState?.nextItemTitle || "End of Service"}
                  </div>
                  <div className="text-[11px] text-neutral-500 font-medium truncate">
                    {liveState?.nextSlideText || "No more slides"}
                  </div>
                </div>
              </div>

              {/* In-Preview Mode Alert (When operator is previewing ahead) */}
              {isInPreviewMode && (
                <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/50 flex items-center justify-between gap-3">
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-amber-300">
                      PREVIEW MODE ACTIVE
                    </span>
                    <span className="text-[11px] text-amber-400/80">
                      Inspecting: {currentItemInView?.title} (Slide {previewSlideIndex + 1})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleGoLivePreview}
                    className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-black text-xs shadow-lg hover:bg-emerald-500 transition-colors shrink-0"
                  >
                    ● GO LIVE NOW
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SERVICE SCHEDULE NAVIGATOR */}
          {activeTab === 'schedule' && (
            <div className="space-y-3 flex-1 overflow-y-auto">
              <h3 className="text-xs font-black text-neutral-400 uppercase tracking-wider px-1">
                Order of Worship ({liveState?.scheduleItems?.length || 0} Items)
              </h3>
              
              <div className="space-y-2">
                {liveState?.scheduleItems?.map((item, idx) => {
                  const isItemLive = item.id === liveState.activeItemId;
                  const isItemInspected = item.id === previewItemId && isInPreviewMode;

                  return (
                    <div
                      key={item.id}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        isItemLive
                          ? "bg-indigo-950/50 border-indigo-500/60 shadow-lg shadow-indigo-950/50"
                          : isItemInspected
                            ? "bg-amber-950/30 border-amber-500/50"
                            : "bg-neutral-900/80 border-neutral-800"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                            isItemLive ? "bg-indigo-500 text-white" : "bg-neutral-800 text-neutral-400"
                          }`}>
                            #{idx + 1}
                          </span>
                          <span className="font-black text-xs text-white truncate max-w-[180px]">
                            {item.title}
                          </span>
                        </div>

                        {/* Direct Go Live vs Preview button */}
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setPreviewItemId(item.id);
                              setPreviewSlideIndex(0);
                              setIsInPreviewMode(true);
                              setActiveTab('live');
                              showToast(`Previewing: ${item.title}`);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold text-[10px] transition-colors"
                          >
                            Preview
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (!currentPermissions.canControlSlides) {
                                setPreviewItemId(item.id);
                                setPreviewSlideIndex(0);
                                setIsInPreviewMode(true);
                                setActiveTab('live');
                                showToast(`Previewing: ${item.title} (View-Only Mode)`);
                                return;
                              }
                              sendCommand('PRESENTATION_GO_LIVE', {
                                itemId: item.id,
                                slideIndex: 0
                              });
                              setIsInPreviewMode(false);
                            }}
                            className={`px-2.5 py-1 rounded-lg font-black text-[10px] transition-colors ${
                              isItemLive 
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" 
                                : !currentPermissions.canControlSlides
                                  ? "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
                                  : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
                            }`}
                          >
                            {isItemLive ? "● LIVE" : !currentPermissions.canControlSlides ? "Preview" : "Go Live"}
                          </button>
                        </div>
                      </div>

                      {/* Slides Pills inside Item */}
                      {item.slides && item.slides.length > 0 && (
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 scrollbar-none">
                          {item.slides.map((s, sIdx) => {
                            const isSlideLive = isItemLive && liveState.activeSlideIndex === sIdx;
                            const isSlideInspected = isItemInspected && previewSlideIndex === sIdx;

                            return (
                              <button
                                key={sIdx}
                                type="button"
                                onClick={() => {
                                  if (!currentPermissions.canControlSlides) {
                                    setPreviewItemId(item.id);
                                    setPreviewSlideIndex(sIdx);
                                    setIsInPreviewMode(true);
                                    setActiveTab('live');
                                    showToast(`Previewing slide ${sIdx + 1}`);
                                    return;
                                  }
                                  sendCommand('PRESENTATION_GO_LIVE', {
                                    itemId: item.id,
                                    slideIndex: sIdx
                                  });
                                  setIsInPreviewMode(false);
                                }}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold shrink-0 transition-colors ${
                                  isSlideLive
                                    ? "bg-emerald-500 text-black font-black ring-2 ring-emerald-400"
                                    : isSlideInspected
                                      ? "bg-amber-500 text-black"
                                      : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                                }`}
                              >
                                {s.section || `Slide ${sIdx + 1}`}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: QUICK ACTIONS & CONTROLS */}
          {activeTab === 'actions' && (
            <div className="space-y-4 flex-1">
              {/* Emergency Blackout / Text Off */}
              <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3">
                <span className="text-xs font-black text-neutral-400 uppercase tracking-wider">
                  Emergency Visibility Controls
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={handleToggleHideText}
                    disabled={!currentPermissions.canBlackout}
                    className={`p-3.5 rounded-xl font-black text-xs flex flex-col items-center justify-center gap-1.5 transition-all shadow-md ${
                      !currentPermissions.canBlackout
                        ? "bg-neutral-900/60 text-neutral-500 border border-neutral-800 cursor-not-allowed opacity-50"
                        : liveState?.isTextHidden
                          ? "bg-amber-500 text-black ring-2 ring-amber-400"
                          : "bg-neutral-800 text-white hover:bg-neutral-700 border border-neutral-700"
                    }`}
                  >
                    <EyeOff size={20} />
                    <span>{liveState?.isTextHidden ? "SHOW TEXT" : "HIDE TEXT (BLACKOUT)"}</span>
                    {!currentPermissions.canBlackout && <span className="text-[9px] font-normal text-neutral-500">Requires Operator Role</span>}
                  </button>

                  <button
                    type="button"
                    onClick={handleToggleTicker}
                    disabled={!currentPermissions.canControlTicker}
                    className={`p-3.5 rounded-xl font-black text-xs flex flex-col items-center justify-center gap-1.5 transition-all shadow-md ${
                      !currentPermissions.canControlTicker
                        ? "bg-neutral-900/60 text-neutral-500 border border-neutral-800 cursor-not-allowed opacity-50"
                        : liveState?.tickerConfig?.enabled
                          ? "bg-indigo-600 text-white ring-2 ring-indigo-400"
                          : "bg-neutral-800 text-white hover:bg-neutral-700 border border-neutral-700"
                    }`}
                  >
                    <Megaphone size={20} />
                    <span>{liveState?.tickerConfig?.enabled ? "HIDE TICKER" : "SHOW TICKER"}</span>
                    {!currentPermissions.canControlTicker && <span className="text-[9px] font-normal text-neutral-500">Requires Operator Role</span>}
                  </button>
                </div>
              </div>

              {/* Stage Countdown Timer Controls */}
              <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-neutral-400 uppercase tracking-wider">
                    Stage Countdown Timer
                  </span>
                  <span className="font-mono text-base font-black text-amber-400">
                    {formatTimer(liveState?.countdownLeft || 0)}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => handleAdjustTimer(-60)}
                    disabled={!currentPermissions.canControlTimer}
                    className={`py-2.5 rounded-xl font-black text-xs transition-colors ${
                      !currentPermissions.canControlTimer
                        ? "bg-neutral-900 text-neutral-600 cursor-not-allowed opacity-50"
                        : "bg-neutral-800 hover:bg-neutral-700 text-white"
                    }`}
                  >
                    -1m
                  </button>
                  <button
                    type="button"
                    onClick={handleToggleTimer}
                    disabled={!currentPermissions.canControlTimer}
                    className={`py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-1 transition-colors ${
                      !currentPermissions.canControlTimer
                        ? "bg-neutral-900 text-neutral-600 cursor-not-allowed opacity-50"
                        : liveState?.isCountdownRunning
                          ? "bg-amber-500 text-black"
                          : "bg-emerald-600 text-white"
                    }`}
                  >
                    {liveState?.isCountdownRunning ? <Pause size={14} /> : <Play size={14} />}
                    {liveState?.isCountdownRunning ? "Pause" : "Start"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdjustTimer(60)}
                    disabled={!currentPermissions.canControlTimer}
                    className={`py-2.5 rounded-xl font-black text-xs transition-colors ${
                      !currentPermissions.canControlTimer
                        ? "bg-neutral-900 text-neutral-600 cursor-not-allowed opacity-50"
                        : "bg-neutral-800 hover:bg-neutral-700 text-white"
                    }`}
                  >
                    +1m
                  </button>
                  <button
                    type="button"
                    onClick={handleResetTimer}
                    disabled={!currentPermissions.canControlTimer}
                    className={`py-2.5 rounded-xl font-bold text-xs flex items-center justify-center transition-colors ${
                      !currentPermissions.canControlTimer
                        ? "bg-neutral-900 text-neutral-600 cursor-not-allowed opacity-50"
                        : "bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
                    }`}
                  >
                    <RotateCcw size={14} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      )}

      {/* Primary Sticky Large Touch Navigation Controls (Fixed Bottom) */}
      {isConnectedAndPaired && (
        <div className="fixed bottom-0 left-0 right-0 z-40 p-3 bg-neutral-950/95 backdrop-blur-xl border-t border-neutral-800/80 shadow-2xl">
          <div className="max-w-lg mx-auto grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={handlePrev}
              disabled={!currentPermissions.canControlSlides}
              className={`py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-1.5 border shadow-lg transition-transform ${
                currentPermissions.canControlSlides
                  ? "bg-neutral-900 hover:bg-neutral-800 active:scale-95 text-white border-neutral-700"
                  : "bg-neutral-900/50 text-neutral-500 border-neutral-800 cursor-not-allowed opacity-50"
              }`}
            >
              <ChevronLeft size={20} />
              <span>PREV</span>
            </button>

            <button
              type="button"
              disabled={!currentPermissions.canControlSlides}
              onClick={() => {
                if (!currentPermissions.canControlSlides) {
                  showToast("👁️ View-Only Mode");
                  return;
                }
                if (isInPreviewMode) {
                  handleGoLivePreview();
                } else {
                  showToast("Slide is live!");
                }
              }}
              className={`py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-1.5 shadow-xl transition-all ${
                !currentPermissions.canControlSlides
                  ? "bg-neutral-800 text-neutral-400 border border-neutral-700 cursor-not-allowed opacity-50"
                  : isInPreviewMode
                    ? "bg-amber-500 text-black ring-4 ring-amber-500/30 animate-pulse active:scale-95"
                    : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/50 active:scale-95"
              }`}
            >
              {currentPermissions.canControlSlides && <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping mr-0.5"></span>}
              <span>{!currentPermissions.canControlSlides ? "VIEW ONLY" : isInPreviewMode ? "GO LIVE" : "LIVE"}</span>
            </button>

            <button
              type="button"
              onClick={handleNext}
              disabled={!currentPermissions.canControlSlides}
              className={`py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-1.5 shadow-lg border transition-transform ${
                currentPermissions.canControlSlides
                  ? "bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white shadow-indigo-950/50 border-indigo-400/40"
                  : "bg-neutral-900/50 text-neutral-500 border-neutral-800 cursor-not-allowed opacity-50"
              }`}
            >
              <span>NEXT</span>
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RemotePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center">
        <Radio size={32} className="text-indigo-400 animate-pulse" />
      </div>
    }>
      <RemoteOperatorApp />
    </Suspense>
  );
}
