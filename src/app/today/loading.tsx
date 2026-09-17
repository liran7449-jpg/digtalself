import { AppShell } from "@/components/layout/AppShell";
import { Skeleton } from "@/components/ui/Skeleton";

/**
 * Today 的加载态。
 *
 * 页面是 force-dynamic，每次进来都要等服务端查完库才渲染。没有这一层的话
 * 点击导航后屏幕整秒不变，像卡住了 —— 骨架屏把「等待」变成「正在来」。
 *
 * 骨架的分栏和间距刻意抄自 page.tsx：形状对不上的话，真实内容到达时
 * 会跳一下，比没有骨架更难受。
 */
export default function TodayLoading() {
  return (
    <AppShell current="/today" width="wide">
      <div className="flex flex-col gap-12 lg:grid lg:grid-cols-[20rem_minmax(0,1fr)] lg:gap-x-14">
        {/* 左栏：日期 / 问候 / 状态 / 日程 */}
        <div className="space-y-6">
          <header>
            <Skeleton className="h-4 w-32" />
            <Skeleton className="mt-2.5 h-9 w-52" />
            <Skeleton className="mt-4 h-7 w-40 rounded-full" />
          </header>

          <Skeleton className="h-5 w-full max-w-64" />

          {/* 日程条目 */}
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-4 w-12 shrink-0" />
                <Skeleton className="h-4 flex-1" />
              </div>
            ))}
          </div>

          <div className="border-t border-line pt-7">
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        </div>

        {/* 右栏：输入条 + 记录流 */}
        <div className="space-y-10">
          <Skeleton className="h-24 w-full rounded-xl" />

          <div className="space-y-8">
            {[0, 1, 2].map((i) => (
              <div key={i} className="space-y-2.5">
                <Skeleton className="h-3.5 w-16" />
                <Skeleton className="h-4 w-full" />
                {/* 长短交错，避免看起来像整齐的表格 */}
                <Skeleton className={i === 1 ? "h-4 w-2/3" : "h-4 w-5/6"} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
