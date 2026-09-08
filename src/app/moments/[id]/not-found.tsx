import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";

export default function MomentNotFound() {
  return (
    <AppShell current="/moments">
      <div className="measure">
        <h1 className="font-display text-title text-ink">这条记录不在了。</h1>
        <p className="mt-4 text-body text-ink-muted">
          可能已经被删除。其他记录都还在。
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
