"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * 登出按钮。
 *
 * 之前 /api/auth/logout 这个接口存在但界面上没有任何入口 ——
 * grep 全项目零调用点。加上会话 cookie 是 30 天持久的，
 * 结果就是「只要这个浏览器登录过就永远自动进去」。
 *
 * 用 replace 而不是 push：登出后不该能按浏览器后退回到已登录页面。
 */
export function SignOutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleSignOut() {
    setIsLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.replace("/login");
      // 清掉 client 端缓存的 RSC payload，否则后退可能看到旧内容
      router.refresh();
    } catch {
      // 登出失败也把人送去登录页：cookie 可能已经清了，留在原地更糟
      router.replace("/login");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={isLoading}
      className="text-small text-ink-muted transition-colors duration-[var(--duration-quick)]
        hover:text-ink disabled:opacity-50"
    >
      {isLoading ? "退出中…" : "退出"}
    </button>
  );
}
