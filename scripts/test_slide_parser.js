const fs = require('fs');

function parseLyricsToSlides(rawLyrics) {
  if (!rawLyrics || !rawLyrics.trim()) return [];

  const normalized = rawLyrics.replace(/\r\n/g, '\n').trim();

  // Split by double-newline stanza separations if any
  const rawBlocks = normalized.split(/\n\s*\n+/);
  const slides = [];

  const sectionHeaderRegex = /^\s*(?:\[(.*?)\]|((?:को\.|कोरस:|कोरस\b)|(?:[१२३४५६७८९०]+\.)|(?:Verse\s*\d+:?|\d+\.)|(?:Chorus:?|Bridge:?)))\s*(.*)$/i;

  let slideCount = 1;

  for (const block of rawBlocks) {
    const rawLines = block.split('\n').map(l => l.trim()).filter(Boolean);
    if (rawLines.length === 0) continue;

    let currentSection = `Slide ${slideCount}`;
    let currentLines = [];
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

        // Fallback for unstructured songs with no headers:
        // Automatically break into 3-4 line slides so every song is presentation-ready!
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

  return slides;
}

// Test Case 1: Completely unstructured lyrics (no headers, no blank lines)
const rawUnstructuredLyrics = `म गाउँछु प्रभु तिम्रो महिमा
सदा सर्वदा तिम्रो प्रशंसा गर्छु
तिमी नै हौ मेरो सहारा
जीवनको अन्धकारमा ज्योति तिमी हौ
मेरो बाटो देखाउने प्रभु तिमी हौ
तिम्रो नाम उच्च पार्दछु
तिमी जस्तो कोही छैन यस संसारमा
तिमी नै राजाका राजा प्रभुका प्रभु हौ
हल्लेलूयाह आमेन
मेरो प्राणले तिम्रै खोजी गर्दछ`;

console.log("=== Testing Unstructured Raw Lyrics (No Headers, Single Block) ===");
const res = parseLyricsToSlides(rawUnstructuredLyrics);
console.log(`Total Slides created: ${res.length}`);
res.forEach((s, idx) => {
  console.log(`\nSlide #${idx+1} [${s.section}]:\n${s.text}`);
});
