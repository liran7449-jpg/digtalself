# Moment 交互与架构优化需求 V1.0

## 1. 需求背景

当前 Moment 的创建、展示和编辑链路存在一定割裂。

目前用户主要通过 Today 页面中的「现在在想什么？」进行文字记录，但图片、地点、人物、话题等信息需要进入 Moment 编辑/详情页面后才能补充。

这会导致一次完整的生活记录被拆分成多个操作步骤，不符合「随时记录当下」的产品定位。

同时，目前点击已有 Moment 内容后，容易直接进入带有编辑能力的页面，并出现图片上传等编辑操作，使「查看 Moment」与「编辑 Moment」的职责混淆。

因此需要重新梳理 Moment 的创建、展示与编辑链路。

---

# 2. 核心设计原则

### 2.1 Moment 应该是一个完整的记录单元

用户在记录当下时，应能够在同一个入口中完成：

- 文字
- 图片
- 地点
- 人物
- 话题

等核心内容的记录。

不应要求用户：

> 先创建文字 → 再进入详情 → 再补充其他内容。

---

### 2.2 创建入口应该形成完整闭环

Today 页面中的：

> 「现在在想什么？」

应作为统一的 Moment Composer 入口。

用户可以在这里直接完成：

```text
文字
+
图片
+
地点
+
人物
+
话题
```

然后一次性创建 Moment。

---

### 2.3 Moment Feed 应直接展示内容

如果 Moment 包含图片：

> 图片应该直接在 Moments 时间流中展示。

用户不需要点击 Moment 才能看到图片。

Moments 应该是：

> 一个能够直接浏览生活内容的时间流。

而不是：

> 一个需要不断点击详情才能查看内容的数据库列表。

---

# 3. Moment 三种状态必须明确区分

## 3.1 Composer

职责：

> 创建新的 Moment。

入口：

```text
Today → 现在在想什么？
```

支持：

```text
Text
Image
Place
Person
Topic
```

未来可以扩展：

```text
Video
Voice
Mood
```

---

## 3.2 Feed

职责：

> 浏览已经记录的 Moments。

要求：

- 文字直接展示
- 图片直接展示
- 多图直接展示
- 人物信息直接展示
- 地点信息直接展示
- 话题信息直接展示

不应要求用户进入详情页才能看到 Moment 的主要内容。

---

## 3.3 Detail / Edit

职责：

> 查看完整 Moment，以及在用户明确需要时进行编辑。

进入 Detail 不应该自动进入编辑状态。

默认状态：

> View Mode

只有用户主动点击：

> Edit

才进入：

> Edit Mode

---

# 4. 禁止的交互

禁止：

```text
点击 Moment
↓
自动进入编辑状态
↓
出现图片上传等编辑工具
```

禁止：

```text
创建文字 Moment
↓
必须进入详情页
↓
才能添加图片 / 人物 / 地点
```

禁止：

```text
Moment Feed
↓
只展示文字摘要
↓
图片必须点击后才能查看
```

---

# 5. 推荐交互模型

### 创建

```text
Today

现在在想什么？

[文字输入]

＋ 图片    ＋ 地点    ＋ 人物    ＋ 话题

                    [记下]

                     ↓

                  Moment
```

---

### 浏览

```text
Moments

20:35

[图片]

今天突然想到了……

PERSON · XXX
PLACE · 北京

THOUGHT
```

---

### 查看

点击 Moment：

```text
Moment Detail

完整内容

[图片]

人物
地点
话题
时间

                    [编辑]
```

默认仍然是 View Mode。

---

### 编辑

用户主动点击：

```text
编辑
```

之后才出现：

```text
文字编辑
图片管理
人物
地点
话题
删除
保存
```

---

# 6. 数据模型原则

Moment 不应该被设计成「文字记录」。

Moment 应该是一个可以承载多种内容的核心生活对象：

```text
Moment
├── Text
├── Media
├── People
├── Place
├── Topics
├── CreatedAt
└── Metadata
```

其中：

```text
Media
├── Image
├── Video
└── Audio
```

未来可以继续扩展。

---

# 7. 图片展示原则

图片属于 Moment 内容的一部分，而不是隐藏在编辑页中的附属数据。

如果 Moment 包含图片：

> Feed 中直接展示。

展示方式根据图片数量自适应：

- 1 张：大图
- 2 张：双列
- 3 张及以上：Gallery / Masonry
- 无图片：纯文字布局

不要所有 Moment 强制使用相同的图片容器。

---

# 8. 架构目标

最终形成：

```text
Today
  ↓
Moment Composer
  ↓
Create Moment
  ↓
Moments Feed
  ↓
View Moment
  ↓
Edit（用户主动触发）
```

而不是：

```text
Today
  ↓
Create Text
  ↓
Open Edit
  ↓
Add Image
  ↓
Add Metadata
```

---

# 9. 验收标准

### 创建

- [ ] Today 可以直接创建 Moment
- [ ] 创建时可以添加图片
- [ ] 创建时可以添加地点
- [ ] 创建时可以关联人物
- [ ] 创建时可以添加话题
- [ ] 可以只记录文字
- [ ] 可以只上传图片
- [ ] 可以文字 + 图片组合记录

### 展示

- [ ] Moments 中图片直接外显
- [ ] 不需要进入详情才能看到图片
- [ ] 多图有合理展示方式
- [ ] 文字与图片属于同一个 Moment
- [ ] 人物 / 地点 / 话题可以作为 Moment 上下文展示

### 查看 / 编辑

- [ ] 点击 Moment 默认进入 View Mode
- [ ] 不自动出现图片上传
- [ ] 不自动进入编辑状态
- [ ] 用户主动点击 Edit 后才出现编辑工具
- [ ] 编辑能力与查看能力明确分离

### 架构

- [ ] Moment Composer 与 Moment Feed 解耦
- [ ] Moment View 与 Moment Edit 解耦
- [ ] Media 与 Moment 解耦
- [ ] Person / Place / Topic 与 Moment 保持关联关系
- [ ] 不通过重复数据实现关联
"""

print("文档内容已整理完成。")
</write>