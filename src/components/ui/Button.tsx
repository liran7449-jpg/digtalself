import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "ai";
type Size = "sm" | "md";

const base =
  "inline-flex items-center justify-center gap-2 rounded-soft font-body font-medium " +
  "cursor-pointer transition-all duration-[var(--duration-quick)] ease-[var(--ease-calm)] " +
  "disabled:cursor-not-allowed disabled:opacity-40";

const variants: Record<Variant, string> = {
  primary: "bg-brand text-on-brand hover:bg-brand-hover",
  secondary:
    "bg-transparent text-ink border border-line-strong hover:border-ink-muted hover:bg-paper-raised",
  ghost: "bg-transparent text-ink-soft hover:text-ink hover:bg-brand-soft",
  ai: "bg-ai text-on-ai hover:bg-ai-vivid",
};

// md = 44px，满足触控标准，用于主操作。
// sm = 40px，仅用于次要操作且需保证 8px 以上间距。
const sizes: Record<Size, string> = {
  sm: "min-h-10 px-3.5 text-small",
  md: "min-h-11 px-5 text-body",
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  // 默认 button 而非浏览器默认的 submit：
  // 放进 form 里的普通按钮不该意外提交。提交按钮显式写 type="submit"。
  type = "button",
  children,
  ...props
}: {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
