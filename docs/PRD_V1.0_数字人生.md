# PRD V1.0｜数字人生 Digital Self

> **核心价值：让我看见自己正在变成什么样的人。**

- 文档版本：PRD V1.0
- 产品阶段：MVP
- 产品定位：个人数字人生空间 / Digital Self
- 核心循环：Wake → Plan → Live → Capture → Reflect → Understand → Become
- 本版本目标：定义 P0 MVP 的产品范围、用户流程、页面、功能、AI 行为、数据要求与验收标准

---

# 1. 产品概述

## 1.1 产品定位

一个属于用户自己的数字世界：

> **记录过去，管理当下，探索未来。**

它将生活记录、今日管理、自我认知、目标成长和 AI 长期理解连接起来。

## 1.2 核心用户价值

传统工具解决：

- 我今天要做什么？
- 我写了什么日记？
- 我完成了多少任务？

Digital Self 要进一步解决：

> **我是谁？**
>
> **我经历了什么？**
>
> **我现在处于什么状态？**
>
> **我正在成为谁？**

## 1.3 MVP 核心假设

必须验证：

> **用户愿意每天回来，并且随着使用时间增加，能够明显感受到 AI 越来越了解自己。**

---

# 2. MVP 产品目标

## 2.1 P0 目标

MVP 不追求功能完整，而是完整跑通一个“数字人生的一天”。

### 用户流程

```text
早晨打开
↓
了解自己的状态
↓
AI 生成今日建议
↓
调整今日计划
↓
开始一天
↓
随时 Quick Capture
↓
记录生活 / 想法
↓
完成任务
↓
晚上结束一天
↓
AI 回顾今天
↓
AI 提炼 Insight
↓
形成 Day Memory
↓
进入第二天
```

## 2.2 P0 功能范围

| 模块 | 优先级 | MVP |
|---|---:|---|
| Today | P0 | ✓ |
| Quick Capture | P0 | ✓ |
| Moments | P0 | ✓ |
| Daily Reflection | P0 | ✓ |
| AI Morning Plan | P0 | ✓ |
| AI Daily Insight | P0 | ✓ |
| Basic Memory | P0 | ✓ |
| Me | P0 | ✓ |
| Goals | P0 | ✓ |
| Journey | P1 |  |
| People | P1 |  |
| Growth Analysis | P1 |  |
| Photo Wall | P1 |  |
| Explore | P2 |  |
| Public Me | P2 |  |
| Sanctuary | P2 |  |
| Advanced Gameification | P2 |  |

---

# 3. 用户与权限

## 3.1 MVP 用户

MVP 默认单用户、私有空间。

用户拥有：

- 自己的生活记录
- 自己的目标
- 自己的状态
- 自己的 AI Memory
- 自己的 AI Insight

## 3.2 权限原则

P0：

> 默认 Private。

P1/P2 再设计：

- Public
- Friends
- Close Friends
- Partner
- Private

---

# 4. Information Architecture

## 4.1 一级导航

```text
Today
Me
Journey
Moments
People
Explore
```

P0 实际启用：

```text
Today
Me
Moments
```

AI Butler 为全局入口。

Goals 作为 Me 内部核心模块。

---

# 5. Core Data Objects

## 5.1 User

记录用户长期身份。

字段：

- id
- name
- avatar
- bio
- occupation
- location
- interests
- values
- current_goals
- current_state
- created_at

---

## 5.2 Day

代表一天。

字段：

- date
- mood
- energy
- focus
- theme
- plans
- moments
- reflection
- insight
- memory
- created_at
- updated_at

---

## 5.3 Moment

MVP 最核心的生活原子。

字段：

- id
- type
- content
- media
- date_time
- mood
- tags
- person_ids
- place
- goal_id
- importance
- is_memory
- ai_summary
- created_at
- updated_at

### Moment 类型

- Diary
- Thought
- Photo
- Event
- Achievement
- Feeling
- Trip
- Conversation
- Other

---

## 5.4 Goal

字段：

- id
- title
- why
- desired_identity
- outcome
- actions
- progress
- status
- start_date
- target_date
- evidence
- created_at

### Goal 状态

- Active
- Paused
- Completed
- Abandoned

---

## 5.5 Memory

Memory 是 AI 长期理解的基础。

字段：

- id
- content
- category
- source_ids
- confidence
- importance
- user_confirmed
- created_at
- updated_at

### Memory Category

- Identity
- Preference
- Goal
- Person
- Experience
- Belief
- Interest
- Pattern
- Important Event

---

## 5.6 Insight

AI 对用户记录产生的观察。

字段：

- id
- type
- title
- content
- evidence_ids
- confidence
- date_range
- user_feedback
- created_at

### Insight 类型

- Daily
- Weekly
- Growth
- Pattern
- Goal
- Relationship
- Emotional

---

# 6. 页面 PRD：Today

## 6.1 页面目标

用户进入 Today 后，5 秒内知道：

1. 我现在状态如何？
2. 今天最重要的事情是什么？
3. 我接下来要做什么？
4. 今天已经发生了什么？

---

## 6.2 页面结构

```text
Today
│
├── Header
│   ├── Date
│   ├── Greeting
│   └── AI Butler
│
├── My State
│   ├── Mood
│   ├── Energy
│   └── Focus
│
├── Today's Focus
│
├── AI Morning Brief
│
├── Today's Timeline
│
├── Quick Capture
│
├── Today's Moments
│
└── End My Day
```

---

## 6.3 Header

显示：

- 当前日期
- 星期
- 时间段
- 个性化 Greeting

示例：

> Good morning.

或者：

> Good evening.

不使用：

> “早上好！今天也要元气满满哦！”

---

# 7. My State

## 7.1 Mood

建议 5 档：

- Great
- Good
- Okay
- Low
- Heavy

也允许跳过。

## 7.2 Energy

建议：

- Low
- Medium
- High

## 7.3 Focus

用户可以填写：

> 今天最想专注什么？

例如：

> 完成论文最后一部分。

---

# 8. AI Morning Plan

## 8.1 触发

每天首次进入 Today 时：

如果今天尚未生成 Morning Plan：

> 自动生成。

不重复生成。

---

## 8.2 AI 输入

AI 可读取：

### 长期信息

- User Profile
- Goals
- Important Memories
- Preferences

### 短期信息

- Yesterday
- Recent Days
- Current Mood
- Current Energy
- Existing Schedule
- Active Goals

---

## 8.3 AI 输出

结构：

### Today in One Sentence

一句话概括今天。

### Priority

今天最重要的事情。

### Suggested Plan

建议安排：

- Focus
- Work
- Life
- Rest

### Small Suggestion

一个轻量建议。

---

## 8.4 AI 输出原则

AI 不应：

- 强行制定计划
- 填满用户一天
- 自动修改任务
- 把效率最大化作为唯一目标

AI 应：

> 建议，而不是控制。

---

## 8.5 用户操作

每条建议：

- Accept
- Edit
- Delete
- Ignore

---

# 9. Today's Timeline

## 9.1 展示

按照时间顺序显示：

```text
09:30
Work

12:30
Lunch

14:00
Deep Work

18:30
Gym
```

## 9.2 状态

- Upcoming
- In Progress
- Completed
- Skipped

---

# 10. Quick Capture

## 10.1 定位

用户随时记录任何突然出现的内容。

入口：

> + Capture

---

## 10.2 输入

支持：

- Text
- Photo
- Voice（后续）
- Video（后续）

P0：

> Text + Photo。

---

## 10.3 最低操作

用户输入：

> “今天突然觉得，也许我应该认真考虑一下未来的职业方向。”

点击保存即可。

不要求用户先选择：

- 类型
- 标签
- 目标
- 情绪

---

## 10.4 AI 后处理

AI 可以后台建议：

```text
Thought
Career
Potential Goal
```

用户可：

- Confirm
- Edit
- Ignore

---

# 11. Moments

## 11.1 页面目标

让用户看到：

> **我的生活正在被留下。**

---

## 11.2 展示形式

默认：

> Chronological Memory Flow

不要默认做成：

> Card Grid。

---

## 11.3 Moment 创建

点击：

> + New Moment

进入轻量编辑。

字段：

- Content
- Photo
- Type
- Date
- Mood
- Tags

高级关联：

- People
- Place
- Goal

默认折叠。

---

# 12. Moment Detail

详情页：

```text
Date
Title / Content
Media

Context
├── People
├── Place
├── Mood
└── Goal

Reflection

AI Insight

Memory
```

---

# 13. Memory

## 13.1 用户视角

Memory 不应该成为一个复杂的“知识库页面”。

用户只需要知道：

> AI 记住了什么。

---

## 13.2 Memory Center

P0 可以作为 Me 内部页面。

显示：

### Things I Remember

例如：

> 你目前最关注职业发展。

> 你希望保持规律运动。

> 你最近在思考长期职业方向。

---

## 13.3 用户控制

每条 Memory：

- Confirm
- Edit
- Forget

这是 AI 信任的关键。

---

# 14. Evening Reflection

## 14.1 触发

用户点击：

> End My Day

---

## 14.2 页面流程

### Step 1

> How was today?

选择：

- Great
- Good
- Okay
- Difficult
- Heavy

### Step 2

> What stayed with you today?

自由输入，可跳过。

### Step 3

> What did you learn?

自由输入，可跳过。

### Step 4

AI 生成：

> Your Day

---

# 15. AI Daily Reflection

AI 输入：

- Today's Plan
- Completed Tasks
- Skipped Tasks
- Today's Moments
- Mood
- Energy
- User Reflection
- Relevant Memory

---

## 15.1 AI 输出

### Your Day

客观总结今天。

### What Stood Out

指出重要事件。

### Your Insight

提出 1 个值得注意的观察。

### Your Growth

如果有证据，再指出变化。

### Tomorrow

提供一个轻量建议。

---

# 16. AI Insight 规则

必须遵循：

> Observation → Evidence → Interpretation → Suggestion

例如：

> **Observation**
>
> 最近两周，你多次提到职业方向。

> **Evidence**
>
> 过去 14 天有 4 次相关记录。

> **Interpretation**
>
> 这可能说明这已经成为近期一个持续存在的问题。

> **Suggestion**
>
> 或许可以专门留一个晚上，把“我真正想要什么”单独梳理一次。

---

# 17. Day Card

每天结束后生成一个 Day Card。

字段：

- Date
- Mood
- Energy
- Focus
- Key Moments
- People
- Growth
- One Thought
- One Memory
- AI Insight

视觉上应该像：

> 一张属于这一天的人生卡片。

而不是日报表。

---

# 18. Me 页面

## 18.1 页面目标

回答：

> **我是谁？**

---

## 18.2 页面结构

```text
Me

Identity
│
├── Who I Am
├── What Matters To Me
├── My Strengths
├── My Interests
└── My Patterns

Becoming
│
├── Who I Want To Be
├── Current Goals
└── Who I Am Becoming

Memory
│
└── Things AI Remembers
```

---

# 19. Me：Who I Am

MVP 只保留基础内容：

- Name
- Bio
- Current Role
- Interests
- Values
- Current Focus

不要在 MVP 做复杂人格测评。

---

# 20. Goals

## 20.1 Goals 页面

用户可以创建：

> 我想实现什么？

但系统进一步询问：

> 为什么？

> 实现后，我希望成为怎样的人？

---

## 20.2 Goal 创建流程

### Step 1

> What do you want?

### Step 2

> Why does it matter?

### Step 3

> Who do you want to become through this?

### Step 4

> What's the next step?

最终形成：

```text
Goal
↓
Why
↓
Desired Identity
↓
Outcome
↓
Next Actions
```

---

# 21. AI Butler 全局设计

## 21.1 入口

建议使用：

> ✦

作为全局悬浮入口。

---

## 21.2 AI 在不同页面的上下文

| 页面 | AI 主要作用 |
|---|---|
| Today | Plan |
| Moments | Organize |
| Me | Understand |
| Journey | Reflect |
| People | Remember |
| Explore | Connect |
| Sanctuary | Accompany |

---

# 22. AI Butler 对话

不建立一个复杂的“AI Chat Home”。

点击 AI：

显示当前上下文：

例如 Today：

> What would you like to work through?

快捷入口：

- Plan my day
- Review yesterday
- Help me prioritize
- I need to think something through

---

# 23. AI Context Architecture

每次 AI 请求不应该把所有数据全部塞进去。

分为：

## Layer 1：Identity

长期稳定：

- 基本身份
- 工作
- 价值观
- 重要偏好

## Layer 2：Goals

当前目标。

## Layer 3：Recent State

最近 7～14 天：

- 情绪
- 计划
- Moments
- 反思

## Layer 4：Relevant Memory

根据当前问题检索相关记忆。

## Layer 5：Current Context

当前页面、当前输入、当前时间。

---

# 24. AI Memory Governance

## 24.1 什么值得记

优先记：

- 长期目标
- 长期偏好
- 重要人物
- 重要经历
- 用户明确表达的价值观
- 用户反复出现的问题
- 用户确认过的 AI 观察

## 24.2 什么不应该长期记

- 一次性的普通信息
- 无意义闲聊
- AI 自己猜测的事实
- 敏感信息，除非用户明确需要并同意保存

---

# 25. Empty State

空状态不能写：

> “暂无数据。”

应该具有产品情绪。

## Today

> Your day hasn't started yet.

## Moments

> Nothing here yet.
>
> That's okay.
> Your life is just beginning to fill this space.

## Goals

> What do you want to become?

## Memory

> I’m still getting to know you.

---

# 26. Loading State

AI 思考时避免：

> Loading...

建议：

> Thinking about your day…

或：

> Looking through what happened today…

---

# 27. Error State

不要暴露技术错误。

不使用：

> API Error 500

使用：

> I couldn't finish that just now.
> Your records are safe. Try again.

---

# 28. Notification Strategy

MVP 极度克制。

允许：

### Morning

> Your day is ready.

### Evening

> Ready to look back on today?

禁止：

- 高频提醒
- 连续催促
- 游戏式奖励通知
- “你已经 3 天没有记录了！”

---

# 29. Visual Requirements

## 29.1 总体风格

> Quiet Luxury + Personal + Alive

关键词：

- 高级
- 克制
- 安静
- 有生命力
- 有个人感

---

## 29.2 Layout

优先：

- whitespace
- typography
- editorial layout
- timeline
- large image
- asymmetry
- subtle motion

避免：

- Dashboard 感
- 密集 Card
- 数据墙
- 大量 Badge
- KPI 化

---

# 30. Responsive

至少支持：

- Desktop
- Tablet
- Mobile

Desktop：

> Personal Digital Space

Mobile：

> Quick Capture + Daily Companion

移动端重点保证：

1. Today
2. Capture
3. Reflection
4. Moments

---

# 31. Privacy Requirements

这是产品的核心信任基础。

P0 必须：

- 明确私有数据边界
- 用户可删除 Moment
- 用户可删除 Memory
- 用户可关闭 AI 对某类内容的使用
- 用户可以看到 AI 记住了什么
- AI 不得把 Private 内容用于 Public Me

---

# 32. Public / Private Boundary

P0：

> 所有内容 Private。

后续 Public Me 必须采用：

> Explicit Opt-in

即：

> 用户主动选择公开。

禁止：

> 默认公开。

---

# 33. AI Safety & Emotional Design

当用户表达明显痛苦时：

AI 应：

1. 先回应情绪
2. 理解发生了什么
3. 避免过度分析
4. 给用户选择是否继续梳理
5. 必要时鼓励寻求现实中的支持

不要：

- 诊断
- 标签化
- 强行积极
- 用成长叙事否定痛苦

核心原则：

> **成长不应该建立在否定感受之上。**

---

# 34. MVP Acceptance Criteria

## Today

- [ ] 用户可以查看当天状态
- [ ] 用户可以设置 Mood / Energy / Focus
- [ ] AI 可以生成 Morning Plan
- [ ] 用户可以修改 AI 建议
- [ ] 用户可以完成/跳过任务
- [ ] 用户可以 Quick Capture
- [ ] 用户可以进入 Evening Reflection
- [ ] AI 可以生成 Daily Insight
- [ ] Day Card 可以保存

## Moments

- [ ] 可以创建 Moment
- [ ] 可以添加文本
- [ ] 可以添加图片
- [ ] 可以编辑
- [ ] 可以删除
- [ ] 可以按时间查看
- [ ] 可以关联 Day

## Memory

- [ ] AI 可以保存重要 Memory
- [ ] 用户可以查看
- [ ] 用户可以修改
- [ ] 用户可以删除
- [ ] AI 后续回答可以引用 Memory

## Me

- [ ] 可以编辑基础资料
- [ ] 可以创建 Goal
- [ ] 可以查看当前 Goal
- [ ] AI 可以理解当前 Goal

## AI Butler

- [ ] AI 可以读取当前 Day
- [ ] AI 可以读取 Goal
- [ ] AI 可以读取 Recent Memories
- [ ] AI 可以进行 Morning Plan
- [ ] AI 可以进行 Daily Reflection
- [ ] AI 可以回答关于用户自己的问题
- [ ] AI 明确区分事实与推测

---

# 35. MVP Success Metrics

第一阶段重点不是商业指标。

## 行为指标

### D1 Return

用户第二天是否回来。

### Recording Rate

用户是否愿意留下至少一条真实记录。

### Reflection Rate

用户是否愿意完成 Evening Reflection。

### AI Memory Confirmation

用户是否愿意确认 AI 记住的信息。

---

## 体验指标

可以在使用 7～14 天后询问：

### Q1

> “你觉得这个产品开始了解你了吗？”

### Q2

> “AI 给你的建议有多少真正有帮助？”

### Q3

> “回看这些记录，你是否更了解自己？”

### Q4

> “如果这个产品明天消失，你会不会觉得可惜？”

最后一个问题尤其重要。

---

# 36. Product Quality Bar

一个功能只有同时满足以下条件，才进入正式版本：

### Useful

真的解决问题。

### Natural

操作符合生活习惯。

### Connected

能够和其他人生数据产生关系。

### Personal

使用越久越有个人价值。

### Beautiful

符合整体视觉气质。

### Quiet

不会打扰用户。

---

# 37. Build Order

开发严格按照以下顺序：

## Phase 1

Today + Moment + Capture

## Phase 2

Morning Plan + Evening Reflection

## Phase 3

Memory + Me + Goals

## Phase 4

AI Context + Long-term Understanding

## Phase 5

视觉打磨 + Animation + Responsive

## Phase 6

真实使用 + Bug Fix + 删除冗余功能

---

# 38. Vibe Coding 执行原则

后续每次让 Coding Agent 工作，都必须遵循：

## 规则 1

先理解 Product Bible 与 PRD，再修改代码。

## 规则 2

一次只完成一个明确任务。

## 规则 3

修改前说明：

- 当前问题
- 解决方案
- 影响范围

## 规则 4

不要擅自改变：

- IA
- 核心交互
- 数据模型
- 产品定位
- 视觉语言

## 规则 5

如果发现产品决策存在冲突：

> 停止扩展，优先提出冲突。

## 规则 6

不要为了实现方便牺牲：

> 用户体验 > 工程便利。

## 规则 7

不要一次生成大量页面。

优先：

> 一个页面 → 做完整 → 验证 → 再下一个。

---

# 39. First Coding Milestone

第一次 Coding 不做整个产品。

只实现：

> **Today V0.1**

必须完整支持：

```text
打开 Today
↓
设置 Mood / Energy
↓
看到 Focus
↓
AI Morning Plan
↓
Timeline
↓
完成一项任务
↓
Quick Capture
↓
End My Day
↓
AI Daily Insight
↓
Day Card
```

如果这一条链路跑通：

> Digital Self 才真正“活起来”。

---

# 40. Definition of Done

MVP 不以：

> “代码写完”

作为完成标准。

而以：

> **用户真实使用一天后，感觉这是一个可以继续生活下去的空间。**

作为完成标准。

具体来说：

- 用户能在 30 秒内开始一天
- 用户能在 5 秒内记录一件事
- 用户不需要频繁填写表单
- AI 能理解今日上下文
- AI 能引用过去的相关信息
- AI 的建议不是泛泛鸡汤
- 用户晚上愿意回顾
- 用户可以看到当天被保存下来的生活
- 第二天再次打开时，系统还记得昨天

---

# 41. V1.0 Product Truth

最终判断标准只有一个：

> **这个产品有没有让“记录人生”从负担变成一种自然而有意义的行为？**

如果没有：

继续减法。

如果有：

继续让它变得更懂用户。

---

# 42. 下一阶段

PRD V1.0 完成后，不立即开始大规模 Coding。

下一份文档应为：

> **《IA + User Flow V1.0》**

重点拆解：

1. 全站 Sitemap
2. Today 用户流程
3. Quick Capture 流程
4. Moment 创建流程
5. Morning Plan 流程
6. Evening Reflection 流程
7. Memory 流程
8. Goal 创建流程
9. AI Butler 上下文流程
10. 页面之间的跳转关系

然后进入：

> **Wireframe V1.0 → Design System V1.0 → AI Prompt / Context → Technical Architecture → Vibe Coding Master Prompt → Coding**

---

# Appendix A｜MVP 核心体验一句话

> **早上，它帮我看清今天；白天，它安静地陪我生活；晚上，它帮我理解今天；时间久了，它让我看见自己正在成为谁。**

# Appendix B｜产品核心句

> **记录过去，管理当下，探索未来。**

> **Remember your life. Understand yourself. Shape your days. Become who you want to be.**
