"use client";

import React, { useState, useRef } from "react";
import { FileText, UploadCloud, Layers, CheckCircle2, AlertCircle, RefreshCw, Eye } from "lucide-react";
import type { PresentationSlide } from "@/lib/lyrics";
import { renderPdfFileToSlides, type PdfRenderProgress } from "@/lib/pdfRenderer";
import type { NewItemDataState } from "@/components/AddItemModal";

interface PdfSlideDeckFormProps {
  newItemData: NewItemDataState;
  setNewItemData: React.Dispatch<React.SetStateAction<NewItemDataState>>;
}

export const PdfSlideDeckForm: React.FC<PdfSlideDeckFormProps> = ({
  newItemData,
  setNewItemData
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<PdfRenderProgress | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [previewSlideIdx, setPreviewSlideIdx] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const slides: PresentationSlide[] = newItemData.presentationSlides || [];

  const handleProcessPdf = async (file: File) => {
    if (!file) return;
    const fileName = file.name.toLowerCase();

    if (fileName.endsWith(".pptx") || fileName.endsWith(".ppt") || fileName.endsWith(".key") || fileName.endsWith(".odp")) {
      setErrorMsg(
        "💡 To project PowerPoint (.pptx) with exact fonts and graphics: Open your PPT in PowerPoint or Google Slides, click File ➔ Save As (or Export) ➔ PDF (.pdf), then drop that PDF file here!"
      );
      return;
    }

    if (!fileName.endsWith(".pdf")) {
      setErrorMsg("Please select a .pdf presentation deck (exported from PowerPoint, Keynote, Canva, or Google Slides).");
      return;
    }

    setErrorMsg(null);
    setIsProcessing(true);
    setProgress({ currentPage: 0, totalPages: 0, percent: 0, status: "Starting PDF extraction..." });

    try {
      const result = await renderPdfFileToSlides(file, (p) => {
        setProgress(p);
      });

      const autoTitle = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");

      setNewItemData((prev) => ({
        ...prev,
        title: prev.title.trim() ? prev.title : autoTitle,
        subtitle: `${result.totalPages} Slides • Presentation Deck`,
        presentationSlides: result.slides,
        pdfFile: file
      }));
      setPreviewSlideIdx(0);
    } catch (err: any) {
      console.error("PDF processing failed:", err);
      setErrorMsg(err.message || "Failed to parse and render PDF slides. Please try another PDF.");
    } finally {
      setIsProcessing(false);
      setProgress(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleProcessPdf(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleProcessPdf(file);
  };

  return (
    <div className="space-y-4">
      {/* Title & Subtitle Header */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-neutral-400 uppercase mb-1">
            Presentation Title
          </label>
          <input
            type="text"
            value={newItemData.title}
            onChange={(e) => setNewItemData((prev) => ({ ...prev, title: e.target.value }))}
            placeholder="e.g. Sunday Sermon - Faith & Hope"
            className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2.5 text-xs md:text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-neutral-400 uppercase mb-1">
            Subtitle / Speaker
          </label>
          <input
            type="text"
            value={newItemData.subtitle}
            onChange={(e) => setNewItemData((prev) => ({ ...prev, subtitle: e.target.value }))}
            placeholder="e.g. Pastor John • 12 Slides"
            className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2.5 text-xs md:text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
          />
        </div>
      </div>

      {/* Upload Zone / Extraction Progress */}
      {slides.length === 0 ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => !isProcessing && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[220px] ${
            isDragging
              ? "border-indigo-500 bg-indigo-950/30 shadow-lg shadow-indigo-500/20"
              : "border-neutral-800 bg-neutral-900/50 hover:bg-neutral-900 hover:border-neutral-700"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.pptx,.ppt,application/pdf"
            onChange={handleFileChange}
            className="hidden"
          />

          {isProcessing ? (
            <div className="w-full max-w-md space-y-3">
              <RefreshCw size={32} className="text-indigo-400 animate-spin mx-auto" />
              <div>
                <p className="text-sm font-bold text-white">Extracting Presentation Slides...</p>
                <p className="text-xs text-neutral-400">{progress?.status}</p>
              </div>
              {/* Progress Bar */}
              <div className="w-full bg-neutral-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-indigo-500 h-full transition-all duration-200 rounded-full"
                  style={{ width: `${progress?.percent || 0}%` }}
                ></div>
              </div>
              <p className="text-[11px] font-mono text-indigo-300">{progress?.percent || 0}% Completed</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="w-12 h-12 rounded-2xl bg-indigo-950/80 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mx-auto">
                <UploadCloud size={24} />
              </div>
              <div>
                <p className="text-sm font-bold text-white">
                  Drop PowerPoint / Keynote PDF deck here
                </p>
                <p className="text-xs text-neutral-400 mt-1">
                  Export your presentation as <strong className="text-neutral-200">.PDF</strong> and upload for 100% offline projection
                </p>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-neutral-800/80 rounded-full text-[11px] font-semibold text-neutral-300 border border-neutral-700">
                <FileText size={13} className="text-indigo-400" />
                <span>Supports PowerPoint, Google Slides, Keynote & Canva PDFs</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Slides Extracted Gallery */
        <div className="space-y-3 bg-neutral-900/60 p-4 rounded-2xl border border-neutral-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers size={16} className="text-indigo-400" />
              <span className="text-xs font-bold text-white">
                Extracted {slides.length} Presentation Slides
              </span>
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              <RefreshCw size={13} />
              Replace PDF
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.pptx,.ppt,application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Active Preview Zoom Box */}
          {slides[previewSlideIdx] && (
            <div className="relative aspect-video w-full max-h-48 bg-black rounded-xl overflow-hidden border border-neutral-800 flex items-center justify-center">
              <img
                src={slides[previewSlideIdx].imageUrl}
                alt={slides[previewSlideIdx].title || `Slide ${previewSlideIdx + 1}`}
                className="w-full h-full object-contain"
              />
              <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/80 rounded text-[10px] font-bold text-white backdrop-blur-md">
                Slide {previewSlideIdx + 1} of {slides.length}
              </div>
            </div>
          )}

          {/* Thumbnail Carousel / Grid */}
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-36 overflow-y-auto p-1">
            {slides.map((s, idx) => (
              <div
                key={s.id}
                onClick={() => setPreviewSlideIdx(idx)}
                className={`relative aspect-video rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                  previewSlideIdx === idx
                    ? "border-indigo-500 ring-2 ring-indigo-500/40 scale-95"
                    : "border-neutral-800 hover:border-neutral-600 opacity-75 hover:opacity-100"
                }`}
              >
                <img
                  src={s.thumbnailUrl || s.imageUrl}
                  alt={`Slide ${s.pageNumber}`}
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-1 right-1 px-1 py-0.2 bg-black/80 rounded text-[9px] font-mono text-white">
                  {s.pageNumber}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2 p-3 bg-red-950/80 border border-red-500/40 rounded-xl text-red-300 text-xs">
          <AlertCircle size={15} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
};
