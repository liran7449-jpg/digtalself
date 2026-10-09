/**
 * /me 界面设计方案
 *
 * 左侧：Goals 列表（方案 C 浮动样式）
 * 右侧：选中 Goal 关联的具体事件（Moments）
 * 无白底卡片，融入背景
 */

"use client";

import { useState } from "react";

const SAMPLE_GOALS = [
  {
    id: "1",
    title: "学会弹吉他",
    evidenceCount: 12,
    moments: [
      { id: "m1", content: "今天练了 30 分钟《童年》，左手按弦终于不疼了", date: "2024-12-15" },
      { id: "m2", content: "第一次完整弹完一首歌！虽然很慢但是很开心", date: "2024-12-10" },
      { id: "m3", content: "学会了 C 大调音阶，手指灵活度提升了", date: "2024-12-08" },
      { id: "m4", content: "跟着视频学了基础和弦转换", date: "2024-12-05" },
    ]
  },
  {
    id: "2",
    title: "成为更健康的人",
    evidenceCount: 8,
    moments: [
      { id: "m5", content: "晨跑 5km，感觉身体状态越来越好", date: "2024-12-14" },
      { id: "m6", content: "坚持早睡一周了，精神明显好很多", date: "2024-12-13" },
      { id: "m7", content: "今天做了 20 分钟瑜伽，柔韧性在慢慢提升", date: "2024-12-11" },
    ]
  },
  {
    id: "3",
    title: "读完 24 本书",
    evidenceCount: 3,
    moments: [
      { id: "m8", content: "读完《黑客与画家》，对创造力有了新理解", date: "2024-12-12" },
      { id: "m9", content: "开始读《人类简史》，很有意思", date: "2024-12-09" },
    ]
  },
];

export default function MeDesignPage() {
  const [selected, setSelected] = useState<string>("1");
  const selectedGoal = SAMPLE_GOALS.find((g) => g.id === selected);

  return (
    <div className="min-h-screen bg-paper px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-12">
          <h1 className="font-display text-display text-ink">Me</h1>
          <p className="mt-2 text-lead text-ink-soft">我正在成为谁</p>
        </header>

        <div className="grid gap-16 lg:grid-cols-[360px_1fr]">
          {/* 左侧：Goals 列表 */}
          <div className="space-y-8">
            <div>
              <h2 className="font-display text-heading text-ink">Current Goals</h2>
              <div className="mt-4 h-px bg-gradient-to-r from-line to-transparent" />
            </div>

            <div className="space-y-6">
              {SAMPLE_GOALS.map((goal) => (
                <button
                  key={goal.id}
                  onClick={() => setSelected(goal.id)}
                  className={`group block w-full text-left transition-all duration-200
                    ${selected === goal.id ? "translate-x-2" : "hover:translate-x-1"}`}
                >
                  <h3
                    className={`font-body text-lead font-medium transition-colors ${
                      selected === goal.id
                        ? "text-brand"
                        : "text-ink group-hover:text-brand"
                    }`}
                  >
                    {goal.title}
                  </h3>
                  <p className="mt-1 text-small text-ink-muted">
                    {goal.evidenceCount} Evidence
                  </p>
                  {selected === goal.id && (
                    <div className="mt-2 h-0.5 w-12 bg-brand transition-all" />
                  )}
                </button>
              ))}
            </div>

            <div className="pt-4">
              <button
                className="text-body text-ink-muted transition-colors hover:text-brand"
              >
                + 添加新目标
              </button>
            </div>
          </div>

          {/* 右侧：关联的 Moments */}
          <div className="space-y-6">
            {selectedGoal && (
              <>
                <div>
                  <h2 className="font-display text-heading text-ink">
                    Growth Evidence
                  </h2>
                  <p className="mt-1 text-small text-ink-muted">
                    {selectedGoal.evidenceCount} moments related to "{selectedGoal.title}"
                  </p>
                  <div className="mt-4 h-px bg-gradient-to-r from-line to-transparent" />
                </div>

                <div className="space-y-4">
                  {selectedGoal.moments.map((moment) => (
                    <div
                      key={moment.id}
                      className="group border-l-2 border-transparent pl-4
                        transition-all hover:border-brand hover:translate-x-1"
                    >
                      <p className="text-body leading-relaxed text-ink">
                        {moment.content}
                      </p>
                      <p className="mt-2 text-small text-ink-muted">
                        {new Date(moment.date).toLocaleDateString("zh-CN", {
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  ))}
                </div>

                {selectedGoal.moments.length === 0 && (
                  <div className="py-16 text-center">
                    <p className="text-body text-ink-muted">
                      还没有关联的事件
                    </p>
                    <p className="mt-2 text-small text-ink-faint">
                      在 Today 记录 Moment 时关联这个目标
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
