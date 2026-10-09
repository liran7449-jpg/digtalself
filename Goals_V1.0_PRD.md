# Goals V1.0 产品 PRD

> 文档定位：Today / Digital Self 项目 Goals 模块 V1.0 产品需求文档  
> 核心理念：**目标不是任务清单，而是一条人生方向；真实生活中的事件，会不断成为这条方向上的证据。**

---

## 1. 产品定位

### 1.1 Goal 是什么

Goal 不是 Todo、OKR、KPI，也不是每日打卡计划。

Goal 是：

> **我选择的一条未来方向。**

它回答的是：

> “我想往哪里去？”

而不是：

> “我今天必须完成什么？”

因此：

- **Goal = 方向**
- **Today = 当下行动**
- **Moment = 真实发生的生活**
- **Evidence = 我正在靠近目标的证据**
- **Milestone = 一个阶段性的变化**
- **Growth Story = 我发生了什么变化**
- **Me = 我正在成为谁**

### 1.2 核心价值

Goal 系统最终希望给用户三种感受：

1. **方向感**：我知道自己想往哪里去。
2. **证据感**：原来我真的已经做了这么多。
3. **成长感**：原来我已经发生了一点变化。

形成：

> **方向 → 行动 → 真实生活 → 证据 → 成就感 → 自我理解**

---

# 2. 设计哲学

## 2.1 极低前置输入

用户产生一个目标时，不应该被要求完成一份人生规划表。

创建 Goal 最少只需要：

> **我想……**

例如：

> 学会弹吉他

点击 Add 即可创建。

以下内容均不是创建必填项：

- Why
- Who I want to become
- Next Step
- Deadline
- KPI
- Progress Target

原则：

> **不要让用户为了记录一个方向，先完成一次复杂的自我规划。**

---

## 2.2 目标的意义允许后生长

用户创建目标时可能并不知道：

- 为什么想做
- 最终会变成什么
- 下一步是什么
- 这个目标对自己到底意味着什么

因此这些信息不应被强迫填写。

随着真实生活发生：

Moment → Evidence → Milestone → Reflection

目标的意义逐渐显现。

例如：

用户最初只写：

> 学会弹吉他

几个月后产生：

- 买第一把吉他
- 上第一节课
- 学会 C 大调
- 完整弹完一首歌
- 录下第一首作品

系统才逐渐有机会理解：

> 音乐似乎已经不只是一个“想尝试的新技能”。

---

## 2.3 不让系统替用户定义自己

用户此前明确不希望手动填写“我是一个什么样的人”。

因此：

`Who I want to become`

不作为 Goal 创建字段。

未来可以由 AI 根据长期生活数据提出观察：

> “过去 4 个月，你持续留下了 12 个与音乐有关的 Moment。音乐似乎正在成为你生活里越来越重要的一部分。”

AI 只能：

- 观察
- 建议
- 总结
- 提问

不能未经用户确认：

- 定义用户人格
- 修改用户目标
- 自动改变 Goal 状态
- 删除 Goal
- 自动确认成长结论

---

# 3. 用户心理与产品机制

Goal 系统应利用积极的心理机制，但避免把产品变成游戏化绩效系统。

## 3.1 胜任感

用户需要感受到：

> “我做得到，而且我正在变好。”

因此重点不是：

> 你还差 80%。

而是：

> 你已经留下了 12 个真实的成长证据。

---

## 3.2 进度反馈

用户需要知道自己“走到哪里了”。

但 Progress 应优先呈现**事实**，而不是系统评分。

例如：

- 7 / 20 本书
- 最近 30 天运动 6 次
- 12 个 Growth Evidence
- 3 个 Milestones

避免统一使用：

> 73%

因为很多人生目标不存在客观的 0–100%。

---

## 3.3 自主性

Goal 必须属于用户自己。

系统可以：

- 建议
- 提醒
- 关联候选
- 总结

但不能强迫。

尤其避免：

- 连续打卡
- 每日惩罚
- 排行榜
- 失败提示
- 强制完成率
- 高频催促

核心原则：

> **Goal 应该创造方向，而不是创造压力。**

---

# 4. Goal 创建

## 4.1 V1 创建流程

极简创建：

```text
What are you moving towards?

[ 学会弹吉他                     ]

              Add
```

或者中文：

```text
你想往哪里去？

[ 学会弹吉他                     ]

              添加目标
```

完成后立即创建。

---

## 4.2 V1 不要求填写

以下均不强制：

- Why
- Becoming
- Next Step
- Deadline
- Target Value
- Category
- Reminder
- Frequency

如果用户未来想补充，可以在 Goal Detail 中编辑。

---

# 5. Goal 数量

建议：

> **Active Goal 推荐 3–5 个。**

但不做数据库硬限制。

当用户超过 5 个 Active Goals 时，可以提供温和提示：

> 你现在有不少正在前往的方向。  
> 也许可以想想，最近哪些最重要？

不要阻止创建。

原因：

> 产品帮助用户选择方向，而不是替用户管理人生。

历史 Goal 可以无限保留。

---

# 6. Goal 状态

V1 支持：

| 状态 | 含义 |
|---|---|
| Active | 当前正在前往 |
| Paused | 暂时暂停，但未来可能继续 |
| Achieved | 已经达到自己设定的目标 |
| Abandoned | 不再选择这个方向 |

### Abandoned 的产品语义

不要使用：

- Failed
- Failed Goal
- Overdue

而使用：

> **这已经不是我现在选择的方向。**

Goal 不应因为暂停或放弃而消失。

它仍然是用户人生轨迹的一部分。

---

# 7. Goal 与 Moment 的核心关系

这是 Goals V1.0 最重要的机制。

> **真实事件可以成为 Goal 的 Growth Evidence。**

例如：

Goal：

> 学会弹吉他

Moment：

> 今天上了第一节吉他课。

用户可以将 Moment 关联到 Goal。

关联后：

```text
Moment
    ↓
Goal Evidence
```

---

# 8. Evidence 机制

## 8.1 Evidence 是什么

Evidence 是：

> **真实发生过，并且能说明用户正在向 Goal 靠近的生活事件。**

Evidence 不等于任务完成。

例如：

Goal：

> 成为一个更丰富的人

可能的 Evidence：

- 去了一个从没去过的城市
- 看了一部很喜欢的电影
- 学会了一首歌
- 和一个重要的人进行了深入交流
- 第一次尝试某件事
- 写下一段重要的思考

---

## 8.2 Evidence 不要求所有 Moment 都计入

一个 Moment 可以：

- 不关联任何 Goal
- 关联一个 Goal
- 关联多个 Goal

用户决定。

产品不能为了制造“进度”而强迫所有生活事件进入 Goal。

原则：

> **生活优先，目标其次。**

---

# 9. Event → Goal 的关联方式

采用三级机制。

## Level 1：用户主动关联

用户创建或编辑 Moment 时：

```text
关联目标

○ 学会弹吉他
○ 成为更健康的人
○ 更丰富地生活
```

用户确认后成为 Evidence。

这是最可靠的方式。

---

## Level 2：系统弱建议

未来系统可以根据语义提供：

> 这个 Moment 似乎和「学会弹吉他」有关。

[关联] [忽略]

默认不自动关联。

---

## Level 3：AI 长期理解

未来 AI 可以观察：

> 过去 3 个月，你有 17 个与运动相关的 Moment。

然后询问：

> 这些经历似乎一直在朝着「身体状态更好」这个方向靠近，要不要把它们整理成一段成长轨迹？

用户确认后再生成。

---

# 10. Progress 机制

V1 不采用统一百分比。

Progress 根据 Goal 的实际性质自然表达。

## 10.1 数量型

例如：

> 今年读 20 本书

显示：

> **7 / 20 books**

---

## 10.2 行为积累型

例如：

> 成为一个坚持运动的人

显示：

> **过去 30 天 · 6 次运动**

或者：

> **27 个运动相关 Moment**

---

## 10.3 成长型

例如：

> 成为一个更有表达力的人

显示：

> **12 Growth Evidence**

---

## 10.4 阶段型

显示：

> **3 Milestones**

---

## 10.5 不允许伪造精确度

如果 Goal 无法合理量化：

不要人为计算：

> 63%

不要把主观成长变成虚假的精确数字。

---

# 11. Milestone

Milestone 是 Goal 生命周期中的重要阶段。

它与 Evidence 不同。

### Evidence

> 一个真实事件。

### Milestone

> 一组事件累积后，代表一个阶段变化。

例如：

Goal：

> 学会弹吉他

Evidence：

- 买了吉他
- 上第一节课
- 学会 C 大调
- 学会 F 大调
- 学会一首歌

Milestone：

> **第一次完整弹完一首歌**

---

## 11.1 Milestone 的意义

Milestone 的作用不是：

> 奖励用户积分。

而是：

> **帮助用户看见自己真的走过了一个阶段。**

---

## 11.2 Milestone 表达

可以生成：

```text
You made it this far.

第一次完整弹完一首歌

Oct 2026
```

或者：

> 你已经为这个方向留下了 10 个真实瞬间。

---

# 12. 成就感设计

V1 不做：

- XP
- 等级
- 排行榜
- 连续打卡
- 每日积分
- 失败惩罚
- 任务完成率
- 强制奖励
- 徽章收集体系

优先做：

> **Evidence → Milestone → Growth Story**

---

# 13. Growth Card

重要 Milestone 可以形成 Growth Card。

例如：

```text
FIVE BOOKS IN

今年，你已经读完了 5 本书。

其中 3 本来自过去三个月。

也许你正在重新找回阅读的节奏。

[查看这 5 个 Moment]
```

注意：

系统可以提供观察，但不要过度解释。

“也许”比“你已经成为……”更合适。

---

# 14. Goal Detail 页面

Goal Detail 默认是 View Mode。

推荐结构：

```text
学会弹吉他

Started Oct 2026

────────────────

12
Growth Evidence

3
Milestones

────────────────

Recent Evidence

🎸 买了第一把吉他
Oct 08

🎵 学会 C 大调
Oct 05

🎤 上了第一节课
Sep 28

────────────────

[ View all Moments ]

[ Edit Goal ]
```

---

## 14.1 Goal Detail 不应该像任务管理器

禁止默认出现：

- 大型进度条
- KPI Dashboard
- 任务矩阵
- 复杂统计
- 密集表格
- 日历打卡墙

Goal Detail 应该更接近：

> **一条正在生长的个人轨迹。**

---

# 15. Goal 与 Today

二者职责明确：

### Goal

> 我想往哪里去？

### Today

> 今天我正在做什么？

Today 中可以出现：

> This connects to:
> `学会弹吉他`

但不要把 Goal 自动变成 Todo。

---

# 16. Goal 与 Moments

Moments 是真实生活。

Goal 是方向。

Moment 是 Goal 的 Evidence 来源。

关系：

```text
Goal
  ↑
  │
Evidence
  ↑
Moment
```

一个 Moment 可以同时关联多个 Goal。

---

# 17. Goal 与 Reflection

Reflection 是意义解释层。

例如：

Moment：

> 今天第一次完整弹完一首歌。

Reflection：

> 原来坚持一件事情几个月，真的会发生变化。

未来可以形成：

```text
Goal
↓
Moment
↓
Reflection
↓
Growth Story
```

这会比单纯统计次数更有价值。

---

# 18. Goal 与 Me

Me 是长期自我理解层。

Goal 体现：

> 我想往哪里去。

Moments 体现：

> 我实际经历了什么。

Evidence 体现：

> 哪些经历与我的方向有关。

最终：

> **Me 体现我正在成为谁。**

因此：

```text
Goals
   ↓
Evidence
   ↓
Growth
   ↓
Becoming
   ↓
Me
```

---

# 19. AI 未来介入原则

AI 不是 Goal 的主人。

AI 只能逐渐理解。

## AI 可以做

### 1. 关联建议

> 这个 Moment 似乎和「学会弹吉他」有关。

### 2. 进展总结

> 最近三个月，你已经有 8 个与这个方向相关的 Moment。

### 3. Milestone 发现

> 你似乎已经完成了一个阶段。

### 4. Pattern 发现

> 你最近记录的几个 Moment 都和“表达”有关。

### 5. Next Step 建议

> 如果你愿意，下一步可以考虑找一位老师。

---

## AI 不可以未经确认做

- 修改 Goal
- 删除 Goal
- 自动 Achieve
- 自动 Abandon
- 自动创建用户目标
- 强制关联 Moment
- 给用户贴人格标签
- 把推测当成事实

---

# 20. Goal 的长期生命周期

```text
CREATE
  ↓
LIVE
  ↓
MOMENT
  ↓
EVIDENCE
  ↓
MILESTONE
  ↓
GROWTH
  ↓
ACHIEVED / PAUSED / ABANDONED
  ↓
LIFE JOURNEY
```

Goal 即使结束，也不会从系统消失。

它成为：

> **我曾经想往哪里去。**

---

# 21. 用户场景

## 场景 A：突然产生一个想法

用户：

> 我想学钢琴。

操作：

Add Goal → 输入 → 创建。

整个过程不超过几秒。

---

## 场景 B：生活自然推动目标

用户：

> 今天上了第一节钢琴课。

创建 Moment。

选择：

> 学会钢琴

Goal Evidence +1。

---

## 场景 C：阶段性成就

用户经过一段时间：

> 第一次完整弹完一首歌。

系统记录 Milestone。

用户获得：

> “原来我真的已经走到这里了。”

---

## 场景 D：目标暂停

用户：

> 最近工作太忙，暂时不学了。

Goal → Paused。

不产生负面提示。

---

## 场景 E：目标放弃

用户：

> 我发现自己其实不喜欢钢琴了。

Goal → Abandoned。

产品不说：

> 失败。

而记录：

> 这是曾经选择过的一条方向。

---

# 22. 空状态

新建 Goal：

```text
还没有成长证据。

先去生活。
当某些事情与这个方向产生联系，
它们会慢慢出现在这里。
```

避免：

> Start completing tasks now!

---

# 23. V1 范围

## 必须做

### Goal

- 创建
- 查看
- 编辑
- 删除/归档策略
- Active / Paused / Achieved / Abandoned
- Active Goal 列表
- Goal Detail

### Moment

- Moment → Goal 关联
- Goal → Evidence 列表
- Evidence → 原 Moment

### Progress

- Evidence 数量
- 基础数量型目标支持
- Milestone 基础结构

### Me

- 展示当前 Goals
- 展示部分 Evidence / Milestone

### 数据

- Goal Repository
- Goal Service
- Goal API
- Goal 与 Moment 的关联表
- Migration

---

# 24. V1 明确不做

暂不做：

- AI 自动 Goal
- AI 自动关联
- AI 自动 Milestone
- AI 自动总结成长
- XP
- Level
- Leaderboard
- Streak
- 强制 Deadline
- Reminder
- 复杂任务系统
- OKR
- KPI
- 社交比较
- Goal 分享
- Goal 排行
- 复杂统计 Dashboard

---

# 25. V2 方向

未来可以增加：

## AI Goal Understanding

理解用户目标。

## Smart Evidence Suggestion

自动发现可能相关的 Moment。

## Milestone Detection

发现重要阶段。

## Growth Story

把 Evidence + Reflection 组织成成长故事。

## Goal Review

定期回顾：

> 这个目标现在还重要吗？

## Goal Evolution

目标本身也可以变化：

> “学会唱歌”
→
> “成为更有表达力的人”

但变化必须由用户确认。

---

# 26. 数据模型原则

Goal 必须是单一事实来源。

其他模块只引用 Goal。

建议核心关系：

```text
Goal
 ├── GoalStatus
 ├── GoalEvidence
 │      └── Moment
 └── Milestone
```

Moment 与 Goal：

```text
Moment
  ↕
MomentGoal
  ↕
Goal
```

不要在 Moment 中复制 Goal 的完整信息。

不要在 Today 中复制 Goal。

不要在 Me 中复制 Goal。

---

# 27. 验收标准

## 创建

- [ ] 用户只输入一句话即可创建 Goal
- [ ] 不要求填写 Why / Becoming / Next Step
- [ ] 创建后立即可见

## 状态

- [ ] Active
- [ ] Paused
- [ ] Achieved
- [ ] Abandoned
- [ ] 状态切换不会丢失 Evidence

## Moment

- [ ] Moment 可以关联 Goal
- [ ] 一个 Moment 可以关联多个 Goal
- [ ] Goal 可以查看关联 Moment
- [ ] Moment 可以查看关联 Goal

## Evidence

- [ ] Evidence 数量正确
- [ ] Evidence 可以追溯到原 Moment
- [ ] 删除/取消关联后统计正确
- [ ] 刷新后数据仍存在

## Persistence

- [ ] 创建 Goal → 刷新 → Goal 仍存在
- [ ] 创建 Evidence → 刷新 → Evidence 仍存在
- [ ] 关联 Moment → 刷新 → 关联仍存在
- [ ] Goal 状态修改 → 刷新 → 状态正确

## 回归

- [ ] Today 正常
- [ ] Moments 正常
- [ ] Quick Capture 正常
- [ ] Moment Composer 正常
- [ ] Daily Reflection 正常
- [ ] Person / Place / Topic / Media association 正常

---

# 28. 产品成功标准

Goals V1.0 不以：

> 用户创建了多少 Goal

作为核心成功标准。

更重要的是：

### 1. 用户是否愿意留下真实目标

### 2. 用户是否会自然地把生活事件与目标连接

### 3. 用户是否能在一段时间后看到：

> “原来我真的做了这些事情。”

### 4. 用户是否获得：

> **真实的进展感，而不是被 KPI 追赶的感觉。**

### 5. Goal 是否成为 Me 的长期自我理解基础

---

# 29. 最终产品原则

### 原则一

> **Goal should create direction, not pressure.**

### 原则二

> **Life comes first. Goals come second.**

### 原则三

> **Progress should be evidence, not judgment.**

### 原则四

> **Do not force the user to explain themselves before they have lived enough to know the answer.**

### 原则五

> **A Moment is a piece of life. An Evidence is a piece of growth.**

### 原则六

> **The system should help the user notice who they are becoming, not tell them who they are.**

---

# 30. 一句话总结

> **Goal 不是让我每天完成更多事情，而是让我在回头看的时候，发现自己真的正在往想去的地方走。**

整个 Goals 系统最终形成：

```text
        “我想往哪里去”
                ↓
              Goal
                ↓
        “我今天经历了什么”
                ↓
             Moment
                ↓
        “这是否让我更靠近”
                ↓
           Evidence
                ↓
        “我已经走过一段了”
                ↓
           Milestone
                ↓
        “我发生了什么变化”
                ↓
          Growth Story
                ↓
        “我正在成为谁”
                ↓
               Me
```

> **不是管理人生，而是让人生留下方向感。**
