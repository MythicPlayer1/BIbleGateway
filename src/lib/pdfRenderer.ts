"use client";

import * as pdfjsLib from "pdfjs-dist";
import type { PresentationSlide } from "./lyrics";

// Configure PDF.js worker in browser environment
function initPdfWorker() {
  if (typeof window === "undefined") return;
  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    // Use unpkg CDN matching installed version with reliable fallback
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || "4.10.38"}/build/pdf.worker.min.mjs`;
  }
}

export interface PdfRenderProgress {
  currentPage: number;
  totalPages: number;
  percent: number;
  status: string;
}

export interface RenderedPdfDeck {
  fileName: string;
  totalPages: number;
  slides: PresentationSlide[];
}

/**
 * Render a single PDF page to a base64 JPEG data URL
 */
async function renderPageToDataUrl(
  page: any,
  scale: number,
  quality: number = 0.88
): Promise<string> {
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { alpha: false });

  if (!context) {
    throw new Error("Could not get 2D context from canvas");
  }

  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);

  // Fill crisp black background before rendering
  context.fillStyle = "#000000";
  context.fillRect(0, 0, canvas.width, canvas.height);

  const renderContext = {
    canvasContext: context,
    viewport: viewport,
  };

  await page.render(renderContext).promise;
  return canvas.toDataURL("image/jpeg", quality);
}

/**
 * Extracts and converts all pages of a PDF File into high-DPI presentation slides
 */
export async function renderPdfFileToSlides(
  file: File,
  onProgress?: (progress: PdfRenderProgress) => void
): Promise<RenderedPdfDeck> {
  initPdfWorker();

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || "4.10.38"}/cmaps/`,
    cMapPacked: true,
  });

  const pdfDoc = await loadingTask.promise;
  const totalPages = pdfDoc.numPages;
  const slides: PresentationSlide[] = [];

  const baseTitle = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    if (onProgress) {
      onProgress({
        currentPage: pageNum,
        totalPages,
        percent: Math.round((pageNum / totalPages) * 100),
        status: `Rendering slide ${pageNum} of ${totalPages}...`,
      });
    }

    const page = await pdfDoc.getPage(pageNum);
    
    // High-resolution slide (2.0 scale for crisp projection)
    const imageUrl = await renderPageToDataUrl(page, 2.0, 0.90);
    // Lightweight thumbnail for grid preview
    const thumbnailUrl = await renderPageToDataUrl(page, 0.45, 0.75);

    slides.push({
      id: `slide-p${pageNum}-${Date.now()}`,
      pageNumber: pageNum,
      imageUrl,
      thumbnailUrl,
      title: `${baseTitle} - Slide ${pageNum}`,
    });
  }

  return {
    fileName: file.name,
    totalPages,
    slides,
  };
}
