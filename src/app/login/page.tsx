"use client";

import { Suspense, useState, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * useSearchParams() 在静态预渲染时拿不到值，必须包一层 Suspense，
 * 否则 build 会以 missing-suspense-with-csr-bailout 失败。
 * /login 是静态页（○），所以走的是预渲染这条路。
 */
export default function LoginPage() {
  return (
    <Suspense fallback={<LoginShell />}>
      <LoginForm />
    </Suspense>
  );
}

/** fallback：和真实表单同样的骨架，避免 hydration 时布局跳动。 */
function LoginShell() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 dark:bg-neutral-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold text-neutral-900 dark:text-neutral-50">
            Digital Self
          </h1>
        </div>
      </div>
    </div>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        /**
         * 拿临时密码登录的用户先去改密码。middleware 也会拦，
         * 这里直接跳是为了少一次重定向往返。
         */
        if (data.mustChangePassword) {
          router.push("/change-password");
        } else {
          /**
           * `from` 是 middleware 拦下来时记的原始路径，登录后送回去。
           * 只接受站内相对路径 —— 不校验的话 ?from=https://evil.com
           * 就变成了一个挂在自己域名下的钓鱼跳转。
           */
          const from = searchParams.get("from");
          const safeFrom = from?.startsWith("/") && !from.startsWith("//") ? from : "/today";
          router.push(safeFrom);
        }
        router.refresh();
      } else {
        setError(data.error || "登录失败");
      }
    } catch {
      setError("网络错误，请重试");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 dark:bg-neutral-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold text-neutral-900 dark:text-neutral-50">
            Digital Self
          </h1>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            请登录
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"
            >
              用户名
            </label>
            <input
              id="username"
              name="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-600"
              placeholder="用户名"
              autoComplete="username"
              autoCapitalize="none"
              autoFocus
              disabled={isLoading}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"
            >
              密码
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-600"
              placeholder="密码"
              autoComplete="current-password"
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
            disabled={isLoading || !username || !password}
            className="w-full py-3 rounded-lg bg-neutral-900 dark:bg-neutral-50 text-white dark:text-neutral-900 font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "登录中..." : "登录"}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-neutral-500 dark:text-neutral-500">
          这是一个私人空间，只有持有账号的用户可以访问
        </div>
      </div>
    </div>
  );
}
