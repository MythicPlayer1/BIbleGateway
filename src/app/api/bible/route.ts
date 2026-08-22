import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Cache the bible data in memory
let bibleData: any = null;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const bookIdStr = searchParams.get('book');
  const chapterStr = searchParams.get('chapter');
  
  if (!bookIdStr || !chapterStr) {
    return NextResponse.json({ error: 'Missing book or chapter parameters' }, { status: 400 });
  }

  const bookId = parseInt(bookIdStr, 10);
  const chapterIdx = parseInt(chapterStr, 10) - 1; // 0-indexed in JSON

  try {
    if (!bibleData) {
      const filePath = path.join(process.cwd(), 'src', 'lib', 'nepali-bible.json');
      const fileContents = fs.readFileSync(filePath, 'utf8');
      bibleData = JSON.parse(fileContents);
    }

    const book = bibleData.Book[bookId];
    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    const chapter = book.Chapter[chapterIdx];
    if (!chapter) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
    }

    // Process verses to be easier for frontend
    const verses = chapter.Verse.map((v: any, index: number) => ({
      verseNumber: index + 1,
      text: v.Verse
    }));

    return NextResponse.json({ verses });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to load bible data' }, { status: 500 });
  }
}
