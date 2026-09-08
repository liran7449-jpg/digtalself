# IA + User Flow V1.0｜数字人生 Digital Self

> **目标：把 PRD 中的产品能力组织成一张真正可以被设计、开发和验证的产品地图。**

- 文档版本：IA + User Flow V1.0
- 基于：Product Bible V1.0 / PRD V1.0
- 阶段：MVP
- 核心原则：先打通“我的一天”，再让一天连接成我的人生。

---

# 1. Information Architecture｜信息架构

## 1.1 全局结构

```text
Digital Self
│
├── Today
│   ├── My State
│   ├── Today's Focus
│   ├── AI Morning Brief
│   ├── Timeline
│   ├── Quick Capture
│   ├── Today's Moments
│   └── End My Day
│
├── Moments
│   ├── All Moments
│   ├── Moment Detail
│   ├── Create Moment
│   └── Edit Moment
│
├── Me
│   ├── Profile
│   ├── Who I Am
│   ├── Goals
│   ├── Memory
│   └── AI Insights
│
├── Journey [P1]
│   ├── Life Timeline
│   ├── Chapters
│   └── Chapter Detail
│
├── People [P1]
│   ├── People List
│   └── Person Detail
│
├── Explore [P2]
│   ├── Books
│   ├── Films
│   ├── TV
│   ├── Music
│   ├── Places
│   └── Ideas
│
└── AI Butler
    ├── Global Entry
    ├── Contextual Conversation
    ├── Morning Plan
    ├── Daily Reflection
    └── Personal Understanding
```

---

# 2. MVP 导航策略

虽然完整产品有 6 个一级导航，但 MVP 不需要全部上线。

## MVP Navigation

```text
Today
Moments
Me
```

### Today

核心入口。

> 今天的我。

### Moments

核心记录空间。

> 我的生活。

### Me

核心长期空间。

> 我是谁，以及我想成为谁。

---

# 3. 全局 Navigation

## 3.1 Desktop

建议：

```text
┌──────────────────────────────────────────────────┐
│  Digital Self                     ✦ AI Butler    │
├──────────────┬───────────────────────────────────┤
│              │                                   │
│ Today        │                                   │
│ Moments      │            Main Content           │
│ Me           │                                   │
│              │                                   │
│              │                                   │
│              │                                   │
│              │                                   │
└──────────────┴───────────────────────────────────┘
```

导航应该安静。

不要：

- 巨大的侧边栏
- 复杂图标体系
- 大量 Badge
- 未读红点

---

# 4. 全局 AI Butler

AI Butler 是全局层。

入口：

> ✦

但不同页面点击后的默认上下文不同。

| 当前页面 | 默认 AI Context |
|---|---|
| Today | 今天 |
| Moments | 当前 Moment |
| Me | 用户自己 |
| Journey | 当前人生阶段 |
| People | 当前人物 |
| Explore | 当前内容 |
| Sanctuary | 当前情绪 |

---

# 5. First Time Experience｜首次进入

首次进入不应该是一张大型问卷。

目标：

> **让 AI 获得第一批真正有价值的用户信息。**

---

## 5.1 Welcome

文案：

> Welcome to your space.
>
> This is a place for your life —  
> what you've lived, what you're thinking,  
> and who you're becoming.

CTA：

> Begin

---

# 6. Onboarding Conversation

AI 通过 4～5 个开放问题认识用户。

## Q1

> What matters to you most right now?

## Q2

> What are you trying to become?

## Q3

> What are you currently struggling with?

## Q4

> What makes you feel alive?

## Q5

> What do you want this space to remember about you?

---

## 6.1 Onboarding 原则

用户可以：

- Skip
- Later
- Answer partially

绝不能：

> 强制填写完整。

结束：

> I think I know a little about you now.
>
> 但不用着急。
>
> 我会慢慢认识你。

---

# 7. User Flow 总览

核心用户路径：

```text
First Open
    ↓
Onboarding
    ↓
Today
    ↓
Set State
    ↓
AI Morning Plan
    ↓
Adjust Plan
    ↓
Live
    ↓
Quick Capture
    ↓
Moment
    ↓
End My Day
    ↓
Reflection
    ↓
AI Insight
    ↓
Day Card
    ↓
Memory
    ↓
Next Day
```

---

# 8. Flow 01｜Morning

## 8.1 用户打开产品

进入：

> Today

系统判断：

```text
Is today initialized?
│
├── No
│   ↓
│  Morning Setup
│
└── Yes
    ↓
   Today's State
```

---

# 9. Morning Setup

### Step 1

> How are you feeling today?

选择 Mood。

### Step 2

> How much energy do you have?

选择 Energy。

### Step 3

> What matters most today?

输入 Focus。

完成：

> Shape My Day

---

# 10. AI Morning Plan Flow

```text
User State
   +
Calendar / Existing Tasks
   +
Active Goals
   +
Yesterday
   +
Recent Context
   ↓
AI Planning
   ↓
Today's Suggested Plan
   ↓
User Review
   ↓
Accept / Edit / Remove
   ↓
Today Timeline
```

---

# 11. AI Morning Plan 页面

结构：

```text
Good morning.

You have a lot going on today,
but only one thing really needs your attention.

[ Today's Focus ]

──────────────

Your day, gently shaped

09:30  Deep Work
12:30  Lunch
14:00  Meeting
18:30  Gym

──────────────

One small suggestion

Leave 30 minutes tonight
for yourself.

[ Accept Plan ]
```

---

# 12. Flow 02｜Daytime

白天不主动打扰用户。

用户主要做三件事：

```text
Execute
Capture
Check
```

---

## 12.1 Execute

用户完成任务：

> Complete

系统：

- 更新 Task
- 更新 Day
- 记录 completion evidence

不要立即弹出：

> +20 XP!

---

# 13. Flow 03｜Quick Capture

这是 MVP 最重要的低摩擦入口之一。

```text
任何页面
   ↓
+ Capture
   ↓
输入内容
   ↓
Save
   ↓
完成
```

保存后不强制进入编辑页面。

---

# 14. Quick Capture 示例

用户：

> “刚刚和老板聊完，突然发现自己其实不太喜欢现在做的事情。”

点击：

> Save

完成。

后台 AI 可以进行：

```text
Content
↓
Potential Type: Thought
↓
Topic: Career
↓
Related Goal: Career Direction
↓
Potential Memory: Medium
```

但不自动确认。

---

# 15. Quick Capture 后处理

保存后可以出现一个非常轻的提示：

> I noticed this might be about your career direction.

按钮：

- Add to Career
- Keep as Moment
- Not now

重点：

> **不要强迫用户整理。**

---

# 16. Flow 04｜Create Moment

如果用户主动创建 Moment：

```text
+ New Moment
    ↓
Write / Add Photo
    ↓
Optional Context
    ↓
Save
```

---

# 17. Moment 编辑层级

## Level 1：必须

- Content / Photo
- Date

## Level 2：可选

- Type
- Mood
- Tags

## Level 3：高级

- People
- Place
- Goal
- Why It Matters

原则：

> 默认只展示 Level 1。

---

# 18. Flow 05｜Moment Detail

```text
Moment
│
├── What happened
│
├── Media
│
├── When
│
├── Context
│   ├── People
│   ├── Place
│   └── Goal
│
├── Why it matters
│
└── AI Insight
```

---

# 19. Flow 06｜Evening

晚上用户进入 Today：

系统状态：

```text
Day in progress
      ↓
After reasonable evening time
      ↓
Show "End My Day"
```

不要强制弹窗。

---

# 20. End My Day

点击：

> End My Day

进入 Reflection。

---

# 21. Reflection Flow

```text
How was today?
      ↓
Mood
      ↓
What stayed with you?
      ↓
Free text
      ↓
What did you learn?
      ↓
Free text
      ↓
Review My Day
```

所有问题都可以 Skip。

---

# 22. AI Daily Reflection

AI 读取：

```text
Today's Plan
+
Completion
+
Moments
+
Mood
+
Energy
+
Reflection
+
Relevant Memories
```

输出：

```text
Your Day
    ↓
What Stood Out
    ↓
Your Insight
    ↓
Your Growth
    ↓
Tomorrow
```

---

# 23. Daily Insight 页面

## Hero

> Today, you...

一句话。

## Your Day

客观总结。

## What Stood Out

1～3 个重点。

## Your Insight

最多 1～2 个观察。

## Your Growth

只有有证据才显示。

## Tomorrow

一个建议。

原则：

> **宁少勿滥。**

---

# 24. Day Card

Reflection 完成后生成。

```text
┌─────────────────────────────┐
│ September 7, 2026           │
│                             │
│ Good · High Energy          │
│                             │
│ Today's Focus               │
│ ...                         │
│                             │
│ One Moment                  │
│ ...                         │
│                             │
│ One Thought                 │
│ ...                         │
│                             │
│ AI Insight                  │
│ ...                         │
└─────────────────────────────┘
```

---

# 25. Flow 07｜Memory

AI 在以下时机判断是否值得形成 Memory：

- Onboarding
- Quick Capture 后
- Moment 创建后
- Evening Reflection 后
- AI 对话中

---

# 26. Memory Decision Flow

```text
New Information
      ↓
Is it potentially long-term?
      ↓
   ┌──┴──┐
   No    Yes
   ↓      ↓
  End   Is it reliable?
            ↓
       ┌────┴────┐
       No        Yes
       ↓          ↓
      End     Save as candidate
                    ↓
             User Confirmation
                    ↓
                 Memory
```

---

# 27. Memory UX

不要频繁提示：

> “AI 已经为你生成 17 条 Memory。”

而应该自然出现：

> **I remember this.**

例如：

> 你最近一直在思考职业方向。

[Keep] [Forget]

---

# 28. Flow 08｜Me

进入 Me：

```text
Me
│
├── Identity
│
├── Becoming
│
├── Goals
│
├── Memory
│
└── Insights
```

---

# 29. Me 首页

核心 Hero：

> **Who am I?**

下面：

### Right Now

当前状态。

### What Matters

近期重要事情。

### What I'm Becoming

当前成长方向。

### Goals

当前目标。

### AI Knows

AI 记住的内容。

---

# 30. Goal Flow

```text
Me
 ↓
Goals
 ↓
+ New Goal
 ↓
What do you want?
 ↓
Why does it matter?
 ↓
Who do you want to become?
 ↓
What's the next step?
 ↓
Create Goal
```

---

# 31. Goal Detail

```text
Goal
│
├── Why
├── Desired Identity
├── Outcome
├── Progress
├── Next Actions
├── Evidence
└── Reflection
```

核心不是：

> 完成多少%。

而是：

> 这个目标是否正在推动我成为想成为的人？

---

# 32. Flow 09｜AI Butler Conversation

用户点击 ✦：

```text
Current Page Context
      +
User Message
      +
Relevant Memory
      +
Recent State
      ↓
AI Response
```

---

# 33. AI Butler 快捷问题

Today：

- Plan my day
- Help me prioritize
- What should I focus on?
- Review yesterday

Moments：

- What do you think this means?
- Help me organize this
- Is this worth remembering?

Me：

- What do you know about me?
- What patterns do you see?
- What am I becoming?
- What am I avoiding?

---

# 34. AI 对话中的证据链

当 AI 做长期判断时：

```text
Claim
↓
Why I think this
↓
Evidence
↓
User response
```

例如：

> I’ve noticed you’ve been thinking about career direction quite often.

展开：

> I found 4 related entries in the last 14 days.

用户可以：

- That feels right
- Not really
- Tell me more

---

# 35. Flow 10｜历史回顾

MVP 可以提供最简单的：

> Browse Moments

用户可以：

- 按日期查看
- 查看 Day Card
- 查看 Moment
- 点击相关 Memory

P1 再做：

- 30 Day Review
- 90 Day Review
- Year Review

---

# 36. 页面之间的关键连接

这是整个产品最重要的结构。

## Day → Moment

今天发生的事情进入生活记录。

## Moment → Person

一件事情与某个人有关。

## Moment → Goal

一件事情与一个目标有关。

## Moment → Memory

重要经历沉淀为长期记忆。

## Memory → AI

AI 后续理解用户。

## Goal → Growth

目标行动产生成长证据。

## Day → Insight

一天产生一个观察。

## Insight → Becoming

长期 Insight 最终形成：

> Who I Am Becoming

---

# 37. Global Create System

产品应该只有一个主要：

> **Create / Capture**

而不是每个页面都有不同的“新增”。

入口：

> + Capture

AI 自动判断：

```text
用户输入
↓
Moment?
Thought?
Goal?
Memory?
Person?
```

然后给建议。

---

# 38. Back Navigation

页面之间不要产生迷宫。

任何 Detail 页面：

> ← Back

同时允许：

> Related

例如 Moment Detail：

```text
Related
├── Sarah
├── Career Goal
├── Beijing
└── September 2026
```

---

# 39. Search

MVP 可以只做简单全局搜索：

> Search your life

搜索：

- Moments
- Memories
- Goals

P1：

- People
- Places
- Explore
- Semantic Search

---

# 40. Global AI Search

最终用户可以直接问：

> “我去年为什么离开那家公司？”

AI：

1. 搜索相关 Moments
2. 搜索相关 Memories
3. 找到时间范围
4. 汇总
5. 区分事实与解释

这是未来非常重要的价值。

---

# 41. Error / Empty / Loading Flow

## AI Loading

> Thinking about this…

## Memory Loading

> Looking through what I remember…

## Empty Moments

> Nothing here yet.
>
> Your life is still unfolding.

## Empty Goals

> What do you want to become?

## AI Error

> I couldn't finish that just now.
>
> Your records are safe.

---

# 42. State Machine｜核心状态

## Day

```text
Not Started
↓
Started
↓
In Progress
↓
Ready to Reflect
↓
Reflected
```

## Task

```text
Planned
↓
In Progress
↓
Completed

Planned
↓
Skipped
```

## Moment

```text
Draft
↓
Saved
↓
Enriched
↓
Linked
```

## Memory

```text
Candidate
↓
Confirmed
↓
Active
↓
Updated / Forgotten
```

## Goal

```text
Draft
↓
Active
↓
Paused / Completed / Abandoned
```

---

# 43. Critical User Flows

MVP 必须重点验证以下 5 条。

## Flow A：第一次使用

```text
Welcome
→ Onboarding
→ Today
```

目标：

> 用户理解产品是什么。

---

## Flow B：第一次规划

```text
Today
→ State
→ AI Plan
→ Accept/Edit
```

目标：

> 用户第一次感受到 AI 了解自己的当前状态。

---

## Flow C：第一次记录

```text
Capture
→ Write
→ Save
```

目标：

> 5 秒以内完成。

---

## Flow D：第一次回顾

```text
End My Day
→ Reflection
→ AI Insight
→ Day Card
```

目标：

> 用户感受到“AI 不只是总结，而是在理解我”。

---

## Flow E：第二天

```text
Open Today
→ Yesterday
→ Today
```

目标：

> 用户明显感受到连续性。

---

# 44. UX Friction Budget｜摩擦预算

产品需要明确控制输入成本。

## Quick Capture

≤ 5 秒

## 查看 Today

≤ 5 秒理解状态

## Morning Plan

≤ 30 秒完成确认

## 创建 Moment

≤ 30 秒

## Evening Reflection

建议：

> 1～3 分钟。

不要要求：

> 10 分钟每日复盘。

---

# 45. AI Friction Budget

AI 不应该让用户：

- 频繁确认
- 频繁选择
- 频繁纠正
- 频繁填写上下文

原则：

> **AI 应减少操作，而不是增加操作。**

---

# 46. Mobile Flow

移动端优先保证：

```text
Open
 ↓
Today
 ↓
Capture
 ↓
Moments
 ↓
Reflect
```

底部导航：

```text
Today    Moments    +    Me    ✦
```

其中：

> + = Capture

---

# 47. Desktop Flow

Desktop 可以更加沉浸：

```text
Sidebar
+
Large Content Canvas
+
Floating AI
```

适合：

- Timeline
- Journal
- Photo
- Reflection
- Life review

---

# 48. IA 设计原则总结

## 原则 1

> 记录入口只有一个。

## 原则 2

> Moment 是生活的基本单位。

## 原则 3

> Day 是时间容器。

## 原则 4

> Memory 是长期理解层。

## 原则 5

> Goal 是未来方向。

## 原则 6

> Insight 是 AI 对变化的观察。

## 原则 7

> Becoming 是最终结果。

---

# 49. 最终产品关系图

```text
                         ┌──────────────┐
                         │     User     │
                         └──────┬───────┘
                                │
                ┌───────────────┼────────────────┐
                │               │                │
                ▼               ▼                ▼
             Today           Moments             Me
                │               │                │
                │               │          ┌─────┴─────┐
                │               │          │           │
                ▼               ▼          ▼           ▼
               Day           Moment       Goals     Identity
                │               │          │           │
                │          ┌────┼────┐     │           │
                │          ▼    ▼    ▼     ▼           │
                │       Person Place Media Evidence     │
                │                              │        │
                └──────────────┐               ▼        │
                               ▼             Growth      │
                            Memory              │        │
                               │                ▼        │
                               ▼            Becoming ◄──┘
                            Insight
                               │
                               ▼
                          AI Understanding
                               │
                               └──────────────► User
```

---

# 50. 下一阶段：Wireframe V1.0

IA 和 Flow 完成后，下一步不应该马上做所有页面。

先只画 4 个页面：

## 01 Today

证明：

> 一天怎么开始、进行、结束。

## 02 Moments

证明：

> 生活怎么被留下。

## 03 Me

证明：

> 长期自我如何呈现。

## 04 AI Butler

证明：

> AI 如何真正参与，而不是变成聊天窗口。

---

# 51. Wireframe 的设计目标

下一阶段需要把每个页面继续拆成：

```text
Page
↓
Section
↓
Component
↓
Interaction
↓
State
↓
Animation
↓
AI Behavior
↓
Data
```

最终做到：

> **任何一个页面，设计师可以画；产品经理可以验收；Coding Agent 可以实现。**

---

# 52. 下一步原则

不要一次设计整个网站。

按照：

> **Today → Moments → Me → AI Butler**

依次设计。

先把最核心的“一天”做到真正有生命力。

因为如果：

> Today 不好用，

那么：

> Journey、People、Explore、Public Me 再漂亮，都只是一个漂亮的数据库。

---

# Final

> **IA 决定信息怎么流动。**
>
> **User Flow 决定用户怎么生活。**
>
> **而这个产品真正要设计的，不是页面，而是用户与自己相处的方式。**
