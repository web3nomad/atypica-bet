import { Metadata } from "next";
import HistoryClient from "./HistoryClient";
import { generateMockRevenueData } from "@/lib/mockTwitterData";
import { prisma } from "@/lib/prisma";
import { TwitterPost } from "@/types";

export const metadata: Metadata = {
  title: "Trading History",
  description: "Track all trading activities and performance history from ioiio.bet",
};

export const dynamic = "force-dynamic";

/**
 * History Page - Trading Activity Timeline
 *
 * Shows Twitter/X posts about trading activities with revenue tracking.
 */
export default async function HistoryPage() {
  const tweets = await prisma.tweet.findMany({
    where: {
      type: { in: ["BUY", "SELL"] },
      isVisible: true,
    },
    orderBy: { postedAt: "desc" },
    select: {
      id: true,
      tweetId: true,
      text: true,
      postedAt: true,
      rawJson: true,
      type: true,
    },
  });

  const posts: TwitterPost[] = tweets.map((tweet) => {
    const raw = (tweet.rawJson ?? {}) as Record<string, unknown>;
    const buyText = typeof raw.buyText === "string" ? raw.buyText : "";
    const market = typeof raw.market === "string" ? raw.market : "";
    const amount = typeof raw.amount === "number" ? raw.amount : undefined;
    const entry = typeof raw.entry === "number" ? raw.entry : undefined;

    return {
      id: tweet.id,
      tweetId: tweet.tweetId,
      content: buyText || tweet.text,
      author: {
        handle: "@ioiiobet",
        name: "ioiio.bet",
        avatar: "/images/logoicon.jpg",
      },
      publishedAt: tweet.postedAt.toISOString(),
      tradeData: market
        ? {
            action: tweet.type === "SELL" ? "SELL" : "BUY",
            market,
            amount,
            price: entry,
          }
        : undefined,
      media: {
        images: [],
        videos: [],
        links: [],
      },
      engagement: {
        likes: 0,
        retweets: 0,
        replies: 0,
      },
    };
  });

  // TODO: Replace with actual revenue data from database
  // const revenueData = await fetchRevenueHistory();
  const revenueData = generateMockRevenueData();

  return <HistoryClient posts={posts} revenueData={revenueData} />;
}
