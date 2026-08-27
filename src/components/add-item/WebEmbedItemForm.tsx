"use client";

import React, { useState } from "react";
import { Globe, ExternalLink, HelpCircle, Check, Presentation } from "lucide-react";
import type { WebEmbedType } from "@/lib/lyrics";
import type { NewItemDataState } from "@/components/AddItemModal";

interface WebEmbedItemFormProps {
  newItemData: NewItemDataState;
  setNewItemData: React.Dispatch<React.SetStateAction<NewItemDataState>>;
}

/**
 * Cleanly transforms public presentation URLs into embeddable iframe URLs
 */
function normalizeEmbedUrl(rawInput: string): { url: string; type: WebEmbedType } {
  let url = rawInput.trim();

  // If user pasted full iframe tag: <iframe src="..." ...>
  if (url.includes("<iframe") && url.includes("src=")) {
    const match = url.match(/src=["']([^"']+)["']/i);
    if (match && match[1]) {
      url = match[1];
    }
  }

  // Decode HTML entities like &amp; -> &
  url = url.replace(/&amp;/g, "&");

  // 1. Google Slides Published URL (/presentation/d/e/2PACX-.../pub or /pubembed -> /embed)
  if (url.includes("docs.google.com/presentation/d/e/")) {
    let embedReadyUrl = url;
    if (embedReadyUrl.includes("/pubembed")) {
      embedReadyUrl = embedReadyUrl.replace("/pubembed", "/embed");
    } else if (embedReadyUrl.includes("/pub")) {
      embedReadyUrl = embedReadyUrl.replace("/pub", "/embed");
    }
    return {
      url: embedReadyUrl,
      type: "google_slides",
    };
  }

  // 2. Standard Google Slides Doc ID (/presentation/d/{DOC_ID}/edit or /preview)
  if (url.includes("docs.google.com/presentation/d/")) {
    const docIdMatch = url.match(/\/presentation\/d\/([a-zA-Z0-9_-]+)/);
    if (docIdMatch && docIdMatch[1] && docIdMatch[1] !== "e") {
      return {
        url: `https://docs.google.com/presentation/d/${docIdMatch[1]}/embed?start=false&loop=false&delayms=3000`,
        type: "google_slides",
      };
    }
  }

  // 3. Google Drive file preview (/file/d/{FILE_ID}/view -> /file/d/{FILE_ID}/preview)
  if (url.includes("drive.google.com/file/d/")) {
    const driveMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (driveMatch && driveMatch[1]) {
      return {
        url: `https://drive.google.com/file/d/${driveMatch[1]}/preview`,
        type: "google_slides",
      };
    }
  }

  // 4. Microsoft 365 / PowerPoint Online
  if (url.includes("office.com") || url.includes("onedrive.live.com") || url.includes("sharepoint.com")) {
    return { url, type: "powerpoint_online" };
  }

  return { url, type: "generic" };
}

export const WebEmbedItemForm: React.FC<WebEmbedItemFormProps> = ({
  newItemData,
  setNewItemData,
}) => {
  const [activePlatform, setActivePlatform] = useState<"google" | "microsoft">("google");
  const [inputUrl, setInputUrl] = useState(newItemData.embedUrl || "");

  const handleUrlChange = (val: string) => {
    setInputUrl(val);
    const normalized = normalizeEmbedUrl(val);
    setNewItemData((prev) => ({
      ...prev,
      embedUrl: normalized.url,
      embedType: normalized.type,
      title: prev.title.trim()
        ? prev.title
        : normalized.type === "google_slides"
        ? "Google Slides Presentation"
        : normalized.type === "powerpoint_online"
        ? "PowerPoint Online Presentation"
        : "Live Web Presentation",
      subtitle: prev.subtitle.trim() ? prev.subtitle : "Live Interactive Web Embed",
    }));
  };

  return (
    <div className="space-y-4">
      {/* Title & Subtitle */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-neutral-400 uppercase mb-1">
            Presentation Title
          </label>
          <input
            type="text"
            value={newItemData.title}
            onChange={(e) => setNewItemData((prev) => ({ ...prev, title: e.target.value }))}
            placeholder="e.g. Guest Speaker Sermon"
            className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2.5 text-xs md:text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-neutral-400 uppercase mb-1">
            Subtitle
          </label>
          <input
            type="text"
            value={newItemData.subtitle}
            onChange={(e) => setNewItemData((prev) => ({ ...prev, subtitle: e.target.value }))}
            placeholder="e.g. Google Slides • Live Embed"
            className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2.5 text-xs md:text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
          />
        </div>
      </div>

      {/* Embed Link Input */}
      <div>
        <label className="block text-xs font-bold text-neutral-400 uppercase mb-1 flex items-center justify-between">
          <span>Live Presentation URL / Embed Code</span>
          <span className="text-[10px] text-indigo-400 font-normal">Auto-converts to embed mode</span>
        </label>
        <div className="relative">
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder="Paste Google Slides or PowerPoint 365 link here..."
            className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3.5 py-3 pr-10 text-xs md:text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500 font-medium font-mono"
          />
          <div className="absolute right-3 top-3 text-neutral-400">
            <Globe size={16} />
          </div>
        </div>
      </div>

      {/* Live Preview / Helper Guide */}
      {newItemData.embedUrl ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <Check size={14} /> Embed URL Ready for Projector
            </span>
            <a
              href={newItemData.embedUrl}
              target="_blank"
              rel="noreferrer"
              className="text-indigo-400 hover:underline flex items-center gap-1 text-[11px]"
            >
              Open in new tab <ExternalLink size={11} />
            </a>
          </div>
          <div className="relative aspect-video w-full max-h-56 bg-black rounded-2xl overflow-hidden border border-neutral-800 shadow-xl">
            <iframe
              src={newItemData.embedUrl}
              title="Live Slide Preview"
              className="w-full h-full border-0"
              allowFullScreen
            />
          </div>
        </div>
      ) : (
        /* Helper Instructions Tabs */
        <div className="bg-neutral-900/60 p-4 rounded-2xl border border-neutral-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-300">
              <HelpCircle size={14} className="text-indigo-400" />
              <span>How to get the public embed link:</span>
            </div>
            <div className="flex gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800">
              <button
                type="button"
                onClick={() => setActivePlatform("google")}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-bold ${
                  activePlatform === "google"
                    ? "bg-indigo-600 text-white"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                Google Slides
              </button>
              <button
                type="button"
                onClick={() => setActivePlatform("microsoft")}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-bold ${
                  activePlatform === "microsoft"
                    ? "bg-indigo-600 text-white"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                PowerPoint 365
              </button>
            </div>
          </div>

          {activePlatform === "google" ? (
            <div className="space-y-2">
              <ol className="text-xs text-neutral-400 space-y-1.5 list-decimal list-inside leading-relaxed">
                <li>In Google Slides: Click <strong className="text-white">File (फाइल) ➔ Share (साझा) ➔ Publish to web (वेबमा प्रकाशित गर्नुहोस्)</strong>.</li>
                <li>Click the blue <strong className="text-indigo-400">Publish</strong> button and copy the generated link.</li>
                <li>Paste that link into the box above.</li>
              </ol>
              <div className="p-2.5 bg-amber-950/40 border border-amber-500/30 rounded-xl text-[11px] text-amber-300 flex items-start gap-2">
                <span>⚠️</span>
                <span>
                  <strong>Tip:</strong> If Google displays <em>&quot;Sorry, the file does not exist&quot;</em>, it means the slide is still private. Clicking <strong>Publish to web</strong> (or changing Share access to <em>&quot;Anyone with the link&quot;</em>) will instantly fix it!
                </span>
              </div>
            </div>
          ) : (
            <ol className="text-xs text-neutral-400 space-y-1 list-decimal list-inside leading-relaxed">
              <li>In PowerPoint Online: Click <strong className="text-white">File ➔ Share ➔ Embed</strong>.</li>
              <li>Copy the generated <strong className="text-white">Embed Code</strong> or URL.</li>
              <li>Paste it here to display live slides on your church projector.</li>
            </ol>
          )}
        </div>
      )}
    </div>
  );
};
