import { books, Book } from "@/lib/books";

export interface ParsedBibleReference {
  bookId: number;
  book: Book;
  chapter: number;
  startVerse: number;
  endVerse?: number;
  originalQuery: string;
}

// Convert Nepali numerals (०-९) to English numerals (0-9)
export function nepaliToEnglishDigits(str: string): string {
  const nepaliDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
  let result = str;
  nepaliDigits.forEach((digit, i) => {
    result = result.split(digit).join(String(i));
  });
  return result;
}

// Map alias strings to Book IDs (0-65)
const BOOK_ALIASES: Record<string, number> = {
  // Genesis
  "gen": 0, "genesis": 0, "gn": 0, "उत्पत्ति": 0, "utpatti": 0, "utpati": 0,
  // Exodus
  "exo": 1, "exodus": 1, "ex": 1, "प्रस्थान": 1, "prasthan": 1,
  // Leviticus
  "lev": 2, "leviticus": 2, "lv": 2, "लेवीहरू": 2, "लेवी": 2, "lewi": 2, "levi": 2,
  // Numbers
  "num": 3, "numbers": 3, "nm": 3, "गन्ती": 3, "ganti": 3,
  // Deuteronomy
  "deu": 4, "deut": 4, "deuteronomy": 4, "dt": 4, "व्यवस्था": 4, "byabastha": 4, "byawastha": 4,
  // Joshua
  "jos": 5, "josh": 5, "joshua": 5, "jsh": 5, "यहोशू": 5, "yahoshu": 5,
  // Judges
  "jdg": 6, "judg": 6, "judges": 6, "न्यायकर्ताहरू": 6, "न्यायकर्ता": 6, "nyayakarta": 6,
  // Ruth
  "rut": 7, "ruth": 7, "रूथ": 7, "रुथ": 7,
  // 1 Samuel
  "1sa": 8, "1sam": 8, "1samuel": 8, "१शमूएल": 8, "१ शमूएल": 8, "1 samuel": 8, "1 sam": 8, "1samu": 8,
  // 2 Samuel
  "2sa": 9, "2sam": 9, "2samuel": 9, "२शमूएल": 9, "२ शमूएल": 9, "2 samuel": 9, "2 sam": 9, "2samu": 9,
  // 1 Kings
  "1ki": 10, "1kgs": 10, "1kings": 10, "१राजाहरू": 10, "१ राजाहरू": 10, "1 kings": 10, "1 king": 10,
  // 2 Kings
  "2ki": 11, "2kgs": 11, "2kings": 11, "२राजाहरू": 11, "२ राजाहरू": 11, "2 kings": 11, "2 king": 11,
  // 1 Chronicles
  "1ch": 12, "1chr": 12, "1chron": 12, "1chronicles": 12, "१इतिहास": 12, "१ इतिहास": 12, "1 chronicles": 12,
  // 2 Chronicles
  "2ch": 13, "2chr": 13, "2chron": 13, "2chronicles": 13, "२इतिहास": 13, "२ इतिहास": 13, "2 chronicles": 13,
  // Ezra
  "ezr": 14, "ezra": 14, "एज्रा": 14, "ejra": 14,
  // Nehemiah
  "neh": 15, "nehemiah": 15, "नहेम्याह": 15, "nehemyah": 15,
  // Esther
  "est": 16, "esther": 16, "एस्तर": 16, "estar": 16,
  // Job
  "job": 17, "अय्यूब": 17, "ayyub": 17,
  // Psalms
  "psa": 18, "psalm": 18, "psalms": 18, "ps": 18, "भजनसंग्रह": 18, "भजन": 18, "bhajan": 18, "bhajansangrah": 18,
  // Proverbs
  "pro": 19, "prov": 19, "proverbs": 19, "pr": 19, "हितोपदेश": 19, "hitopadesh": 19,
  // Ecclesiastes
  "ecc": 20, "eccl": 20, "ecclesiastes": 20, "उपदेशक": 20, "upadeshak": 20,
  // Song of Songs
  "sng": 21, "song": 21, "songofsongs": 21, "श्रेष्ठगीत": 21, "shresthageet": 21,
  // Isaiah
  "isa": 22, "isaiah": 22, "is": 22, "यशैया": 22, "yashaiya": 22,
  // Jeremiah
  "jer": 23, "jeremiah": 23, "यर्मिया": 23, "yarmiya": 23,
  // Lamentations
  "lam": 24, "lamentations": 24, "विलाप": 24, "bilap": 24, "wilap": 24,
  // Ezekiel
  "ezk": 25, "ezek": 25, "ezekiel": 25, "इजकिएल": 25, "izakiel": 25,
  // Daniel
  "dan": 26, "daniel": 26, "दानिएल": 26,
  // Hosea
  "hos": 27, "hosea": 27, "होशे": 27,
  // Joel
  "jol": 28, "joel": 28, "योएल": 28,
  // Amos
  "amo": 29, "amos": 29, "आमोस": 29,
  // Obadiah
  "oba": 30, "obad": 30, "obadiah": 30, "ओबदिया": 30,
  // Jonah
  "jon": 31, "jonah": 31, "योना": 31,
  // Micah
  "mic": 32, "micah": 32, "मीका": 32,
  // Nahum
  "nam": 33, "nah": 33, "nahum": 33, "नहूम": 33,
  // Habakkuk
  "hab": 34, "habakkuk": 34, "हबकूक": 34,
  // Zephaniah
  "zep": 35, "zeph": 35, "zephaniah": 35, "सपन्याह": 35,
  // Haggai
  "hag": 36, "haggai": 36, "हाग्गै": 36,
  // Zechariah
  "zec": 37, "zech": 37, "zechariah": 37, "जकरिया": 37,
  // Malachi
  "mal": 38, "malachi": 38, "मलाकी": 38,
  // Matthew
  "mat": 39, "matt": 39, "matthew": 39, "mt": 39, "मत्ती": 39, "matti": 39,
  // Mark
  "mrk": 40, "mark": 40, "mk": 40, "मर्कूस": 40, "markus": 40,
  // Luke
  "luk": 41, "luke": 41, "lk": 41, "लूका": 41, "luka": 41,
  // John
  "jhn": 42, "john": 42, "jn": 42, "यूहन्ना": 42, "yuhanna": 42, "yoohanna": 42,
  // Acts
  "act": 43, "acts": 43, "प्रेरित": 43, "prerit": 43,
  // Romans
  "rom": 44, "romans": 44, "ro": 44, "रोमी": 44, "romi": 44,
  // 1 Corinthians
  "1co": 45, "1cor": 45, "1corinthians": 45, "१कोरिन्थी": 45, "१ कोरिन्थी": 45, "1 corinthians": 45, "1 cor": 45,
  // 2 Corinthians
  "2co": 46, "2cor": 46, "2corinthians": 46, "२कोरिन्थी": 46, "२ कोरिन्थी": 46, "2 corinthians": 46, "2 cor": 46,
  // Galatians
  "gal": 47, "galatians": 47, "गलाती": 47, "galati": 47,
  // Ephesians
  "eph": 48, "ephesians": 48, "एफिसी": 48, "efisi": 48, "ephisi": 48,
  // Philippians
  "php": 49, "phil": 49, "philippians": 49, "फिलिप्पी": 49, "filippi": 49, "philippi": 49,
  // Colossians
  "col": 50, "colossians": 50, "कलस्सी": 50, "kalassi": 50,
  // 1 Thessalonians
  "1th": 51, "1thess": 51, "1thessalonians": 51, "१थेसलोनिकी": 51, "१ थेसलोनिकी": 51, "1 thessalonians": 51,
  // 2 Thessalonians
  "2th": 52, "2thess": 52, "2thessalonians": 52, "२थेसलोनिकी": 52, "२ थेसलोनिकी": 52, "2 thessalonians": 52,
  // 1 Timothy
  "1ti": 53, "1tim": 53, "1timothy": 53, "१तिमोथी": 53, "१ तिमोथी": 53, "1 timothy": 53, "1 tim": 53,
  // 2 Timothy
  "2ti": 54, "2tim": 54, "2timothy": 54, "२तिमोथी": 54, "२ तिमोथी": 54, "2 timothy": 54, "2 tim": 54,
  // Titus
  "tit": 55, "titus": 55, "तीतस": 55, "titas": 55,
  // Philemon
  "phm": 56, "philem": 56, "philemon": 56, "फिलेमोन": 56, "filemon": 56,
  // Hebrews
  "heb": 57, "hebrews": 57, "हिब्रू": 57, "hibru": 57,
  // James
  "jas": 58, "james": 58, "याकूब": 58, "yakub": 58,
  // 1 Peter
  "1pe": 59, "1pet": 59, "1peter": 59, "१पत्रुस": 59, "१ पत्रुस": 59, "1 peter": 59, "1 pet": 59,
  // 2 Peter
  "2pe": 60, "2pet": 60, "2peter": 60, "२पत्रुस": 60, "२ पत्रुस": 60, "2 peter": 60, "2 pet": 60,
  // 1 John
  "1jn": 61, "1john": 61, "१यूहन्ना": 61, "१ यूहन्ना": 61, "1 john": 61,
  // 2 John
  "2jn": 62, "2john": 62, "२यूहन्ना": 62, "२ यूहन्ना": 62, "2 john": 62,
  // 3 John
  "3jn": 63, "3john": 63, "३यूहन्ना": 63, "३ यूहन्ना": 63, "3 john": 63,
  // Jude
  "jud": 64, "jude": 64, "यहूदा": 64, "yahuda": 64,
  // Revelation
  "rev": 65, "revelation": 65, "revelations": 65, "प्रकाश": 65, "prakash": 65
};

export function parseBibleReference(input: string): ParsedBibleReference | null {
  if (!input || !input.trim()) return null;

  // 1. Normalize numbers (convert Nepali digits to English digits)
  const normalized = nepaliToEnglishDigits(input.trim())
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .toLowerCase();

  // Match pattern: [Book Name/Alias] [Chapter](: or . or space)[StartVerse](- or to or -)[EndVerse]
  // Examples:
  // "John 3:16", "Jn 3:16-18", "यूहन्ना 3:16", "Genesis 1:1", "Ps 23", "भजनसंग्रह 23:1-6", "1 Cor 13:4"
  const refRegex = /^((?:\d\s*)?[a-z\u0900-\u097f]+(?:\s+[a-z\u0900-\u097f]+)?)\s*(\d+)(?:(?:\s*[:.]\s*|\s+)(\d+)(?:\s*(?:-|to)\s*(\d+))?)?$/i;

  const match = normalized.match(refRegex);
  if (!match) return null;

  const rawBook = match[1].trim().replace(/\s+/g, ' ');
  const chapterNum = parseInt(match[2], 10);
  const startVerse = match[3] ? parseInt(match[3], 10) : 1;
  const endVerse = match[4] ? parseInt(match[4], 10) : (match[3] ? undefined : undefined);

  // Normalize book string for lookup
  const cleanBookKey = rawBook
    .replace(/[\s\-_]/g, '')
    .replace(/1st/g, '1')
    .replace(/2nd/g, '2')
    .replace(/3rd/g, '3');

  // Try direct lookup
  let bookId = BOOK_ALIASES[cleanBookKey];

  // Try spaced version
  if (bookId === undefined) {
    bookId = BOOK_ALIASES[rawBook];
  }

  // Try finding in official books list
  if (bookId === undefined) {
    const found = books.find(b => 
      b.name.toLowerCase().replace(/\s+/g, '') === cleanBookKey ||
      b.englishName.toLowerCase().replace(/\s+/g, '') === cleanBookKey
    );
    if (found) bookId = found.id;
  }

  if (bookId === undefined || isNaN(bookId)) return null;

  const book = books.find(b => b.id === bookId);
  if (!book) return null;

  // Validate chapter bounds
  if (chapterNum < 1 || chapterNum > book.chapters) {
    return null;
  }

  return {
    bookId,
    book,
    chapter: chapterNum,
    startVerse: startVerse > 0 ? startVerse : 1,
    endVerse: endVerse && endVerse >= startVerse ? endVerse : undefined,
    originalQuery: input
  };
}
