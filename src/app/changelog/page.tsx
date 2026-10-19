/**
 * /changelog —— 更新日志
 *
 * 显示所有历史版本的更新记录，用户可以随时回看。
 */

import { AppShell } from "@/components/layout/AppShell";
import { requireUserId } from "@/lib/session";
import { userRepo } from "@/repositories";
import { readFileSync } from "fs";
import { join } from "path";

export default async function ChangelogPage() {
  // 标记已读
  const userId = await requireUserId();
  await userRepo.update(userId, {
    lastReadChangelogDate: new Date(),
  });

  // 读取 Markdown 内容
  const changelogPath = join(process.cwd(), "src/content/CHANGELOG.md");
  const markdown = readFileSync(changelogPath, "utf-8");

  // 简单解析：按 ## 日期分组显示
  const sections = markdown.split(/(?=^## \d{4}-\d{2}-\d{2})/m).filter(Boolean);

  return (
    <AppShell current="/me" width="prose">
      <div className="space-y-16">
        <header>
          <h1 className="font-display text-display text-ink">更新日志</h1>
          <p className="mt-3 text-lead text-ink-soft">
            记录产品的新功能和改进
          </p>
        </header>

        <div className="prose prose-ink max-w-none space-y-12">
          {sections.map((section, i) => {
            // 提取日期标题
            const dateMatch = section.match(/^## (\d{4}-\d{2}-\d{2})/);
            const date = dateMatch ? dateMatch[1] : '';

            // 移除日期标题，保留其他内容
            const content = section.replace(/^## \d{4}-\d{2}-\d{2}\n\n/, '');

            return (
              <article key={i} className="border-l-2 border-line pl-6">
                {date && (
                  <h2 className="mb-6 font-display text-heading text-ink">
                    {date}
                  </h2>
                )}
                <div
                  className="space-y-4"
                  dangerouslySetInnerHTML={{ __html: formatMarkdown(content) }}
                />
              </article>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}

// 简单的 Markdown 格式化（仅支持基础格式）
function formatMarkdown(text: string): string {
  return text
    .replace(/### (.+)/g, '<h3 class="font-medium text-ink mb-2">$1</h3>')
    .replace(/- (.+)/g, '<li class="flex items-start gap-2"><span class="text-brand mt-1">•</span><span>$1</span></li>')
    .replace(/---/g, '<hr class="my-8 border-line" />')
    .split('\n\n')
    .map(para => {
      if (para.startsWith('<h3') || para.startsWith('<li') || para.startsWith('<hr')) {
        return para;
      }
      return `<p class="text-body text-ink">${para}</p>`;
    })
    .join('\n');
}
