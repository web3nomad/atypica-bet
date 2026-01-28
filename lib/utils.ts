/**
 * 客户端工具函数
 * 这些函数可以在客户端组件中安全使用，不依赖 Node.js 模块
 */

/**
 * 从 Polymarket URL 中提取 Event Slug
 * 支持完整 URL 或直接 slug
 * 
 * @param input - Polymarket URL 或 Event Slug
 * @returns 提取的 Event Slug
 * 
 * @example
 * extractSlugFromUrl('https://polymarket.com/event/super-bowl-champion-2026')
 * // => 'super-bowl-champion-2026'
 * 
 * @example
 * extractSlugFromUrl('super-bowl-champion-2026')
 * // => 'super-bowl-champion-2026'
 */
export function extractSlugFromUrl(input: string): string {
  const trimmed = input.trim();

  if (trimmed.startsWith('http')) {
    try {
      const url = new URL(trimmed);
      const segments = url.pathname.split('/').filter(Boolean);
      return segments[segments.length - 1] || '';
    } catch {
      return '';
    }
  }

  return trimmed;
}

type ClassValue =
  | string
  | number
  | null
  | undefined
  | false
  | ClassValue[]
  | Record<string, boolean>;

export function cn(...inputs: ClassValue[]) {
  const classes: string[] = [];

  const pushClass = (value: ClassValue) => {
    if (!value) return;
    if (typeof value === "string" || typeof value === "number") {
      classes.push(String(value));
      return;
    }
    if (Array.isArray(value)) {
      value.forEach(pushClass);
      return;
    }
    if (typeof value === "object") {
      Object.entries(value).forEach(([key, enabled]) => {
        if (enabled) classes.push(key);
      });
    }
  };

  inputs.forEach(pushClass);
  return classes.join(" ");
}
