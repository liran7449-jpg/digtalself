const ROWS = [
  {
    cls: "font-display text-display text-ink",
    name: "display / 52px",
    font: "Playfair Display",
    sample: "Good morning.",
    use: "页面主标题，每页只出现一次",
  },
  {
    cls: "font-display text-title text-ink",
    name: "title / 32px",
    font: "Playfair Display",
    sample: "Your day, gently shaped",
    use: "区块标题",
  },
  {
    cls: "font-display text-heading text-ink",
    name: "heading / 22px",
    font: "Playfair Display",
    sample: "今天只有一件事真正重要",
    use: "卡片标题、AI 关键句",
  },
  {
    cls: "text-lead text-ink-soft",
    name: "lead / 19px",
    font: "Inter 300",
    sample: "你昨天写下想认真考虑职业方向，今天要不要留半小时给它？",
    use: "AI 输出正文、引文",
  },
  {
    cls: "text-body text-ink",
    name: "body / 16px",
    font: "Inter 400",
    sample: "晚上散步的时候突然想到，也许我应该认真考虑一下未来的方向。",
    use: "正文、输入内容",
  },
  {
    cls: "text-small text-ink-muted",
    name: "small / 14px",
    font: "Inter 400",
    sample: "21:40 · Thought · 3 分钟前",
    use: "次要信息、时间戳",
  },
  {
    cls: "label-caps text-ink-faint",
    name: "label / 12px",
    font: "Inter 500 · 0.11em",
    sample: "Today's Focus",
    use: "区块标签，全大写",
  },
];

export function TypeScale() {
  return (
    <div className="space-y-8">
      {ROWS.map((r) => (
        <div key={r.name} className="border-t border-line-soft pt-5 first:border-0 first:pt-0">
          <div className="mb-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <code className="font-mono text-label text-brand">{r.name}</code>
            <span className="text-label text-ink-faint">{r.font}</span>
            <span className="text-label text-ink-muted">{r.use}</span>
          </div>
          <p className={`${r.cls} measure-wide`}>{r.sample}</p>
        </div>
      ))}
    </div>
  );
}
