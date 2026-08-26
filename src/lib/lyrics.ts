export interface Song {
  id: string;
  title: string;
  title_en?: string;
  artist?: string;
  authors?: string;
  details?: string;
  letter?: string;
  language?: 'Nepali' | 'English';
  rawLyrics: string;
  rawLyrics_en?: string;
}

export type SlideLayout = 'standard' | 'lowerthird' | 'giving' | 'countdown';
export type TextAlign = 'center' | 'left' | 'right';
export type AccentColor = 'indigo' | 'amber' | 'emerald' | 'rose' | 'cyan' | 'white';

export type TickerTheme = 'amber' | 'emerald' | 'cyan' | 'rose' | 'indigo' | 'white';
export type TickerPosition = 'bottom' | 'top';
export type TickerSpeed = 'slow' | 'normal' | 'fast' | 'vfast';
export type TickerFontSize = 'sm' | 'md' | 'lg' | 'xl';

export interface TickerConfig {
  enabled: boolean;
  text: string;
  badgeLabel: string;
  showBadge: boolean;
  theme: TickerTheme;
  position: TickerPosition;
  speed: TickerSpeed;
  fontSize: TickerFontSize;
}

export type TextAnimationEffect = 'fade' | 'slide-up' | 'slide-down' | 'zoom-in' | 'flip' | 'blur' | 'pop';
export type TextAnimationSpeed = 'fast' | 'normal' | 'slow';

export interface TextAnimationConfig {
  effect: TextAnimationEffect;
  speed: TextAnimationSpeed;
}

export const DEFAULT_TEXT_ANIMATION_CONFIG: TextAnimationConfig = {
  effect: 'slide-up',
  speed: 'normal'
};

export function getTextAnimationDuration(speed: TextAnimationSpeed = 'normal'): number {
  switch (speed) {
    case 'fast': return 0.25;
    case 'slow': return 0.75;
    case 'normal':
    default: return 0.45;
  }
}

export function getTextAnimationVariants(effect: TextAnimationEffect = 'slide-up') {
  switch (effect) {
    case 'fade':
      return {
        initial: { opacity: 0, scale: 0.97 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 1.03 }
      };
    case 'slide-down':
      return {
        initial: { opacity: 0, y: -45, scale: 0.98 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: 45, scale: 0.98 }
      };
    case 'zoom-in':
      return {
        initial: { opacity: 0, scale: 0.82 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 1.15 }
      };
    case 'flip':
      return {
        initial: { opacity: 0, rotateX: 55, y: 25 },
        animate: { opacity: 1, rotateX: 0, y: 0 },
        exit: { opacity: 0, rotateX: -55, y: -25 }
      };
    case 'blur':
      return {
        initial: { opacity: 0, filter: 'blur(16px)', scale: 0.94 },
        animate: { opacity: 1, filter: 'blur(0px)', scale: 1 },
        exit: { opacity: 0, filter: 'blur(16px)', scale: 1.06 }
      };
    case 'pop':
      return {
        initial: { opacity: 0, scale: 0.65 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.75 }
      };
    case 'slide-up':
    default:
      return {
        initial: { opacity: 0, y: 45, scale: 0.98 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: -45, scale: 0.98 }
      };
  }
}

export type BackgroundMode = 'none' | 'video' | 'slideshow' | 'gradient';
export type BackgroundTransitionEffect = 'fade' | 'zoom' | 'slide' | 'blur' | 'scale-fade';

export interface BackgroundImageItem {
  id: string;
  name: string;
  url?: string;
  buffer?: ArrayBuffer;
  mime?: string;
}

export type GradientType = 'linear' | 'radial' | 'conic' | 'mesh';
export type GradientAnimation = 'none' | 'slow-flow' | 'pulse' | 'wave';

export interface GradientConfig {
  type: GradientType;
  color1: string;
  color2: string;
  color3: string;
  angle: number;
  animation: GradientAnimation;
  presetId?: string;
}

export interface GlobalBackgroundConfig {
  mode: BackgroundMode;
  overlayOpacity: number; // 0 to 0.9
  slideshow: {
    images: BackgroundImageItem[];
    interval: number; // seconds
    transitionEffect: BackgroundTransitionEffect;
    transitionDuration: number; // seconds
  };
  gradient: GradientConfig;
  video?: {
    name?: string;
    url?: string;
    buffer?: ArrayBuffer;
    mime?: string;
  };
}

export const GRADIENT_PRESETS = [
  { id: 'midnight-sapphire', name: 'Midnight Sapphire', color1: '#0f172a', color2: '#1e1b4b', color3: '#312e81', type: 'linear' as const, angle: 135 },
  { id: 'deep-emerald', name: 'Deep Emerald', color1: '#064e3b', color2: '#022c22', color3: '#0f5132', type: 'linear' as const, angle: 120 },
  { id: 'royal-purple', name: 'Royal Purple', color1: '#3b0764', color2: '#1e1b4b', color3: '#581c87', type: 'linear' as const, angle: 145 },
  { id: 'sunset-amber', name: 'Sunset Amber', color1: '#451a03', color2: '#78350f', color3: '#92400e', type: 'linear' as const, angle: 110 },
  { id: 'aurora-teal', name: 'Aurora Teal', color1: '#042f2e', color2: '#115e59', color3: '#0f766e', type: 'radial' as const, angle: 0 },
  { id: 'obsidian-slate', name: 'Obsidian Slate', color1: '#09090b', color2: '#18181b', color3: '#27272a', type: 'linear' as const, angle: 160 },
  { id: 'crimson-velvet', name: 'Crimson Velvet', color1: '#450a0a', color2: '#7f1d1d', color3: '#991b1b', type: 'linear' as const, angle: 130 },
  { id: 'cosmic-mesh', name: 'Cosmic Mesh Glow', color1: '#1e1b4b', color2: '#4c1d95', color3: '#065f46', type: 'mesh' as const, angle: 135 },
];

export const DEFAULT_BACKGROUND_CONFIG: GlobalBackgroundConfig = {
  mode: 'none',
  overlayOpacity: 0.4,
  slideshow: {
    images: [],
    interval: 5,
    transitionEffect: 'zoom',
    transitionDuration: 1.2
  },
  gradient: {
    type: 'linear',
    color1: '#0f172a',
    color2: '#1e1b4b',
    color3: '#312e81',
    angle: 135,
    animation: 'slow-flow',
    presetId: 'midnight-sapphire'
  }
};

export const BROADCAST_CHANNEL_NAME = 'worship_display_channel';

export const DEFAULT_TICKER_CONFIG: TickerConfig = {
  enabled: false,
  text: "मण्डलीमा पाल्नुभएका सम्पूर्ण दाजुभाइ तथा दिदीबहिनीहरूलाई प्रभु येशूको नाउँमा हार्दिक स्वागत गर्दछौं!",
  badgeLabel: "सूचना (NOTICE)",
  showBadge: true,
  theme: "amber",
  position: "bottom",
  speed: "normal",
  fontSize: "md"
};

export const QUICK_TICKER_PRESETS = [
  {
    label: "🌟 स्वागतम् (Welcome)",
    badge: "स्वागतम्",
    theme: "amber" as TickerTheme,
    text: "मण्डलीमा पाल्नुभएका सम्पूर्ण दाजुभाइ तथा दिदीबहिनीहरूलाई प्रभु येशूको नाउँमा हार्दिक स्वागत गर्दछौं!"
  },
  {
    label: "☕ चिया-नास्ता (Fellowship)",
    badge: "संगति",
    theme: "emerald" as TickerTheme,
    text: "संगति पश्चात तलको हलमा चिया-नास्ताको व्यवस्था गरिएको छ, सम्पूर्णमा हार्दिक आमन्त्रण छ।"
  },
  {
    label: "🚗 पार्किङ सूचना (Parking)",
    badge: "सूचना",
    theme: "cyan" as TickerTheme,
    text: "कृपया आफ्नो सवारी साधन मण्डलीको तोकिएको पार्किङ क्षेत्रमा मात्र व्यवस्थित रूपमा पार्क गरिदिनुहोला।"
  },
  {
    label: "📱 मोबाइल साइलेन्ट (Silence Phone)",
    badge: "ध्यान दिनुहोस",
    theme: "rose" as TickerTheme,
    text: "कृपया संगति अवधिभर आफ्नो मोबाइल फोन साइलेन्ट वा भाइब्रेसन मोडमा राखिदिनुहोला।"
  },
  {
    label: "🙏 उपवास प्रार्थना (Prayer Meeting)",
    badge: "प्रार्थना",
    theme: "indigo" as TickerTheme,
    text: "उपवास तथा प्रार्थना संगति हरेक बुधबार बिहान १०:०० बजे मण्डली भवनमा हुनेछ।"
  },
  {
    label: "👦 युवा संगति (Youth)",
    badge: "जवान संगति",
    theme: "emerald" as TickerTheme,
    text: "युवा संगति (Youth Fellowship) हरेक शनिबार दिउँसो २:०० बजे हुनेछ, सम्पूर्ण जवानहरूलाई स्वागत छ।"
  }
];

export interface CustomSlideTheme {
  layout?: SlideLayout;
  textAlign?: TextAlign;
  accentColor?: AccentColor;
  bgMediaUrl?: string;
  bgMediaType?: 'image' | 'video';
  // For Giving / QR Code / Links
  qrCodeUrl?: string;
  bankDetails?: string;
  qrBadgeLabel?: string;
  qrInstruction?: string;
  // For Countdown Timer
  countdownSeconds?: number;
  countdownLabel?: string;
}

export interface MediaSlideItem {
  id: string;
  name: string;
  type: 'image' | 'video';
  mime: string;
  url?: string;
  buffer?: ArrayBuffer;
}

export interface SongSlide {
  section: string; // e.g. "Verse 1", "Chorus", "Bridge", "Slide 1", "Image 1", "कोरस", "पद १"
  lines: string[];
  text: string;
  title?: string;
  subtitle?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  mediaBuffer?: ArrayBuffer;
  mediaMime?: string;
  theme?: CustomSlideTheme;
}

export type BibleTranslation = 'nepali' | 'niv' | 'kjv';

export interface BibleTranslationOption {
  id: BibleTranslation;
  name: string;
  shortName: string;
  language: 'Nepali' | 'English';
  badge: string;
  description: string;
}

export const BIBLE_TRANSLATIONS: BibleTranslationOption[] = [
  {
    id: 'nepali',
    name: 'नेपाली बाइबल (NNRV)',
    shortName: 'नेपाली',
    language: 'Nepali',
    badge: 'नेपाली (Default)',
    description: 'Nepali New Revised Version (NNRV)'
  },
  {
    id: 'niv',
    name: 'New International Version (NIV)',
    shortName: 'NIV',
    language: 'English',
    badge: 'English NIV',
    description: 'The New International Version'
  },
  {
    id: 'kjv',
    name: 'King James Version (KJV)',
    shortName: 'KJV',
    language: 'English',
    badge: 'English KJV',
    description: 'Classic King James Version (1611)'
  }
];

export type ScheduleItemType = 'song' | 'scripture' | 'media' | 'slide';

export interface ScheduleItem {
  id: string;
  title: string;
  subtitle?: string;
  type: ScheduleItemType;
  songId?: string;
  bookId?: number;
  chapter?: number;
  verse?: number;
  translation?: BibleTranslation;
  translations?: BibleTranslation[];
  scriptureText?: string;
  mediaType?: 'image' | 'video';
  mediaUrl?: string;
  mediaName?: string;
  mediaBuffer?: ArrayBuffer;
  mediaMime?: string;
  mediaItems?: MediaSlideItem[];
  slideText?: string;
  slideSubtitle?: string;
  slideTemplate?: string;
  theme?: CustomSlideTheme;
  customSlides?: SongSlide[];
}

export const defaultSongs: Song[] = [
  {
    id: "song-1",
    title: "धन्यवाद धन्यवाद (Dhanyabad Dhanyabad)",
    title_en: "Dhanyabad Dhanyabad",
    artist: "Worship Team",
    rawLyrics: `[कोरस]
धन्यवाद धन्यवाद येशू तिमीलाई
मेरो जीवनको हरेक घडीमा
मेरो जीवनको हरेक पलमा

[पद १]
अन्धकारको बाटोमा ज्योति बन्यौ
निराशाको क्षणमा आशा बन्यौ
मेरो दुर्बलतामा बल तिमी बन्यौ
म गाउँछु तिम्रै महिमा सदा

[पद २]
क्रूसको बलिदानले मुक्ति दियौ
आफ्नो पवित्र रगतले धुनुभयो
अनन्त जीवनको आशा दियौ
म झुक्छु तिम्रो चरणमा सदा`
  },
  {
    id: "song-2",
    title: "Amazing Grace (अचम्मको अनुग्रह)",
    title_en: "Amazing Grace",
    artist: "John Newton",
    rawLyrics: `[Verse 1]
Amazing grace! How sweet the sound
That saved a wretch like me!
I once was lost, but now am found;
Was blind, but now I see.

[Verse 2]
'Twas grace that taught my heart to fear,
And grace my fears relieved;
How precious did that grace appear
The hour I first believed.

[Verse 3]
Through many dangers, toils and snares,
I have already come;
'Tis grace hath brought me safe thus far,
And grace will lead me home.`
  }
];

export const defaultSchedule: ScheduleItem[] = [];

// Robust Parser: Splits structured songs by tags & double newlines,
// and automatically chunks unstructured songs into 3-line slides so no song is ever left unparsed!
export function parseLyricsToSlides(rawLyrics?: string | null): SongSlide[] {
  if (!rawLyrics || typeof rawLyrics !== 'string' || !rawLyrics.trim()) return [];

  const normalized = rawLyrics.replace(/\r\n/g, '\n').trim();

  // Split by double-newline stanza separations if present
  const rawBlocks = normalized.split(/\n\s*\n+/);
  const slides: SongSlide[] = [];

  const sectionHeaderRegex = /^\s*(?:\[(.*?)\]|((?:को\.|कोरस:|कोरस\b)|(?:[१२३४५६७८९०]+\.)|(?:Verse\s*\d+:?|\d+\.)|(?:Chorus:?|Bridge:?)))\s*(.*)$/i;

  let slideCount = 1;

  for (const block of rawBlocks) {
    const rawLines = block.split('\n').map(l => l.trim()).filter(Boolean);
    if (rawLines.length === 0) continue;

    let currentSection = `Slide ${slideCount}`;
    let currentLines: string[] = [];
    let hasFoundExplicitHeader = false;

    for (let i = 0; i < rawLines.length; i++) {
      const line = rawLines[i];
      const match = line.match(sectionHeaderRegex);

      if (match) {
        hasFoundExplicitHeader = true;
        if (currentLines.length > 0) {
          slides.push({
            section: currentSection,
            lines: currentLines,
            text: currentLines.join('\n')
          });
          slideCount++;
          currentLines = [];
        }

        let headerName = "";
        let remaining = "";

        if (match[1]) {
          headerName = match[1];
          remaining = match[3];
        } else if (match[2]) {
          const tag = match[2].trim();
          remaining = match[3];
          if (/^(को\.|कोरस:|कोरस)/i.test(tag)) {
            headerName = "कोरस (Chorus)";
          } else if (/^[१२३४५६७८९०]+\./.test(tag)) {
            const num = tag.replace('.', '');
            headerName = `पद ${num}`;
          } else if (/^\d+\./.test(tag)) {
            const num = tag.replace('.', '');
            headerName = `Verse ${num}`;
          } else if (/^Verse\s*\d+/i.test(tag)) {
            headerName = tag;
          } else if (/^Chorus/i.test(tag)) {
            headerName = "Chorus";
          } else {
            headerName = tag;
          }
        }

        currentSection = headerName;
        if (remaining && remaining.trim()) {
          currentLines.push(remaining.trim());
        }
      } else {
        currentLines.push(line);

        // Fallback for raw unstructured songs with no headers:
        // Automatically chunks every 3 lines into a clean slide
        if (!hasFoundExplicitHeader && currentLines.length >= 3 && i < rawLines.length - 1) {
          slides.push({
            section: `Slide ${slideCount}`,
            lines: currentLines,
            text: currentLines.join('\n')
          });
          slideCount++;
          currentLines = [];
          currentSection = `Slide ${slideCount}`;
        }
      }
    }

    if (currentLines.length > 0) {
      slides.push({
        section: currentSection,
        lines: currentLines,
        text: currentLines.join('\n')
      });
      slideCount++;
    }
  }

  if (slides.length === 0 && normalized) {
    slides.push({
      section: "Lyrics",
      lines: normalized.split('\n').filter(Boolean),
      text: normalized
    });
  }

  return slides;
}

// Parser for Custom Slides supporting `---` delimiter and `[Section]` tags
export function parseCustomSlideText(
  rawText: string,
  defaultTitle: string = "Custom Slide",
  theme?: CustomSlideTheme
): SongSlide[] {
  if (!rawText || !rawText.trim()) {
    return [{
      section: defaultTitle,
      lines: [defaultTitle],
      text: defaultTitle,
      title: defaultTitle,
      theme
    }];
  }

  // Check if text has `---` multi-slide delimiter
  if (rawText.includes('---')) {
    const rawChunks = rawText.split(/^---$/m).map(c => c.trim()).filter(Boolean);
    if (rawChunks.length > 0) {
      return rawChunks.map((chunk, idx) => {
        let section = `Slide ${idx + 1}`;
        let text = chunk;
        const tagMatch = chunk.match(/^\[([^\]]+)\]/);
        if (tagMatch) {
          section = tagMatch[1];
          text = chunk.replace(/^\[[^\]]+\]\s*/, '').trim();
        }
        return {
          section,
          lines: text.split('\n').map(l => l.trim()).filter(Boolean),
          text,
          title: defaultTitle,
          theme
        };
      });
    }
  }

  // Check if text has `[Section]` tags (like [1. Point 1], [Announcement 1])
  const tagRegex = /\[([^\]]+)\]/g;
  if (tagRegex.test(rawText)) {
    return parseLyricsToSlides(rawText).map(slide => ({
      ...slide,
      title: defaultTitle,
      theme
    }));
  }

  // Single slide fallback
  return [{
    section: defaultTitle,
    lines: rawText.split('\n').map(l => l.trim()).filter(Boolean),
    text: rawText.trim(),
    title: defaultTitle,
    theme
  }];
}

export interface SlideTemplateOption {
  id: string;
  name: string;
  name_ne: string;
  icon: string;
  description: string;
  defaultTitle: string;
  defaultSubtitle: string;
  defaultText: string;
  theme: CustomSlideTheme;
}

export const SLIDE_TEMPLATES: SlideTemplateOption[] = [
  {
    id: 'welcome',
    name: 'Welcome to Church',
    name_ne: 'स्वागतम् (Welcome)',
    icon: 'Sparkles',
    description: 'Opening service slide with warm welcome & church theme',
    defaultTitle: 'Welcome to Sunday Worship Service',
    defaultSubtitle: 'प्रभु येशू ख्रीष्टको नाउँमा हार्दिक स्वागत गर्दछौं',
    defaultText: `[स्वागतम्]\nहाम्रो संगतिमा पाल्नुभएका सम्पूर्ण दाजुभाइ तथा दिदीबहिनीहरूलाई\nप्रभु येशू ख्रीष्टको नाउँमा हार्दिक स्वागत गर्दछौं।\n\n"परमेश्वरको मन्दिरमा आउन पाउँदा म हर्षित भएँ।" — भजन १२२:१`,
    theme: {
      layout: 'standard',
      textAlign: 'center',
      accentColor: 'indigo'
    }
  },
  {
    id: 'sermon',
    name: 'Sermon Outline (Multi-Slide)',
    name_ne: 'वचनको रूपरेखा (Sermon)',
    icon: 'BookOpen',
    description: 'Title, speaker, scripture & main sermon points across slides',
    defaultTitle: 'विश्वासको यात्रा (Walk of Faith)',
    defaultSubtitle: 'प्रचारक: पास्टर ज्यू | मुख्य पद: हिब्रू ११:१-६',
    defaultText: `[१. वचनको शीर्षक]\nविश्वासको यात्रा (Walk of Faith)\nमुख्य पद: हिब्रू ११:१-६\nप्रचारक: पास्टर ज्यू\n\n---\n\n[२. बुँदा १]\n१. विश्वासको परिभाषा र शक्ति\n"विश्वास आशा गरिएका कुराहरूको निश्चय र नदेखिएका कुराहरूको प्रमाण हो।" — हिब्रू ११:१\n\n---\n\n[३. बुँदा २]\n२. अब्राहामको आज्ञाकारिता\nबोलाहट पाउँदा नहिचकिचाई अघि बढ्ने विश्वास।\n\n---\n\n[४. निष्कर्ष]\n३. हाम्रो दैनिक जीवनमा विश्वासको अभ्यास\nहरेक चुनौतीमा ख्रीष्टमाथि भरोसा राखौं।`,
    theme: {
      layout: 'standard',
      textAlign: 'center',
      accentColor: 'amber'
    }
  },
  {
    id: 'announcements',
    name: 'Church Announcements',
    name_ne: 'मण्डलीका सूचनाहरू (Notice)',
    icon: 'Megaphone',
    description: 'Weekly events, prayer meetings, youth fellowships and timings',
    defaultTitle: 'मण्डलीका आवश्यक सूचनाहरू',
    defaultSubtitle: 'साप्ताहिक कार्यक्रम तथा संगति विवरण',
    defaultText: `[सूचना १: संगति]\n१. उपवास तथा प्रार्थना संगति\n• हरेक बुधबार बिहान १०:०० बजे देखि\n• मण्डली भवनमा उपस्थित हुनुहोला\n\n---\n\n[सूचना २: जवान संगति]\n२. युवा संगति (Youth Fellowship)\n• हरेक शनिबार दिउँसो २:०० बजे\n• सम्पूर्ण जवानहरूलाई आमन्त्रण छ\n\n---\n\n[सूचना ३: बाइबल अध्ययन]\n३. शुक्रबारको बाइबल अध्ययन\n• साँझ ६:३० बजे (Online & Church Hall)`,
    theme: {
      layout: 'standard',
      textAlign: 'left',
      accentColor: 'cyan'
    }
  },
  {
    id: 'giving',
    name: 'Tithes & Offering (दशांश र भेटी)',
    name_ne: 'दशांश र भेटी (Giving with QR)',
    icon: 'CreditCard',
    description: 'Digital offering slide with bank account and eSewa/Fonepay QR Code',
    defaultTitle: 'दशांश तथा भेटी (Tithes & Offering)',
    defaultSubtitle: '२ कोरिन्थी ९:७ — "खुशीसाथ दिनेलाई परमेश्वरले प्रेम गर्नुहुन्छ।"',
    defaultText: `दशांश तथा भेटी (Tithes & Offering)\n\n"प्रत्येकले आफ्नो हृदयमा संकल्प गरेअनुसार देओस्, न त मन नलाईकन, न करकापमा, किनभने खुशीसाथ दिनेलाई परमेश्वरले प्रेम गर्नुहुन्छ।"\n— २ कोरिन्थी ९:७\n\nBank: Global IME Bank / Nabil Bank\nAccount Name: Church Trust\nAccount No: 01234567890123\nBranch: Kathmandu / Lalitpur`,
    theme: {
      layout: 'giving',
      textAlign: 'left',
      accentColor: 'emerald',
      bankDetails: `Account Name: Church Worship Fellowship\nAccount No: 0192837465012\nBank: Global IME Bank\nBranch: Main Branch\neSewa / Fonepay ID: 9800000000`
    }
  },
  {
    id: 'countdown',
    name: 'Pre-Service Countdown Timer',
    name_ne: 'काउन्टडाउन टाइमर (५ मिनेट)',
    icon: 'Clock',
    description: 'Animated pre-service digital countdown clock (05:00)',
    defaultTitle: 'संगति सुरु हुन बाँकी समय',
    defaultSubtitle: 'Service Starting Soon — Please take your seats',
    defaultText: `संगति केही क्षणमा सुरु हुँदैछ\nकृपया आफ्नो स्थान ग्रहण गरी प्रार्थनामा बस्नुहोला।`,
    theme: {
      layout: 'countdown',
      textAlign: 'center',
      accentColor: 'indigo',
      countdownSeconds: 300,
      countdownLabel: 'Service Begins In'
    }
  },
  {
    id: 'communion',
    name: 'Holy Communion (प्रभुभोज)',
    name_ne: 'पवित्र प्रभुभोज (Communion)',
    icon: 'Heart',
    description: 'Communion liturgy and scripture reading (1 Corinthians 11)',
    defaultTitle: 'पवित्र प्रभुभोज संगति (Holy Communion)',
    defaultSubtitle: '१ कोरिन्थी ११:२३-२६',
    defaultText: `[प्रभुको रोटी]\n"यो मेरो शरीर हो, जो तिमीहरूका निम्ति हो। मेरो सम्झनामा यो गर।"\n\n---\n\n[प्रभुको कचौरा]\n"यो कचौरा मेरो रगतमा भएको नयाँ करार हो। जहिले जहिले तिमीहरू यो पिउँछौ, मेरो सम्झनामा यो गर।"\n\n---\n\n[घोषणा]\n"किनकि जहिले जहिले तिमीहरू यो रोटी खान्छौ र यो कचौराबाट पिउँछौ, तिमीहरूले प्रभुको मृत्युको घोषणा गर्दछौ, जबसम्म उहाँ आउनुहुन्न।"\n— १ कोरिन्थी ११:२६`,
    theme: {
      layout: 'standard',
      textAlign: 'center',
      accentColor: 'rose'
    }
  },
  {
    id: 'benediction',
    name: 'Benediction (आशीषवचन)',
    name_ne: 'आशीषवचन (Closing Blessing)',
    icon: 'Shield',
    description: 'Aaronic and apostolic closing blessings for the congregation',
    defaultTitle: 'आशीषवचन (Benediction)',
    defaultSubtitle: 'गन्ती ६:२४-२६',
    defaultText: `"परमप्रभुले तिमीहरूलाई आशिष दिऊन् र तिमीहरूको रक्षा गरून्।\nपरमप्रभुले आफ्नो मुहार तिमीहरूमाथि चम्काऊन् र तिमीहरूमाथि अनुग्रह गरून्।\nपरमप्रभुले आफ्नो मुहार तिमीहरूतिर फर्काऊन् र तिमीहरूलाई शान्ति दिऊन्।"\n\n— गन्ती ६:२४-२६`,
    theme: {
      layout: 'standard',
      textAlign: 'center',
      accentColor: 'amber'
    }
  }
];
