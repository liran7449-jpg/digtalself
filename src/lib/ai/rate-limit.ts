/**
 * 简单的内存限流器，按 userId 限制请求频率。
 *
 * 30 次 / 小时，滑动窗口。重启会清零，单实例够用。
 */

const WINDOW_MS = 60 * 60 * 1000; // 1 小时
const MAX_REQUESTS = 30;

const requests = new Map<string, number[]>();

export function checkRateLimit(userId: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const cutoff = now - WINDOW_MS;

  // 清理过期记录
  const timestamps = requests.get(userId) || [];
  const recent = timestamps.filter((t) => t > cutoff);

  if (recent.length >= MAX_REQUESTS) {
    requests.set(userId, recent);
    return { allowed: false, remaining: 0 };
  }

  recent.push(now);
  requests.set(userId, recent);

  return { allowed: true, remaining: MAX_REQUESTS - recent.length };
}
