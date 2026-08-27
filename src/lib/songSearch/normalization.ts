/**
 * Unified Normalization and Natural Romanization for Nepali Christian Song Search
 * Used BOTH at build-time (index generation) and at runtime (user query processing).
 */

const VOWEL_MAP: Record<string, string> = {
  "अ": "a", "आ": "aa", "इ": "i", "ई": "i", "उ": "u", "ऊ": "u",
  "ऋ": "ri", "ए": "e", "ऐ": "ai", "ओ": "o", "औ": "au", "अं": "an", "अः": "ah"
};

const MATRA_MAP: Record<string, string> = {
  "ा": "a", "ि": "i", "ी": "i", "ु": "u", "ू": "u",
  "ृ": "ri", "े": "e", "ै": "ai", "ो": "o", "ौ": "au",
  "ं": "n", "ँ": "n", "ः": "h"
};

const CONSONANT_MAP: Record<string, string> = {
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

// Common Nepali word dictionary for natural conversational transliteration
const NATURAL_WORD_REPLACEMENTS: [RegExp, string][] = [
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

/**
 * Converts Devanagari text into natural conversational Roman Nepali
 * e.g. "मेरो हृदयले तपाईंलाई खोज्दछ" -> "mero hridayale tapailai khojchha"
 */
export function romanizeNepaliNatural(devanagariText: string): string {
  if (!devanagariText) return "";

  let working = devanagariText.trim();

  // Apply common high-frequency natural word overrides
  for (const [regex, replacement] of NATURAL_WORD_REPLACEMENTS) {
    working = working.replace(regex, ` ${replacement} `);
  }

  let result = "";
  const len = working.length;

  for (let i = 0; i < len; i++) {
    const char = working[i];
    const nextChar = i + 1 < len ? working[i + 1] : "";

    // 1. Independent Vowel
    if (VOWEL_MAP[char]) {
      result += VOWEL_MAP[char];
      continue;
    }

    // 2. Consonant
    if (CONSONANT_MAP[char]) {
      const base = CONSONANT_MAP[char];

      // Halant (्) -> No inherent vowel
      if (nextChar === VIRAMA) {
        result += base;
        i++; // skip virama
        continue;
      }

      // Matra (Vowel sign)
      if (MATRA_MAP[nextChar]) {
        result += base + MATRA_MAP[nextChar];
        i++; // skip matra
        continue;
      }

      // Inherent 'a' vowel in Nepali
      if (i + 1 === len || /[\s\p{P}]/u.test(nextChar)) {
        result += base;
      } else {
        result += base + "a";
      }
      continue;
    }

    // 3. Standalone Matra fallback
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

/**
 * Strips all Devanagari matras, halants, and modifiers to create a consonant-skeleton
 * e.g. "येशू" -> "यस", "धन्यवाद" -> "धन्यबद"
 */
export function stripDevanagariMatras(text: string): string {
  if (!text) return "";
  return text
    .replace(/[\u093E-\u094C\u094D\u0901-\u0903\u093C]/g, "")
    .replace(/[शष]/g, "स")
    .replace(/[व]/g, "ब")
    .replace(/[ईइ]/g, "इ")
    .replace(/[ऊउ]/g, "उ")
    .replace(/[\s\p{P}]/gu, "");
}

/**
 * Unified search query normalizer for both database indexing and user keystrokes.
 * Ensures consistent fuzzy matching across spelling mistakes & variations.
 */
export function normalizeSearchQuery(input: string): string {
  if (!input) return "";

  let s = input.toLowerCase().trim();

  // Strip punctuation & brackets
  s = s.replace(/[.,/#!$%^&*;:{}=\-_`~()?"'<>।॥]/g, " ");

  // Collapse multiple spaces
  s = s.replace(/\s+/g, " ").trim();

  // Roman phonetic normalization
  s = s
    .replace(/ee/g, "i")
    .replace(/ii/g, "i")
    .replace(/oo/g, "u")
    .replace(/uu/g, "u")
    .replace(/aa/g, "a")
    .replace(/ai/g, "e")
    .replace(/w/g, "v")
    .replace(/b/g, "v") // in dhanyabad vs dhanyawad
    .replace(/sh/g, "s")
    .replace(/kh/g, "k")
    .replace(/gh/g, "g")
    .replace(/th/g, "t")
    .replace(/dh/g, "d")
    .replace(/ph/g, "f")
    .replace(/bh/g, "v")
    .replace(/jh/g, "j")
    .replace(/ch/g, "s")
    .replace(/([a-z])\1+/g, "$1"); // remove duplicated letters: ddhhaanyyabaad -> danyabad

  return s.trim();
}
