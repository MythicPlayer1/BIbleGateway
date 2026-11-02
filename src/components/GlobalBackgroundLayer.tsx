"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { VideoOff, Camera } from "lucide-react";
import { GlobalBackgroundConfig, BackgroundTransitionEffect } from "@/lib/lyrics";

interface GlobalBackgroundLayerProps {
  config?: GlobalBackgroundConfig | null;
  legacyBgUrl?: string | null;
  legacyBgType?: 'video' | 'image' | null;
}

export function GlobalBackgroundLayer({ config, legacyBgUrl, legacyBgType }: GlobalBackgroundLayerProps) {
  const [slideshowIdx, setSlideshowIdx] = useState(0);
  const cameraVideoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const images = config?.slideshow?.images || [];
  const intervalSec = config?.slideshow?.interval || 5;
  const durationSec = config?.slideshow?.transitionDuration || 1.2;
  const effect: BackgroundTransitionEffect = config?.slideshow?.transitionEffect || 'zoom';
  const mode = config?.mode || (legacyBgUrl ? (legacyBgType === 'video' ? 'video' : 'slideshow') : 'none');
  const opacity = config?.overlay?.opacity !== undefined
    ? config.overlay.opacity
    : (config?.overlayOpacity !== undefined ? config.overlayOpacity : 0.4);

  const overlayColor = config?.overlay?.color || '#000000';
  const overlayType = config?.overlay?.type || 'uniform';
  const blurLevel = config?.overlay?.blur || 'none';

  // Backdrop blur styling for soft-focus readability over moving camera/video
  const blurFilter = blurLevel === 'subtle' ? 'backdrop-blur-[4px]'
    : blurLevel === 'medium' ? 'backdrop-blur-[9px]'
    : blurLevel === 'heavy' ? 'backdrop-blur-[16px]'
    : '';

  // Get CSS background style based on overlayType
  const getOverlayBackgroundStyle = () => {
    switch (overlayType) {
      case 'lower-third':
        return `linear-gradient(to top, ${overlayColor} 0%, ${overlayColor} 50%, transparent 95%)`;
      case 'vignette':
        return `radial-gradient(ellipse at center, transparent 25%, ${overlayColor} 100%)`;
      case 'top-bottom':
        return `linear-gradient(to bottom, ${overlayColor} 0%, transparent 35%, transparent 65%, ${overlayColor} 100%)`;
      case 'uniform':
      default:
        return overlayColor;
    }
  };

  // Live Camera Stream Lifecycle
  useEffect(() => {
    if (mode !== 'camera') {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      setCameraError(null);
      return;
    }

    let isMounted = true;

    async function initCamera() {
      try {
        setCameraError(null);
        if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
          throw new Error("Live camera is not supported in this browser or environment.");
        }

        // Clean up prior stream before requesting a new one
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }

        const deviceId = config?.camera?.deviceId;
        let stream: MediaStream;

        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: deviceId ? { deviceId: { exact: deviceId } } : true,
            audio: false
          });
        } catch (exactErr) {
          // If the specific deviceId is not available on this machine/display, fallback to any available camera
          if (deviceId) {
            console.warn("Selected camera deviceId not found on this screen, falling back to default camera:", exactErr);
            stream = await navigator.mediaDevices.getUserMedia({
              video: true,
              audio: false
            });
          } else {
            throw exactErr;
          }
        }

        if (!isMounted) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        streamRef.current = stream;

        if (cameraVideoRef.current) {
          cameraVideoRef.current.srcObject = stream;
          cameraVideoRef.current.play().catch(() => {});
        }
      } catch (err: any) {
        console.warn("Live Camera Background failed:", err);
        if (isMounted) {
          const msg = err?.name === 'NotAllowedError'
            ? 'Camera permission denied. Please allow camera access in your browser.'
            : err?.name === 'NotFoundError'
            ? 'No camera or HDMI capture device found.'
            : (err?.message || 'Failed to start camera feed.');
          setCameraError(msg);
        }
      }
    }

    initCamera();

    return () => {
      isMounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, [mode, config?.camera?.deviceId]);

  // Ensure stream stays bound if video element re-renders
  useEffect(() => {
    if (mode === 'camera' && cameraVideoRef.current && streamRef.current) {
      if (cameraVideoRef.current.srcObject !== streamRef.current) {
        cameraVideoRef.current.srcObject = streamRef.current;
        cameraVideoRef.current.play().catch(() => {});
      }
    }
  });

  // Auto Slideshow Interval Timer
  useEffect(() => {
    if (mode !== 'slideshow' || images.length <= 1) return;
    const timer = setInterval(() => {
      setSlideshowIdx(prev => (prev + 1) % images.length);
    }, Math.max(2, intervalSec) * 1000);

    return () => clearInterval(timer);
  }, [mode, images.length, intervalSec]);

  if (mode === 'none' && !legacyBgUrl) {
    return null;
  }

  // Active Slideshow Image
  const activeImage = images.length > 0
    ? images[slideshowIdx % images.length]
    : (legacyBgUrl && legacyBgType !== 'video' ? { id: 'legacy', url: legacyBgUrl, name: 'Background' } : null);

  // Variant definitions for smooth slide motion
  const getFramerVariants = () => {
    switch (effect) {
      case 'fade':
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 }
        };
      case 'slide':
        return {
          initial: { opacity: 0, x: "100%" },
          animate: { opacity: 1, x: "0%" },
          exit: { opacity: 0, x: "-100%" }
        };
      case 'blur':
        return {
          initial: { opacity: 0, filter: "blur(20px)" },
          animate: { opacity: 1, filter: "blur(0px)" },
          exit: { opacity: 0, filter: "blur(20px)" }
        };
      case 'scale-fade':
        return {
          initial: { opacity: 0, scale: 0.88 },
          animate: { opacity: 1, scale: 1 },
          exit: { opacity: 0, scale: 1.12 }
        };
      case 'zoom':
      default:
        return {
          initial: { opacity: 0, scale: 1.02 },
          animate: { opacity: 1, scale: 1.14 },
          exit: { opacity: 0 }
        };
    }
  };

  const variants = getFramerVariants();

  return (
    <div className="absolute inset-0 z-0 overflow-hidden select-none">

      {/* 1. SLIDESHOW / SINGLE IMAGE BACKGROUND MODE (WITH CINEMATIC KEN BURNS MOTION) */}
      {mode === 'slideshow' && activeImage?.url && (
        <AnimatePresence mode="popLayout">
          <motion.div
            key={activeImage.id || activeImage.url}
            initial={images.length > 1 ? variants.initial : { opacity: 0, scale: 1 }}
            animate={
              images.length > 1
                ? variants.animate
                : {
                  opacity: 1,
                  scale: [1, 1.06, 1],
                  x: [0, -8, 0],
                  y: [0, 5, 0]
                }
            }
            exit={variants.exit}
            transition={
              images.length > 1
                ? {
                  opacity: { duration: durationSec, ease: "easeInOut" },
                  scale: effect === 'zoom'
                    ? { duration: Math.max(intervalSec, durationSec), ease: "linear" }
                    : { duration: durationSec, ease: "easeOut" },
                  x: { duration: durationSec, ease: [0.25, 1, 0.5, 1] },
                  filter: { duration: durationSec, ease: "easeOut" }
                }
                : {
                  opacity: { duration: 0.6, ease: "easeOut" },
                  scale: { duration: 30, repeat: Infinity, ease: "easeInOut" },
                  x: { duration: 30, repeat: Infinity, ease: "easeInOut" },
                  y: { duration: 30, repeat: Infinity, ease: "easeInOut" }
                }
            }
            className="absolute inset-0 w-full h-full"
          >
            <img
              src={activeImage.url}
              alt={activeImage.name || "Background"}
              className="w-full h-full object-cover"
            />
          </motion.div>
        </AnimatePresence>
      )}

      {/* 2. ADVANCED GRADIENT MODE */}
      {mode === 'gradient' && config?.gradient && (
        <div className="absolute inset-0 w-full h-full overflow-hidden">
          <div
            className={`w-full h-full transition-all duration-700 ${config.gradient.animation === 'slow-flow' ? 'animate-[spin_40s_linear_infinite]' : ''
              } ${config.gradient.animation === 'pulse' ? 'animate-pulse' : ''
              }`}
            style={{
              background: config.gradient.type === 'radial'
                ? `radial-gradient(circle at center, ${config.gradient.color1}, ${config.gradient.color2}, ${config.gradient.color3})`
                : config.gradient.type === 'conic'
                  ? `conic-gradient(from 0deg at 50% 50%, ${config.gradient.color1}, ${config.gradient.color2}, ${config.gradient.color3}, ${config.gradient.color1})`
                  : config.gradient.type === 'mesh'
                    ? `radial-gradient(at 0% 0%, ${config.gradient.color1} 0px, transparent 50%),
                       radial-gradient(at 100% 0%, ${config.gradient.color2} 0px, transparent 50%),
                       radial-gradient(at 50% 100%, ${config.gradient.color3} 0px, transparent 50%),
                       ${config.gradient.color1}`
                    : `linear-gradient(${config.gradient.angle}deg, ${config.gradient.color1}, ${config.gradient.color2}, ${config.gradient.color3})`,
              transform: config.gradient.animation === 'slow-flow' ? 'scale(1.4)' : 'scale(1)'
            }}
          />
        </div>
      )}

      {/* 3. VIDEO MODE */}
      {mode === 'video' && (config?.video?.url || (legacyBgUrl && legacyBgType === 'video')) && (
        <video
          src={config?.video?.url || legacyBgUrl || ''}
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {/* 4. LIVE CAMERA / HDMI CAPTURE MODE */}
      {mode === 'camera' && (
        <div className="absolute inset-0 w-full h-full overflow-hidden bg-black">
          <video
            ref={cameraVideoRef}
            autoPlay
            playsInline
            muted
            className={`absolute inset-0 w-full h-full object-cover transition-transform duration-300 ${
              config?.camera?.mirror ? 'scale-x-[-1]' : 'scale-x-100'
            }`}
          />
          {cameraError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-rose-300 bg-neutral-950/85 backdrop-blur-md z-10 space-y-2">
              <VideoOff size={42} className="text-rose-400" />
              <p className="font-bold text-sm tracking-wide">Live Camera Offline</p>
              <p className="text-xs text-neutral-400 max-w-sm">{cameraError}</p>
            </div>
          )}
        </div>
      )}

      {/* Dynamic transparency overlay for text contrast and legibility */}
      <div
        className={`absolute inset-0 w-full h-full transition-all duration-300 pointer-events-none ${blurFilter}`}
        style={{
          background: getOverlayBackgroundStyle(),
          opacity
        }}
      />
    </div>
  );
}
