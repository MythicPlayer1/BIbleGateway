/**
 * Offline / Build-Time Song Search Index Generator
 * Reads raw 2.8 MB nepali_christian_songs.json, applies natural Romanization and tokenization,
 * and generates a compact, high-speed song_search_index.json (~300 KB).
 */

const fs = require("fs");
const path = require("path");

const VOWEL_MAP = {
  "अ": "a", "आ": "aa", "इ": "i", "ई": "i", "उ": "u", "ऊ": "u",
  "ऋ": "ri", "ए": "e", "ऐ": "ai", "ओ": "o", "औ": "au", "अं": "an", "अः": "ah"
};

const MATRA_MAP = {
  "ा": "a", "ि": "i", "ी": "i", "ु": "u", "ू": "u",
  "ृ": "ri", "े": "e", "ै": "ai", "ो": "o", "ौ": "au",
  "ं": "n", "ँ": "n", "ः": "h"
};

const CONSONANT_MAP = {
  "क": "k", "ख": "kh", "ग": "g", "घ": "gh", "ङ": "ng",
  "च": "ch", "छ": "chh", "ज": "j", "झ": "jh", "ञ": "ny",
  "ट": "t", "ठ": "th", "ड": "d", "ढ": "dh", "ण": "n",
  "त": "t", "थ": "th", "द": "d", "ध": "dh", "न": "n",
  "प": "p", "फ": "ph", "ब": "b", "भ": "bh", "म": "m",
  "य": "y", "र": "r", "ल": "l", "व": "w",
  "श": "sh", "ष": "sh", "स": "s", "ह": "h",
  "क्ष": "chha", "त्र": "tra", "ज्ञ": "gya"
};

const VIRAMA = "्";

const NATURAL_WORD_REPLACEMENTS = [
  [/तपाईंलाई|तपाइलाई|तपाईलाई/g, "tapailai"],
  [/तपाईं|तपाइ/g, "tapaai"],
  [/धन्यवाद/g, "dhanyabad"],
  [/हृदयले/g, "hridayale"],
  [/हृदय/g, "hridaya"],
  [/येशूको|येशुको/g, "yeshuko"],
  [/येशू|येशु|यीशु|यिशु/g, "yeshu"],
  [/प्रभुको/g, "prabhuko"],
  [/प्रभु/g, "prabhu"],
  [/महिमा/g, "mahima"],
  [/ख्रीष्टीय|ख्रिष्टीय/g, "khristiya"],
  [/ख्रीष्टको|ख्रिष्टको/g, "khristko"],
  [/ख्रीष्ट|ख्रिष्ट/g, "khrist"],
  [/ईश्वर|इश्वर/g, "ishwor"],
  [/हाल्लेलूयाह|हल्लेलूयाह|हाल्लेलुयाह|हल्लेलुयाह/g, "hallelujah"],
  [/होसन्ना|होसाना/g, "hosanna"],
  [/अनुग्रह/g, "anugraha"],
  [/मुक्तिदाता/g, "muktidata"],
  [/मुक्ति/g, "mukti"],
  [/पवित्र/g, "pavitra"],
  [/शान्ति/g, "shanti"],
  [/आशिष/g, "ashish"],
  [/प्रार्थना/g, "prarthana"],
  [/स्वर्ग/g, "swarga"],
  [/क्रूस/g, "krus"],
  [/खोच्दछ|खोज्दछ/g, "khojchha"],
  [/गाउँछु|गाउछु/g, "gaauchhu"],
  [/गाऔँ|गाऔ/g, "gaaun"],
  [/उचाल्छु/g, "uchalchhu"],
  [/आनन्दित/g, "aanandit"],
  [/आनन्द/g, "aananda"],
  [/खुशी|खुसी/g, "khushi"],
  [/स्तुति/g, "stuti"],
  [/प्रशंसा/g, "prashansa"],
  [/आराधना/g, "aaradhana"],
  [/राजा/g, "raja"],
  [/प्रेम/g, "prem"],
  [/हाम्रो/g, "hamro"],
  [/मेरो/g, "mero"],
  [/तेरो/g, "tero"]
];

function romanizeNepaliNatural(devanagariText) {
  if (!devanagariText) return "";

  let working = devanagariText.trim();
  for (const [regex, replacement] of NATURAL_WORD_REPLACEMENTS) {
    working = working.replace(regex, ` ${replacement} `);
  }

  let result = "";
  const len = working.length;

  for (let i = 0; i < len; i++) {
    const char = working[i];
    const nextChar = i + 1 < len ? working[i + 1] : "";

    if (VOWEL_MAP[char]) {
      result += VOWEL_MAP[char];
      continue;
    }

    if (CONSONANT_MAP[char]) {
      const base = CONSONANT_MAP[char];
      if (nextChar === VIRAMA) {
        result += base;
        i++;
        continue;
      }
      if (MATRA_MAP[nextChar]) {
        result += base + MATRA_MAP[nextChar];
        i++;
        continue;
      }
      if (i + 1 === len || /[\s\p{P}]/u.test(nextChar)) {
        result += base;
      } else {
        result += base + "a";
      }
      continue;
    }

    if (MATRA_MAP[char]) {
      result += MATRA_MAP[char];
      continue;
    }

    if (char === VIRAMA) continue;
    result += char;
  }

  return result
    .toLowerCase()
    .replace(/aa/g, "a")
    .replace(/ee/g, "i")
    .replace(/oo/g, "u")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeSearchQuery(input) {
  if (!input) return "";
  let s = input.toLowerCase().trim();
  s = s.replace(/[.,/#!$%^&*;:{}=\-_`~()?"'<>।॥]/g, " ");
  s = s.replace(/\s+/g, " ").trim();
  s = s
    .replace(/ee/g, "i")
    .replace(/ii/g, "i")
    .replace(/oo/g, "u")
    .replace(/uu/g, "u")
    .replace(/aa/g, "a")
    .replace(/ai/g, "e")
    .replace(/w/g, "v")
    .replace(/b/g, "v")
    .replace(/sh/g, "s")
    .replace(/kh/g, "k")
    .replace(/gh/g, "g")
    .replace(/th/g, "t")
    .replace(/dh/g, "d")
    .replace(/ph/g, "f")
    .replace(/bh/g, "v")
    .replace(/jh/g, "j")
    .replace(/ch/g, "s")
    .replace(/([a-z])\1+/g, "$1");
  return s.trim();
}

function extractHymnalAliases(details, songId) {
  const aliases = new Set();
  if (songId) {
    aliases.add(songId.toLowerCase());
    const num = songId.replace(/[^0-9]/g, "");
    if (num) aliases.add(num);
  }

  if (details) {
    // Extract codes like kb:s140, sz:s190, sd:c100
    const matches = details.match(/([a-zA-Z0-9]+:[a-zA-Z0-9]+)/g);
    if (matches) {
      matches.forEach((m) => {
        aliases.add(m.toLowerCase());
        const cleaned = m.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
        aliases.add(cleaned);
        const codeNum = m.replace(/[^0-9]/g, "");
        if (codeNum) aliases.add(codeNum);
      });
    }
  }

  return Array.from(aliases);
}

function buildIndex() {
  const startTime = Date.now();
  const rawPath = path.join(__dirname, "..", "src", "data", "nepali_christian_songs.json");
  const outputPath = path.join(__dirname, "..", "src", "data", "song_search_index.json");

  console.log(`\n📦 Reading raw dataset from: ${rawPath}`);
  const rawData = JSON.parse(fs.readFileSync(rawPath, "utf-8"));
  console.log(`🎵 Total songs found: ${rawData.length}`);

  const searchIndex = rawData.map((song) => {
    const rawTitle = song.title || "";
    const naturalRomanTitle = song.title_en || romanizeNepaliNatural(rawTitle);
    const artistStr = song.artist || "";
    const searchNormalized = normalizeSearchQuery(`${rawTitle} ${naturalRomanTitle} ${artistStr}`);
    const hymnalAliases = extractHymnalAliases(song.details, song.id);

    if (song.songNumber) {
      hymnalAliases.push(`bhajan ${song.songNumber}`);
      hymnalAliases.push(`bhajan #${song.songNumber}`);
      hymnalAliases.push(`b${song.songNumber}`);
      hymnalAliases.push(String(song.songNumber));
    }

    if (artistStr) {
      hymnalAliases.push(artistStr.toLowerCase());
      hymnalAliases.push(normalizeSearchQuery(artistStr));
    }

    // Extract first hook line from lyrics for chorus searching
    let firstLyricLine = "";
    const lyricsSource = song.rawLyrics || song.lyrics || "";
    if (lyricsSource) {
      const lines = lyricsSource.split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("को.") && !l.startsWith("१."));
      if (lines.length > 0) {
        firstLyricLine = romanizeNepaliNatural(lines[0].substring(0, 50));
      }
    }

    const aliases = Array.from(new Set([
      ...hymnalAliases,
      ...(firstLyricLine ? [firstLyricLine] : []),
      ...(song.title_en ? [song.title_en.toLowerCase()] : [])
    ]));

    return {
      id: song.id,
      title: rawTitle,
      title_roman: naturalRomanTitle,
      search_normalized: searchNormalized,
      aliases: aliases.join(" "),
      letter: song.letter || "",
      category: song.category || "artist",
      artist: artistStr,
      songNumber: song.songNumber || undefined
    };
  });

  fs.writeFileSync(outputPath, JSON.stringify(searchIndex), "utf-8");

  const elapsed = Date.now() - startTime;
  const rawSizeBytes = fs.statSync(rawPath).size;
  const indexSizeBytes = fs.statSync(outputPath).size;

  console.log(`✅ Index successfully built in ${elapsed}ms!`);
  console.log(`📊 Raw dataset size: ${(rawSizeBytes / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`⚡ Search index size: ${(indexSizeBytes / 1024).toFixed(2)} KB (Reduced by ${(100 - (indexSizeBytes / rawSizeBytes) * 100).toFixed(1)}%)`);
  console.log(`📁 Saved to: ${outputPath}\n`);
}

buildIndex();
