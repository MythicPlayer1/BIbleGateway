/**
 * Dataset-Wide Natural Roman Nepali Title Generator (Refined & Perfected)
 * Transliterates all titles from Devanagari to natural, standard Roman Nepali
 * and updates both src/data/nepali_christian_songs.json and public/nepali_christian_songs.json.
 */

const fs = require("fs");
const path = require("path");

// Nepali numbers to Arabic numerals
const NUM_MAP = {
  "०": "0", "१": "1", "२": "2", "३": "3", "४": "4",
  "५": "5", "६": "6", "७": "7", "८": "8", "९": "9"
};

// Independent vowels
const VOWEL_MAP = {
  "अ": "a", "आ": "aa", "इ": "i", "ई": "i", "उ": "u", "ऊ": "u",
  "ऋ": "ri", "ए": "e", "ऐ": "ai", "ओ": "o", "औ": "au", "अं": "an", "अः": "ah"
};

// Matras (Vowel signs)
const MATRA_MAP = {
  "ा": "a", "ि": "i", "ी": "i", "ु": "u", "ू": "u",
  "ृ": "ri", "े": "e", "ै": "ai", "ो": "o", "ौ": "au",
  "ं": "n", "ँ": "n", "ः": "h"
};

// Consonants
const CONSONANT_MAP = {
  "क": "k", "ख": "kh", "ग": "g", "घ": "gh", "ङ": "ng",
  "च": "ch", "छ": "chh", "ज": "j", "झ": "jh", "ञ": "ny",
  "ट": "t", "ठ": "th", "ड": "d", "ढ": "dh", "ण": "n",
  "त": "t", "थ": "th", "द": "d", "ध": "dh", "न": "n",
  "प": "p", "फ": "ph", "ब": "b", "भ": "bh", "म": "m",
  "य": "y", "र": "r", "ल": "l", "व": "w",
  "श": "sh", "ष": "sh", "स": "s", "ह": "h",
  "क्ष": "ksh", "त्र": "tr", "ज्ञ": "gy"
};

const VIRAMA = "्";

// High-frequency Church & Nepali word lexicon (exact word replacements in Title Case)
const DICTIONARY = new Map([
  // Pronouns & Postpositions
  ["तपाईंलाई", "Tapailai"],
  ["तपाइलाई", "Tapailai"],
  ["तपाईलाई", "Tapailai"],
  ["तपाईंको", "Tapaiko"],
  ["तपाइको", "Tapaiko"],
  ["तपाईको", "Tapaiko"],
  ["तपाईंमा", "Tapaima"],
  ["तपाईं", "Tapai"],
  ["तपाइ", "Tapai"],
  ["तपाई", "Tapai"],
  ["हामीलाई", "Hamilai"],
  ["हाम्रो", "Hamro"],
  ["हाम्रा", "Hamra"],
  ["हामी", "Hami"],
  ["मलाई", "Malai"],
  ["मेरो", "Mero"],
  ["मेरा", "Mera"],
  ["मेरी", "Meri"],
  ["म", "Ma"],
  ["तिमीलाई", "Timilai"],
  ["तिम्रो", "Timro"],
  ["तिम्रा", "Timra"],
  ["तिमी", "Timi"],
  ["उनलाई", "Unlai"],
  ["उनको", "Unko"],
  ["उनका", "Unka"],
  ["उनी", "Uni"],
  ["उसलाई", "Uslai"],
  ["उसको", "Usko"],
  ["सबैलाई", "Sabailai"],
  ["सबैले", "Sabaile"],
  ["सबै", "Sabai"],
  ["आफ्ना", "Aaphna"],
  ["आफ्नो", "Aaphno"],
  ["आफ्नी", "Aaphni"],
  ["अरू", "Aru"],
  ["अरु", "Aru"],

  // Core Worship & Theological terms
  ["परमेश्वरलाई", "Parmeshwarlai"],
  ["परमेश्वरको", "Parmeshwarko"],
  ["परमेश्वरले", "Parmeshwarle"],
  ["परमेश्वर", "Parmeshwar"],
  ["प्रभुलाई", "Prabhulai"],
  ["प्रभुको", "Prabhuko"],
  ["प्रभुमा", "Prabhuma"],
  ["प्रभुले", "Prabhule"],
  ["प्रभु", "Prabhu"],
  ["प्रभुज्यूको", "Prabhujyuko"],
  ["प्रभुज्यू", "Prabhujyu"],
  ["येशूलाई", "Yeshulai"],
  ["येशूको", "Yeshuko"],
  ["येशूमा", "Yeshuma"],
  ["येशूकहाँ", "Yeshukaha"],
  ["येशूले", "Yeshule"],
  ["येशू", "Yeshu"],
  ["येशु", "Yeshu"],
  ["यीशु", "Yeshu"],
  ["यिशु", "Yeshu"],
  ["ख्रीष्टलाई", "Khristlai"],
  ["ख्रीष्टको", "Khristko"],
  ["ख्रीष्टमा", "Khristma"],
  ["ख्रीष्टले", "Khristle"],
  ["ख्रीष्टीय", "Khristiya"],
  ["ख्रिष्टीय", "Khristiya"],
  ["ख्रीष्ट", "Khrist"],
  ["ख्रिष्ट", "Khrist"],
  ["ईश्वरलाई", "Ishworlai"],
  ["ईश्वरको", "Ishworko"],
  ["ईश्वर", "Ishwor"],
  ["इश्वर", "Ishwor"],
  ["हाल्लेलूयाह", "Hallelujah"],
  ["हल्लेलूयाह", "Hallelujah"],
  ["हाल्लेलुयाह", "Hallelujah"],
  ["हल्लेलुयाह", "Hallelujah"],
  ["होसन्ना", "Hosanna"],
  ["होसाना", "Hosanna"],
  ["यहोवा", "Yahowa"],
  ["याह्वे", "Yahwe"],
  ["पवित्र", "Pavitra"],
  ["आत्मा", "Aatma"],
  ["सृष्टिकर्ता", "Srishtikarta"],
  ["सृष्टि", "Srishti"],
  ["मुक्तिदातालाई", "Muktidatalai"],
  ["मुक्तिदाता", "Muktidata"],
  ["मुक्तिदान", "Muktidan"],
  ["मुक्ति", "Mukti"],
  ["उद्धारकर्ता", "Uddharkarta"],
  ["उद्धार", "Uddhar"],
  ["अनुग्रहको", "Anugrahako"],
  ["अनुग्रहले", "Anugrahale"],
  ["अनुग्रह", "Anugraha"],
  ["अनुग्रही", "Anugrahi"],
  ["धन्यवाद", "Dhanyabad"],
  ["महिमा", "Mahima"],
  ["आराधना", "Aaradhana"],
  ["आराधनाको", "Aaradhanako"],
  ["प्रशंसा", "Prashansa"],
  ["स्तुति", "Stuti"],
  ["जयजयकार", "Jayajayakar"],
  ["जय", "Jaya"],
  ["शान्ति", "Shanti"],
  ["आशिष", "Ashish"],
  ["प्रार्थना", "Prarthana"],
  ["स्वर्गतिर", "Swargatira"],
  ["स्वर्गीय", "Swargiya"],
  ["स्वर्ग", "Swarga"],
  ["क्रूसलाई", "Kruslai"],
  ["क्रूसको", "Krusko"],
  ["क्रूसमा", "Krusma"],
  ["क्रूस", "Krus"],
  ["रगतले", "Ragatle"],
  ["रगत", "Ragat"],
  ["जीवनलाई", "Jeevanlai"],
  ["जीवनमा", "Jeevanma"],
  ["जीवनको", "Jeevanko"],
  ["जीवन", "Jeevan"],
  ["अनन्तकालसम्मै", "Anantakalasammai"],
  ["अनन्तको", "Anantako"],
  ["अनन्त", "Ananta"],
  ["विश्वास", "Bishwas"],
  ["आशा", "Aasha"],
  ["ज्योति", "Jyoti"],
  ["अन्धकार", "Andhakar"],
  ["अँध्यारो", "Andhyaro"],
  ["अँध्यारोमा", "Andhyaroma"],
  ["राजा", "Raja"],
  ["राजाहरूका", "Rajaharuka"],
  ["गोठालो", "Gothalo"],
  ["गोठैमा", "Gothaima"],
  ["वचन", "Bachan"],
  ["सत्यता", "Satyata"],
  ["सत्य", "Satya"],
  ["प्रेमले", "Premle"],
  ["प्रेमको", "Premko"],
  ["प्रेम", "Prem"],
  ["हृदयले", "Hridayale"],
  ["हृदयमा", "Hridayama"],
  ["हृदयको", "Hridayako"],
  ["हृदय", "Hridaya"],
  ["आँखाले", "Aankhale"],
  ["आँखा", "Aankha"],
  ["हातहरू", "Haatharu"],
  ["हात", "Haat"],
  ["आनन्दित", "Aanandit"],
  ["आनन्दले", "Aanandale"],
  ["आनन्द", "Aananda"],
  ["खुशी", "Khushi"],
  ["खुसी", "Khusi"],
  ["हर्षित", "Harshit"],
  ["हर्ष", "Harsha"],
  ["अगप्य", "Agapya"],

  // Common Verbs & Conjugations
  ["खोज्दछ", "Khojchha"],
  ["खोच्दछ", "Khojchha"],
  ["खोज्छु", "Khojchhu"],
  ["खोजेर", "Khojera"],
  ["गाउँछु", "Gaauchhu"],
  ["गाउँछन्", "Gaauchhan"],
  ["गाऔँ", "Gaaun"],
  ["गाऊँ", "Gaaun"],
  ["गाउनुहोस्", "Gaaunuhos"],
  ["गीत", "Geet"],
  ["उचाल्छु", "Uchalchhu"],
  ["उचाल्छौँ", "Uchalchhaun"],
  ["उचाल्दछौँ", "Uchaldachhaun"],
  ["उचालौँ", "Uchaalaun"],
  ["झुक्छु", "Jhukchhu"],
  ["झुक्दछौँ", "Jhukdachhaun"],
  ["दण्डवत्", "Dandawat"],
  ["चढाउँछु", "Chadhauchhu"],
  ["चढाऔँ", "Chadhaaun"],
  ["अर्पण", "Arpan"],
  ["दिन्छु", "Dinchhu"],
  ["दिनुहोस्", "Dinuhos"],
  ["आउनुहोस्", "Aaunuhos"],
  ["लिनुहोस्", "Linuhos"],
  ["भन्छन्", "Bhanchhan"],
  ["भन्छु", "Bhanchhu"],
  ["भन्छौ", "Bhanchhau"],
  ["भन्दछ", "Bhandachha"],
  ["हेर्छु", "Herchhu"],
  ["हेर्दछ", "Herdachha"],
  ["हेरौँ", "Heraun"],
  ["हेर्न", "Herna"],
  ["देख्छु", "Dekhchhu"],
  ["देखिँदैछ", "Dekhindaichha"],
  ["चाखीसके", "Chaakhisake"],
  ["चाखिसके", "Chaakhisake"],
  ["पाइसके", "Paaisake"],
  ["पाएँ", "Paaye"],
  ["पाए", "Paaye"],
  ["पाउनेछौ", "Paunechhau"],
  ["पाउनेछौँ", "Paunechhaun"],
  ["पाउनेछन्", "Paunechhan"],
  ["हुनेछ", "Hunechha"],
  ["हुनेछन्", "Hunechhan"],
  ["गरौँ", "Garaun"],
  ["गर्दछु", "Gardachhu"],
  ["गर्छौँ", "Garchhaun"],
  ["गर्छु", "Garchhu"],
  ["गरे", "Gare"],
  ["गर", "Gara"],
  ["भयो", "Bhayo"],
  ["थियो", "Thiyo"],
  ["थिए", "Thie"],
  ["छन्", "Chhan"],
  ["छौँ", "Chhaun"],
  ["छौ", "Chhau"],
  ["हुन्", "Hun"],
  ["हुँ", "Hun"],
  ["हो", "Ho"],
  ["भो", "Bho"],
  ["छ", "Chha"],
  ["नयाँ", "Naya"],
  ["नया", "Naya"],
  ["धेरै", "Dherai"],
  ["थोरै", "Thorai"],
  ["मीठो", "Meetho"],
  ["मिठो", "Mitho"],
  ["न्यानो", "Nyano"],
  ["हजारौ", "Hajarau"],
  ["लाखौ", "Lakhau"],
  ["समयलाई", "Samayalai"],
  ["समय", "Samaya"],
  ["अघि", "Aghi"],
  ["अगि", "Aghi"],
  ["बढ़ौँ", "Badhaun"],
  ["बढौँ", "Badhaun"],
  ["बढ़", "Badha"],
  ["बढ", "Badha"],
  ["साथीलाई", "Saathilai"],
  ["साथी", "Saathi"],
  ["साथमा", "Saathma"],
  ["सँग", "Sanga"],
  ["सित", "Sita"],
  ["बाट", "Bata"],
  ["सम्म", "Samma"],
  ["लागि", "Lagi"],
  ["निम्ति", "Nimti"],
  ["भनेर", "Bhanera"],
  ["भाइ", "Bhai"],
  ["दाज्यू", "Dajyu"],
  ["दिदी", "Didi"],
  ["बहिनी", "Bahini"],
  ["जवान", "Jawan"],
  ["युवा", "Yuwa"],
  ["यवा", "Yuwa"],
  ["संसारमा", "Sansarma"],
  ["संसार", "Sansar"],
  ["संसारैको", "Sansaraiko"],
  ["पृथ्वीका", "Prithwika"],
  ["पृथ्वी", "Prithvi"],
  ["सामर्थी", "Samarthi"],
  ["बलिया", "Baliya"],
  ["शक्तिशाली", "Shaktishali"],
  ["शक्ति", "Shakti"],
  ["दूत", "Doot"],
  ["तारा", "Tara"],
  ["भेटी", "Bheti"],
  ["परालको", "Paralko"],
  ["ओछ्यान", "Ochhyan"],
  ["कोक्रो", "Kokro"],
  ["डुँड़ै", "Dundai"],
  ["डुँड़ैमा", "Dundaima"],
  ["गोठालाहरू", "Gothalaharu"],
  ["गोठाला", "Gothala"],
  ["ज्योतिषीहरू", "Jyotishiharu"],
  ["भेड़ा", "Bheda"],
  ["पहाडहरूले", "Pahadharule"],
  ["पहाड", "Pahad"],
  ["घेरेझैँ", "Gherejhai"],
  ["घेर्नुहोस्", "Ghernuhos"],
  ["घेर्छन्", "Gherchhan"],
  ["उपस्थितिमा", "Upasthitima"],
  ["उपस्थिति", "Upasthiti"],
  ["शहरको", "Shaharko"],
  ["शहर", "Shahar"],
  ["गाउँमा", "Gaauma"],
  ["गावैँमा", "Gaauma"],
  ["मण्डली", "Mandali"],
  ["बन्धन", "Bandhan"],
  ["दुःखदेखि", "Dukhadekhi"],
  ["दुःख", "Dukha"],
  ["जिन्दगी", "Jindagi"],
  ["जीउनेहरू", "Jiuneharu"],
  ["जीउने", "Jiune"],
  ["दीप", "Deep"],
  ["जलाई", "Jalai"],
  ["जानलाई", "Janalai"],
  ["जानको", "Janako"],
  ["सिंहासनतर्फ", "Sinhasanatarpha"],
  ["सिंहासन", "Sinhasan"],
  ["भजौँ", "Bhajaun"],
  ["भजन", "Bhajan"],
  ["फैलाई", "Phailai"],
  ["उज्ज्वल", "Ujjwal"],

  // Biblical Names & Places
  ["यरूशलेम", "Jerusalem"],
  ["यरुशलेम", "Jerusalem"],
  ["बेथलेहेम", "Bethlehem"],
  ["यशैया", "Isaiah"],
  ["दाऊद", "David"],
  ["सियोन", "Zion"],
  ["कालवरी", "Calvary"]
]);

/**
 * Transliterate a single Nepali word using linguistic rules
 */
function transliterateWord(word) {
  if (!word) return "";

  // 1. Direct dictionary match
  const cleanWord = word.replace(/[.,/#!$%^&*;:{}=\-_`~()?"'<>।॥]/g, "");
  if (DICTIONARY.has(cleanWord)) {
    const roman = DICTIONARY.get(cleanWord);
    return word.replace(cleanWord, roman);
  }

  let result = "";
  const len = word.length;

  for (let i = 0; i < len; i++) {
    const char = word[i];
    const nextChar = i + 1 < len ? word[i + 1] : "";

    // Arabic/Nepali Digits
    if (NUM_MAP[char]) {
      result += NUM_MAP[char];
      continue;
    }

    // Independent Vowels
    if (VOWEL_MAP[char]) {
      result += VOWEL_MAP[char];
      continue;
    }

    // Consonants
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

      // Inherent 'a' vowel in Nepali:
      // Drop 'a' at end of word or before punctuation (schwa deletion: राम -> Ram)
      if (i + 1 === len || /[\s\p{P}]/u.test(nextChar)) {
        result += base;
      } else {
        result += base + "a";
      }
      continue;
    }

    // Standalone Matra fallback
    if (MATRA_MAP[char]) {
      result += MATRA_MAP[char];
      continue;
    }

    if (char === VIRAMA) continue;

    // Punctuations, Latin letters, spaces, etc.
    result += char;
  }

  if (!result) return "";

  // Clean double-vowels artifacts and ensure proper Title Case
  let cleaned = result
    .replace(/aa/g, "a")
    .replace(/ee/g, "i")
    .replace(/oo/g, "u");

  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
}

/**
 * Natural Roman Nepali Transliteration for Titles
 */
function naturalRomanizeTitle(title) {
  if (!title) return "";

  // Convert Devanagari numerals in parentheses: (२) -> (2), (३) -> (3)
  let working = title.replace(/\(([०-९\d]+)\)/g, (match, p1) => {
    const num = p1.split("").map((c) => NUM_MAP[c] || c).join("");
    return `(${num})`;
  });

  // Split into tokens preserving punctuation and whitespace
  const tokens = working.split(/(\s+|[-–—()।॥,.]+)/);

  const romanTokens = tokens.map((token) => {
    if (!token || /^\s+$/.test(token) || /^[-–—()।॥,.]+$/.test(token)) {
      return token.replace(/[।॥]/g, "");
    }
    return transliterateWord(token);
  });

  let output = romanTokens.join("");

  // Post-clean formatting
  output = output
    .replace(/\s+/g, " ")
    .replace(/\s+([.,?!])/g, "$1")
    .trim();

  return output;
}

/**
 * Run the dataset transformation
 */
function processDataset() {
  const dataPath = path.join(__dirname, "..", "src", "data", "nepali_christian_songs.json");
  const publicDataPath = path.join(__dirname, "..", "public", "nepali_christian_songs.json");

  console.log("\n=======================================================");
  console.log("  🇳🇵 NATURAL ROMAN NEPALI TITLE REGENERATION");
  console.log("=======================================================\n");

  const rawSongs = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
  console.log(`🎵 Total songs to process: ${rawSongs.length}`);

  let successCount = 0;
  let missingCount = 0;
  const beforeAfterSamples = [];

  const updatedSongs = rawSongs.map((song, idx) => {
    const rawTitle = song.title || "";
    if (!rawTitle.trim()) {
      missingCount++;
      return song;
    }

    const naturalTitleEn = naturalRomanizeTitle(rawTitle);
    successCount++;

    if (idx < 25 || idx === 100 || idx === 500 || idx === 1018 || idx === 1924) {
      beforeAfterSamples.push({
        id: song.id,
        nepali: rawTitle,
        old_title_en: song.title_en,
        new_title_en: naturalTitleEn
      });
    }

    return {
      ...song,
      title_en: naturalTitleEn
    };
  });

  // Write back to both files
  fs.writeFileSync(dataPath, JSON.stringify(updatedSongs, null, 2), "utf-8");
  fs.writeFileSync(publicDataPath, JSON.stringify(updatedSongs, null, 2), "utf-8");

  console.log(`\n✅ Successfully updated ${successCount} songs in:`);
  console.log(`   • ${dataPath}`);
  console.log(`   • ${publicDataPath}`);

  console.log(`\n📊 VALIDATION REPORT:`);
  console.log(`   • Total Songs: ${rawSongs.length}`);
  console.log(`   • Successfully Transliterated: ${successCount}`);
  console.log(`   • Missing/Empty Titles: ${missingCount}`);
  console.log(`   • Data Integrity: ${updatedSongs.length === rawSongs.length ? "100% MATCH ✅" : "COUNT MISMATCH ❌"}`);

  console.log("\n----------------------------------------------------------------------------------");
  console.log("  🔍 BEFORE / AFTER COMPARISON SAMPLES (25 Songs):");
  console.log("----------------------------------------------------------------------------------");
  beforeAfterSamples.forEach((sample, i) => {
    console.log(`\n[${i + 1}] ID: ${sample.id}`);
    console.log(`  🇳🇵 Nepali:     ${sample.nepali}`);
    console.log(`  ❌ Legacy:     ${sample.old_title_en}`);
    console.log(`  ✨ Desired:    ${sample.new_title_en}`);
  });
}

processDataset();
