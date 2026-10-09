import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import { getCurrentUserId } from "@/lib/session";
import { repoFor } from "@/repositories";
import { WhatsNewModal } from "@/components/WhatsNewModal";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Digital Self",
  description: "记录过去，管理当下，探索未来。",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // 获取当前用户的 lastSeenVersion，用于判断是否显示更新公告
  const userId = await getCurrentUserId();
  let lastSeenVersion: string | null = null;
  if (userId) {
    try {
      const user = await repoFor(userId).users.getOrCreate(userId, userId);
      lastSeenVersion = user?.lastSeenVersion ?? null;
    } catch {
      // 查询失败不阻塞页面渲染，只是不显示弹窗
    }
  }

  return (
    <html lang="zh-CN">
      <body className={`${playfair.variable} ${inter.variable}`}>
        {children}
        {userId && <WhatsNewModal lastSeenVersion={lastSeenVersion} />}
      </body>
    </html>
  );
}
