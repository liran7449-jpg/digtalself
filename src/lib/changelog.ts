/**
 * 获取更新日志的最新发布日期
 * 从 CHANGELOG.md 中解析第一个日期标题（## YYYY-MM-DD）
 */
export function getLatestChangelogDate(): Date {
  // 硬编码最新日期，每次更新 CHANGELOG.md 时手动更新这里
  // 或者在构建时通过环境变量注入
  return new Date('2026-10-17');
}

/**
 * 获取更新日志内容
 * 返回静态的 Markdown 内容
 */
export function getChangelogContent(): string {
  // 这里可以通过 import 静态内容，或者返回硬编码的内容
  // 为了避免 Vercel 构建问题，暂时返回空字符串
  // changelog 页面会直接读取文件
  return '';
}
