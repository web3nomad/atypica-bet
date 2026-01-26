import { NextRequest, NextResponse } from 'next/server';
import { detectTweetTemplate } from '@/lib/tweet-parser';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const text = typeof body.text === 'string' ? body.text.trim() : '';

    if (!text) {
      return NextResponse.json(
        { error: 'Tweet text is required for parsing' },
        { status: 400 }
      );
    }

    const parsed = detectTweetTemplate(text);

    if (!parsed) {
      return NextResponse.json(
        {
          error:
            'Unable to extract structured fields from the provided tweet. Please adjust it manually.',
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      type: parsed.type,
      rawJson: parsed.rawJson,
      isTrade: parsed.type === 'BUY' || parsed.type === 'SELL',
    });
  } catch (error) {
    console.error('Failed to parse tweet:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to parse tweet automatically',
      },
      { status: 500 }
    );
  }
}
