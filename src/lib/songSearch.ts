/**
 * High-Precision Multi-Layer Search Engine for Nepali Christian Songs
 * Supports:
 * 1. Pure Devanagari search (with or without matras / halants)
 * 2. Romanized English search with phonetic flexibility (dhanyabad == dhanyawaad == dhanyavad)
 * 3. Multi-word search (e.g. "dhanyabad yeshu", "mero prabhu")
 * 4. Hymnal code & number search (e.g. "140", "kb:140", "s140")
 * 5. Fast relevance scoring and ranking
 */

import type { Song } from "./lyrics";

// 1. Remove all Devanagari vowel signs / matras / diacritics for stem comparison
export function stripDevanagariMatras(text: string): string {
  if (!text) return "";
  return text
    .replace(/[\u093E-\u094C\u094D\u0901-\u0903\u093C]/g, "") // remove aa, i, ee, u, oo, e, ai, o, au, halant, chandrabindu, anusvara, nukta
    .replace(/[शष]/g, "स")
    .replace(/[व]/g, "ब")
    .replace(/[ईइ]/g, "इ")
    .replace(/[ऊउ]/g, "उ")
    .replace(/[\s\p{P}]/gu, "");
}

// 2. Normalize Romanized English phonetics
export function normalizePhonetic(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    // Double vowels to single
    .replace(/ee/g, "i")
    .replace(/oo/g, "u")
    .replace(/aa/g, "a")
    .replace(/ii/g, "i")
    .replace(/uu/g, "u")
    .replace(/ai/g, "e")
    .replace(/au/g, "o")
    // Interchangeable consonants
    .replace(/w/g, "v")
    .replace(/b/g, "v")
    .replace(/sh/g, "s")
    .replace(/ch/g, "s")
    .replace(/kh/g, "k")
    .replace(/gh/g, "g")
    .replace(/th/g, "t")
    .replace(/dh/g, "d")
    .replace(/ph/g, "f")
    .replace(/bh/g, "v")
    .replace(/jh/g, "j")
    .replace(/([a-z])\1+/g, "$1"); // remove duplicate adjacent letters
}

// 3. Roman to Devanagari character/syllable mapping for direct typing
const ROMAN_TO_DEVANAGARI_MAP: [RegExp, string][] = [
  // Common church keywords
  [/dhanyabaad|dhanyawad|dhanyabad|dhanyawaad/gi, "धन्यवाद"],
  [/hallelujah|halleluiah|halleluyah/gi, "हल्लेलूयाह"],
  [/hosanna|hosana/gi, "होसन्ना"],
  [/khristiya|khristiy|kristiya|kristiy/gi, "ख्रीष्टीय"],
  [/khrist|krist/gi, "ख्रीष्ट"],
  [/yeshu|yesu|eeshu/gi, "येशू"],
  [/prabhu|prabu/gi, "प्रभु"],
  [/mahima/gi, "महिमा"],
  [/iswor|ishwar|ishwor|iswar/gi, "ईश्वर"],
  [/anugraha|anugrah/gi, "अनुग्रह"],
  [/muktidata|muktidaata/gi, "मुक्तिदाता"],
  [/mukti/gi, "मुक्ति"],
  [/pavitra|pawitra/gi, "पवित्र"],
  [/shanti/gi, "शान्ति"],
  [/aashish|ashish/gi, "आशिष"],
  [/praarthana|prarthana/gi, "प्रार्थना"],
  [/swarga|swarg/gi, "स्वर्ग"],
  [/krus|krush/gi, "क्रूस"],
  [/aaja/gi, "आज"],
  [/hamro/gi, "हाम्रो"],
  [/mero/gi, "मेरो"],
  [/tero/gi, "तेरो"],
  [/raja/gi, "राजा"],
  [/prem/gi, "प्रेम"],
  [/aao|aau/gi, "आऊ"],
  [/gaao|gaau/gi, "गाऔं"],

  // Consonant clusters
  [/ksha/gi, "क्ष"], [/gya/gi, "ज्ञ"], [/tra/gi, "त्र"],
  [/sh/gi, "श"], [/kh/gi, "ख"], [/gh/gi, "घ"], [/ch/gi, "च"],
  [/jh/gi, "झ"], [/th/gi, "थ"], [/dh/gi, "ध"], [/ph/gi, "फ"],
  [/bh/gi, "भ"], [/ng/gi, "ङ"], [/ny/gi, "ञ"],
  
  // Single consonants
  [/k/gi, "क"], [/g/gi, "ग"], [/c/gi, "क"], [/j/gi, "ज"],
  [/t/gi, "त"], [/d/gi, "द"], [/n/gi, "न"], [/p/gi, "प"],
  [/f/gi, "फ"], [/b/gi, "ब"], [/m/gi, "म"], [/y/gi, "य"],
  [/r/gi, "र"], [/l/gi, "ल"], [/v/gi, "व"], [/w/gi, "व"],
  [/s/gi, "स"], [/h/gi, "ह"]
];

export function romanToDevanagariApprox(romanText: string): string {
  if (!romanText) return "";
  let result = romanText.toLowerCase();
  for (const [regex, devanagari] of ROMAN_TO_DEVANAGARI_MAP) {
    result = result.replace(regex, devanagari);
  }
  return result;
}

/**
 * Searches and scores a song against search queries
 */
export function matchAndScoreSong(song: Song, rawQuery: string): number {
  if (!rawQuery.trim()) return 1;

  const query = rawQuery.trim().toLowerCase();
  const queryTokens = query.split(/\s+/).filter(Boolean);
  const isDevanagariQuery = /[\u0900-\u097F]/.test(query);

  const title = (song.title || "").toLowerCase();
  const titleEn = (song.title_en || "").toLowerCase();
  const lyrics = (song.rawLyrics || (song as any).lyrics || "").toLowerCase();
  const lyricsEn = (song.rawLyrics_en || "").toLowerCase();
  const details = (song.details || "").toLowerCase();
  const songId = (song.id || "").toLowerCase();
  const authors = (song.authors || song.artist || "").toLowerCase();

  let score = 0;

  // 1. Direct Number / Song ID / Hymnal Code Match (e.g. "140", "kb:s140", "song3")
  const numericOnly = query.replace(/[^0-9]/g, "");
  if (numericOnly) {
    if (details.includes(query) || details.includes(`:s${numericOnly}`) || details.includes(`:${numericOnly}`)) {
      return 1500;
    }
    if (songId === query || songId === `song${numericOnly}` || songId.includes(numericOnly)) {
      score += 600;
    }
  }

  // 2. Exact Title Match
  if (title === query || titleEn === query) {
    return 2000;
  }

  // 3. Title Starts With
  if (title.startsWith(query) || titleEn.startsWith(query)) {
    score += 800;
  }

  // 4. Title Contains Full Query
  if (title.includes(query) || titleEn.includes(query)) {
    score += 500;
  }

  // 5. Lyrics Contains Full Query
  if (lyrics.includes(query) || lyricsEn.includes(query)) {
    score += 250;
  }

  // 6. Authors or Details match
  if (authors.includes(query) || details.includes(query)) {
    score += 200;
  }

  // 7. Multi-Token / Word-by-Word Matching
  if (queryTokens.length > 1) {
    let allTokensInTitle = true;
    let allTokensInSong = true;

    for (const token of queryTokens) {
      const inTitle = title.includes(token) || titleEn.includes(token);
      const inSong = inTitle || lyrics.includes(token) || lyricsEn.includes(token);
      if (!inTitle) allTokensInTitle = false;
      if (!inSong) allTokensInSong = false;
    }

    if (allTokensInTitle) score += 600;
    else if (allTokensInSong) score += 300;
  }

  // 8. Phonetic & Transliteration Fuzzy Matching
  const queryPhonetic = normalizePhonetic(query);
  const titlePhonetic = normalizePhonetic(titleEn || title);

  if (queryPhonetic && titlePhonetic) {
    if (titlePhonetic.startsWith(queryPhonetic)) {
      score += 400;
    } else if (titlePhonetic.includes(queryPhonetic)) {
      score += 250;
    }
  }

  // 9. Devanagari Stem / Matra-less Matching
  if (isDevanagariQuery) {
    const queryStem = stripDevanagariMatras(query);
    const titleStem = stripDevanagariMatras(title);
    if (queryStem && titleStem && titleStem.includes(queryStem)) {
      score += 350;
    }
  } else {
    // Convert Roman query to approx Devanagari and search
    const devanagariApprox = romanToDevanagariApprox(query);
    if (devanagariApprox && /[\u0900-\u097F]/.test(devanagariApprox)) {
      const approxStem = stripDevanagariMatras(devanagariApprox);
      const titleStem = stripDevanagariMatras(title);
      if (approxStem && titleStem && titleStem.includes(approxStem)) {
        score += 300;
      }
    }
  }

  return score;
}

/**
 * Filter and sort songs using the multi-layer search engine
 */
export function searchAndRankSongs(
  songs: Song[],
  query: string,
  selectedLetter?: string
): Song[] {
  const trimmedQuery = query.trim();

  // If no search query, filter by letter only
  if (!trimmedQuery) {
    if (!selectedLetter) return songs;
    const l = selectedLetter.toLowerCase();
    return songs.filter((s) => {
      const letterMatch = s.letter && s.letter.toLowerCase() === l;
      const titleMatch = (s.title || "").startsWith(selectedLetter);
      const romanMatch = (s.title_en || "").toLowerCase().startsWith(l);
      return letterMatch || titleMatch || romanMatch;
    });
  }

  // When search query is active, search across ALL songs with scoring
  const scoredSongs: { song: Song; score: number }[] = [];

  for (const song of songs) {
    const score = matchAndScoreSong(song, trimmedQuery);
    if (score > 0) {
      scoredSongs.push({ song, score });
    }
  }

  // Sort by highest score first
  scoredSongs.sort((a, b) => b.score - a.score);

  return scoredSongs.map((item) => item.song);
}
