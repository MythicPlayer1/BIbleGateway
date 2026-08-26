import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { books } from '@/lib/books';

// In-memory cache for loaded translation chapters
let nepaliBibleData: any = null;
const remoteChaptersCache = new Map<string, Array<{ verseNumber: number; text: string }>>();

function cleanVerseText(rawText: string): string {
  if (!rawText) return '';
  return rawText
    .replace(/<S>[^<]*<\/S>/gi, '') // Remove Strong numbers like <S>7225</S>
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '') // Strip remaining HTML tags
    .replace(/\s+/g, ' ')
    .trim();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const bookIdStr = searchParams.get('bookId') || searchParams.get('book');
  const chapterStr = searchParams.get('chapter');
  const translation = (searchParams.get('translation') || 'nepali').toLowerCase().trim();
  
  if (bookIdStr === null || chapterStr === null) {
    return NextResponse.json({ error: 'Missing book or chapter parameters' }, { status: 400 });
  }

  const bookId = parseInt(bookIdStr, 10);
  const chapterNum = parseInt(chapterStr, 10); // 1-indexed
  const chapterIdx = chapterNum - 1; // 0-indexed for local JSON

  const targetBook = books.find(b => b.id === bookId) || books[0];
  const bookEnglishName = targetBook.englishName;

  // 1. Nepali Translation (Local JSON - Offline & Fast)
  if (translation === 'nepali' || translation === 'nnrv') {
    try {
      if (!nepaliBibleData) {
        const filePath = path.join(process.cwd(), 'src', 'lib', 'nepali-bible.json');
        const fileContents = fs.readFileSync(filePath, 'utf8');
        nepaliBibleData = JSON.parse(fileContents);
      }

      const book = nepaliBibleData.Book[bookId];
      if (!book) {
        return NextResponse.json({ error: 'Book not found' }, { status: 404 });
      }

      const chapter = book.Chapter[chapterIdx];
      if (!chapter) {
        return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
      }

      const verses = chapter.Verse.map((v: any, index: number) => ({
        verseNumber: index + 1,
        text: cleanVerseText(v.Verse)
      }));

      return NextResponse.json({ 
        translation: 'nepali',
        bookId,
        bookName: targetBook.name,
        bookEnglishName: targetBook.englishName,
        chapter: chapterNum,
        verses 
      });
    } catch (error) {
      console.error('Failed to load Nepali Bible data:', error);
      return NextResponse.json({ error: 'Failed to load bible data' }, { status: 500 });
    }
  }

  // 2. English Translations: KJV or NIV
  const cacheKey = `${translation}_${bookId}_${chapterNum}`;
  if (remoteChaptersCache.has(cacheKey)) {
    return NextResponse.json({
      translation,
      bookId,
      bookName: targetBook.name,
      bookEnglishName: targetBook.englishName,
      chapter: chapterNum,
      verses: remoteChaptersCache.get(cacheKey)
    });
  }

  try {
    let verses: Array<{ verseNumber: number; text: string }> = [];

    if (translation === 'kjv') {
      // Primary: bible-api.com
      try {
        const apiRes = await fetch(
          `https://bible-api.com/${encodeURIComponent(bookEnglishName)}+${chapterNum}?translation=kjv`,
          { next: { revalidate: 86400 } }
        );
        if (apiRes.ok) {
          const data = await apiRes.json();
          if (Array.isArray(data.verses) && data.verses.length > 0) {
            verses = data.verses.map((v: any) => ({
              verseNumber: v.verse,
              text: cleanVerseText(v.text)
            }));
          }
        }
      } catch (err) {
        console.warn('bible-api.com KJV failed, trying bolls.life fallback');
      }

      // Fallback: bolls.life KJV (1-indexed bookId: bookId + 1)
      if (verses.length === 0) {
        const bollsRes = await fetch(
          `https://bolls.life/get-chapter/KJV/${bookId + 1}/${chapterNum}/`,
          { next: { revalidate: 86400 } }
        );
        if (bollsRes.ok) {
          const bollsData = await bollsRes.json();
          if (Array.isArray(bollsData)) {
            verses = bollsData.map((item: any, idx: number) => ({
              verseNumber: item.verse || idx + 1,
              text: cleanVerseText(item.text)
            }));
          }
        }
      }
    } else if (translation === 'niv') {
      // Bolls.life NIV (1-indexed bookId: bookId + 1)
      const bollsRes = await fetch(
        `https://bolls.life/get-chapter/NIV/${bookId + 1}/${chapterNum}/`,
        { next: { revalidate: 86400 } }
      );
      if (bollsRes.ok) {
        const bollsData = await bollsRes.json();
        if (Array.isArray(bollsData) && bollsData.length > 0) {
          verses = bollsData.map((item: any, idx: number) => ({
            verseNumber: item.verse || idx + 1,
            text: cleanVerseText(item.text)
          }));
        }
      }
    }

    if (verses.length > 0) {
      remoteChaptersCache.set(cacheKey, verses);
      return NextResponse.json({
        translation,
        bookId,
        bookName: targetBook.name,
        bookEnglishName: targetBook.englishName,
        chapter: chapterNum,
        verses
      });
    }

    return NextResponse.json(
      { error: `Could not retrieve ${translation.toUpperCase()} scripture for ${bookEnglishName} ${chapterNum}` },
      { status: 502 }
    );
  } catch (error) {
    console.error(`Error fetching ${translation} bible:`, error);
    return NextResponse.json({ error: 'Failed to fetch scripture translation' }, { status: 500 });
  }
}
