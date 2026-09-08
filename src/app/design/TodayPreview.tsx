import { Button } from "@/components/ui/Button";
import { Label, Rule, AiSurface, Sparkle } from "@/components/ui/Primitives";
import { MoodPicker } from "@/components/state/MoodPicker";

const TIMELINE = [
  { time: "09:30", title: "Deep Work — 论文最后一部分", state: "done" },
  { time: "12:30", title: "Lunch", state: "done" },
  { time: "14:00", title: "和导师的会", state: "now" },
  { time: "18:30", title: "Gym", state: "next" },
  { time: "21:00", title: "留给自己的半小时", state: "next", ai: true },
];

const MOMENTS = [
  { time: "08:12", type: "Thought", text: "醒得比平时早，脑子意外清楚。" },
  { time: "13:05", type: "Note", text: "导师提到的那篇 2019 年的论文，值得找出来读。" },
];

export function TodayPreview() {
  return (
    <div className="overflow-hidden rounded-sheet border border-line bg-paper">
      {/* 顶栏 */}
      <div className="flex items-center justify-between border-b border-line px-6 py-4 sm:px-9">
        <nav className="flex gap-6 text-small" aria-label="主导航">
          <span className="font-medium text-ink">Today</span>
          <span className="cursor-pointer text-ink-faint transition-colors hover:text-ink-soft">
            Moments
          </span>
          <span className="cursor-pointer text-ink-faint transition-colors hover:text-ink-soft">
            Me
          </span>
        </nav>
        <button
          aria-label="AI Butler"
          className="-mr-2.5 flex size-11 cursor-pointer items-center justify-center rounded-soft text-ai transition-colors hover:bg-ai-soft"
        >
          <Sparkle className="size-4" />
        </button>
      </div>

      <div className="space-y-11 px-6 py-11 sm:px-9 lg:px-12">
        {/* Header */}
        <header>
          <p className="text-small text-ink-muted">Thursday, September 7</p>
          <h3 className="mt-2.5 font-display text-display text-ink">Good morning.</h3>
        </header>

        {/* My State */}
        <section>
          <Label>How are you feeling</Label>
          <div className="mt-3.5">
            <MoodPicker value="good" />
          </div>
        </section>

        <Rule />

        {/* Today's Focus */}
        <section>
          <Label>Today&apos;s Focus</Label>
          <p className="mt-3.5 font-display text-title text-ink measure">
            完成论文最后一部分。
          </p>
        </section>

        {/* AI Morning Brief */}
        <AiSurface className="p-6 sm:p-7">
          <div className="flex items-center gap-2">
            <Sparkle className="size-3.5 text-ai" />
            <Label tone="ai">Morning Brief</Label>
          </div>
          <p className="mt-3.5 font-display text-heading text-ink measure">
            今天事情不少，但只有一件真正需要你的注意。
          </p>
          <p className="mt-3 text-lead text-ink-soft measure">
            你昨天写下想认真考虑职业方向。今晚留半小时给它，可能比多做一小时论文更值得。
          </p>
          <div className="mt-6 flex flex-wrap gap-2.5">
            <Button variant="ai" size="sm">
              Accept
            </Button>
            <Button variant="secondary" size="sm">
              Edit
            </Button>
            <Button variant="ghost" size="sm">
              Not today
            </Button>
          </div>
        </AiSurface>

        {/* Timeline */}
        <section>
          <Label>Your day</Label>
          <ul className="mt-4">
            {TIMELINE.map((t) => (
              <li
                key={t.time}
                className="flex gap-5 border-t border-line-soft py-3.5 first:border-0"
              >
                <span
                  className={`w-12 shrink-0 pt-px font-mono text-small tabular-nums ${
                    t.state === "now" ? "text-brand" : "text-ink-faint"
                  }`}
                >
                  {t.time}
                </span>
                <span className="flex-1">
                  <span
                    className={`text-body ${
                      t.state === "done"
                        ? "text-ink-faint line-through decoration-line-strong"
                        : t.state === "now"
                          ? "font-medium text-ink"
                          : "text-ink-soft"
                    }`}
                  >
                    {t.title}
                  </span>
                  {t.state === "now" && (
                    <span className="ml-3 label-caps text-brand">Now</span>
                  )}
                  {t.ai && (
                    <Sparkle className="ml-2.5 inline size-3 align-baseline text-ai" />
                  )}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <Rule />

        {/* Quick Capture */}
        <section>
          <Label>Capture</Label>
          <div className="mt-3.5 rounded-card border border-line bg-paper-sunken px-5 py-4">
            <p className="text-body text-ink-muted">
              现在在想什么？
            </p>
          </div>
        </section>

        {/* Today's Moments */}
        <section>
          <Label>Today&apos;s Moments</Label>
          <ul className="mt-4 space-y-4">
            {MOMENTS.map((m) => (
              <li key={m.time} className="flex gap-5">
                <span className="w-12 shrink-0 pt-0.5 font-mono text-small tabular-nums text-ink-faint">
                  {m.time}
                </span>
                <div className="flex-1 border-l border-line pl-5">
                  <p className="text-body text-ink measure">{m.text}</p>
                  <p className="mt-1 text-label text-ink-faint">{m.type}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <Rule />

        {/* End My Day */}
        <div className="flex justify-center pb-2">
          <Button variant="secondary">End my day</Button>
        </div>
      </div>
    </div>
  );
}
