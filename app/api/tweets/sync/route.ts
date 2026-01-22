import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PostType } from '@prisma/client';
import { setProxy } from '@/lib/proxy';
import fixturePayload from '@/lib/fixtures/x-tweets.json';

const X_API_BASE = 'https://api.x.com/2';
const X_HANDLE = 'ioiio_eth';

type XTweet = {
  id: string;
  text: string;
  created_at?: string;
};

const buildSectionRegex = (label: string) =>
  new RegExp(
    `(?:^|\\n)\\s*${label}\\s*[:：]\\s*([\\s\\S]*?)(?=\\n\\s*(?:buy|sell|market|amount|entry)\\s*[:：]|$)`,
    'i'
  );

const parseNumber = (value: string | null): number | null => {
  if (!value) return null;
  const normalized = value.replace(/,/g, '').replace(/[^0-9.+-]/g, '');
  if (!normalized) return null;
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

const parseTradeTemplate = (text: string, template: 'BUY' | 'SELL') => {
  const normalized = text.replace(/\r\n/g, '\n').trim();
  const label = template.toLowerCase();
  const buyText = normalized.match(buildSectionRegex(label))?.[1]?.trim() ?? '';
  const market = normalized.match(buildSectionRegex('market'))?.[1]?.trim() ?? '';
  const amountText = normalized.match(buildSectionRegex('amount'))?.[1]?.trim() ?? '';
  const entryText = normalized.match(buildSectionRegex('entry'))?.[1]?.trim() ?? '';
  const amount = parseNumber(amountText);
  const entry = parseNumber(entryText);

  if (!buyText || !market || amount === null || entry === null) return null;

  return {
    buyText,
    market,
    amount,
    entry,
  };
};

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source');
    const useFixture = source === 'fixture';

    const account = await prisma.twitterAccount.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
    });

    if (!account) {
      return NextResponse.json(
        { error: 'No active Twitter account configured' },
        { status: 400 }
      );
    }

    if (!useFixture && !account.twitterUserId) {
      return NextResponse.json(
        { error: 'No active Twitter account configured' },
        { status: 400 }
      );
    }

    let payload: { data?: XTweet[] };

    if (useFixture) {
      payload = fixturePayload as { data?: XTweet[] };
    } else {
      const token = process.env.X_BEARER_TOKEN;
      if (!token) {
        return NextResponse.json(
          { error: 'Missing X_BEARER_TOKEN' },
          { status: 500 }
        );
      }

      await setProxy();

      const apiUrl = new URL(
        `${X_API_BASE}/users/${account.twitterUserId}/tweets`
      );
      apiUrl.searchParams.set('exclude', 'replies,retweets');
      apiUrl.searchParams.set('max_results', '5');
      apiUrl.searchParams.set('tweet.fields', 'created_at');

      const response = await fetch(apiUrl.toString(), {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: 'no-store',
      });

      if (!response.ok) {
        const errorText = await response.text();
        return NextResponse.json(
          { error: 'Failed to fetch tweets', detail: errorText },
          { status: response.status }
        );
      }

      payload = (await response.json()) as { data?: XTweet[] };
    }

    const tweets = Array.isArray(payload.data) ? payload.data : [];
    const tweetIds = tweets.map((tweet) => tweet.id);

    const existing = await prisma.tweet.findMany({
      where: { tweetId: { in: tweetIds } },
      select: { tweetId: true },
    });
    const existingIds = new Set(existing.map((tweet) => tweet.tweetId));

    let addedCount = 0;
    let ignoredCount = 0;
    let skippedCount = 0;

    const createData = tweets.flatMap((tweet) => {
      if (existingIds.has(tweet.id)) {
        skippedCount += 1;
        return [];
      }

      const parsedBuy = parseTradeTemplate(tweet.text, 'BUY');
      const parsedSell = parsedBuy ? null : parseTradeTemplate(tweet.text, 'SELL');
      const parsed = parsedBuy ?? parsedSell;
      const matchedType = parsedBuy ? PostType.BUY : parsedSell ? PostType.SELL : null;
      const matched = Boolean(parsed);

      if (matched) {
        addedCount += 1;
      } else {
        ignoredCount += 1;
      }

      const rawJson = matched
        ? {
            parsed: true,
            template: matchedType,
            buyText: parsed?.buyText,
            market: parsed?.market,
            amount: parsed?.amount,
            entry: parsed?.entry,
          }
        : { parsed: false };

      return [
        {
          accountId: account.id,
          tweetId: tweet.id,
          text: tweet.text,
          url: `https://x.com/${X_HANDLE}/status/${tweet.id}`,
          postedAt: tweet.created_at ? new Date(tweet.created_at) : new Date(),
          type: matchedType,
          isVisible: matched,
          rawJson,
        },
      ];
    });

    if (createData.length > 0) {
      await prisma.tweet.createMany({ data: createData });
    }

    await prisma.twitterAccount.update({
      where: { id: account.id },
      data: { lastSyncAt: new Date() },
    });

    return NextResponse.json({
      addedCount,
      ignoredCount,
      skippedCount,
      fetchedCount: tweets.length,
    });
  } catch (error) {
    console.error('Tweet sync failed:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Tweet sync failed',
      },
      { status: 500 }
    );
  }
}
