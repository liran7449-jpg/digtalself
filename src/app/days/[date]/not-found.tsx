import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";

export default function DayNotFound() {
  return (
    <AppShell current="/moments">
      <div className="measure">
        <h1 className="font-display text-title text-ink">这一天还没到。</h1>
        <p className="mt-4 text-body text-ink-muted">
          未来的日子还没有内容。回去看看已经走过的。
        </p>
        <Link
          href="/moments"
          className="mt-8 inline-flex min-h-11 items-center rounded-soft border
            border-line-strong px-5 text-small text-ink transition-colors
            hover:border-ink-muted hover:bg-paper-raised"
        >
          回到 Moments
        </Link>
      </div>
    </AppShell>
  );
}
