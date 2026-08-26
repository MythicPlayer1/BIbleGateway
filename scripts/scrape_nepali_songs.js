const fs = require('fs');
const path = require('path');

const letters = [
  "a", "aa", "i", "ii", "u", "uu", "R_", "e", "ai", "o", "au",
  "k", "kh", "g", "gh", "Ng", "ch", "chh", "j", "jh", "Nj",
  "T_", "T_h", "D_", "D_h", "N_", "t", "th", "d", "dh", "n",
  "p", "ph", "b", "bh", "m", "y", "r", "l", "w",
  "sh", "S_h", "s", "h", "kSh", "tr", "Gy"
];

function parseSongsFromHtml(html, letter) {
  const songs = [];
  const ddRegex = /<dd[^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/dd>/gi;
  let match;
  
  while ((match = ddRegex.exec(html)) !== null) {
    const id = match[1];
    const ddContent = match[2];
    
    // Lyrics inside <pre>
    const preMatch = ddContent.match(/<pre[^>]*>([\s\S]*?)<\/pre>/i);
    if (!preMatch) continue;
    
    const lyrics = preMatch[1]
      .replace(/&nbsp;/g, ' ')
      .replace(/\u00A0/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\r\n/g, '\n')
      .trim();
      
    // Authors
    const authorMatch = ddContent.match(/<span class=['"]authors['"]>([\s\S]*?)<\/span>/i);
    const authors = authorMatch ? authorMatch[1].replace(/<[^>]+>/g, '').trim() : undefined;
    
    // Look backwards from the start of this dd tag for the matching <dt>...</dt>
    const ddIndex = match.index;
    const previousChunk = html.substring(Math.max(0, ddIndex - 600), ddIndex);
    
    let title = '';
    let details = undefined;
    
    const dtMatch = previousChunk.match(/<dt[^>]*>([\s\S]*?)<\/dt>/i);
    if (dtMatch) {
      let dtInner = dtMatch[1];
      
      const detailsMatch = dtInner.match(/<span class="songDetails">([\s\S]*?)<\/span>/i);
      if (detailsMatch) {
        details = detailsMatch[1].replace(/<[^>]+>/g, '').trim();
      }
      
      title = dtInner
        .replace(/<span class="songDetails"[\s\S]*?<\/span>/gi, '')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/\u00A0/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\r\n/g, ' ')
        .trim();
    }
    
    if (title && lyrics) {
      songs.push({
        id,
        letter,
        title,
        details: details || undefined,
        authors: authors || undefined,
        lyrics
      });
    }
  }
  
  return songs;
}

async function scrapeAll() {
  const allSongs = [];
  const resultsByLetter = {};

  console.log(`Starting scrape of ${letters.length} letter endpoints from nepalichristiansongs.com...\n`);

  for (const letter of letters) {
    const url = `https://www.nepalichristiansongs.com/${letter}.php`;
    try {
      process.stdout.write(`Fetching [${letter}] (${url})... `);
      let res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
      });

      if (!res.ok && letter === 'kSh') {
        res = await fetch(`https://www.nepalichristiansongs.com/ksh.php`);
      }

      if (!res.ok) {
        console.log(`FAILED (HTTP ${res.status})`);
        continue;
      }

      const html = await res.text();
      const songs = parseSongsFromHtml(html, letter);
      console.log(`✅ ${songs.length} songs`);
      
      allSongs.push(...songs);
      resultsByLetter[letter] = songs.length;

      // Polite rate limit delay
      await new Promise(r => setTimeout(r, 120));
    } catch (err) {
      console.log(`❌ Error: ${err.message}`);
    }
  }

  // Deduplicate by ID
  const uniqueMap = new Map();
  for (const s of allSongs) {
    if (!uniqueMap.has(s.id)) {
      uniqueMap.set(s.id, s);
    }
  }
  const uniqueSongs = Array.from(uniqueMap.values());

  console.log(`\n======================================================`);
  console.log(`🎉 SCRAPING COMPLETE! Total songs collected: ${uniqueSongs.length}`);
  console.log(`======================================================\n`);

  // Ensure output directories exist
  const srcDataDir = path.join(__dirname, '../src/data');
  if (!fs.existsSync(srcDataDir)) {
    fs.mkdirSync(srcDataDir, { recursive: true });
  }
  const publicDir = path.join(__dirname, '../public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // Save to src/data/nepali_christian_songs.json
  const srcPath = path.join(srcDataDir, 'nepali_christian_songs.json');
  fs.writeFileSync(srcPath, JSON.stringify(uniqueSongs, null, 2), 'utf-8');
  console.log(`📁 Saved to source data: ${srcPath} (${(fs.statSync(srcPath).size / 1024).toFixed(1)} KB)`);

  // Save to public/nepali_christian_songs.json (accessible via fetch('/nepali_christian_songs.json'))
  const publicPath = path.join(publicDir, 'nepali_christian_songs.json');
  fs.writeFileSync(publicPath, JSON.stringify(uniqueSongs, null, 2), 'utf-8');
  console.log(`📁 Saved to public folder: ${publicPath} (${(fs.statSync(publicPath).size / 1024).toFixed(1)} KB)`);

  // Summary by letter
  console.log('\nBreakdown by letter:');
  console.log(JSON.stringify(resultsByLetter, null, 2));
}

scrapeAll().catch(console.error);
