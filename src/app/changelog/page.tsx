/**
 * /changelog —— 更新日志
 *
 * 显示所有历史版本的更新记录，用户可以随时回看。
 */

import { AppShell } from "@/components/layout/AppShell";
import { CHANGELOG } from "@/lib/version";

export default function ChangelogPage() {
  // 按版本号倒序排列（最新的在最上面）
  const versions = Object.keys(CHANGELOG).sort().reverse();

  return (
    <AppShell current="/me" width="wide">
      <div className="space-y-16">
        <header>
          <h1 className="font-display text-display text-ink">更新日志</h1>
          <p className="mt-3 text-lead text-ink-soft">
            记录每个版本的新功能和改进
          </p>
        </header>

        <div className="space-y-12">
          {versions.map((version) => {
            const entry = CHANGELOG[version];
            return (
              <article key={version} className="border-l-2 border-line pl-6">
                <header className="mb-4">
                  <div className="flex items-baseline gap-3">
                    <h2 className="font-display text-heading text-ink">
                      {entry.title}
                    </h2>
                    <span className="text-small text-ink-faint">v{version}</span>
                  </div>
                  <p className="mt-2 text-body text-ink-soft">
                    {entry.description}
                  </p>
                </header>

                <ul className="space-y-2">
                  {entry.highlights.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-body text-ink">
                      <span className="mt-1 text-brand" aria-hidden="true">
                        •
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
