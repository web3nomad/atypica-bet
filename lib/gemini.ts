import { GoogleGenAI } from "@google/genai";

// 只在服务端实例化，使用环境变量（不会暴露给客户端）
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function generatePredictionAnalysis(
  title: string,
  description: string,
  options: string[]
) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are an expert AI analyst for a prediction market. Analyze this prediction topic and provide a structured report in Chinese.
      Topic: ${title}
      Description: ${description}
      Options: ${options.join(', ')}

      Structure your response exactly with these markers:
      [OVERVIEW]: A high-level overview of the market context.
      [OPTIONS]: Detailed analysis of each option's probability.
      [FACTORS]: Key influencing factors.
      [REASONING]: Step-by-step reasoning for the final pick.
      [PICK]: The exact text of the option you pick as most likely.
      [SCORE]: A confidence score between 0 and 100.`,
      config: {
        temperature: 0.7,
        topP: 0.95,
      },
    });

    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return null;
  }
}

export function parseAnalysis(text: string) {
  const sections = {
    overview: '',
    optionsAnalysis: '',
    keyFactors: '',
    reasoning: '',
    pick: '',
    score: 0
  };

  const markers = {
    overview: '[OVERVIEW]:',
    options: '[OPTIONS]:',
    factors: '[FACTORS]:',
    reasoning: '[REASONING]:',
    pick: '[PICK]:',
    score: '[SCORE]:'
  };

  const content = text || '';

  const getChunk = (startMarker: string, endMarker?: string) => {
    const startIdx = content.indexOf(startMarker);
    if (startIdx === -1) return '';
    const endIdx = endMarker ? content.indexOf(endMarker, startIdx) : content.length;
    return content.substring(startIdx + startMarker.length, endIdx === -1 ? content.length : endIdx).trim();
  };

  sections.overview = getChunk(markers.overview, markers.options);
  sections.optionsAnalysis = getChunk(markers.options, markers.factors);
  sections.keyFactors = getChunk(markers.factors, markers.reasoning);
  sections.reasoning = getChunk(markers.reasoning, markers.pick);
  sections.pick = getChunk(markers.pick, markers.score);
  const scoreStr = getChunk(markers.score);
  sections.score = parseInt(scoreStr.replace(/[^0-9]/g, '')) || 50;

  return sections;
}

export interface ReportSummary {
  summary: string;
  takeaways: string[];
}

const SUMMARY_PROMPT = `You are an expert analyst. Read the report carefully and output a JSON object with the following format:
{
  "summary": "A concise English overview (max 120 characters) of the entire report.",
  "takeaways": [
    "Critical insight #1",
    "Critical insight #2",
    "Critical insight #3"
  ]
}
Do not add any additional text. Start the response directly with the JSON object.`;

export async function summarizeReportContent(text: string): Promise<ReportSummary> {
  const trimmedText = text.trim().slice(0, 20_000);

  const responseText = await retryWithBackoff(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `${SUMMARY_PROMPT}
Report:
${trimmedText}`,
      config: {
        temperature: 0.55,
        topP: 0.9,
        candidateCount: 1,
      },
    });

    if (!response.text) {
      throw new Error('Gemini 未返回结果');
    }

    return response.text;
  }, 3, 600);

  return parseReportSummary(responseText);
}

function parseReportSummary(text: string): ReportSummary {
  const trimmed = text.trim();
  let candidate = trimmed;
  if (!trimmed.startsWith('{')) {
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      candidate = trimmed.slice(start, end + 1);
    }
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(candidate);
  } catch (error) {
    throw new Error('Gemini 返回的内容无法解析为 JSON');
  }
  const summary =
    typeof (parsed as Record<string, unknown>).summary === 'string'
      ? ((parsed as Record<string, unknown>).summary as string).trim()
      : '';
  const takeawaysValue = (parsed as Record<string, unknown>).takeaways;
  const rawTakeaways: unknown[] = Array.isArray(takeawaysValue)
    ? takeawaysValue
    : [];

  const takeaways = rawTakeaways
    .map((item: unknown) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean);

  if (!summary && takeaways.length === 0) {
    throw new Error('未能从 Gemini 响应中解析出摘要或要点');
  }

  return {
    summary,
    takeaways,
  };
}

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  attempts: number,
  delayMs: number,
) {
  let lastError: unknown = null;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt === attempts - 1) break;
      const wait = delayMs * (attempt + 1);
      await new Promise((resolve) => setTimeout(resolve, wait));
    }
  }

  throw lastError;
}
