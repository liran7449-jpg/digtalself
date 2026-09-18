"use client";

import { useEffect, useState } from "react";

/**
 * 生日彩蛋。只在生日当天的 Today 页出现。
 *
 * 设计取向（Product Bible：Quiet Luxury + Personal + Alive）：
 * 不做弹窗、不做撒花、不做需要点「确定」才能继续的拦路屏。
 * 那些是 SaaS 的做法，会把「有人记得你的生日」变成一次系统通知。
 *
 * 这里的做法是：一句话，安静地浮上来，然后一直待在那儿。
 * 用户不需要处理它，只是看见。几个缓慢上浮的小光点是唯一的动效，
 * 位置和时长都是固定值而不是随机数 —— 随机会让每次刷新长得不一样，
 * 反而显得是个程序在放动画。
 */

/** 几句备选祝福，按日期取，同一天刷新不会变。 */
const LINES = [
  "今天是你的日子。",
  "很高兴你在这里。",
  "又一年，还是你。",
] as const;

/**
 * 小光点。位置写死，不用 Math.random() ——
 * 服务端和客户端随机值不一致会 hydration 报错，
 * 而且每次刷新都换位置会让它显得像个动画演示。
 */
const MOTES = [
  { left: "12%", delay: "0s", size: 4 },
  { left: "27%", delay: "1.4s", size: 3 },
  { left: "48%", delay: "0.6s", size: 5 },
  { left: "66%", delay: "2.1s", size: 3 },
  { left: "84%", delay: "1.1s", size: 4 },
] as const;

export function BirthdayGreeting({
  name,
  /** 用来选祝福语，保证同一天稳定。 */
  dayKey,
  /** 管理员写的一句话。有就替代默认祝福语 —— 一句真话胜过三句模板。 */
  note,
}: {
  name: string | null;
  dayKey: string;
  note?: string | null;
}) {
  /**
   * 挂载后才放动效。
   *
   * 服务端渲染出的 HTML 里如果已经带着动画类，用户会看到动画从
   * 页面加载途中的某一帧开始 —— 尤其在慢网络下很明显。
   */
  const [shown, setShown] = useState(false);
  useEffect(() => {
    setShown(true);
  }, []);

  /**
   * 有留言就用留言，没有才回落到备选句。
   * 一句具体的话比三句通用模板有分量得多。
   */
  const line = note?.trim() || LINES[Number(dayKey.replaceAll("-", "")) % LINES.length];
  const greeting = name ? `${name}，生日快乐` : "生日快乐";

  return (
    <section
      aria-label="生日祝福"
      className="animate-rise relative overflow-hidden rounded-soft border border-line-soft
        bg-paper-raised px-6 py-7 sm:px-8"
    >
      {/* 光点层。aria-hidden：纯装饰，不该被读屏念出来 */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {shown &&
          MOTES.map((m, i) => (
            <span
              key={i}
              className="birthday-mote absolute rounded-full bg-accent/35"
              style={{
                left: m.left,
                width: m.size,
                height: m.size,
                animationDelay: m.delay,
              }}
            />
          ))}
      </div>

      <div className="relative">
        <p className="font-display text-title text-ink">
          {greeting}
          {/*
            蛋糕单独一个 span：emoji 在 Playfair 里会回落到系统 emoji 字体，
            跟着标题的 letter-spacing 走会显得和文字挤在一起。
            inline-block + 左边距让它自己占一格。
          */}
          <span aria-hidden className="ml-1.5 inline-block align-baseline">
            🎂
          </span>
        </p>
        <p className="mt-2 text-body text-ink-soft">{line}</p>
      </div>
    </section>
  );
}
