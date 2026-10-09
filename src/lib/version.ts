/**
 * 应用版本号。
 *
 * 用于更新公告：用户的 lastSeenVersion < APP_VERSION 时显示弹窗。
 * 有新功能上线时手动递增版本号（如 1.1.0 → 1.2.0）。
 */
export const APP_VERSION = "1.1.0";

/**
 * 更新公告内容。
 *
 * 键是版本号，值是该版本的公告内容。
 * 显示时取 APP_VERSION 对应的公告。
 */
export const CHANGELOG: Record<
  string,
  {
    title: string;
    description: string;
    highlights: string[];
    cta?: { label: string; href: string };
  }
> = {
  "1.1.0": {
    title: "Goals — 让成长看得见",
    description: "现在你可以在 Me 管理自己的方向和目标，记录时关联目标，积累成长证据。",
    highlights: [
      "在 Me 管理你的方向和目标",
      "记录时关联目标，积累成长证据",
      "看看你在每个方向上走了多远",
    ],
    cta: { label: "去 Me 看看", href: "/me" },
  },
};
