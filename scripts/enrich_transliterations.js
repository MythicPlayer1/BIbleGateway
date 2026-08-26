const fs = require('fs');
const path = require('path');

const VOWELS = {
  'अ': 'a', 'आ': 'aa', 'इ': 'i', 'ई': 'ee', 'उ': 'u', 'ऊ': 'oo',
  'ऋ': 'ri', 'ए': 'e', 'ऐ': 'ai', 'ओ': 'o', 'औ': 'au', 'अं': 'am', 'अः': 'ah'
};

const MATRAS = {
  'ा': 'aa', 'ि': 'i', 'ी': 'ee', 'ु': 'u', 'ू': 'oo',
  'ृ': 'ri', 'े': 'e', 'ै': 'ai', 'ो': 'o', 'ौ': 'au',
  'ं': 'n', 'ँ': 'n', 'ः': 'h'
};

const CONSONANTS = {
  'क': 'k', 'ख': 'kh', 'ग': 'g', 'घ': 'gh', 'ङ': 'ng',
  'च': 'ch', 'छ': 'chh', 'ज': 'j', 'झ': 'jh', 'ञ': 'ny',
  'ट': 't', 'ठ': 'th', 'ड': 'd', 'ढ': 'dh', 'ण': 'n',
  'त': 't', 'थ': 'th', 'द': 'd', 'ध': 'dh', 'न': 'n',
  'प': 'p', 'फ': 'ph', 'ब': 'b', 'भ': 'bh', 'म': 'm',
  'य': 'y', 'र': 'r', 'ल': 'l', 'व': 'w',
  'श': 'sh', 'ष': 'sh', 'स': 's', 'ह': 'h',
  'क्ष': 'ksh', 'त्र': 'tr', 'ज्ञ': 'gy'
};

const VIRAMA = '्';

function transliterate(text) {
  if (!text) return '';
  let result = '';
  const len = text.length;

  for (let i = 0; i < len; i++) {
    const char = text[i];
    const nextChar = i + 1 < len ? text[i + 1] : '';

    if (VOWELS[char]) {
      result += VOWELS[char];
      continue;
    }

    if (CONSONANTS[char]) {
      const base = CONSONANTS[char];
      if (nextChar === VIRAMA) {
        result += base;
        i++;
        continue;
      }
      if (MATRAS[nextChar]) {
        result += base + MATRAS[nextChar];
        i++;
        continue;
      }
      if (i + 1 === len || /[\s\p{P}]/u.test(nextChar)) {
        result += base;
      } else {
        result += base + 'a';
      }
      continue;
    }

    if (MATRAS[char]) {
      result += MATRAS[char];
      continue;
    }

    if (char === VIRAMA) continue;

    result += char;
  }

  // Capitalize words for clean English titles
  return result
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function processSongs() {
  const dataPath = path.join(__dirname, '../src/data/nepali_christian_songs.json');
  const songs = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

  console.log(`Processing transliteration for ${songs.length} songs...`);

  const enriched = songs.map(song => {
    const title_en = transliterate(song.title);
    return {
      ...song,
      title_en: title_en
    };
  });

  // Save back to src/data and public
  fs.writeFileSync(dataPath, JSON.stringify(enriched, null, 2), 'utf-8');
  console.log(`Updated: ${dataPath}`);

  const publicPath = path.join(__dirname, '../public/nepali_christian_songs.json');
  fs.writeFileSync(publicPath, JSON.stringify(enriched, null, 2), 'utf-8');
  console.log(`Updated: ${publicPath}`);

  console.log('\n--- Sample Transliterated Songs ---');
  for (let i = 0; i < 5; i++) {
    console.log(`Nepali: ${enriched[i].title}  ==>  English: ${enriched[i].title_en}`);
  }
}

processSongs();
