import { Metadata } from "next";
import HistoryClient from "./HistoryClient";
import { mockTwitterPosts, generateMockRevenueData } from "@/lib/mockTwitterData";

export const metadata: Metadata = {
  title: "Trading History",
  description: "Track all trading activities and performance history from ioiio.bet",
};

/**
 * History Page - Trading Activity Timeline
 *
 * Shows Twitter/X posts about trading activities with revenue tracking.
 * Currently using mock data - will be replaced with TikHub API integration.
 */
export default async function HistoryPage() {
  // TODO: Replace with actual TikHub API call
  // const posts = await fetchTwitterPosts();
  const posts = mockTwitterPosts;

  // TODO: Replace with actual revenue data from database
  // const revenueData = await fetchRevenueHistory();
  const revenueData = generateMockRevenueData();

  return <HistoryClient posts={posts} revenueData={revenueData} />;
}
