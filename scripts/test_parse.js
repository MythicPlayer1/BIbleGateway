const fs = require('fs');

async function test() {
  const res = await fetch("https://www.nepalichristiansongs.com/a.php");
  const html = await res.text();
  
  const songs = [];
  
  // Split by <dd class="nepali" or <dd class="hindi"
  // Each song is between <script type="text/javascript"><!--Hide from old browsers ... <dd ... id="songXYZ"> ... </dd>
  
  // Find all <dd ... id="([^"]+)">
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
      .replace(/\r\n/g, '\n')
      .trim();
      
    // Authors
    const authorMatch = ddContent.match(/<span class=['"]authors['"]>([\s\S]*?)<\/span>/i);
    const authors = authorMatch ? authorMatch[1].replace(/<[^>]+>/g, '').trim() : undefined;
    
    // Look backwards from the start of this dd tag for the matching <dt>...</dt>
    const ddIndex = match.index;
    const previousChunk = html.substring(Math.max(0, ddIndex - 600), ddIndex);
    
    // Extract from <dt ...> ... </dt>
    let title = '';
    let details = undefined;
    
    const dtMatch = previousChunk.match(/<dt[^>]*>([\s\S]*?)<\/dt>/i);
    if (dtMatch) {
      let dtInner = dtMatch[1];
      
      // Extract details
      const detailsMatch = dtInner.match(/<span class="songDetails">([\s\S]*?)<\/span>/i);
      if (detailsMatch) {
        details = detailsMatch[1].replace(/<[^>]+>/g, '').trim();
      }
      
      // Clean title
      title = dtInner
        .replace(/<span class="songDetails"[\s\S]*?<\/span>/gi, '')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/\u00A0/g, ' ')
        .replace(/\r\n/g, ' ')
        .trim();
    }
    
    if (title && lyrics) {
      songs.push({
        id,
        title,
        details: details || undefined,
        authors,
        lyrics
      });
    }
  }
  
  console.log(`Successfully parsed ${songs.length} songs from a.php!`);
  for (let i = 0; i < Math.min(5, songs.length); i++) {
    console.log(`\n--- Song #${i+1} [${songs[i].id}] ---`);
    console.log(`Title: ${songs[i].title}`);
    console.log(`Details: ${songs[i].details}`);
    console.log(`Authors: ${songs[i].authors}`);
    console.log(`Lyrics First 2 Lines:\n${songs[i].lyrics.split('\n').slice(0, 2).join('\n')}`);
  }
}

test().catch(console.error);
