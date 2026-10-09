/**
 * WhatsNewModal: 更新公告弹窗
 *
 * 用户登录后，如果 lastSeenVersion < APP_VERSION，显示当前版本的更新内容。
 * 用户关闭弹窗或点击 CTA 后，标记为已读。
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { APP_VERSION, CHANGELOG } from "@/lib/version";

interface WhatsNewModalProps {
  /** 用户看过的最后一个版本号，null 表示从未标记 */
  lastSeenVersion: string | null;
}

export function WhatsNewModal({ lastSeenVersion }: WhatsNewModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [dismissing, setDismissing] = useState(false);

  const changelog = CHANGELOG[APP_VERSION];
  const shouldShow = !lastSeenVersion || lastSeenVersion < APP_VERSION;

  useEffect(() => {
    if (shouldShow && changelog) {
      // 延迟 500ms 显示，避免闪现
      const timer = setTimeout(() => setOpen(true), 500);
      return () => clearTimeout(timer);
    }
  }, [shouldShow, changelog]);

  async function markAsSeen() {
    if (dismissing) return;
    setDismissing(true);

    try {
      await fetch("/api/v1/user/seen-version", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version: APP_VERSION }),
      });
      setOpen(false);
    } catch (error) {
      console.error("Failed to mark version as seen:", error);
      // 即使失败也关闭，避免用户被卡住
      setOpen(false);
    }
  }

  function handleCTA() {
    markAsSeen();
    if (changelog.cta?.href) {
      router.push(changelog.cta.href);
    }
  }

  if (!open || !changelog) return null;

  return (
    <>
      {/* 半透明遮罩，降低不透明度，让背景内容依稀可见 */}
      <div
        className="fixed inset-0 z-50 bg-ink/10 backdrop-blur-sm animate-fade-in"
        onClick={markAsSeen}
      />

      {/* 弹窗内容 */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none">
        <div
          className="pointer-events-auto w-full max-w-md rounded-soft bg-paper/95 backdrop-blur-md p-8 shadow-strong animate-scale-in"
          role="dialog"
          aria-labelledby="whats-new-title"
          aria-modal="true"
        >
          <div className="text-center">
            <div className="mb-4 text-4xl" aria-hidden="true">
              🎉
            </div>
            <h2
              id="whats-new-title"
              className="font-display text-display text-ink"
            >
              {changelog.title}
            </h2>
            <p className="mt-3 text-body text-ink-soft">
              {changelog.description}
            </p>
          </div>

          <ul className="mt-6 space-y-3">
            {changelog.highlights.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-body text-ink">
                <span className="mt-1 text-brand" aria-hidden="true">
                  •
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            {changelog.cta && (
              <button
                type="button"
                onClick={handleCTA}
                disabled={dismissing}
                className="flex-1 rounded-soft bg-brand px-6 py-3 text-body font-medium text-paper
                  transition-colors hover:bg-brand-strong disabled:opacity-50"
              >
                {changelog.cta.label}
              </button>
            )}
            <button
              type="button"
              onClick={markAsSeen}
              disabled={dismissing}
              className="flex-1 rounded-soft border border-line px-6 py-3 text-body text-ink-muted
                transition-colors hover:border-line-strong hover:text-ink disabled:opacity-50"
            >
              好的
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
