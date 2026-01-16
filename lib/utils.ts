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
