import { fetchAnalysisReport } from "@/lib/fetchAnalysisReport";
import { summarizeReportContent } from "@/lib/gemini";

const TAKEAWAY_PREFIX_RE = /^[•\-\–\s]+/;

export interface AutoAnalysisResult {
  summary: string;
  takeawayText: string;
}

export async function generateAutoAnalysisFromUrl(
  url: string,
): Promise<AutoAnalysisResult> {
  const report = await fetchAnalysisReport(url);
  const { summary, takeaways } = await summarizeReportContent(report);
  const takeawayText = formatTakeaways(takeaways);

  return {
    summary,
    takeawayText,
  };
}

function formatTakeaways(takeaways: string[]): string {
  return takeaways
    .map((line) => line.replace(TAKEAWAY_PREFIX_RE, "").trim())
    .filter(Boolean)
    .map((line) => `• ${line}`)
    .join("\n");
}
