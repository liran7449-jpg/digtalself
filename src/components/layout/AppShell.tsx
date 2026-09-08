import Link from "next/link";
import type { ReactNode } from "react";
import { Sparkle } from "@/components/ui/Primitives";

const NAV = [
  { href: "/today", label: "Today" },
  { href: "/moments", label: "Moments" },
  { href: "/me", label: "Me" },
] as const;

/**
 * IA 第 3 节：导航应该安静。不做侧边栏、图标体系、badge、未读红点。
 * MVP 只有三个一级入口。
 */
export function AppShell({
  current,
  /**
   * prose：单栏阅读宽度，Today / 详情页用。
   * wide：带侧栏的页面用，正文仍受 measure 约束，多出来的宽度给辅助层。
   */
  width = "prose",
  children,
}: {
  current: (typeof NAV)[number]["href"];
  width?: "prose" | "wide";
  children: ReactNode;
}) {
  return (
    <div className="min-h-dvh">
      <header className="border-b border-line">
        <div
          className={`mx-auto flex items-center justify-between px-6 py-4 sm:px-10 ${
            width === "wide" ? "max-w-6xl" : "max-w-3xl"
          }`}
        >
          <nav className="flex gap-6 text-small" aria-label="主导航">
            {NAV.map((n) => {
              const active = n.href === current;
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  aria-current={active ? "page" : undefined}
                  className={`transition-colors duration-[var(--duration-quick)] ${
                    active
                      ? "font-medium text-ink"
                      : "text-ink-muted hover:text-ink"
                  }`}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>

          {/* AI Butler 全局入口。P0 尚未接 AI，先禁用并说明。 */}
          <button
            type="button"
            disabled
            aria-label="AI Butler（即将上线）"
            title="AI Butler 即将上线"
            className="flex size-11 items-center justify-center rounded-soft text-ai
              opacity-40 disabled:cursor-not-allowed"
          >
            <Sparkle className="size-4" />
          </button>
        </div>
      </header>

      <main
        className={`mx-auto px-6 py-12 sm:px-10 lg:py-16 ${
          width === "wide" ? "max-w-6xl" : "max-w-3xl"
        }`}
      >
        {children}
      </main>
    </div>
  );
}
