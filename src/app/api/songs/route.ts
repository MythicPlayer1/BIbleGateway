import { NextResponse } from 'next/server';
import songsData from '@/data/nepali_christian_songs.json';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') || '').toLowerCase().trim();
  const letter = (searchParams.get('letter') || '').trim();
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  let filtered = songsData as any[];

  if (letter) {
    filtered = filtered.filter(song => song.letter === letter);
  }

  if (q) {
    filtered = filtered.filter(song => 
      song.title.toLowerCase().includes(q) ||
      (song.title_en && song.title_en.toLowerCase().includes(q)) ||
      (song.lyrics && song.lyrics.toLowerCase().includes(q)) ||
      (song.details && song.details.toLowerCase().includes(q)) ||
      (song.authors && song.authors.toLowerCase().includes(q))
    );
  }

  const total = filtered.length;
  const paginated = filtered.slice(offset, offset + limit);

  return NextResponse.json({
    total,
    count: paginated.length,
    songs: paginated
  });
}
