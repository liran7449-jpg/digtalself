"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

/**
 * 改密码页。
 *
 * 两种进入方式：
 * 1. 拿临时密码首次登录 —— middleware 强制跳到这里，改完才能用
 * 2. 主动改密码 —— 从设置入口进来
 *
 * 两种情况共用一个页面，文案不区分：多写一套 UI 不值得。
 */
export default function ChangePasswordPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    // 两次不一致在前端就挡掉，省一次往返
    if (newPassword !== confirmPassword) {
      setError("两次输入的新密码不一致");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await response.json();

      if (response.ok) {
        router.push("/today");
        router.refresh();
      } else {
        setError(data.error || "改密码失败");
      }
    } catch {
      setError("网络错误，请重试");
    } finally {
      setIsLoading(false);
    }
  }

  const inputClass =
    "w-full px-4 py-3 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-600";
  const labelClass =
    "block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2";

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 dark:bg-neutral-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
            设置新密码
          </h1>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            改完之后请记住它，这是进入你自己空间的唯一凭据
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="current" className={labelClass}>
              当前密码
            </label>
            <input
              id="current"
              name="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className={inputClass}
              autoComplete="current-password"
              autoFocus
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="new" className={labelClass}>
              新密码
            </label>
            <input
              id="new"
              name="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={inputClass}
              placeholder="至少 8 位"
              autoComplete="new-password"
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="confirm" className={labelClass}>
              再输一次新密码
            </label>
            <input
              id="confirm"
              name="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={inputClass}
              autoComplete="new-password"
              disabled={isLoading}
            />
          </div>

          {error && (
            <div
              role="alert"
              className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 px-4 py-2 rounded-lg"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={
              isLoading || !currentPassword || !newPassword || !confirmPassword
            }
            className="w-full py-3 rounded-lg bg-neutral-900 dark:bg-neutral-50 text-white dark:text-neutral-900 font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "保存中..." : "保存新密码"}
          </button>
        </form>
      </div>
    </div>
  );
}
