import fs from 'fs';
import path from 'path';

/**
 * 获取更新日志的最新发布日期
 * 从 CHANGELOG.md 中解析第一个日期标题（## YYYY-MM-DD）
 */
export function getLatestChangelogDate(): Date {
  try {
    const changelogPath = path.join(process.cwd(), 'src/content/CHANGELOG.md');
    const content = fs.readFileSync(changelogPath, 'utf-8');

    // 匹配第一个日期标题（## 2026-10-17）
    const match = content.match(/^##\s+(\d{4}-\d{2}-\d{2})/m);

    if (match) {
      return new Date(match[1]);
    }

    // 如果没有找到日期，返回一个很早的日期（不显示红点）
    return new Date('2000-01-01');
  } catch (error) {
    console.error('Failed to read CHANGELOG.md:', error);
    return new Date('2000-01-01');
  }
}
