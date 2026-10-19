/**
 * /changelog —— 更新日志
 *
 * 显示所有历史版本的更新记录，用户可以随时回看。
 */

import { AppShell } from "@/components/layout/AppShell";
import { requireUserId } from "@/lib/session";
import { userRepo } from "@/repositories";

export default async function ChangelogPage() {
  // 标记已读
  const userId = await requireUserId();
  await userRepo.update(userId, {
    lastReadChangelogDate: new Date(),
  });

  // 硬编码的更新日志内容
  const updates = [
    {
      date: "2026-10-17",
      items: [
        { title: "✨ 时间线导航优化", desc: "点击日历日期可快速定位到该天的记录，右侧日历显示选中状态。点击未加载日期时，自动滚动到底部引导加载更多。" },
        { title: "🎨 粘贴图片功能", desc: "支持 Cmd+V 直接粘贴图片到输入框，无需点击上传按钮。自动检查文件大小，超出限制时友好提示。" },
        { title: "🔧 日历月份吸顶", desc: "右侧日历的月份标题在滚动时保持吸顶，方便随时切换月份。" },
      ]
    },
    {
      date: "2026-10-16",
      items: [
        { title: "✨ 视频上传支持", desc: "支持上传视频文件（最大150MB）。图片限制50MB，视频限制150MB，前端自动验证文件大小。" },
        { title: "⚡ 上传性能优化", desc: "大图片跳过元数据提取，避免处理超时。优化文件上传稳定性，减少上传失败。" },
        { title: "🌐 网络连接优化", desc: "接入 Cloudflare CDN，提升国内访问速度。配置 Vercel 中国线路优化。" },
        { title: "🔒 数据库连接修复", desc: "修复 SSL 连接问题，优化数据库连接池配置，提升稳定性。" },
      ]
    },
    {
      date: "2026-10-15",
      items: [
        { title: "🐛 时区问题修复", desc: "修复日期显示错误，强制使用 Asia/Shanghai 时区，确保日期准确。" },
        { title: "🔐 安全优化", desc: "清理 Git 历史中的敏感信息，提升数据安全性。" },
      ]
    }
  ];

  return (
    <AppShell current="/me" width="prose">
      <div className="space-y-16">
        <header>
          <h1 className="font-display text-display text-ink">更新日志</h1>
          <p className="mt-3 text-lead text-ink-soft">
            记录产品的新功能和改进
          </p>
        </header>

        <div className="space-y-12">
          {updates.map((update) => (
            <article key={update.date} className="border-l-2 border-line pl-6">
              <h2 className="mb-6 font-display text-heading text-ink">
                {update.date}
              </h2>
              <div className="space-y-4">
                {update.items.map((item, i) => (
                  <div key={i}>
                    <h3 className="font-medium text-ink mb-2">{item.title}</h3>
                    <p className="text-body text-ink-soft">{item.desc}</p>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
