type TradeTemplate = "BUY" | "SELL";
type ParsedTweetType = TradeTemplate | "ANALYSIS" | "REVENUE";

const buildSectionRegex = (label: string) =>
  new RegExp(
    `(?:^|\\n)\\s*${label}\\s*[:ï¼š]\\s*([\\s\\S]*?)(?=\\n\\s*(?:buy|sell|market|amount|entry)\\s*[:ï¼š]|$)`,
    "i"
  );

const parseNumber = (value: string | null): number | null => {
  if (!value) return null;
  const normalized = value.replace(/,/g, "").replace(/[^0-9.+-]/g, "");
  if (!normalized) return null;
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

const parsePercent = (value: string | null): number | null => {
  if (!value) return null;
  const match = value.match(/([+-]?\d+(?:\.\d+)?)\s*%/);
  if (!match) return null;
  const parsed = Number.parseFloat(match[1]);
  return Number.isFinite(parsed) ? parsed : null;
};

const parseSignedNumber = (
  value: string | null,
  signHint: number | null
): number | null => {
  if (!value) return null;
  const parsed = parseNumber(value);
  if (parsed === null) return null;
  const hasNegative = /-/.test(value);
  const sign = hasNegative || (signHint !== null && signHint < 0) ? -1 : 1;
  return sign * Math.abs(parsed);
};

const parseTradeTemplate = (
  text: string,
  template: TradeTemplate
): { buyText: string; market: string; amount: number; entry: number } | null => {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  const label = template.toLowerCase();
  const buyText =
    normalized.match(buildSectionRegex(label))?.[1]?.trim() ?? "";
  const market =
    normalized.match(buildSectionRegex("market"))?.[1]?.trim() ?? "";
  const amountText =
    normalized.match(buildSectionRegex("amount"))?.[1]?.trim() ?? "";
  const entryText =
    normalized.match(buildSectionRegex("entry"))?.[1]?.trim() ?? "";
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

const parseAnalysisTemplate = (
  text: string
): { analysisText: string; analysisTitle: string } | null => {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  const match = normalized.match(
    /(?:^|\n)\s*[^a-zA-Z0-9]*analysis\s*[:\uFF1A]\s*([\s\S]+)/i
  );
  if (!match) return null;
  const analysisText = match[1].trim();
  if (!analysisText) return null;
  const analysisTitle =
    analysisText.split("\n")[0]?.trim() ?? "";

  return {
    analysisText,
    analysisTitle,
  };
};

const parseRevenueTemplate = (
  text: string
):
  | {
      headerText: string;
      period: string;
      portfolioLine: string;
      revenueRate: number;
      profitLoss: number | null;
      portfolioLabel: string;
    }
  | null => {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  const headerMatch = normalized.match(
    /(?:^|\n)\s*[^a-zA-Z0-9]*revenue\s*[:\uFF1A]\s*([^\n]+)/i
  );
  if (!headerMatch) return null;
  const headerText = headerMatch[1].trim();
  const period =
    normalized.match(/(?:^|\n)\s*period\s*[:\uFF1A]\s*([^\n]+)/i)?.[1]?.trim() ??
    "";
  const portfolioLine =
    normalized.match(/(?:^|\n)\s*portfolio\s*[:\uFF1A]\s*([^\n]+)/i)?.[1]?.trim() ??
    "";
  const percentSource = portfolioLine || headerText;
  const revenueRate = parsePercent(percentSource);
  if (revenueRate === null) return null;
  const pnlMatch = (portfolioLine || headerText).match(/\(([^)]+)\)/);
  const profitLoss = pnlMatch
    ? parseSignedNumber(pnlMatch[1], revenueRate)
    : null;
  const labelMatch = headerText.match(/^(.+?)\s+(?:up|down|over|in|for)\b/i);
  const portfolioLabel = labelMatch ? labelMatch[1].trim() : "Portfolio";

  return {
    headerText,
    period,
    portfolioLine,
    revenueRate,
    profitLoss,
    portfolioLabel,
  };
};

export type ParsedTradeRawJson = {
  parsed: true;
  template: TradeTemplate;
  buyText: string;
  market: string;
  amount: number;
  entry: number;
};

export type ParsedAnalysisRawJson = {
  parsed: true;
  template: "ANALYSIS";
  analysisText: string;
  analysisTitle: string;
};

export type ParsedRevenueRawJson = {
  parsed: true;
  template: "REVENUE";
  headerText: string;
  period: string;
  portfolioLine: string;
  revenueRate: number;
  profitLoss: number | null;
  portfolioLabel: string;
};

export type ParsedTweetResult =
  | { type: TradeTemplate; rawJson: ParsedTradeRawJson }
  | { type: "ANALYSIS"; rawJson: ParsedAnalysisRawJson }
  | { type: "REVENUE"; rawJson: ParsedRevenueRawJson };

export const detectTweetTemplate = (
  text: string
): ParsedTweetResult | null => {
  const tradeBuy = parseTradeTemplate(text, "BUY");
  if (tradeBuy) {
    return {
      type: "BUY",
      rawJson: {
        parsed: true,
        template: "BUY",
        ...tradeBuy,
      },
    };
  }

  const tradeSell = parseTradeTemplate(text, "SELL");
  if (tradeSell) {
    return {
      type: "SELL",
      rawJson: {
        parsed: true,
        template: "SELL",
        ...tradeSell,
      },
    };
  }

  const analysis = parseAnalysisTemplate(text);
  if (analysis) {
    return {
      type: "ANALYSIS",
      rawJson: {
        parsed: true,
        template: "ANALYSIS",
        ...analysis,
      },
    };
  }

  const revenue = parseRevenueTemplate(text);
  if (revenue) {
    return {
      type: "REVENUE",
      rawJson: {
        parsed: true,
        template: "REVENUE",
        ...revenue,
      },
    };
  }

  return null;
};
