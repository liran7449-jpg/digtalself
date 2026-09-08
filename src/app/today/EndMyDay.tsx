"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { endMyDay } from "./actions";

/**
 * IA 第 20 节 End My Day。P0 只把 Day 推进到 ready_to_reflect，
 * Evening Reflection 页面在下一阶段接上。
 */
export function EndMyDay({ done }: { done: boolean }) {
  const [pending, startTransition] = useTransition();

  if (done) {
    return (
      <p className="text-center text-small text-ink-muted">
        今天已经收尾了。晚安。
      </p>
    );
  }

  return (
    <div className="flex justify-center">
      <Button
        variant="secondary"
        disabled={pending}
        onClick={() => startTransition(async () => void (await endMyDay()))}
      >
        {pending ? "正在收尾…" : "End my day"}
      </Button>
    </div>
  );
}
