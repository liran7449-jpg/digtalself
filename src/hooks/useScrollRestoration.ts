'use client';

import { useEffect, useRef } from 'react';

/**
 * 滚动位置恢复 Hook
 *
 * 用于列表页面（Moments、Today 等），记住滚动位置：
 * - 离开页面时保存滚动位置到 sessionStorage
 * - 返回页面时自动恢复到之前的位置
 * - 关闭标签页后自动清除（sessionStorage 特性）
 *
 * @param key - 唯一标识，用于区分不同页面的滚动位置
 */
export function useScrollRestoration(key: string) {
  const SCROLL_KEY = `scroll-position-${key}`;
  const hasRestoredRef = useRef(false);

  // 页面加载时恢复滚动位置
  useEffect(() => {
    // 只恢复一次
    if (hasRestoredRef.current) return;

    const savedPosition = sessionStorage.getItem(SCROLL_KEY);
    if (savedPosition) {
      // 使用 requestAnimationFrame 等待浏览器渲染完成，减少闪烁
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          window.scrollTo({
            top: parseInt(savedPosition, 10),
            behavior: 'auto',
          });
          hasRestoredRef.current = true;
        });
      });
    } else {
      hasRestoredRef.current = true;
    }
  }, [SCROLL_KEY]);

  // 实时保存滚动位置（滚动时）
  useEffect(() => {
    const handleScroll = () => {
      sessionStorage.setItem(SCROLL_KEY, window.scrollY.toString());
    };

    // 防抖：减少写入频率
    let timeoutId: NodeJS.Timeout;
    const debouncedHandleScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleScroll, 100);
    };

    window.addEventListener('scroll', debouncedHandleScroll, { passive: true });

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('scroll', debouncedHandleScroll);
    };
  }, [SCROLL_KEY]);
}
