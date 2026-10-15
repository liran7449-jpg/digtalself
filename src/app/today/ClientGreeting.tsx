"use client";

import { useEffect, useState } from "react";
import { greeting } from "@/domain/day-key";

/**
 * 客户端渲染的问候语，避免 SSR hydration 不一致
 */
export function ClientGreeting() {
  const [text, setText] = useState("");

  useEffect(() => {
    setText(greeting(new Date()));
  }, []);

  // SSR 时返回空，避免 hydration 错误
  if (!text) return <span className="opacity-0">Loading...</span>;

  return <>{text}</>;
}
