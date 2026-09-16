/**
 * 骨架块。loading.tsx 用它占位，等真实内容流式替换。
 *
 * 尺寸由调用方用 className 给，这里只管颜色和呼吸动画 ——
 * 骨架屏的意义在于形状对得上真实布局，硬编码尺寸反而碍事。
 */
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      // motion-reduce：跟随系统「减弱动效」设置，不让动画干扰对光敏感的用户
      className={`animate-pulse rounded bg-paper-sunken motion-reduce:animate-none ${className}`}
      aria-hidden
    />
  );
}
