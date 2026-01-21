import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const tweets = await prisma.tweet.findMany({
      select: {
        id: true,
        tweetId: true,
        text: true,
        type: true,
        postedAt: true,
        marketId: true,
        rawJson: true,
        isVisible: true,
      },
      orderBy: { postedAt: 'desc' },
    });

    return NextResponse.json({
      tweets: tweets.map((tweet) => ({
        ...tweet,
        postedAt: tweet.postedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Failed to load tweets:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to load tweets',
      },
      { status: 500 }
    );
  }
}
