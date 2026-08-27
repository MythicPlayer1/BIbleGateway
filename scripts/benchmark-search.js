/**
 * Automated Performance & Accuracy Benchmark for Fast Nepali Song Search Engine
 * Highly Optimized with Precomputed Tokens and Fast Token-Scanning + Zero-Result Fallback
 */

const fs = require("fs");
const path = require("path");
const Fuse = require("fuse.js");

const indexData = JSON.parse(
  fs.readFileSync(path.join(__dirname, "..", "src", "data", "song_search_index.json"), "utf-8")
);

console.log("\n=======================================================");
console.log("  🚀 BENCHMARK: FAST NEPALI SONG SEARCH ENGINE");
console.log("=======================================================\n");

// 1. Measure Index Initialization
const initStart = performance.now();
const fuse = new Fuse(
  indexData,
  {
    keys: [
      { name: "title", weight: 0.45 },
      { name: "title_roman", weight: 0.35 },
      { name: "aliases", weight: 0.15 },
      { name: "search_normalized", weight: 0.05 }
    ],
    threshold: 0.35,
    ignoreLocation: true,
    includeScore: true,
    shouldSort: true,
    minMatchCharLength: 2
  }
);
const initTime = performance.now() - initStart;

console.log(`📦 Loaded ${indexData.length} indexed songs in: ${initTime.toFixed(2)} ms`);
console.log(`🎯 Target (< 500ms): ${initTime < 500 ? "PASSED ✅" : "FAILED ❌"}\n`);

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

function search(query, limit = 20) {
  const rawQuery = query.trim();
  const normalized = normalizeSearchQuery(rawQuery);
  const numericOnly = rawQuery.replace(/[^0-9]/g, "");
  const tokens = normalized.split(/\s+/).filter(Boolean);

  const exactMatches = [];
  const tokenMatches = [];
  const matchedSet = new Set();

  // Pass 1: Direct, Prefix & Multi-Token Substring Scan (< 1-2ms)
  for (const item of indexData) {
    if (numericOnly && (item.aliases.includes(rawQuery.toLowerCase()) || item.aliases.includes(numericOnly))) {
      if (!matchedSet.has(item.id)) {
        matchedSet.add(item.id);
        exactMatches.push(item);
      }
      continue;
    }

    if (item.title === rawQuery || item.title_roman === normalized) {
      if (!matchedSet.has(item.id)) {
        matchedSet.add(item.id);
        exactMatches.push(item);
      }
      continue;
    }

    if (item.title.startsWith(rawQuery) || item.title_roman.startsWith(normalized)) {
      if (!matchedSet.has(item.id)) {
        matchedSet.add(item.id);
        tokenMatches.push(item);
      }
      continue;
    }

    // Check if all search tokens match in normalized field or aliases
    if (tokens.length > 0) {
      const allInItem = tokens.every(
        (t) =>
          item.search_normalized.includes(t) ||
          item.title_roman.includes(t) ||
          item.title.includes(t) ||
          item.aliases.includes(t)
      );
      if (allInItem) {
        if (!matchedSet.has(item.id)) {
          matchedSet.add(item.id);
          tokenMatches.push(item);
        }
      }
    }
  }

  let finalMatches = [...exactMatches, ...tokenMatches];

  // Pass 2: Fuzzy fallback via Fuse.js ONLY if 0 exact/token matches found
  if (finalMatches.length === 0 && normalized.length >= 2) {
    const fuseRes = fuse.search(normalized, { limit });
    for (const r of fuseRes) {
      if (!matchedSet.has(r.item.id)) {
        matchedSet.add(r.item.id);
        finalMatches.push(r.item);
      }
    }
  }

  return finalMatches.slice(0, limit);
}

// Benchmark Test Suite
const testCases = [
  { name: "1-Character Query", query: "m", minMatches: 5 },
  { name: "3-Character Query", query: "mer", minMatches: 5 },
  { name: "Conversational Roman Query", query: "mero hridayale", minMatches: 1 },
  { name: "Conversational Roman Query", query: "tapailai khojchha", minMatches: 1 },
  { name: "High-Frequency Church Keyword", query: "dhanyabad", minMatches: 3 },
  { name: "Phonetic Spelling Variation", query: "dhanyawaad", minMatches: 3 },
  { name: "Typo Tolerant Search", query: "danyabad", minMatches: 3 },
  { name: "Typo Tolerant Search", query: "kristiya", minMatches: 3 },
  { name: "Pure Devanagari Query", query: "येशू", minMatches: 5 },
  { name: "Pure Devanagari Query", query: "धन्यवाद", minMatches: 5 },
  { name: "Pure Devanagari Query", query: "महिमा", minMatches: 3 },
  { name: "Hymnal Code Search", query: "kb:140", minMatches: 1 },
  { name: "Hymnal Number Search", query: "140", minMatches: 1 },
  { name: "Song ID Search", query: "song1924", minMatches: 1 }
];

let totalTime = 0;
let passCount = 0;

console.log("----------------------------------------------------------------------------------");
console.log(String("Test Case").padEnd(30) + String("Query").padEnd(20) + String("Matches").padEnd(10) + String("Time (ms)").padEnd(12) + "Status");
console.log("----------------------------------------------------------------------------------");

testCases.forEach((tc) => {
  const start = performance.now();
  const results = search(tc.query, 20);
  const duration = performance.now() - start;
  totalTime += duration;

  const passed = results.length >= tc.minMatches && duration < 20;
  if (passed) passCount++;

  console.log(
    tc.name.padEnd(30) +
    `"${tc.query}"`.padEnd(20) +
    `${results.length}`.padEnd(10) +
    `${duration.toFixed(2)} ms`.padEnd(12) +
    (passed ? "✅ PASS" : "❌ FAIL")
  );
});

const avgTime = totalTime / testCases.length;

console.log("----------------------------------------------------------------------------------");
console.log(`\n📊 BENCHMARK SUMMARY:`);
console.log(`   • Total Tests: ${testCases.length}`);
console.log(`   • Passed: ${passCount} / ${testCases.length}`);
console.log(`   • Average Query Time: ${avgTime.toFixed(2)} ms (Target: < 20-50 ms)`);
console.log(`   • Status: ${passCount === testCases.length ? "ALL TESTS PASSED 🚀" : "SOME TESTS FAILED ⚠️"}\n`);
