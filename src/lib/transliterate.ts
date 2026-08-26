// Devanagari to Roman transliteration mapping dictionary

const VOWELS: Record<string, string> = {
  'अ': 'a', 'आ': 'aa', 'इ': 'i', 'ई': 'ee', 'उ': 'u', 'ऊ': 'oo',
  'ऋ': 'ri', 'ए': 'e', 'ऐ': 'ai', 'ओ': 'o', 'औ': 'au', 'अं': 'am', 'अः': 'ah'
};

const MATRAS: Record<string, string> = {
  'ा': 'aa', 'ि': 'i', 'ी': 'ee', 'ु': 'u', 'ू': 'oo',
  'ृ': 'ri', 'े': 'e', 'ै': 'ai', 'ो': 'o', 'ौ': 'au',
  'ं': 'n', 'ँ': 'n', 'ः': 'h'
};

const CONSONANTS: Record<string, string> = {
  'क': 'k', 'ख': 'kh', 'ग': 'g', 'घ': 'gh', 'ङ': 'ng',
  'च': 'ch', 'छ': 'chh', 'ज': 'j', 'झ': 'jh', 'ञ': 'ny',
  'ट': 't', 'ठ': 'th', 'ड': 'd', 'ढ': 'dh', 'ण': 'n',
  'त': 't', 'थ': 'th', 'द': 'd', 'ध': 'dh', 'न': 'n',
  'प': 'p', 'फ': 'ph', 'ब': 'b', 'भ': 'bh', 'म': 'm',
  'य': 'y', 'र': 'r', 'ल': 'l', 'व': 'w',
  'श': 'sh', 'ष': 'sh', 'स': 's', 'ह': 'h',
  'क्ष': 'ksh', 'त्र': 'tr', 'ज्ञ': 'gy'
};

const VIRAMA = '्'; // Halant

export function transliterateDevanagari(text: string): string {
  if (!text) return '';

  let result = '';
  const len = text.length;

  for (let i = 0; i < len; i++) {
    const char = text[i];
    const nextChar = i + 1 < len ? text[i + 1] : '';

    // Check independent vowels
    if (VOWELS[char]) {
      result += VOWELS[char];
      continue;
    }

    // Check consonants
    if (CONSONANTS[char]) {
      const base = CONSONANTS[char];

      // If followed by Virama (्), no inherent vowel 'a'
      if (nextChar === VIRAMA) {
        result += base;
        i++; // Skip virama
        continue;
      }

      // If followed by a matra (vowel sign)
      if (MATRAS[nextChar]) {
        result += base + MATRAS[nextChar];
        i++; // Skip matra
        continue;
      }

      // Inherent 'a' vowel in Nepali
      // If at end of word or before space/punctuation, often silent or soft 'a'
      if (i + 1 === len || /[\s\p{P}]/u.test(nextChar)) {
        result += base;
      } else {
        result += base + 'a';
      }
      continue;
    }

    // Matra without consonant (rare fallback)
    if (MATRAS[char]) {
      result += MATRAS[char];
      continue;
    }

    if (char === VIRAMA) {
      continue;
    }

    // Numbers & English/Punctuation
    result += char;
  }

  // Post-process to make it sound natural and readable in English
  return result
    .replace(/ee/g, 'i')
    .replace(/oo/g, 'u')
    .replace(/aa/g, 'a')
    .replace(/([a-z])\1+/gi, '$1') // remove triple repeats
    .replace(/\s+/g, ' ')
    .trim();
}

// Generate phonetic search variations (e.g. yeshu / yesu, khristiya / kristiya, dhanyabad / dhanyabaad)
export function normalizeSearchString(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\u0900-\u097F\s]/g, '')
    .replace(/ee/g, 'i')
    .replace(/oo/g, 'u')
    .replace(/aa/g, 'a')
    .replace(/sh/g, 's')
    .replace(/kh/g, 'k')
    .replace(/ph/g, 'f')
    .replace(/bh/g, 'b')
    .replace(/dh/g, 'd')
    .replace(/th/g, 't')
    .replace(/v/g, 'w')
    .replace(/\s+/g, ' ')
    .trim();
}

export const nepaliToRoman = transliterateDevanagari;

export function romanToDevanagariExactMatch(text: string): string {
  return normalizeSearchString(text);
}

