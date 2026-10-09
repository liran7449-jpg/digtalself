"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

/**
 * 账号菜单。取代原来那个孤零零的「退出」按钮。
 *
 * 改密码入口必须在这里，而不是登录页 —— 登录页按定义是未登录状态，
 * 谁都能打开。如果那里能改密码，任何人输入别人的用户名就能把对方
 * 锁在外面。改密码前必须先证明「你是你」（所以 API 也要求当前密码）。
 *
 * 用原生 button + Link 而不是引入下拉菜单库：只有两个菜单项，
 * 一个库的体积和 API 面都不值得。
 */
export function AccountMenu({ name }: { name: string | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  /**
   * 点外面关掉，Esc 也关掉。
   *
   * 这两个是下拉菜单的最低预期 —— 少了任何一个，用户会觉得菜单「卡住了」。
   * pointerdown 而不是 click：click 在某些浏览器上会先触发菜单项本身，
   * 导致刚点的那一下被当成「点了外面」。
   */
  useEffect(() => {
    if (!open) return;

    function onPointerDown(e: PointerEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      // 失败也送去登录页：cookie 可能已经清了，留在原地更糟
      // replace 而不是 push —— 登出后不该能按后退回到已登录页面
      router.replace("/login");
      router.refresh();
    }
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex min-h-11 items-center gap-1.5 rounded-soft px-2 text-small
          text-ink-muted transition-colors duration-[var(--duration-quick)]
          hover:text-ink"
      >
        {name || "账号"}
        <svg
          aria-hidden
          viewBox="0 0 12 12"
          className={`size-3 transition-transform duration-[var(--duration-quick)] ${
            open ? "rotate-180" : ""
          }`}
        >
          <path
            d="M2.5 4.5 6 8l3.5-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="animate-rise absolute right-0 top-full z-20 mt-1 w-40 overflow-hidden
            rounded-soft border border-line bg-paper-raised py-1 shadow-lg"
        >
          <Link
            role="menuitem"
            href="/change-password"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-small text-ink-soft transition-colors
              duration-[var(--duration-quick)] hover:bg-brand-soft hover:text-ink"
          >
            修改密码
          </Link>
          <Link
            role="menuitem"
            href="/changelog"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-small text-ink-soft transition-colors
              duration-[var(--duration-quick)] hover:bg-brand-soft hover:text-ink"
          >
            更新日志
          </Link>
          <button
            role="menuitem"
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className="block w-full px-4 py-2.5 text-left text-small text-ink-soft
              transition-colors duration-[var(--duration-quick)]
              hover:bg-brand-soft hover:text-ink disabled:opacity-50"
          >
            {signingOut ? "退出中…" : "退出登录"}
          </button>
        </div>
      )}
    </div>
  );
}
