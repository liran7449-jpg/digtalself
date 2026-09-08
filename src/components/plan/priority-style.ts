import type { PlanPriority } from "@/domain/enums";

/**
 * 优先级的视觉规则。Timeline 和 Day 视图共用，避免两处各写一份而分叉。
 *
 * 刻意保持单色，不引入红黄绿：
 * - high  一道细竖线 + 字重加强
 * - normal 什么都不加（默认档不该被看见）
 * - low   字色后退一档
 *
 * 只标偏离常态的。全都挂徽标就成了看板噪音（Product Bible 29.3）。
 */
export function priorityBar(priority: PlanPriority): string | null {
  return priority === "high" ? "bg-brand" : null;
}

/**
 * @param base 常态档的字色。Today 用 ink，Day 视图是只读回看语境，用更淡的 ink-soft。
 */
export function priorityText(
  priority: PlanPriority,
  {
    dimmed,
    base = "text-ink",
  }: { dimmed?: boolean; base?: string } = {},
): string {
  if (dimmed) return "text-ink-faint";
  if (priority === "high") return `${base} font-medium`;
  if (priority === "low") return "text-ink-muted";
  return base;
}
