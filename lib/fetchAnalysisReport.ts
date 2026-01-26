const DEFAULT_TIMEOUT_MS = 15_000;
const MAX_RESPONSE_LENGTH = 80_000;

export class AnalysisFetchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AnalysisFetchError";
  }
}

/**
 * Fetch the raw text content of an analysis report URL.
 * Performs trimming/sanitization and enforces a timeout to avoid hanging.
 */
export async function fetchAnalysisReport(
  url: string,
  options?: { timeoutMs?: number; maxLength?: number }
): Promise<string> {
  const normalizedUrl = url?.trim();

  if (!normalizedUrl) {
    throw new AnalysisFetchError("分析报告链接为空");
  }

  if (
    !normalizedUrl.startsWith("http://") &&
    !normalizedUrl.startsWith("https://")
  ) {
    throw new AnalysisFetchError("分析报告链接必须以 http:// 或 https:// 开头");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options?.timeoutMs ?? DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(normalizedUrl, {
      method: "GET",
      headers: {
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0 Safari/537.36 AtypicaBot/1.0",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new AnalysisFetchError(`分析报告请求失败，状态码 ${response.status}`);
    }

    const text = await response.text();
    const maxLength = options?.maxLength ?? MAX_RESPONSE_LENGTH;
    return text.trim().slice(0, maxLength);
  } catch (error) {
    if ((error as Error).name === "AbortError") {
      throw new AnalysisFetchError("分析报告请求超时");
    }
    if (error instanceof AnalysisFetchError) {
      throw error;
    }
    throw new AnalysisFetchError("获取分析报告失败");
  } finally {
    clearTimeout(timeout);
  }
}
