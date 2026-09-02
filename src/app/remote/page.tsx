"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Smartphone, Radio, Wifi, Lock, Unlock, Play, Pause, RotateCcw, 
  EyeOff, Eye, ChevronLeft, ChevronRight, Sparkles, AlertCircle, 
  CheckCircle2, Layers, Clock, Megaphone, Send, ShieldAlert, Monitor, Zap
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
  const currentPermissions = ROLE_PERMISSIONS[operatorRole] || ROLE_PERMISSIONS.viewer;
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
  const [isWakeLocked, setIsWakeLocked] = useState(false);
  const [pingMs, setPingMs] = useState<number | null>(null);

  const clientRef = useRef<RemoteOperatorClient | null>(null);
  const toastTimeoutRef = useRef<any>(null);
  const lastCommandTimeRef = useRef<number>(0);
  const wakeLockSentinelRef = useRef<any>(null);

  const hasUserInteractedRef = useRef<boolean>(false);

  useEffect(() => {
    const handleInteraction = () => {
      hasUserInteractedRef.current = true;
    };
    window.addEventListener('pointerdown', handleInteraction, { once: true, passive: true });
    window.addEventListener('touchstart', handleInteraction, { once: true, passive: true });
    return () => {
      window.removeEventListener('pointerdown', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };
  }, []);

  // Industrial Haptic Feedback Trigger
  const triggerHaptic = (type: 'tap' | 'heavy' | 'double' | 'error' = 'tap') => {
    if (typeof navigator === 'undefined' || !navigator.vibrate || !hasUserInteractedRef.current) return;
    try {
      if (type === 'tap') navigator.vibrate(18);
      else if (type === 'heavy') navigator.vibrate(35);
      else if (type === 'double') navigator.vibrate([20, 40, 20]);
      else if (type === 'error') navigator.vibrate([40, 60, 40]);
    } catch {}
  };

  // Industrial Screen Wake Lock (Keeps phone screen ON during worship services)
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) return;

    const requestWakeLock = async () => {
      try {
        if (document.visibilityState === 'visible') {
          const sentinel = await (navigator as any).wakeLock.request('screen');
          wakeLockSentinelRef.current = sentinel;
          setIsWakeLocked(true);
          sentinel.addEventListener('release', () => {
            setIsWakeLocked(false);
          });
        }
      } catch {
        setIsWakeLocked(false);
      }
    };

    requestWakeLock();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLockSentinelRef.current) {
        try { wakeLockSentinelRef.current.release(); } catch {}
        wakeLockSentinelRef.current = null;
      }
    };
  }, []);

  const showToast = (msg: string, isError = false) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setFeedbackToast(msg);
    if (isError) {
      setErrorDetail(msg);
      triggerHaptic('error');
    }
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

  // Fast HTTP fallback auto-pair (if WebRTC does not connect within 800ms)
  useEffect(() => {
    if (!isClientReady || !operatorId || isWebRtcLive) return;

    const timer = setTimeout(() => {
      if (!isWebRtcLive) {
        pairViaHttp(initialToken, initialRoom);
      }
    }, 800);

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
        const startTime = performance.now();
        const res = await fetch(`/api/remote-sync?room=${encodeURIComponent(roomCode)}`);
        if (res.ok) {
          const latency = Math.round(performance.now() - startTime);
          if (!isWebRtcLive) {
            setPingMs(latency);
          }
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
        onPing: (latencyMs: number) => {
          setPingMs(prev => {
            if (prev === null) return latencyMs;
            // Smooth moving average filter to avoid erratic momentary packet spikes
            if (latencyMs > 400 && prev < 60) {
              return prev; // Ignore momentary buffer spike while state packet is in flight
            }
            return Math.round(prev * 0.65 + latencyMs * 0.35);
          });
        },
        onPairingStatus: (resp: PairingResponseMessage) => {
          setIsWebRtcLive(true);
          if (resp.status === "approved") {
            setOperatorRole(resp.role);
            setHasControlLock(resp.hasControlLock);
            setConnectionStatus("paired");
            triggerHaptic('double');
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
            triggerHaptic('double');
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
    // Rapid-tap safety guard: avoid accidental double-skipping
    const now = Date.now();
    if (now - lastCommandTimeRef.current < 90) return;
    lastCommandTimeRef.current = now;

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
    triggerHaptic('tap');

    // Smart Deterministic Schedule Item Navigation
    if (liveState && liveState.scheduleItems && liveState.scheduleItems.length > 0) {
      const items = liveState.scheduleItems;
      const curItemIdx = items.findIndex(i => i.id === liveState.activeItemId);
      const curItem = curItemIdx >= 0 ? items[curItemIdx] : items[0];
      const curSlideIdx = liveState.activeSlideIndex ?? 0;
      const totalSlides = curItem?.slides?.length || curItem?.slideCount || 1;

      if (curSlideIdx < totalSlides - 1) {
        // Next slide in current item (Instant 0ms Optimistic UI)
        const nextSlide = curSlideIdx + 1;
        const targetSlide = curItem.slides?.[nextSlide];
        const targetText = targetSlide?.text || targetSlide?.lines?.join('\n') || '';
        setLiveState(prev => prev ? {
          ...prev,
          activeSlideIndex: nextSlide,
          activeSlideText: targetText || prev.activeSlideText,
          activeSlideSection: targetSlide?.section || `Slide ${nextSlide + 1}`
        } : prev);
        sendCommand('PRESENTATION_GO_LIVE', {
          itemId: curItem.id,
          slideIndex: nextSlide
        });
        return;
      } else if (curItemIdx < items.length - 1) {
        // Advance to next song/item in schedule
        const nextItem = items[curItemIdx + 1];
        const firstSlide = nextItem.slides?.[0];
        const firstText = firstSlide?.text || firstSlide?.lines?.join('\n') || '';
        setLiveState(prev => prev ? {
          ...prev,
          activeItemId: nextItem.id,
          activeSlideIndex: 0,
          activeItemTitle: nextItem.title,
          activeSlideText: firstText || prev.activeSlideText,
          activeSlideSection: firstSlide?.section || 'Slide 1'
        } : prev);
        sendCommand('PRESENTATION_GO_LIVE', {
          itemId: nextItem.id,
          slideIndex: 0
        });
        showToast(`Jumped to: ${nextItem.title}`);
        return;
      }
    }

    sendCommand('PRESENTATION_NEXT');
  };

  const handlePrev = () => {
    if (!currentPermissions.canControlSlides) {
      showToast("👁️ View-Only Mode: Cannot change slides");
      return;
    }
    triggerHaptic('tap');

    // Smart Deterministic Schedule Item Navigation (Backwards with Instant Optimistic UI)
    if (liveState && liveState.scheduleItems && liveState.scheduleItems.length > 0) {
      const items = liveState.scheduleItems;
      const curItemIdx = items.findIndex(i => i.id === liveState.activeItemId);
      const curItem = curItemIdx >= 0 ? items[curItemIdx] : items[0];
      const curSlideIdx = liveState.activeSlideIndex ?? 0;

      if (curSlideIdx > 0) {
        // Previous slide in current item
        const prevSlide = curSlideIdx - 1;
        const targetSlide = curItem.slides?.[prevSlide];
        const targetText = targetSlide?.text || targetSlide?.lines?.join('\n') || '';
        setLiveState(prev => prev ? {
          ...prev,
          activeSlideIndex: prevSlide,
          activeSlideText: targetText || prev.activeSlideText,
          activeSlideSection: targetSlide?.section || `Slide ${prevSlide + 1}`
        } : prev);
        sendCommand('PRESENTATION_GO_LIVE', {
          itemId: curItem.id,
          slideIndex: prevSlide
        });
        return;
      } else if (curItemIdx > 0) {
        // Back to previous song/item in schedule
        const prevItem = items[curItemIdx - 1];
        const prevSlidesCount = prevItem?.slides?.length || prevItem?.slideCount || 1;
        const targetSlideIdx = Math.max(0, prevSlidesCount - 1);
        const targetSlide = prevItem?.slides?.[targetSlideIdx];
        const targetText = targetSlide?.text || targetSlide?.lines?.join('\n') || '';
        setLiveState(prev => prev ? {
          ...prev,
          activeItemId: prevItem.id,
          activeSlideIndex: targetSlideIdx,
          activeItemTitle: prevItem.title,
          activeSlideText: targetText || prev.activeSlideText,
          activeSlideSection: targetSlide?.section || `Slide ${targetSlideIdx + 1}`
        } : prev);
        sendCommand('PRESENTATION_GO_LIVE', {
          itemId: prevItem.id,
          slideIndex: targetSlideIdx
        });
        showToast(`Jumped to: ${prevItem.title}`);
        return;
      }
    }

    sendCommand('PRESENTATION_PREVIOUS');
  };

  const handleGoLivePreview = () => {
    if (!currentPermissions.canControlSlides) {
      showToast("👁️ View-Only Mode: Cannot push slides live");
      return;
    }
    if (!previewItemId) return;
    triggerHaptic('heavy');
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
    triggerHaptic('double');
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
    triggerHaptic('tap');
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
    triggerHaptic('tap');
    sendCommand('COUNTDOWN_ADJUST', { delta });
  };

  const handleResetTimer = () => {
    if (!currentPermissions.canControlTimer) {
      showToast("🚫 Permission Denied: Cannot reset timer");
      return;
    }
    triggerHaptic('tap');
    sendCommand('COUNTDOWN_RESET', { seconds: 300 });
  };

  // Hardware Bluetooth Clicker & Keyboard Listener (Space, Arrow keys, PageUp/Down)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp' || e.key === 'Backspace') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'b' || e.key === 'B' || e.key === '.') {
        e.preventDefault();
        handleToggleHideText();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPermissions, liveState, isWebRtcLive, isInPreviewMode, previewItemId, previewSlideIndex]);

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

  const handleRequestOperatorRole = async () => {
    triggerHaptic('heavy');
    showToast("🙋 Requesting Operator Control...");
    try {
      if (clientRef.current?.isConnected) {
        await clientRef.current.sendCommand('REQUEST_ROLE_UPGRADE', { role: 'operator' });
      } else {
        await sendCommand('REQUEST_ROLE_UPGRADE', { role: 'operator' });
      }
      showToast("⏳ Permission request sent to Desktop Host!");
    } catch {
      showToast("❌ Could not send permission request");
    }
  };

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
    <div className="h-dvh max-h-dvh h-screen max-h-screen bg-neutral-950 text-neutral-100 font-sans flex flex-col select-none overflow-hidden">
      {/* Top Mobile Operator Header */}
      <header className="shrink-0 z-40 bg-neutral-900/95 backdrop-blur-md border-b border-neutral-800 px-4 py-2.5 flex items-center justify-between shadow-lg">
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

        {/* Connection, WakeLock, Ping & Role Badge */}
        <div className="flex items-center gap-1.5">
          {isWakeLocked && (
            <span
              title="Screen Wake Lock Active (Screen will stay awake during worship)"
              className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center"
            >
              <Zap size={12} className="fill-amber-400 text-amber-400" />
            </span>
          )}

          {isConnectedAndPaired ? (
            <div className="flex items-center gap-1.5">
              {(() => {
                const val = pingMs !== null ? pingMs : (isWebRtcLive ? 5 : 20);
                const displayLabel = pingMs !== null ? `${pingMs}ms` : (isWebRtcLive ? '<5ms' : 'LAN');
                
                let pillStyle = "bg-emerald-950/90 text-emerald-300 border-emerald-500/50";
                let dotStyle = "bg-emerald-400 animate-pulse";

                if (val <= 50) {
                  // 🟢 < 50ms: Emerald Green (Ultra Low Latency)
                  pillStyle = "bg-emerald-950/90 text-emerald-300 border-emerald-500/50 shadow-[0_0_8px_rgba(16,185,129,0.2)]";
                  dotStyle = "bg-emerald-400 animate-pulse";
                } else if (val <= 120) {
                  // 🔵 51-120ms: Cyan / Sky (Good)
                  pillStyle = "bg-sky-950/90 text-sky-300 border-sky-500/50 shadow-[0_0_8px_rgba(14,165,233,0.2)]";
                  dotStyle = "bg-sky-400 animate-pulse";
                } else if (val <= 250) {
                  // 🟡 121-250ms: Amber / Yellow (Moderate)
                  pillStyle = "bg-amber-950/90 text-amber-300 border-amber-500/50 shadow-[0_0_8px_rgba(245,158,11,0.2)]";
                  dotStyle = "bg-amber-400 animate-pulse";
                } else {
                  // 🔴 > 250ms: Rose / Red (High Latency)
                  pillStyle = "bg-rose-950/90 text-rose-300 border-rose-500/60 shadow-[0_0_10px_rgba(244,63,94,0.3)] animate-pulse";
                  dotStyle = "bg-rose-400 animate-ping";
                }

                return (
                  <span className={`px-2 py-0.5 rounded-full border text-[9px] font-mono font-black flex items-center gap-1.5 transition-all duration-300 ${pillStyle}`}>
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotStyle}`}></span>
                    <span>{displayLabel} {isWebRtcLive ? 'P2P' : 'LAN'}</span>
                  </span>
                );
              })()}
              <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${roleBadge.color}`}>
                {roleBadge.label}
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

      {/* Viewer Read-Only Notice Banner with Interactive Request Control Button */}
      {isConnectedAndPaired && !currentPermissions.canControlSlides && (
        <div className="shrink-0 px-3.5 py-2 bg-amber-950/80 border-b border-amber-600/40 text-amber-200 text-xs font-semibold flex items-center justify-between gap-2 shadow-lg backdrop-blur-md">
          <div className="flex items-center gap-1.5 min-w-0">
            <AlertCircle size={14} className="text-amber-400 shrink-0" />
            <span className="truncate">View-Only Stage Monitor</span>
          </div>
          <button
            type="button"
            onClick={handleRequestOperatorRole}
            className="shrink-0 px-3 py-1 bg-amber-400 hover:bg-amber-300 active:scale-95 text-neutral-950 font-black text-[11px] rounded-lg transition-all shadow-md flex items-center gap-1.5"
          >
            <ShieldAlert size={12} className="text-neutral-950" />
            <span>Request Control</span>
          </button>
        </div>
      )}

      {/* Control Lock Status Banner */}
      {isConnectedAndPaired && (
        <div className={`shrink-0 px-4 py-1.5 text-xs flex items-center justify-between border-b ${
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
              className="px-2.5 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 text-[11px] font-bold transition-all"
            >
              Release Lock
            </button>
          ) : (
            <button
              type="button"
              onClick={handleRequestControl}
              className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 font-bold text-[11px] shadow-sm transition-all active:scale-95 flex items-center gap-1"
              title="Acquire exclusive control lock so other devices cannot interfere"
            >
              <Lock size={11} className="text-indigo-400" />
              <span>Lock Control</span>
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
            className={`fixed top-14 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl text-xs font-bold shadow-2xl backdrop-blur-md border flex items-center gap-2 ${
              feedbackToast.includes('❌') || feedbackToast.includes('🚫')
                ? "bg-rose-950/95 text-rose-200 border-rose-500 shadow-rose-950/50" 
                : "bg-neutral-900/95 text-white border-neutral-700 shadow-black/80"
            }`}
          >
            <span>{feedbackToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CONNECTING / UNPAIRED SCREEN */}
      {!isConnectedAndPaired && (
        <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center text-center space-y-5">
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
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          
          {/* ================================================================= */}
          {/* 1. STICKY TOP PINNED SECTION (Controls + Live Stage Monitor)      */}
          {/* ================================================================= */}
          <div className="shrink-0 px-3.5 pt-2 pb-2 bg-neutral-950/95 backdrop-blur-xl border-b border-neutral-800/80 shadow-2xl z-20 space-y-2 max-w-lg mx-auto w-full">
            
            {/* Quick Stage Controls Strip (Blackout, Timer, Ticker) */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={handleToggleHideText}
                disabled={!currentPermissions.canBlackout}
                className={`py-1.5 px-2 rounded-xl font-black text-[11px] flex items-center justify-center gap-1 transition-all shadow-sm ${
                  !currentPermissions.canBlackout
                    ? "bg-neutral-900/60 text-neutral-500 border border-neutral-800 cursor-not-allowed opacity-50"
                    : liveState?.isTextHidden
                      ? "bg-amber-500 text-black ring-2 ring-amber-400 font-black animate-pulse"
                      : "bg-neutral-900 text-white hover:bg-neutral-800 border border-neutral-800"
                }`}
              >
                <EyeOff size={12} className={liveState?.isTextHidden ? "text-black" : "text-amber-400"} />
                <span>{liveState?.isTextHidden ? "UNMUTE" : "MUTE"}</span>
              </button>

              <button
                type="button"
                onClick={handleToggleTimer}
                disabled={!currentPermissions.canControlTimer}
                className={`py-1.5 px-2 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1 transition-all shadow-sm ${
                  !currentPermissions.canControlTimer
                    ? "bg-neutral-900/60 text-neutral-500 border border-neutral-800 cursor-not-allowed opacity-50"
                    : liveState?.isCountdownRunning
                      ? "bg-amber-500 text-black ring-2 ring-amber-400"
                      : "bg-neutral-900 text-neutral-300 hover:bg-neutral-800 border border-neutral-800"
                }`}
              >
                <Clock size={12} className={liveState?.isCountdownRunning ? "text-black" : "text-amber-400"} />
                <span className="font-mono">{formatTimer(liveState?.countdownLeft || 0)}</span>
              </button>

              <button
                type="button"
                onClick={handleToggleTicker}
                disabled={!currentPermissions.canControlTicker}
                className={`py-1.5 px-2 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1 transition-all shadow-sm ${
                  !currentPermissions.canControlTicker
                    ? "bg-neutral-900/60 text-neutral-500 border border-neutral-800 cursor-not-allowed opacity-50"
                    : liveState?.tickerConfig?.enabled
                      ? "bg-indigo-600 text-white ring-2 ring-indigo-400"
                      : "bg-neutral-900 text-neutral-300 hover:bg-neutral-800 border border-neutral-800"
                }`}
              >
                <Megaphone size={12} className={liveState?.tickerConfig?.enabled ? "text-white" : "text-indigo-400"} />
                <span>{liveState?.tickerConfig?.enabled ? "TICKER" : "TICKER"}</span>
              </button>
            </div>

            {/* Synchronized Real-Time Live Projector Preview Card (Compact & Pinned) */}
            <div 
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              className="relative aspect-[16/8] sm:aspect-video w-full rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl overflow-hidden flex flex-col justify-center items-center px-4 py-2.5 text-center transition-all cursor-grab select-none"
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
                <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px]"></div>
              </div>

              {/* Blackout / Text Mute Overlay */}
              {liveState?.isTextHidden && (
                <div className="absolute inset-0 z-20 bg-black/90 flex flex-col items-center justify-center text-neutral-400 space-y-1">
                  <EyeOff size={24} className="text-amber-400 animate-pulse" />
                  <span className="text-[10px] font-black tracking-wider uppercase text-amber-300">
                    TEXT MUTED (BLACKOUT ACTIVE)
                  </span>
                </div>
              )}

              {/* Slide Text Content */}
              <div className="relative z-10 max-h-full overflow-hidden flex flex-col justify-center items-center">
                <p 
                  className="text-white font-black leading-snug whitespace-pre-wrap select-none text-xs sm:text-sm drop-shadow-md line-clamp-4"
                  style={{
                    fontFamily: getFontFamilyCss(liveState?.displayConfig?.fontFamily),
                    textShadow: getTextShadowCss(liveState?.displayConfig?.textShadow || 'strong')
                  }}
                >
                  {liveState?.activeSlideText || "No active slide text"}
                </p>
                {liveState?.activeSlideCitation && (
                  <span className="text-[11px] font-semibold text-indigo-300 mt-1 truncate max-w-[280px]">
                    {liveState.activeSlideCitation}
                  </span>
                )}
              </div>

              {/* Live Countdown Overlay Badge */}
              {liveState?.isCountdownRunning && (
                <div className="absolute top-2 right-2 z-20 px-2 py-0.5 rounded-lg bg-black/80 border border-amber-500/50 text-amber-400 font-mono font-black text-[10px]">
                  ⏱️ {formatTimer(liveState.countdownLeft)}
                </div>
              )}
            </div>

            {/* Current & Upcoming Slide Details Strip (Ultra-Compact) */}
            <div className="grid grid-cols-2 gap-2 text-left">
              <div className="p-2 rounded-xl bg-neutral-900/90 border border-neutral-800 flex items-center justify-between gap-1.5 overflow-hidden">
                <div className="min-w-0">
                  <div className="text-[8px] font-black text-indigo-400 uppercase tracking-wider">
                    CURRENT LIVE
                  </div>
                  <div className="font-black text-xs text-white truncate">
                    {liveState?.activeItemTitle || "None"}
                  </div>
                </div>
                <span className="px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 font-mono text-[9px] font-bold shrink-0 border border-indigo-800/40">
                  {liveState?.activeSlideIndex !== undefined ? liveState.activeSlideIndex + 1 : 1}/{liveState?.totalSlidesInItem || 1}
                </span>
              </div>

              <div className="p-2 rounded-xl bg-neutral-900/90 border border-neutral-800 flex items-center justify-between gap-1.5 overflow-hidden">
                <div className="min-w-0">
                  <div className="text-[8px] font-black text-neutral-400 uppercase tracking-wider">
                    UP NEXT
                  </div>
                  <div className="font-black text-xs text-neutral-300 truncate">
                    {liveState?.nextItemTitle || "End of Service"}
                  </div>
                </div>
                <span className="text-[9px] text-neutral-500 font-medium truncate max-w-[80px]">
                  {liveState?.nextSlideText ? "Ready" : "End"}
                </span>
              </div>
            </div>
          </div>

          {/* ================================================================= */}
          {/* 2. SCROLLABLE SERVICE PLAYLIST (Smooth scroll underneath)          */}
          {/* ================================================================= */}
          <main className="flex-1 overflow-y-auto px-3.5 pt-2 pb-36 space-y-2.5 max-w-lg mx-auto w-full overscroll-contain">
            <div className="flex items-center justify-between px-1 pt-1">
              <span className="text-[11px] font-black text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                <Layers size={13} className="text-indigo-400" /> Service Playlist ({liveState?.scheduleItems?.length || 0})
              </span>
              <span className="text-[10px] text-neutral-500 font-medium">
                Tap any slide to jump directly
              </span>
            </div>

            <div className="space-y-2 pb-6">
              {liveState?.scheduleItems && liveState.scheduleItems.length > 0 ? (
                liveState.scheduleItems.map((item, idx) => {
                  const isItemLive = item.id === liveState.activeItemId;

                  return (
                    <div
                      key={item.id}
                      className={`p-3 rounded-2xl border transition-all ${
                        isItemLive
                          ? "bg-indigo-950/40 border-indigo-500/60 shadow-lg shadow-indigo-950/40 ring-1 ring-indigo-500/30"
                          : "bg-neutral-900/80 border-neutral-800 hover:border-neutral-700"
                      }`}
                    >
                      {/* Item Header (Tap to Jump to Item Slide 1) */}
                      <div 
                        onClick={() => {
                          if (!currentPermissions.canControlSlides) {
                            showToast("👁️ View-Only Mode: Cannot change slides");
                            return;
                          }
                          triggerHaptic('heavy');
                          sendCommand('PRESENTATION_GO_LIVE', {
                            itemId: item.id,
                            slideIndex: 0
                          });
                          showToast(`Jumped to: ${item.title}`);
                        }}
                        className="flex items-center justify-between mb-2 cursor-pointer active:opacity-80"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md shrink-0 ${
                            isItemLive ? "bg-indigo-500 text-white" : "bg-neutral-800 text-neutral-400"
                          }`}>
                            #{idx + 1}
                          </span>
                          <span className="font-black text-xs text-white truncate max-w-[200px]">
                            {item.title}
                          </span>
                        </div>

                        {/* Status Tag */}
                        <div className="shrink-0">
                          {isItemLive ? (
                            <span className="px-2 py-0.5 rounded-full font-black text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                              ON AIR
                            </span>
                          ) : (
                            <span className="text-[10px] text-neutral-500 font-medium">
                              {item.slides?.length || item.slideCount || 1} slides
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Slides Pills inside Item - Direct 1-Tap Live Navigation */}
                      {item.slides && item.slides.length > 0 && (
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 scrollbar-none">
                          {item.slides.map((s, sIdx) => {
                            const isSlideLive = isItemLive && liveState.activeSlideIndex === sIdx;

                            return (
                              <button
                                key={sIdx}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!currentPermissions.canControlSlides) {
                                    showToast("👁️ View-Only Mode: Cannot change slides");
                                    return;
                                  }
                                  triggerHaptic('heavy');
                                  // ⚡ Optimistic UI Update: Instantly update active slide on mobile with 0ms perceived lag
                                  const targetSlideText = s.text || s.lines?.join('\n') || '';
                                  const targetCitation = (s as any).slideCitation || (item.type === 'scripture' ? item.title : '');
                                  setLiveState(prev => prev ? {
                                    ...prev,
                                    activeItemId: item.id,
                                    activeSlideIndex: sIdx,
                                    activeItemTitle: item.title,
                                    activeSlideText: targetSlideText || prev.activeSlideText,
                                    activeSlideCitation: targetCitation || prev.activeSlideCitation,
                                    activeSlideSection: s.section || `Slide ${sIdx + 1}`
                                  } : prev);

                                  sendCommand('PRESENTATION_GO_LIVE', {
                                    itemId: item.id,
                                    slideIndex: sIdx
                                  });
                                  showToast(`Projected: ${item.title} (${s.section || `Slide ${sIdx + 1}`})`);
                                }}
                                className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold shrink-0 transition-all active:scale-95 ${
                                  isSlideLive
                                    ? "bg-emerald-500 text-black font-black ring-2 ring-emerald-400 shadow-md"
                                    : "bg-neutral-800/90 text-neutral-300 hover:bg-neutral-700 active:bg-indigo-600 active:text-white border border-neutral-700/50"
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
                })
              ) : (
                <div className="p-6 rounded-2xl bg-neutral-900/50 border border-neutral-800 text-center space-y-1">
                  <p className="text-xs text-neutral-400 font-bold">No schedule items loaded yet</p>
                  <p className="text-[10px] text-neutral-500">Add songs or scriptures to the schedule on the desktop</p>
                </div>
              )}
            </div>
          </main>
        </div>
      )}

      {/* Primary Sticky Large Touch Navigation Controls (Fixed Bottom with Safe-Area insets) */}
      {isConnectedAndPaired && (
        <div className="fixed bottom-0 left-0 right-0 z-40 px-4 pt-3 pb-[max(env(safe-area-inset-bottom),14px)] bg-neutral-950/95 backdrop-blur-xl border-t border-neutral-800/80 shadow-2xl">
          <div className="max-w-lg mx-auto space-y-2">
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={handlePrev}
                disabled={!currentPermissions.canControlSlides}
                className={`py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-1.5 border shadow-lg transition-all touch-manipulation select-none ${
                  currentPermissions.canControlSlides
                    ? "bg-neutral-900 hover:bg-neutral-800 active:scale-[0.93] text-white border-neutral-700 active:bg-neutral-700"
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
                    triggerHaptic('tap');
                    showToast("Slide is live!");
                  }
                }}
                className={`py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-1.5 shadow-xl transition-all touch-manipulation select-none ${
                  !currentPermissions.canControlSlides
                    ? "bg-neutral-800 text-neutral-400 border border-neutral-700 cursor-not-allowed opacity-50"
                    : isInPreviewMode
                      ? "bg-amber-500 text-black ring-4 ring-amber-500/30 animate-pulse active:scale-[0.93]"
                      : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/50 active:scale-[0.93]"
                }`}
              >
                {currentPermissions.canControlSlides && <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping mr-0.5"></span>}
                <span>
                  {!currentPermissions.canControlSlides 
                    ? "VIEW ONLY" 
                    : isInPreviewMode 
                      ? "GO LIVE" 
                      : `LIVE (${(liveState?.activeSlideIndex ?? 0) + 1}/${liveState?.totalSlidesInItem || 1})`
                  }
                </span>
              </button>

              <button
                type="button"
                onClick={handleNext}
                disabled={!currentPermissions.canControlSlides}
                className={`py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-1.5 shadow-lg border transition-all touch-manipulation select-none ${
                  currentPermissions.canControlSlides
                    ? "bg-indigo-600 hover:bg-indigo-500 active:scale-[0.93] text-white shadow-indigo-950/50 border-indigo-400/40 active:bg-indigo-700"
                    : "bg-neutral-900/50 text-neutral-500 border-neutral-800 cursor-not-allowed opacity-50"
                }`}
              >
                <span>NEXT</span>
                <ChevronRight size={20} />
              </button>
            </div>
            <div className="hidden sm:flex items-center justify-center gap-2 text-[10px] text-neutral-500 font-medium">
              <span>⌨️ Bluetooth Clicker / Keyboard: Space / Arrows / B (Blackout)</span>
            </div>
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
