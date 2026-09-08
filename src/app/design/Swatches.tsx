import { Label } from "@/components/ui/Primitives";

type Sw = { name: string; token: string; hex: string; use: string; ring?: boolean };

const GROUPS: { group: string; items: Sw[] }[] = [
  {
    group: "Paper",
    items: [
      { name: "paper", token: "bg-paper", hex: "#FFFBEB", use: "主背景", ring: true },
      { name: "paper-raised", token: "bg-paper-raised", hex: "#FFFEFA", use: "抬升面", ring: true },
      { name: "paper-sunken", token: "bg-paper-sunken", hex: "#FAF5E6", use: "输入框", ring: true },
    ],
  },
  {
    group: "Ink",
    items: [
      { name: "ink", token: "bg-ink", hex: "#0F172A", use: "主文字 17.2:1" },
      { name: "ink-soft", token: "bg-ink-soft", hex: "#44403C", use: "次要 9.9:1" },
      { name: "ink-muted", token: "bg-ink-muted", hex: "#6B645E", use: "辅助 5.6:1" },
      { name: "ink-faint", token: "bg-ink-faint", hex: "#706A63", use: "小字 5.2:1" },
      { name: "ink-hint", token: "bg-ink-hint", hex: "#A8A29E", use: "仅装饰" },
    ],
  },
  {
    group: "Brand",
    items: [
      { name: "brand", token: "bg-brand", hex: "#92400E", use: "主操作" },
      { name: "brand-soft", token: "bg-brand-soft", hex: "#F5EDE3", use: "选中底", ring: true },
      { name: "accent", token: "bg-accent", hex: "#A16207", use: "强调" },
    ],
  },
  {
    group: "AI",
    items: [
      { name: "ai", token: "bg-ai", hex: "#5457E0", use: "AI 文字 5.3:1" },
      { name: "ai-vivid", token: "bg-ai-vivid", hex: "#6366F1", use: "仅填充块" },
      { name: "ai-soft", token: "bg-ai-soft", hex: "#EEF0FE", use: "AI 底", ring: true },
      { name: "ai-border", token: "bg-ai-border", hex: "#DCDFFB", use: "AI 边框", ring: true },
    ],
  },
  {
    group: "Mood",
    items: [
      { name: "great", token: "bg-mood-great", hex: "#B45309", use: "很好" },
      { name: "good", token: "bg-mood-good", hex: "#A16207", use: "不错" },
      { name: "okay", token: "bg-mood-okay", hex: "#78716C", use: "还行" },
      { name: "low", token: "bg-mood-low", hex: "#57534E", use: "低落" },
      { name: "heavy", token: "bg-mood-heavy", hex: "#44403C", use: "沉重" },
    ],
  },
];

export function Swatches() {
  return (
    <div className="space-y-9">
      {GROUPS.map(({ group, items }) => (
        <div key={group}>
          <Label>{group}</Label>
          <div className="mt-3.5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {items.map((s) => (
              <div key={s.name}>
                <div
                  className={`h-16 rounded-card ${s.token} ${
                    s.ring ? "border border-line" : ""
                  }`}
                />
                <p className="mt-2.5 text-small font-medium text-ink">{s.name}</p>
                <p className="font-mono text-label text-ink-faint">{s.hex}</p>
                <p className="mt-0.5 text-label text-ink-muted">{s.use}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
