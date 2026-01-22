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
      type: { in: ["BUY", "SELL", "ANALYSIS", "REVENUE"] },
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
      marketId: true,
      market: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });

  const posts: TwitterPost[] = tweets.map((tweet) => {
    const raw = (tweet.rawJson ?? {}) as Record<string, unknown>;
    const buyText = typeof raw.buyText === "string" ? raw.buyText : "";
    const market = typeof raw.market === "string" ? raw.market : "";
    const amount = typeof raw.amount === "number" ? raw.amount : undefined;
    const entry = typeof raw.entry === "number" ? raw.entry : undefined;
    const analysisText =
      typeof raw.analysisText === "string" ? raw.analysisText : "";
    const analysisTitle =
      typeof raw.analysisTitle === "string" ? raw.analysisTitle : "";
    const analysisHeadline =
      analysisTitle || (analysisText ? analysisText.split("\n")[0].trim() : "");
    const revenueRate =
      typeof raw.revenueRate === "number" ? raw.revenueRate : undefined;
    const profitLoss =
      typeof raw.profitLoss === "number" ? raw.profitLoss : undefined;
    const portfolioLabel =
      typeof raw.portfolioLabel === "string" ? raw.portfolioLabel : "Portfolio";

    const relatedMarket = tweet.market
      ? {
          id: tweet.market.id,
          title: tweet.market.title,
        }
      : undefined;

    return {
      id: tweet.id,
      tweetId: tweet.tweetId,
      content:
        tweet.type === "ANALYSIS" && analysisText
          ? analysisText
          : buyText || tweet.text,
      relatedMarket,
      author: {
        handle: "@ioiiobet",
        name: "ioiio.bet",
        avatar: "/images/logoicon.jpg",
      },
      publishedAt: tweet.postedAt.toISOString(),
      tradeData:
        tweet.type === "ANALYSIS"
          ? {
              action: "ANALYSIS",
              market: analysisHeadline || "Analysis",
            }
          : tweet.type === "REVENUE"
            ? {
                action: "REVENUE",
                market: portfolioLabel,
                revenueRate,
                profitLoss,
              }
            : market
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
