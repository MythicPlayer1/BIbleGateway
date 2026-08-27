"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getGlobalBackground, getScheduleMedia } from "@/lib/mediaStorage";
import { GlobalBackgroundLayer } from "@/components/GlobalBackgroundLayer";
import { QrCode, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import type {
  SlideLayout, TextAlign, AccentColor, CustomSlideTheme,
  TickerConfig, TickerTheme, TickerPosition, TickerSpeed, TickerFontSize,
  GlobalBackgroundConfig, TextAnimationConfig
} from "@/lib/lyrics";
import {
  DEFAULT_TICKER_CONFIG, BROADCAST_CHANNEL_NAME,
  DEFAULT_TEXT_ANIMATION_CONFIG, getTextAnimationVariants, getTextAnimationDuration
} from "@/lib/lyrics";

// Responsive pure-CSS viewport typography scaling
function getResponsiveFontSize(text: string) {
  if (!text) return '5.5vw';
  const lines = text.trim().split('\n').filter(Boolean);
  const lineCount = lines.length;
  const longestLine = Math.max(...lines.map(l => l.length), 0);

  if (lineCount <= 1 && longestLine < 35) {
    return 'clamp(48px, 6.8vw, 130px)';
  } else if (lineCount <= 2 && longestLine < 50) {
    return 'clamp(40px, 5.6vw, 110px)';
  } else if (lineCount <= 3 && longestLine < 65) {
    return 'clamp(34px, 4.6vw, 92px)';
  } else if (lineCount <= 4) {
    return 'clamp(28px, 3.8vw, 78px)';
  } else if (lineCount <= 6) {
    return 'clamp(24px, 3.2vw, 64px)';
  } else {
    return 'clamp(20px, 2.7vw, 52px)';
  }
}

export default function Projector() {
  const [verse, setVerse] = useState<{
    text: string;
    reference: string;
    title?: string;
    subtitle?: string;
    layout?: SlideLayout;
    textAlign?: TextAlign;
    accentColor?: AccentColor;
    qrCodeUrl?: string;
    bankDetails?: string;
    qrBadgeLabel?: string;
    qrInstruction?: string;
    countdownSeconds?: number;
    countdownLabel?: string;
    countdownRunning?: boolean;
    webEmbedUrl?: string;
    embedType?: string;
  }>({
    text: "",
    reference: "",
    layout: "standard",
    textAlign: "center",
    accentColor: "indigo"
  });

  const [bgUrl, setBgUrl] = useState<string | null>(null);
  const [bgType, setBgType] = useState<'video' | 'image' | null>(null);
  const [bgConfig, setBgConfig] = useState<GlobalBackgroundConfig | null>(null);
  const [textAnim, setTextAnim] = useState<TextAnimationConfig>(DEFAULT_TEXT_ANIMATION_CONFIG);
  const [mediaSlide, setMediaSlide] = useState<{ url: string; fileType: 'video' | 'image'; title: string } | null>(null);
  const [isTextHidden, setIsTextHidden] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Live Scrolling Ticker State
  const [ticker, setTicker] = useState<TickerConfig>(DEFAULT_TICKER_CONFIG);

  // Countdown Timer Engine
  const [countdownLeft, setCountdownLeft] = useState<number>(300);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState<boolean>(true);
  const [isVideoMuted, setIsVideoMuted] = useState<boolean>(false);

  // Image Zoom & Pan State for Projector launched screen
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showZoomControls, setShowZoomControls] = useState<boolean>(false);
  const zoomControlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const bgUrlRef = useRef<string | null>(null);
  const mediaSlideUrlRef = useRef<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaSlideVideoRef = useRef<HTMLVideoElement | null>(null);

  // Reset zoom & pan when mediaSlide changes
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setIsDragging(false);
  }, [mediaSlide?.url]);

  const triggerZoomControls = () => {
    setShowZoomControls(true);
    if (zoomControlsTimeoutRef.current) clearTimeout(zoomControlsTimeoutRef.current);
    zoomControlsTimeoutRef.current = setTimeout(() => {
      setShowZoomControls(false);
    }, 2800);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(5, Number((prev + 0.25).toFixed(2))));
    triggerZoomControls();
  };

  const handleZoomOut = () => {
    setZoom(prev => {
      const next = Math.max(1, Number((prev - 0.25).toFixed(2)));
      if (next <= 1) setPan({ x: 0, y: 0 });
      return next;
    });
    triggerZoomControls();
  };

  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    triggerZoomControls();
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (mediaSlide?.fileType !== 'image') return;
    const delta = e.deltaY < 0 ? 0.2 : -0.2;
    setZoom(prev => {
      const next = Math.min(5, Math.max(1, Number((prev + delta).toFixed(2))));
      if (next <= 1) {
        setPan({ x: 0, y: 0 });
        return 1;
      }
      return next;
    });
    triggerZoomControls();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (mediaSlide?.fileType !== 'image' || zoom <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    triggerZoomControls();
    if (!isDragging || zoom <= 1) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (mediaSlide?.fileType !== 'image') return;
    if (zoom > 1) {
      handleResetZoom();
    } else {
      setZoom(2.2);
      triggerZoomControls();
    }
  };

  useEffect(() => {
    const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);

    channel.onmessage = (event) => {
      if (event.data.type === 'SET_VERSE') {
        if (mediaSlideUrlRef.current) {
          URL.revokeObjectURL(mediaSlideUrlRef.current);
          mediaSlideUrlRef.current = null;
        }
        setMediaSlide(null);
        setVerse({
          text: event.data.text,
          reference: event.data.reference,
          title: event.data.title,
          subtitle: event.data.subtitle,
          layout: event.data.layout || 'standard',
          textAlign: event.data.textAlign || 'center',
          accentColor: event.data.accentColor || 'indigo',
          qrCodeUrl: event.data.qrCodeUrl,
          bankDetails: event.data.bankDetails,
          qrBadgeLabel: event.data.qrBadgeLabel,
          qrInstruction: event.data.qrInstruction,
          countdownSeconds: event.data.countdownSeconds,
          countdownLabel: event.data.countdownLabel,
          countdownRunning: event.data.countdownRunning,
          webEmbedUrl: event.data.webEmbedUrl,
          embedType: event.data.embedType
        });

        if (event.data.layout === 'countdown' && typeof event.data.countdownSeconds === 'number' && !isTimerRunning) {
          setCountdownLeft(event.data.countdownSeconds);
        }
      }
      else if (event.data.type === 'SET_MEDIA_SLIDE') {
        const incomingTitle = event.data.title || '';
        const incomingType = event.data.fileType || 'image';

        // If already showing the exact same media, skip recreation to avoid flicker
        if (mediaSlide && mediaSlide.title === incomingTitle && mediaSlide.fileType === incomingType && mediaSlide.url) {
          return;
        }

        if (mediaSlideUrlRef.current) {
          URL.revokeObjectURL(mediaSlideUrlRef.current);
          mediaSlideUrlRef.current = null;
        }
        let newUrl = event.data.url;
        if (event.data.buffer) {
          const blob = new Blob([event.data.buffer], { type: event.data.mime || 'image/jpeg' });
          newUrl = URL.createObjectURL(blob);
          mediaSlideUrlRef.current = newUrl;
        }
        setMediaSlide({
          url: newUrl,
          fileType: incomingType,
          title: incomingTitle
        });
        setVerse(prev => ({ ...prev, text: '', reference: '' }));
      }
      else if (event.data.type === 'CLEAR_MEDIA_SLIDE') {
        if (mediaSlideUrlRef.current) {
          URL.revokeObjectURL(mediaSlideUrlRef.current);
          mediaSlideUrlRef.current = null;
        }
        setMediaSlide(null);
      }
      else if (event.data.type === 'MEDIA_PLAY_PAUSE') {
        setIsVideoPlaying(!!event.data.playing);
      }
      else if (event.data.type === 'MEDIA_MUTE_UNMUTE') {
        setIsVideoMuted(!!event.data.muted);
      }
      else if (event.data.type === 'SET_TEXT_ANIMATION') {
        if (event.data.config) {
          setTextAnim(event.data.config);
        }
      }
      else if (event.data.type === 'SET_BG_CONFIG') {
        setBgConfig(event.data.config);
      }
      else if (event.data.type === 'SET_BACKGROUND' || event.data.type === 'SET_BG') {
        if (bgUrlRef.current) URL.revokeObjectURL(bgUrlRef.current);
        let newUrl = event.data.url;
        if (event.data.buffer) {
          const blob = new Blob([event.data.buffer], { type: event.data.mime || 'image/jpeg' });
          newUrl = URL.createObjectURL(blob);
          bgUrlRef.current = newUrl;
        }
        setBgUrl(newUrl);
        setBgType(event.data.fileType || 'image');
      }
      else if (event.data.type === 'CLEAR_BACKGROUND' || event.data.type === 'CLEAR_BG') {
        if (bgUrlRef.current) URL.revokeObjectURL(bgUrlRef.current);
        bgUrlRef.current = null;
        setBgUrl(null);
        setBgType(null);
      }
      else if (event.data.type === 'TOGGLE_HIDE') {
        setIsTextHidden(!!event.data.hidden);
      }
      else if (event.data.type === 'HIDE_TEXT') {
        setIsTextHidden(true);
      }
      else if (event.data.type === 'SHOW_TEXT') {
        setIsTextHidden(false);
      }
      else if (event.data.type === 'SET_TICKER') {
        const cfg = event.data.config || event.data.ticker;
        if (cfg) {
          setTicker(cfg);
        } else {
          setTicker(prev => ({
            ...prev,
            enabled: event.data.enabled !== undefined ? event.data.enabled : prev.enabled,
            text: event.data.text !== undefined ? event.data.text : prev.text,
            theme: event.data.theme || prev.theme,
            position: event.data.position || prev.position,
            speed: event.data.speed || prev.speed,
            fontSize: event.data.fontSize || prev.fontSize,
            badgeLabel: event.data.badgeLabel !== undefined ? event.data.badgeLabel : prev.badgeLabel,
            showBadge: event.data.showBadge !== undefined ? event.data.showBadge : prev.showBadge
          }));
        }
      }
      else if (event.data.type === 'SET_COUNTDOWN_SYNC') {
        if (event.data.secondsLeft !== undefined) {
          setCountdownLeft(event.data.secondsLeft);
        }
        if (event.data.isRunning !== undefined) {
          setIsTimerRunning(event.data.isRunning);
        }
      }
      else if (event.data.type === 'TIMER_START') {
        setIsTimerRunning(true);
      }
      else if (event.data.type === 'TIMER_PAUSE') {
        setIsTimerRunning(false);
      }
      else if (event.data.type === 'TIMER_RESET') {
        setIsTimerRunning(false);
        setCountdownLeft(event.data.seconds || 300);
      }
      else if (event.data.type === 'INIT_STATE_RESPONSE') {
        if (event.data.verse) {
          setVerse(event.data.verse);
        }
        if (event.data.mediaSlide) {
          if (mediaSlideUrlRef.current) URL.revokeObjectURL(mediaSlideUrlRef.current);
          const blob = new Blob([event.data.mediaSlide.buffer], { type: event.data.mediaSlide.mime });
          const newUrl = URL.createObjectURL(blob);
          mediaSlideUrlRef.current = newUrl;
          setMediaSlide({
            url: newUrl,
            fileType: event.data.mediaSlide.fileType,
            title: event.data.mediaSlide.title
          });
        }
        if (event.data.background) {
          if (bgUrlRef.current) URL.revokeObjectURL(bgUrlRef.current);
          const blob = new Blob([event.data.background.buffer], { type: event.data.background.mime });
          const newUrl = URL.createObjectURL(blob);
          bgUrlRef.current = newUrl;
          setBgUrl(newUrl);
          setBgType(event.data.background.fileType);
        }
        if (event.data.isTextHidden !== undefined) {
          setIsTextHidden(event.data.isTextHidden);
        }
        if (event.data.ticker) {
          setTicker(event.data.ticker);
        }
      }
    };

    // Instant restore from IndexedDB if available
    getGlobalBackground().then(bg => {
      if (bg && !bgUrlRef.current) {
        const newUrl = URL.createObjectURL(bg.blob);
        bgUrlRef.current = newUrl;
        setBgUrl(newUrl);
        setBgType(bg.fileType);
      }
    }).catch(() => { });

    // Dual-Layer Storage Auto-Restore
    const restoreBgConfigFromStorage = async () => {
      try {
        const savedBgConfigStr = localStorage.getItem('worship_global_bg_config');
        if (savedBgConfigStr) {
          const parsedBgConfig = JSON.parse(savedBgConfigStr);
          if (parsedBgConfig.slideshow?.images) {
            const hydratedImages = await Promise.all(
              parsedBgConfig.slideshow.images.map(async (img: any) => {
                const rec = await getScheduleMedia(img.id);
                if (rec) {
                  return {
                    ...img,
                    url: URL.createObjectURL(rec.blob),
                    buffer: rec.buffer,
                    mime: rec.mime
                  };
                }
                return img;
              })
            );
            parsedBgConfig.slideshow.images = hydratedImages.filter(img => img.url);
          }
          if (parsedBgConfig.mode === 'video') {
            const rec = await getScheduleMedia('bg_global_video');
            if (rec) {
              parsedBgConfig.video = {
                name: rec.fileName,
                url: URL.createObjectURL(rec.blob),
                buffer: rec.buffer,
                mime: rec.mime
              };
            }
          }
          setBgConfig(parsedBgConfig);
        }
      } catch (e) { }
    };

    restoreBgConfigFromStorage();

    const restoreFromStorage = async () => {
      try {
        const saved = localStorage.getItem('worship_live_projector_state');
        if (saved) {
          const data = JSON.parse(saved);
          if (data.type === 'media' && data.mediaId) {
            const rec = await getScheduleMedia(data.mediaId);
            if (rec) {
              if (mediaSlideUrlRef.current) URL.revokeObjectURL(mediaSlideUrlRef.current);
              const newUrl = URL.createObjectURL(rec.blob);
              mediaSlideUrlRef.current = newUrl;
              setMediaSlide({
                url: newUrl,
                fileType: rec.fileType,
                title: rec.fileName || data.title || ''
              });
              setVerse(prev => ({ ...prev, text: '', reference: '' }));
            }
          } else if (data.type === 'verse') {
            if (mediaSlideUrlRef.current) {
              URL.revokeObjectURL(mediaSlideUrlRef.current);
              mediaSlideUrlRef.current = null;
            }
            setMediaSlide(null);
            setVerse({
              text: data.text || '',
              reference: data.reference || '',
              title: data.title || '',
              subtitle: data.subtitle || '',
              layout: data.layout || 'standard',
              textAlign: data.textAlign || 'center',
              accentColor: data.accentColor || 'indigo',
              qrCodeUrl: data.qrCodeUrl,
              bankDetails: data.bankDetails,
              qrBadgeLabel: data.qrBadgeLabel,
              qrInstruction: data.qrInstruction,
              countdownSeconds: data.countdownSeconds,
              countdownLabel: data.countdownLabel,
              countdownRunning: data.countdownRunning,
              webEmbedUrl: data.webEmbedUrl,
              embedType: data.embedType
            });
            if (data.countdownRunning !== undefined) setIsTimerRunning(data.countdownRunning);
            if (typeof data.countdownLeft === 'number' && !isTimerRunning) {
              setCountdownLeft(data.countdownLeft);
            }
          }
          if (data.isTextHidden !== undefined) setIsTextHidden(data.isTextHidden);
          if (data.ticker) setTicker(data.ticker);
        }
      } catch (e) { }

      try {
        const savedAnim = localStorage.getItem('worship_text_anim_config');
        if (savedAnim) {
          setTextAnim(JSON.parse(savedAnim));
        }
      } catch (e) { }
    };

    restoreFromStorage();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'worship_live_projector_state') {
        restoreFromStorage();
      }
      if (e.key === 'worship_global_bg_config') {
        restoreBgConfigFromStorage();
      }
      if (e.key === 'worship_text_anim_config') {
        restoreFromStorage();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // Announce presence and request initial state
    channel.postMessage({ type: 'DISPLAY_READY' });
    channel.postMessage({ type: 'REQUEST_INIT_STATE' });
    channel.postMessage({ type: 'HEARTBEAT' });

    const timer = setTimeout(() => {
      channel.postMessage({ type: 'DISPLAY_READY' });
      channel.postMessage({ type: 'REQUEST_INIT_STATE' });
      channel.postMessage({ type: 'HEARTBEAT' });
    }, 150);

    const heartbeatInterval = setInterval(() => {
      channel.postMessage({ type: 'HEARTBEAT' });
    }, 2000);

    const handleBeforeUnload = () => {
      channel.postMessage({ type: 'DISPLAY_CLOSED' });
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearTimeout(timer);
      clearInterval(heartbeatInterval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('storage', handleStorageChange);
      channel.postMessage({ type: 'DISPLAY_CLOSED' });
      channel.close();
      if (bgUrlRef.current) URL.revokeObjectURL(bgUrlRef.current);
      if (mediaSlideUrlRef.current) URL.revokeObjectURL(mediaSlideUrlRef.current);
    };
  }, []);

  // Ensure background video plays
  useEffect(() => {
    if (bgType === 'video' && videoRef.current) {
      videoRef.current.play().catch(() => { });
    }
  }, [bgUrl, bgType]);

  // Ensure foreground media slide video plays when slide loads
  useEffect(() => {
    if (mediaSlide?.fileType === 'video' && mediaSlideVideoRef.current) {
      if (isVideoPlaying) {
        mediaSlideVideoRef.current.play().catch(() => { });
      } else {
        mediaSlideVideoRef.current.pause();
      }
    }
  }, [mediaSlide]);

  // Imperatively sync play/pause on projector video
  useEffect(() => {
    if (!mediaSlideVideoRef.current) return;
    if (isVideoPlaying) {
      mediaSlideVideoRef.current.play().catch(() => { });
    } else {
      mediaSlideVideoRef.current.pause();
    }
  }, [isVideoPlaying]);

  // Imperatively sync mute on projector video
  useEffect(() => {
    if (mediaSlideVideoRef.current) {
      mediaSlideVideoRef.current.muted = isVideoMuted;
    }
  }, [isVideoMuted]);

  // Toggle native borderless fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => { });
    } else {
      document.exitFullscreen().catch(() => { });
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      }
    };
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const fontSizeCss = getResponsiveFontSize(verse.text || verse.title || '');

  // Format timer MM:SS
  const formatTimer = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getAccentBg = (color?: AccentColor) => {
    switch (color) {
      case 'amber': return 'bg-amber-500';
      case 'emerald': return 'bg-emerald-500';
      case 'rose': return 'bg-rose-500';
      case 'cyan': return 'bg-cyan-500';
      case 'white': return 'bg-white';
      default: return 'bg-indigo-500';
    }
  };

  const getAccentText = (color?: AccentColor) => {
    switch (color) {
      case 'amber': return 'text-amber-400';
      case 'emerald': return 'text-emerald-400';
      case 'rose': return 'text-rose-400';
      case 'cyan': return 'text-cyan-400';
      case 'white': return 'text-white';
      default: return 'text-indigo-400';
    }
  };

  return (
    <div
      onDoubleClick={toggleFullscreen}
      className="w-screen h-screen min-h-screen bg-[#030303] text-white flex flex-col items-center justify-center p-0 relative overflow-hidden select-none font-sans"
    >
      {/* 1. Global Background Layer */}
      <GlobalBackgroundLayer config={bgConfig} legacyBgUrl={bgUrl} legacyBgType={bgType} />

      {/* 2. Foreground Presentation Slide */}
      <AnimatePresence mode="wait">
        {/* A. Foreground Media Presentation Slide (Video / Photo with Smooth Crossfade & Pan-Zoom) */}
        {!isTextHidden && mediaSlide && (
          <motion.div
            key={`media-${mediaSlide.title || mediaSlide.url}`}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onDoubleClick={handleDoubleClick}
            className={`absolute inset-0 z-20 w-full h-full p-0 m-0 bg-black flex items-center justify-center overflow-hidden select-none ${zoom > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
              }`}
          >
            {mediaSlide.fileType === 'video' ? (
              <video
                ref={mediaSlideVideoRef}
                src={mediaSlide.url}
                autoPlay={isVideoPlaying}
                loop
                muted={isVideoMuted}
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center transition-transform duration-150 ease-out will-change-transform"
                style={{
                  transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
                  transformOrigin: 'center center'
                }}
              >
                <img
                  src={mediaSlide.url}
                  alt={mediaSlide.title}
                  className="w-full h-full object-contain"
                  style={{
                    imageRendering: 'auto',
                    WebkitUserDrag: 'none'
                  } as React.CSSProperties}
                  draggable={false}
                />
              </div>
            )}

            {/* Subtle Zoom & Pan Controller Overlay on Projector */}
            {mediaSlide.fileType === 'image' && (
              <div
                className={`absolute bottom-6 right-6 z-40 flex items-center gap-1.5 p-1.5 bg-neutral-950/80 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl transition-opacity duration-300 ${showZoomControls || zoom > 1 ? 'opacity-100' : 'opacity-0 hover:opacity-100'
                  }`}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={handleZoomOut}
                  disabled={zoom <= 1}
                  className="p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl disabled:opacity-30 disabled:hover:bg-transparent transition-all active:scale-95"
                  title="Zoom Out (Minimum 100%)"
                >
                  <ZoomOut size={16} />
                </button>
                <span className="text-xs font-mono font-black text-white px-2 min-w-[52px] text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  disabled={zoom >= 5}
                  className="p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl disabled:opacity-30 disabled:hover:bg-transparent transition-all active:scale-95"
                  title="Zoom In (Up to 500%)"
                >
                  <ZoomIn size={16} />
                </button>
                {zoom > 1 && (
                  <button
                    type="button"
                    onClick={handleResetZoom}
                    className="flex items-center gap-1 px-2.5 py-2 text-xs font-bold text-amber-300 hover:text-white bg-amber-950/60 hover:bg-amber-900/80 border border-amber-500/40 rounded-xl transition-all active:scale-95"
                    title="Reset to Normal View (100%)"
                  >
                    <RotateCcw size={13} />
                    <span>Fit</span>
                  </button>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* B. Giving / QR Code / Link Slide Layout */}
        {!isTextHidden && !mediaSlide && verse.layout === 'giving' && (
          <motion.div
            key={`giving-${verse.reference}-${verse.text}`}
            initial={{ opacity: 0, scale: 0.98, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -8 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="w-full max-w-[94vw] mx-auto grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-10 items-center justify-center p-6 md:p-10 relative z-10 bg-black/75 backdrop-blur-xl rounded-3xl border border-white/15 shadow-2xl"
          >
            {/* Left Column (5 of 12 cols): Heading, Scripture/Description & Details */}
            <div className="md:col-span-5 space-y-4 text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 text-xs md:text-sm font-bold uppercase tracking-wider shadow">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>
                  {verse.qrBadgeLabel || (
                    verse.title?.toLowerCase().includes('tithe') || verse.title?.includes('दशांश')
                      ? 'दशांश तथा भेटी (Tithes & Offering)'
                      : (verse.subtitle || 'स्क्यान गर्नुहोस् (SCAN QR CODE)')
                  )}
                </span>
              </div>

              <h2 className="text-2xl md:text-4xl lg:text-5xl font-black text-white leading-tight">
                {verse.title || "स्क्यान गर्नुहोस्"}
              </h2>

              <p className="text-sm md:text-lg text-neutral-300 italic whitespace-pre-line leading-relaxed">
                {verse.text || `"खुशीसाथ दिनेलाई परमेश्वरले प्रेम गर्नुहुन्छ।" — २ कोरिन्थी ९:७`}
              </p>

              {verse.bankDetails && (
                <div className="p-4 md:p-5 bg-neutral-950/95 border border-neutral-800 rounded-2xl font-mono text-xs md:text-sm text-neutral-200 whitespace-pre-line leading-relaxed shadow-xl border-l-4 border-l-emerald-500">
                  {verse.bankDetails}
                </div>
              )}
            </div>

            {/* Right Column (7 of 12 cols): Massive, High-Visibility QR Code Display */}
            <div className="md:col-span-7 flex flex-col items-center justify-center text-center space-y-4">
              <div className="p-5 md:p-8 bg-white rounded-3xl shadow-2xl w-full max-w-[340px] md:max-w-[460px] lg:max-w-[520px] aspect-square flex items-center justify-center ring-8 ring-emerald-500/20">
                {verse.qrCodeUrl ? (
                  <img
                    src={verse.qrCodeUrl}
                    alt="QR Code"
                    className="w-full h-full object-contain rounded-2xl"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-neutral-800 p-6 text-center space-y-3">
                    <QrCode size={180} className="text-neutral-900 opacity-90" />
                    <p className="font-bold text-sm md:text-base text-neutral-700">
                      {verse.qrInstruction || 'Scan with Phone Camera or QR Scanner'}
                    </p>
                  </div>
                )}
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/80 border border-emerald-500/40 text-emerald-300 text-xs md:text-sm font-black uppercase tracking-wider shadow-lg">
                <span>
                  {verse.qrInstruction || '📱 Scan with Phone Camera or QR Scanner (क्यामेराबाट स्क्यान गर्नुहोस्)'}
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {/* C. Countdown Timer Slide Layout */}
        {!isTextHidden && !mediaSlide && verse.layout === 'countdown' && (
          <motion.div
            key={`countdown-${verse.reference}`}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-[85vw] mx-auto flex flex-col items-center justify-center text-center relative z-10 p-6 md:p-12 space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-950/80 border border-indigo-500/40 text-indigo-300 text-xs md:text-base font-bold uppercase tracking-wider shadow-lg">
              <span className={`w-2.5 h-2.5 rounded-full ${isTimerRunning ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`}></span>
              <span>{verse.countdownLabel || 'Service Begins In'}</span>
            </div>

            {/* Giant Digital Clock */}
            <div className="relative">
              <span
                className={`font-black font-mono tracking-wider transition-colors drop-shadow-2xl ${countdownLeft <= 10 && countdownLeft > 0
                    ? 'text-amber-400 animate-pulse'
                    : countdownLeft === 0
                      ? 'text-emerald-400'
                      : 'text-white'
                  }`}
                style={{
                  fontSize: 'clamp(64px, 14vw, 200px)',
                  textShadow: '0px 8px 40px rgba(0,0,0,1), 0px 0px 30px rgba(99,102,241,0.6)'
                }}
              >
                {formatTimer(countdownLeft)}
              </span>
            </div>

            {verse.text && (
              <p
                className="text-white font-medium max-w-2xl whitespace-pre-line leading-relaxed"
                style={{
                  fontSize: 'clamp(16px, 2.2vw, 32px)',
                  textShadow: '0px 4px 20px rgba(0,0,0,1)'
                }}
              >
                {verse.text}
              </p>
            )}
          </motion.div>
        )}

        {/* D. Lower-Third Live Streaming / OBS Overlay Layout */}
        {!isTextHidden && !mediaSlide && verse.layout === 'lowerthird' && verse.text && (
          <motion.div
            key={`lowerthird-${verse.reference}-${verse.text}`}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="absolute bottom-8 left-8 right-8 z-20 max-w-[92vw] mx-auto bg-black/85 backdrop-blur-md border border-white/15 rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col items-center justify-center text-center"
          >
            <p
              className="font-bold text-white leading-snug whitespace-pre-line mb-2"
              style={{ fontSize: 'clamp(20px, 2.8vw, 44px)' }}
            >
              {verse.text}
            </p>
            {verse.reference && (
              <div className="inline-flex items-center gap-2 mt-1">
                <span className={`h-1.5 w-6 rounded-full ${getAccentBg(verse.accentColor)}`}></span>
                <span className={`text-xs md:text-sm font-bold tracking-wider ${getAccentText(verse.accentColor)}`}>
                  {verse.reference}
                </span>
                <span className={`h-1.5 w-6 rounded-full ${getAccentBg(verse.accentColor)}`}></span>
              </div>
            )}
          </motion.div>
        )}

        {/* E. Live Interactive Web Embed (Google Slides / Microsoft 365) */}
        {!isTextHidden && !mediaSlide && verse.webEmbedUrl && (
          <motion.div
            key={`embed-${verse.webEmbedUrl}`}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 z-20 w-full h-full p-0 m-0 bg-black flex items-center justify-center overflow-hidden"
          >
            <iframe
              src={verse.webEmbedUrl}
              title={verse.title || 'Live Web Presentation'}
              className="w-full h-full border-0"
              allow="autoplay; fullscreen"
              allowFullScreen
            />
          </motion.div>
        )}

        {/* F. Standard Full-Screen Slide (Scripture / Lyrics / Custom Slide) */}
        {!isTextHidden && !mediaSlide && !verse.webEmbedUrl && (!verse.layout || verse.layout === 'standard') && (verse.text || verse.title) && (
          <motion.div
            key={`${verse.reference}-${verse.text || verse.title}`}
            initial={getTextAnimationVariants(textAnim.effect).initial}
            animate={getTextAnimationVariants(textAnim.effect).animate}
            exit={getTextAnimationVariants(textAnim.effect).exit}
            transition={{ duration: getTextAnimationDuration(textAnim.speed), ease: [0.22, 1, 0.36, 1] }}
            style={{ willChange: 'transform, opacity', transform: 'translateZ(0)' }}
            className={`w-full max-w-[94vw] mx-auto flex flex-col justify-center relative z-10 ${verse.textAlign === 'left'
                ? 'items-start text-left'
                : verse.textAlign === 'right'
                  ? 'items-end text-right'
                  : 'items-center text-center'
              }`}
          >
            {String(verse.text || verse.title || '').includes('\n───\n') || String(verse.text || verse.title || '').includes('\n---\n') ? (() => {
              const fullContent = String(verse.text || verse.title || '');
              const parts = fullContent.split(/\n───\n|\n---\n/);
              const top = parts[0] || '';
              const bottom = parts[1] || '';
              return (
                <div className="w-full flex flex-col items-center justify-center gap-3 md:gap-5 mb-4 md:mb-6">
                  <p
                    className={`font-black leading-[1.20] tracking-tight text-white w-full whitespace-pre-line ${verse.textAlign === 'left' ? 'text-left' : verse.textAlign === 'right' ? 'text-right' : 'text-center'
                      }`}
                    style={{
                      fontSize: getResponsiveFontSize(top),
                      textShadow: '0px 4px 32px rgba(0,0,0,1), 0px 0px 14px rgba(0,0,0,0.95)'
                    }}
                  >
                    {top}
                  </p>

                  <div className="w-full flex items-center justify-center gap-4 my-1 opacity-80">
                    <div className="h-[2px] flex-1 max-w-[200px] bg-gradient-to-r from-transparent via-indigo-400 to-transparent"></div>
                    <span className="w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.9)]"></span>
                    <div className="h-[2px] flex-1 max-w-[200px] bg-gradient-to-r from-transparent via-indigo-400 to-transparent"></div>
                  </div>

                  <p
                    className={`font-semibold italic leading-[1.24] tracking-normal text-neutral-100/95 w-full whitespace-pre-line ${verse.textAlign === 'left' ? 'text-left' : verse.textAlign === 'right' ? 'text-right' : 'text-center'
                      }`}
                    style={{
                      fontSize: getResponsiveFontSize(bottom),
                      textShadow: '0px 4px 28px rgba(0,0,0,1), 0px 0px 12px rgba(0,0,0,0.9)'
                    }}
                  >
                    {bottom}
                  </p>
                </div>
              );
            })() : (
              <p
                className={`font-black leading-[1.20] tracking-tight mb-4 md:mb-6 text-white w-full whitespace-pre-line ${verse.textAlign === 'left' ? 'text-left' : verse.textAlign === 'right' ? 'text-right' : 'text-center'
                  }`}
                style={{
                  fontSize: fontSizeCss,
                  textShadow: '0px 4px 32px rgba(0,0,0,1), 0px 0px 14px rgba(0,0,0,0.95)'
                }}
              >
                {verse.text || verse.title}
              </p>
            )}

            {verse.reference && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: 0.04 }}
                className="inline-flex items-center gap-3 md:gap-5 mt-1"
              >
                <div className={`h-[3px] w-10 md:w-16 rounded-full shadow-[0_0_12px_rgba(0,0,0,0.9)] ${getAccentBg(verse.accentColor)}`}></div>
                <p
                  className="text-white font-bold tracking-wide"
                  style={{
                    fontSize: 'clamp(18px, 2.2vw, 40px)',
                    textShadow: '0px 2px 14px rgba(0,0,0,1)'
                  }}
                >
                  {verse.reference}
                </p>
                <div className={`h-[3px] w-10 md:w-16 rounded-full shadow-[0_0_12px_rgba(0,0,0,0.9)] ${getAccentBg(verse.accentColor)}`}></div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Live Scrolling Announcement Ticker Overlay */}
      {ticker.enabled && ticker.text && (() => {
        const getTickerDuration = (speed?: TickerSpeed) => {
          switch (speed) {
            case 'slow': return '36s';
            case 'fast': return '14s';
            case 'vfast': return '8s';
            default: return '22s';
          }
        };

        const getTickerFontSize = (size?: TickerFontSize) => {
          switch (size) {
            case 'sm': return 'clamp(12px, 1.2vw, 16px)';
            case 'lg': return 'clamp(17px, 1.9vw, 26px)';
            case 'xl': return 'clamp(21px, 2.4vw, 34px)';
            default: return 'clamp(14px, 1.5vw, 20px)';
          }
        };

        const getTickerThemeStyles = (theme?: TickerTheme) => {
          switch (theme) {
            case 'emerald':
              return {
                container: 'bg-black/92 border-emerald-500/50',
                badge: 'bg-emerald-500 text-black',
                text: 'text-emerald-300'
              };
            case 'cyan':
              return {
                container: 'bg-black/92 border-cyan-500/50',
                badge: 'bg-cyan-500 text-black',
                text: 'text-cyan-300'
              };
            case 'rose':
              return {
                container: 'bg-black/92 border-rose-500/50',
                badge: 'bg-rose-500 text-white',
                text: 'text-rose-300'
              };
            case 'indigo':
              return {
                container: 'bg-black/92 border-indigo-500/50',
                badge: 'bg-indigo-500 text-white',
                text: 'text-indigo-200'
              };
            case 'white':
              return {
                container: 'bg-black/95 border-white/30',
                badge: 'bg-white text-black',
                text: 'text-white'
              };
            default: // amber
              return {
                container: 'bg-black/92 border-amber-500/50',
                badge: 'bg-amber-500 text-black',
                text: 'text-amber-300'
              };
          }
        };

        const styles = getTickerThemeStyles(ticker.theme);

        return (
          <div
            className={`absolute left-0 right-0 z-50 py-2.5 px-5 overflow-hidden shadow-2xl backdrop-blur-xl ${ticker.position === 'top' ? 'top-0 border-b' : 'bottom-0 border-t'
              } ${styles.container}`}
          >
            <div className="flex items-center gap-3.5">
              {ticker.showBadge && (
                <span className={`px-2.5 py-0.5 rounded-full font-black text-[11px] uppercase tracking-wider shrink-0 shadow-md animate-pulse ${styles.badge}`}>
                  {ticker.badgeLabel || 'NOTICE'}
                </span>
              )}
              <div className="overflow-hidden whitespace-nowrap flex-1">
                <div
                  className={`inline-block animate-marquee font-bold tracking-wide ${styles.text}`}
                  style={{
                    animationDuration: getTickerDuration(ticker.speed),
                    fontSize: getTickerFontSize(ticker.fontSize)
                  }}
                >
                  {ticker.text} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; {ticker.text}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
