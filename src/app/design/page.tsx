import { Button } from "@/components/ui/Button";
import { Label, Rule, Surface, AiSurface, Sparkle } from "@/components/ui/Primitives";
import { MoodPicker } from "@/components/state/MoodPicker";
import { EnergyPicker } from "@/components/state/EnergyPicker";
import { Swatches } from "./Swatches";
import { TypeScale } from "./TypeScale";
import { TodayPreview } from "./TodayPreview";

function Section({
  n,
  title,
  note,
  children,
}: {
  n: string;
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-line pt-10">
      <div className="mb-8 flex items-baseline gap-4">
        <span className="label-caps text-ink-faint">{n}</span>
        <div>
          <h2 className="font-display text-title text-ink">{title}</h2>
          {note && <p className="mt-1.5 text-small text-ink-muted measure">{note}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

export default function DesignSystemPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16 sm:px-10 lg:py-24">
      {/* Hero */}
      <header className="mb-20">
        <div className="mb-5 flex items-center gap-2.5">
          <Sparkle className="size-3.5 text-ai" />
          <Label tone="muted">Design System v1.0</Label>
        </div>
        <h1 className="font-display text-display text-ink">Digital Self</h1>
        <p className="mt-6 measure-wide text-lead text-ink-soft">
          记录过去，管理当下，探索未来。
        </p>
        <p className="mt-4 measure-wide text-body text-ink-muted">
          视觉方向 Warm Paper — 暖纸感、克制、editorial。用留白和字体建立层次，
          用线条而不是卡片来分区。AI 的声音有专属颜色，但从不喧哗。
        </p>
      </header>

      <div className="space-y-20">
        <Section
          n="01"
          title="Color"
          note="纸、墨、棕、紫四组。靛紫是 AI 专属色，其他地方一律不用，这样用户能一眼认出哪句话是 AI 说的。"
        >
          <Swatches />
        </Section>

        <Section
          n="02"
          title="Typography"
          note="Playfair Display 只出现在标题和 AI 的关键句子里，Inter 承担全部 UI 和正文。标题敢大，正文行长控制在 65-75 字符。"
        >
          <TypeScale />
        </Section>

        <Section n="03" title="Buttons" note="主按钮墨棕，AI 相关操作用靛紫。最小高度 44px。">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary">Shape My Day</Button>
            <Button variant="secondary">Edit</Button>
            <Button variant="ghost">Skip</Button>
            <Button variant="ai">
              <Sparkle className="size-3.5" />
              Ask AI
            </Button>
            <Button variant="primary" disabled>
              Disabled
            </Button>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button variant="secondary" size="sm">
              Small
            </Button>
            <Button variant="ghost" size="sm">
              Small ghost
            </Button>
          </div>
        </Section>

        <Section
          n="04"
          title="My State"
          note="情绪和精力是这个产品每天的入口。用点和条的形状差异传达强弱，不只靠颜色，色盲用户也能分辨。可以跳过。"
        >
          <div className="space-y-8">
            <div>
              <Label>How are you feeling</Label>
              <div className="mt-3.5">
                <MoodPicker />
              </div>
            </div>
            <div>
              <Label>Energy</Label>
              <div className="mt-3.5">
                <EnergyPicker />
              </div>
            </div>
          </div>
        </Section>

        <Section
          n="05"
          title="Surfaces"
          note="两种容器。普通抬升面用得很省，AI 输出面是唯一有色底的容器。"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <Surface className="p-6">
              <Label>Moment</Label>
              <p className="mt-3 font-display text-heading text-ink">
                晚上散步时想到的事
              </p>
              <p className="mt-2.5 text-small text-ink-muted">21:40 · Thought</p>
            </Surface>

            <AiSurface className="p-6">
              <div className="flex items-center gap-2">
                <Sparkle className="size-3.5 text-ai" />
                <Label tone="ai">Morning Brief</Label>
              </div>
              <p className="mt-3 font-display text-heading text-ink">
                今天只有一件事真正需要你的注意。
              </p>
              <p className="mt-2.5 text-small text-ink-soft">
                其他都可以往后放。
              </p>
            </AiSurface>
          </div>
        </Section>

        <Section
          n="06"
          title="Today"
          note="把以上元素组装成真实页面。这是 MVP 的核心页面，也是判断这套系统能不能成立的地方。"
        >
          <TodayPreview />
        </Section>

        <Section n="07" title="Motion & Rules" note="动效只用来传达空间关系和状态变化，不做装饰。">
          <div className="grid gap-x-10 gap-y-6 text-small sm:grid-cols-2">
            {[
              ["quick 160ms", "hover、选中态切换"],
              ["calm 240ms", "展开、折叠、页面内过渡"],
              ["slow 420ms", "内容首次进入（rise）"],
              ["ease-calm", "cubic-bezier(.22,.61,.36,1)，减速收尾"],
            ].map(([k, v]) => (
              <div key={k} className="flex gap-4">
                <code className="shrink-0 rounded-soft bg-paper-sunken px-2 py-0.5 font-mono text-label text-brand">
                  {k}
                </code>
                <span className="text-ink-muted">{v}</span>
              </div>
            ))}
          </div>
          <Rule className="my-8" />
          <ul className="space-y-2.5 text-small text-ink-soft measure-wide">
            <li>· 全站无 emoji 图标，只用 SVG</li>
            <li>· 焦点环保留，2px 墨棕 + 2px offset</li>
            <li>· prefers-reduced-motion 下全部动效降为 0</li>
            <li>· 触控目标最小 44×44px，间距 8px 以上</li>
            <li>· 不做 badge、红点、XP 弹窗、KPI 数字墙</li>
            <li>
              · 所有承载文字的颜色在 paper 上 ≥ 4.5:1，ink-hint 与 ai-vivid
              不用于文字
            </li>
          </ul>
        </Section>
      </div>
    </main>
  );
}
