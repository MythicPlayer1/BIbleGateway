/**
 * Conversion Script: Migrates from all_nepali_christian_lyrics.json
 * to unified nepali_christian_songs.json with full Bhajan, Chorus, and Artist metadata.
 */

const fs = require("fs");
const path = require("path");

const sourcePath = path.join(__dirname, "..", "public", "all_nepali_christian_lyrics.json");
const targetSrcPath = path.join(__dirname, "..", "src", "data", "nepali_christian_songs.json");
const targetPublicPath = path.join(__dirname, "..", "public", "nepali_christian_songs.json");

// Nepali numbers conversion helper
const NUM_MAP = {
  "0": "०", "1": "१", "2": "२", "3": "३", "4": "४",
  "5": "५", "6": "६", "7": "७", "8": "८", "9": "९"
};

function toNepaliDigits(num) {
  if (num === null || num === undefined) return "";
  return String(num).split("").map((d) => NUM_MAP[d] || d).join("");
}

function toTitleCase(str) {
  if (!str) return "";
  return str
    .replace(/\r/g, "")
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function cleanLyricsText(text) {
  if (!text) return "";
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\[[A-G][b#]?(?:maj|min|m|M|sus|dim|aug|add)?[0-9]?(?:\/[A-G][b#]?)?\]/g, "")
    .replace(/\[[^\]]+\]/g, "") // remove all chord brackets
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s+\n/g, "\n\n")
    .trim();
}

function extractFirstMeaningfulNepaliLine(nepaliLyrics) {
  if (!nepaliLyrics) return "";
  const cleaned = cleanLyricsText(nepaliLyrics);
  const lines = cleaned.split("\n").map((l) => l.trim()).filter(Boolean);

  for (const line of lines) {
    // Skip pure markers like "१:", "१.", "कोरस :", "कोरस", "को."
    const stripped = line.replace(/^([१२३४५६७८९०\d]+[:.]|कोरस\s*[:.]?|को\.|Verse\s*\d+:?|Chorus:?)/i, "").trim();
    const withoutParens = stripped.replace(/^[()（）\s]+|[()（）\s]+$/g, "").trim();
    if (withoutParens.length >= 3 && /[\u0900-\u097F]/.test(withoutParens)) {
      return withoutParens;
    }
  }
  return "";
}

function determineNepaliLetter(nepaliTitle, romanTitle) {
  if (nepaliTitle) {
    const clean = nepaliTitle.replace(/^[()（）"'\s]+/, "");
    const firstChar = clean.charAt(0);
    if (/[\u0900-\u097F]/.test(firstChar)) {
      return firstChar;
    }
  }
  if (romanTitle) {
    const firstChar = romanTitle.trim().charAt(0).toLowerCase();
    if (/[a-z]/.test(firstChar)) {
      return firstChar;
    }
  }
  return "a";
}

function convertDataset() {
  console.log("\n=======================================================");
  console.log("  📦 CONVERTING MAIN NEPALI CHRISTIAN LYRICS DATASET");
  console.log("=======================================================\n");

  const rawData = JSON.parse(fs.readFileSync(sourcePath, "utf-8"));
  console.log(`📊 Metadata:`, rawData.metadata);

  // 1. Build Artist Map
  const artistMap = new Map();
  if (rawData.artists && Array.isArray(rawData.artists)) {
    rawData.artists.forEach((a) => {
      artistMap.set(a.id, a.name.trim());
    });
  }
  console.log(`🎤 Total Artists Mapped: ${artistMap.size}`);

  const convertedSongs = [];

  // 2. Convert Bhajans (848 items)
  if (rawData.bhajans && Array.isArray(rawData.bhajans)) {
    rawData.bhajans.forEach((b, idx) => {
      const bhajanNum = b.songNumber || (idx + 1);
      const bhajanNumNepali = toNepaliDigits(bhajanNum);
      const firstLineNepali = extractFirstMeaningfulNepaliLine(b.nepaliLyrics);

      const rawNameClean = (b.name || "").replace(/\r/g, "").trim();
      const titleEn = rawNameClean
        ? `${toTitleCase(rawNameClean)} (Bhajan ${bhajanNum})`
        : `Bhajan ${bhajanNum}`;

      const titleNepali = firstLineNepali
        ? `${firstLineNepali} (भजन ${bhajanNumNepali})`
        : (rawNameClean ? `${rawNameClean} (भजन ${bhajanNumNepali})` : `भजन ${bhajanNumNepali}`);

      const cleanLyrics = cleanLyricsText(b.nepaliLyrics || "");
      const cleanTranslit = cleanLyricsText(b.translitLyrics || b.romanLyrics || "");

      const detailsParts = [`Bhajan #${bhajanNum}`];
      if (b.mainChords) detailsParts.push(`Key: ${b.mainChords}`);
      if (b.beat) detailsParts.push(`Beat: ${b.beat}`);

      convertedSongs.push({
        id: `bhajan-${bhajanNum}`,
        title: titleNepali,
        title_en: titleEn,
        artist: "Bhajan",
        authors: `[भजन #${bhajanNumNepali}]`,
        details: `[${detailsParts.join(", ")}]`,
        letter: determineNepaliLetter(titleNepali, titleEn),
        category: "bhajan",
        songNumber: bhajanNum,
        mainChords: b.mainChords || undefined,
        beat: b.beat || undefined,
        audioUrl: b.audioUrl || undefined,
        videoUrl: b.videoUrl || undefined,
        rawLyrics: cleanLyrics || b.nepaliLyrics || "",
        chordsLyrics: b.nepaliLyrics || "",
        rawLyrics_en: cleanTranslit || undefined,
        isDefault: true,
        isCustom: false
      });
    });
  }

  console.log(`📖 Converted Bhajans: ${convertedSongs.length}`);
  const bhajanCount = convertedSongs.length;

  // 3. Convert Songs & Choruses (714 items)
  if (rawData.songs && Array.isArray(rawData.songs)) {
    rawData.songs.forEach((s, idx) => {
      const artistName = artistMap.get(s.artist) || "Unknown Artist";
      const firstLineNepali = extractFirstMeaningfulNepaliLine(s.nepaliLyrics);
      const rawNameClean = (s.name || "").replace(/\r/g, "").trim();
      const titleEn = toTitleCase(rawNameClean || firstLineNepali || `Song ${idx + 1}`);

      const titleNepali = firstLineNepali || rawNameClean || `गीत ${idx + 1}`;
      const cleanLyrics = cleanLyricsText(s.nepaliLyrics || "");
      const cleanTranslit = cleanLyricsText(s.translitLyrics || s.romanLyrics || "");

      const isChorus = s.songType === "chorus" || /chorus|कोरस/i.test(s.name || "");
      const category = isChorus ? "chorus" : "artist";

      const detailsParts = [];
      if (artistName && artistName !== "Unknown Artist") detailsParts.push(`Artist: ${artistName}`);
      if (s.mainChords) detailsParts.push(`Key: ${s.mainChords}`);
      if (s.beat) detailsParts.push(`Beat: ${s.beat}`);

      convertedSongs.push({
        id: s.id ? `song-${s.id}` : `song-${idx + 1}`,
        title: titleNepali,
        title_en: titleEn,
        artist: artistName,
        authors: artistName !== "Unknown Artist" ? `[Artist: ${artistName}]` : undefined,
        details: detailsParts.length > 0 ? `[${detailsParts.join(", ")}]` : undefined,
        letter: determineNepaliLetter(titleNepali, titleEn),
        category: category,
        songNumber: s.songNumber || undefined,
        mainChords: s.mainChords || undefined,
        beat: s.beat || undefined,
        audioUrl: s.audioUrl || undefined,
        videoUrl: s.videoUrl || undefined,
        rawLyrics: cleanLyrics || s.nepaliLyrics || "",
        chordsLyrics: s.nepaliLyrics || "",
        rawLyrics_en: cleanTranslit || undefined,
        isDefault: true,
        isCustom: false
      });
    });
  }

  const songCount = convertedSongs.length - bhajanCount;
  console.log(`🎵 Converted Modern Songs / Choruses: ${songCount}`);
  console.log(`🌟 Total Songs in Master Database: ${convertedSongs.length}`);

  // Write to both paths
  fs.writeFileSync(targetSrcPath, JSON.stringify(convertedSongs, null, 2), "utf-8");
  fs.writeFileSync(targetPublicPath, JSON.stringify(convertedSongs, null, 2), "utf-8");

  console.log(`\n✅ Saved unified dataset to:`);
  console.log(`   • ${targetSrcPath}`);
  console.log(`   • ${targetPublicPath}`);

  // Show top samples from both categories
  console.log("\n--- Sample Bhajan ---");
  console.log(JSON.stringify(convertedSongs[0], null, 2));

  console.log("\n--- Sample Modern Song ---");
  console.log(JSON.stringify(convertedSongs[bhajanCount], null, 2));
}

convertDataset();
