import type { ReactNode } from "react";

/** 全大写小标签，用于区块标识。editorial 语汇里的「栏目名」。 */
export function Label({
  children,
  tone = "muted",
  htmlFor,
}: {
  children: ReactNode;
  tone?: "muted" | "brand" | "ai";
  /** 传了就渲染成 <label>，用于表单可访问性 */
  htmlFor?: string;
}) {
  const tones = {
    muted: "text-ink-faint",
    brand: "text-brand",
    ai: "text-ai",
  } as const;
  const cls = `label-caps ${tones[tone]}`;

  if (htmlFor) {
    return (
      <label htmlFor={htmlFor} className={`${cls} block cursor-pointer`}>
        {children}
      </label>
    );
  }
  return <span className={cls}>{children}</span>;
}

/** 极淡分隔线。产品里用线而不用卡片边框来分区。 */
export function Rule({ className = "" }: { className?: string }) {
  return <hr className={`border-0 border-t border-line ${className}`} />;
}

/** 抬升面。谨慎使用 —— PRD 明确要避免卡片墙。 */
export function Surface({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-card border border-line bg-paper-raised ${className}`}
    >
      {children}
    </div>
  );
}

/** AI 输出容器。靛紫细边 + 淡底，让 AI 的话在视觉上可辨认但不喧哗。 */
export function AiSurface({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-card border border-ai-border bg-ai-soft ${className}`}
    >
      {children}
    </div>
  );
}

/** AI Butler 的全局标记 ✦ */
export function Sparkle({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M12 2.5l1.9 6.1a3 3 0 0 0 1.95 1.95l6.15 1.9-6.15 1.9a3 3 0 0 0-1.95 1.95L12 22.5l-1.9-6.2a3 3 0 0 0-1.95-1.95L2 12.45l6.15-1.9A3 3 0 0 0 10.1 8.6L12 2.5z" />
    </svg>
  );
}
