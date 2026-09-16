import { AppShell } from "@/components/layout/AppShell";
import { Skeleton } from "@/components/ui/Skeleton";

/**
 * Moments 的加载态。
 *
 * 和 Today 同理：页面是 force-dynamic，没有这一层就是整秒空白。
 *
 * 分栏顺序刻意跟 page.tsx 一致 —— 窄屏日历在上（order-1）、宽屏在右侧，
 * 顺序反了的话真实内容到达时整页会重排。
 */
export default function MomentsLoading() {
  return (
    <AppShell current="/moments" width="wide">
      <header>
        <Skeleton className="h-9 w-44" />
      </header>

      <div className="mt-12 flex flex-col lg:mt-14 lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-x-14">
        {/* 记录流。按日期分组，组间距比组内大得多 */}
        <div className="order-2 space-y-14 lg:order-1">
          {[0, 1].map((group) => (
            <section key={group}>
              <div className="flex items-baseline justify-between gap-4 border-b border-line pb-2.5">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-3.5 w-10" />
              </div>

              <div className="mt-5 space-y-7">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex gap-4">
                    <Skeleton className="h-3.5 w-11 shrink-0" />
                    <div className="min-w-0 flex-1 space-y-2">
                      <Skeleton className="h-4 w-full" />
                      {/* 长短交错，免得像整齐的表格 */}
                      <Skeleton className={i === 1 ? "h-4 w-1/2" : "h-4 w-4/5"} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* 月历。宽屏跟随滚动 */}
        <aside className="order-1 mb-14 lg:order-2 lg:mb-0 lg:sticky lg:top-10 lg:self-start">
          <Skeleton className="h-72 w-full rounded-xl" />
        </aside>
      </div>
    </AppShell>
  );
}
