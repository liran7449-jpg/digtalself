# Today 项目开发规范
## Architecture + Vibe Coding Safety

> 项目：Today / Personal Knowledge Graph / Digital Self
>
> 本文档统一约束：架构、数据、Git、Vibe Coding Agent、测试、发布与恢复。
>
> **最高原则：用户数据安全 > 项目可恢复性 > 功能正确性 > 架构稳定性 > 代码质量 > 开发速度。**

---

## 0. AI Agent 强制规则

任何 AI Agent 开始任务前，必须读取本文件。

涉及以下任一事项时，必须遵守全部规范：

- 新增 / 修改功能
- 数据模型
- 数据库 / Migration
- API / Service / Repository
- 媒体存储
- 权限 / 分享
- 配置 / 环境
- Git
- 部署
- 大规模重构

### 不确定时，默认按高风险处理

不得自行假设：

- “这些只是开发数据”
- “旧数据可以不要”
- “重建数据库比较简单”
- “直接 reset 没关系”
- “这是测试环境，不重要”

---

# 1. 项目性质：真实个人数据系统

Today 不是单纯 Demo。

以下数据均视为用户真实资产：

- Moment
- Diary
- Reflection
- Photo
- Video
- Person
- Place
- Topic
- Goal
- Memory
- Journey
- Growth Evidence

特别是 Moment / Photo / Reflection：

> **不得因为开发方便而删除、清空、覆盖或重建。**

---

# 2. 分层架构：前端永不直接操作数据库

统一链路：

```text
Web / iOS / Android / 小程序
        ↓
API
        ↓
Service
        ↓
Repository
        ↓
Database
```

规则：

- 前端不得直接读写数据库。
- 前端不得直接调用 ORM。
- 数据访问统一通过 API → Service → Repository。
- 新客户端只是增加调用方，不是重新实现业务逻辑。

---

# 3. 模块之间通过 Service 接口交流

禁止跨模块直接访问其他模块的数据。

例如：

```text
People
   ↓
MomentService
   ↓
MomentRepository
   ↓
Database
```

每个领域建立明确 Service 出口，例如：

```text
MomentService
├── createMoment
├── getMoment
├── updateMoment
├── deleteMoment
├── linkPerson
├── linkPlace
├── linkGoal
└── saveAsMemory
```

规则：

- 每个领域有明确的业务 Service 出口。
- 模块之间只认 Service 接口，不认数据库结构。
- People 不得直接查询 Moment 表。
- Today 不得直接操作 Goal 数据库。
- UI 不得直接访问 Repository。

---

# 4. 数据模型优先：Today 是 Personal Knowledge Graph

产品本质不是页面集合，而是个人知识 / 人生关系图谱。

不要把关系写死在 Moment：

```text
✗ Moment {
    person_id,
    goal_id,
    place_id
}
```

应使用关联表：

```text
Moment
 ├── MomentPerson
 ├── MomentPlace
 ├── MomentGoal
 ├── MomentTopic
 └── MomentMemory
```

核心原则：

> **一件事情只记录一次，但可以在整个数字世界里流动。**

---

# 5. 媒体与业务数据分离

数据库不存图片 / 视频二进制，只存元数据：

```text
Media {
  id
  user_id
  storage_key
  type
  width
  height
  created_at
}
```

文件进入 Object Storage：

```text
/photos/{user_id}/{yyyy}/{MM}/{filename}
```

Web / App / 小程序统一通过 Media / Storage Service 访问。

---

# 6. Privacy By Design

Today 可能存储：

- 私密照片
- 日记
- 感情记录
- 家庭信息
- 工作信息
- 生活轨迹
- 对人的评价
- 私密想法

因此：

> **知道 URL ≠ 有权限访问。**

禁止仅凭永久公开 URL 访问私密内容。

正确方式：

```text
用户请求
 ↓
Backend
 ↓
身份认证
 ↓
权限判断
 ↓
生成临时 / 受控资源地址
 ↓
返回
```

分享链接同样必须经过权限控制。

---

# 7. 配置全部外置，禁止 Hard Code

禁止在代码中写死：

- Database URL
- API URL
- API Key
- AI Key
- Storage 配置
- Environment
- Feature Flag
- 权限配置

统一使用 `.env` / 配置中心 / 环境变量。

例如：

```text
DATABASE_URL
STORAGE_URL
AI_API_KEY
APP_ENV
PUBLIC_BASE_URL
```

规则：

- 密钥不得进入前端。
- `.env` 不得提交 Git。
- 必须维护 `.env.example`。
- 不同环境使用不同配置。

---

# 8. 新功能必须模块化

新增功能必须尽可能自包含：

```text
features/
  goals/
    components/
    services/
    hooks/
    types/
    utils/
```

后端：

```text
modules/
  goals/
    GoalService
    GoalRepository
    GoalTypes
```

目标：

> **功能应该可以被删除，而不导致整个系统崩溃。**

开发前必须问：

> “如果未来删除这个功能，需要修改多少其他模块？”

---

# 9. 前端按领域组织

禁止把所有组件堆进扁平 `components/`。

推荐：

```text
features/
├── today/
├── moments/
├── me/
├── goals/
├── people/
├── journey/
├── memory/
└── sharing/
```

跨模块共用基础组件进入 Design System。

---

# 10. Design System

统一管理：

- Typography
- Color
- Spacing
- Button
- Input
- Modal
- Drawer
- Timeline
- Moment
- Photo
- Section
- Navigation
- Empty State

规则：

- 新页面优先复用已有组件。
- 禁止每个模块重新设计 Button / Input。
- 禁止复制相似组件形成 `xxx-final-2` 垃圾场。

视觉目标：

> Quiet Luxury + Personal + Alive  
> 克制、高级、有生命力。

避免变成 SaaS Dashboard / 卡片堆。

---

# 11. API 规范

客户端统一使用版本化 API：

```text
GET    /api/v1/today
GET    /api/v1/moments
POST   /api/v1/moments
GET    /api/v1/moments/:id
PATCH  /api/v1/moments/:id
DELETE /api/v1/moments/:id

GET    /api/v1/goals
POST   /api/v1/goals

GET    /api/v1/me
```

规则：

- 必须带 `/v1/`。
- 新 API 遵循 RESTful 风格。
- 不得随意创造另一套 API 命名体系。
- Web / App / 小程序共享同一业务 API。

---

# 12. 数据库必须通过 Migration

任何 Schema 变化必须使用 Migration。

例如：

```text
Migration 001 Create users
Migration 002 Create moments
Migration 003 Create media
Migration 004 Add visibility
Migration 005 Add moment_people
```

禁止：

- 手工直接改生产数据库结构
- Agent 直接修改线上 Schema
- 删除旧 migration
- 修改已经执行过的 migration

Migration 原则：

> **Append-only。**

---

# 13. 数据库迁移规范

任何：

```text
SQLite → PostgreSQL
Local → Railway
Database A → Database B
```

必须：

```text
现状检查
 ↓
确认数据源
 ↓
备份
 ↓
验证备份
 ↓
建立 Migration / Migration Script
 ↓
执行迁移
 ↓
数据完整性验证
 ↓
功能验证
 ↓
回归测试
 ↓
用户确认
```

禁止默认采用：

```text
旧数据库
 ↓
RESET / DROP
 ↓
新建数据库
```

---

# 14. 数据库破坏性操作：必须询问用户

以下操作必须先获得用户明确确认：

```text
DROP DATABASE
DROP TABLE
TRUNCATE
DELETE 大量数据
RESET DATABASE
重建数据库
覆盖数据库文件
删除 migration
修改生产数据
覆盖线上数据库
```

询问必须说明：

```text
这是一个高风险操作，可能造成不可逆的数据丢失。

将执行：
xxx

可能影响：
xxx

当前备份：
有 / 无

恢复方案：
xxx

是否确认执行？
```

没有明确确认：

> **不得执行。**

---

# 15. 不得自行判断“数据是否重要”

如果无法确定：

> **默认认为数据重要。**

尤其：

```text
Moment
Photo
Reflection
Diary
Goal
Person
Memory
```

禁止：

> “这是开发阶段，旧数据可以放弃。”

---

# 16. 数据恢复与代码回退是两个问题

如果原始数据库文件仍存在：

> 优先采用“只读读取 → 转换 → 导入”的方式恢复。

例如：

```text
旧 SQLite 文件
      ↓
只读读取
      ↓
转换
      ↓
写入 PostgreSQL
```

不要求为了导出旧数据而先回退整个代码仓库。

原则：

> **先保护原始数据，再恢复代码 / 数据库。**

---

# 17. ORM / Database Driver 迁移禁止全局替换

例如 SQLite 使用：

```text
.all()
.get()
.run()
```

迁移到 PostgreSQL / 其他 ORM 时：

**禁止直接全局字符串替换。**

例如禁止：

```text
sed replace .all()
sed replace .get()
```

必须：

1. 确认新 ORM API
2. 检查具体 Repository
3. 修改一个 Repository
4. Type Check
5. Unit Test
6. Integration Test
7. 回归测试
8. 再修改其他 Repository

原因：

> API 名称相似，不代表语义完全一致。

---

# 18. 测试规范：能启动 ≠ 测试通过

以下不能证明功能正常：

```text
npm run dev 成功
curl 返回 200
页面可以打开
```

这些最多说明应用没有完全启动失败。

完整测试必须验证：

```text
页面
 ↓
API
 ↓
Service
 ↓
Repository
 ↓
Database
 ↓
返回页面
```

并验证真实业务行为。

---

# 19. 功能测试规范

Moment 至少测试：

```text
创建文字 Moment
 ↓
保存
 ↓
Feed 显示
 ↓
刷新页面
 ↓
仍然存在
```

带图片：

```text
创建 Moment
 ↓
上传图片
 ↓
保存
 ↓
Feed 显示图片
 ↓
刷新
 ↓
图片仍存在
```

关联：

```text
Moment
 ↓
Person / Place / Topic / Goal
 ↓
刷新
 ↓
关联仍存在
```

---

# 20. 回归测试规范

修改底层模块时必须回归依赖它的功能。

例如修改：

```text
MediaRepository
```

至少检查：

- Today
- Moments
- Moment Detail
- Moment Composer
- 图片上传
- 图片显示

原则：

> **修改底层基础设施，不能只测试修改的文件。**

---

# 21. 测试失败：禁止创建正式版本

存在以下任一项时：

- TypeScript error
- Build error
- Test failure
- Runtime error
- Console error
- 数据异常
- 图片异常
- 数据关联异常

则：

> **禁止创建正式版本 / Tag。**

禁止：

```text
先 commit
之后再修
```

正式版本必须代表一个经过验证、可以恢复的稳定状态。

---

# 22. Git 是安全网

推荐：

```text
main
│
├── feature/goals
├── feature/me-v1
├── feature/cloud
└── fix/database
```

规则：

- `main` 保持稳定。
- 大功能使用 feature branch。
- Bug 使用 fix branch。
- 不鼓励 Agent 直接在 main 上进行大规模开发。

---

# 23. Git 高风险操作：必须询问

以下必须先获得用户明确确认：

```text
git reset --hard
git clean
git push --force
git push --force-with-lease
git rebase
git checkout -- <file>
git restore <file>
删除 branch
删除 tag
修改共享历史
```

如果远程已经存在共享 commit：

> 优先考虑 `git revert`，而不是重写历史。

---

# 24. 开发任务开始前：Pre-flight Check

每次任务开始前必须检查：

```text
git status
当前 branch
最近 commit
remote
数据库状态
是否存在未提交修改
是否存在 migration
当前应用是否正常
```

并输出：

```text
【当前状态】

Branch:
Working Tree:
Remote:
Database:
Last Stable Version:
Potential Risk:
```

如果状态不清楚：

> **先诊断，不开始修改。**

---

# 25. 开发前必须定义任务边界

每次任务开始前明确：

```text
【Goal】
这次只解决什么？

【Non-goals】
这次明确不做什么？

【Files】
预计修改哪些文件？

【Database】
是否修改数据库？

【Data】
是否涉及真实数据？

【Risk】
低 / 中 / 高

【Test】
完成后如何验证？
```

---

# 26. 最小修改原则

如果用户要求：

> “修复 MediaRepository 错误”

不得顺便：

- 重构数据库
- 修改 UI
- 修改认证
- 修改部署
- 迁移数据库
- 删除旧代码
- 重构整个项目

除非用户明确要求。

原则：

> **解决当前问题所需的最小修改。**

---

# 27. 发现架构问题：先报告，不要顺手重构

如果发现：

> “现在架构不合理，最好全部重构。”

必须停止扩大范围。

先报告：

```text
【发现的问题】
xxx

【当前影响】
xxx

【建议方案】
xxx

【影响范围】
数据库 / API / UI / Git / 部署

【数据风险】
xxx

【建议】
先讨论方案，不立即执行。
```

---

# 28. 环境规范

至少：

```text
Local
Staging
Production
```

推荐：

```text
Local
 ↓
Staging
 ↓
Production
```

禁止在 Production 上直接进行 Vibe Coding。

---

# 29. 真实数据与环境隔离

建议：

```text
Local
  ↓
测试数据

Staging
  ↓
测试数据

Production
  ↓
真实用户数据
```

不要把 Production 数据当作开发测试数据。

---

# 30. 数据备份规范

备份必须满足：

```text
存在
+
可读取
+
能够恢复
```

至少验证：

```text
backup file exists
database opens
record count matches
```

不能只说：

> “已经备份。”

---

# 31. 数据迁移验证

迁移前后必须比较：

```text
Moment
Media
Person
Place
Topic
Goal
Reflection
Memory
```

例如：

```text
SQLite
Moment: 128
Media: 86

PostgreSQL
Moment: 128
Media: 86

Result:
PASS
```

不能只验证：

```text
数据库连接成功
```

---

# 32. Export My Data

用户数据必须能够整体导出：

```text
my-digital-life/
├── moments/
├── photos/
├── videos/
├── people/
├── goals/
├── memories/
└── profile.json
```

支持：

- JSON
- Markdown
- Photos
- Videos

原则：

> 用户的数字人生不能被某一个数据库、云服务或技术栈锁死。

---

# 33. 稳定 ID

所有核心对象：

```text
User
Moment
Person
Goal
Memory
Media
```

使用：

```text
UUID / ULID
```

禁止使用自增数字作为对外标识。

---

# 34. AI 数据修改权限

AI 可以：

- 建议
- 总结
- 分类
- 建议关联
- 生成 Insight
- 发现模式

AI 不得未经用户确认：

- 修改 Moment 原文
- 删除 Moment
- 删除照片
- 修改 Goal
- 修改 Goal 状态
- 修改重要关系
- 覆盖 Reflection

原则：

> **AI 理解用户，但不能擅自改写用户的人生记录。**

---

# 35. Commit 规范

Commit 必须代表一个已经验证的状态。

推荐：

```text
feat: complete Goals V1
fix: restore media repository compatibility
feat: complete mobile capture flow
```

避免用以下作为稳定版本：

```text
test
wip
temporary
try
maybe fixed
```

---

# 36. Version / Tag 规范

创建版本必须满足：

- 功能完成
- Type Check PASS
- Build PASS
- Tests PASS
- 关键页面 PASS
- 核心数据正常
- 无已知严重错误
- Git diff 已检查
- Working tree 状态清晰
- 用户确认可以作为稳定版本

流程：

```text
开发
 ↓
测试
 ↓
回归测试
 ↓
检查 diff
 ↓
用户确认
 ↓
Commit
 ↓
Push
 ↓
Tag
```

禁止：

```text
开发
 ↓
Commit
 ↓
再测试
```

---

# 37. 版本记录

每个稳定版本必须知道：

```text
Version
Commit
Branch
Date
主要变更
数据库状态
Migration
测试结果
数据验证结果
```

---

# 38. Emergency Protocol

如果出现：

- 数据丢失
- 数据异常
- 数据库异常
- Git 历史异常
- 线上异常
- 大规模功能崩溃

立即：

```text
STOP ALL DEVELOPMENT
```

然后：

```text
1. 不继续修改代码
2. 不运行新的 migration
3. 不 reset 数据库
4. 不删除文件
5. 不 force push
6. 不创建版本
7. 保留当前现场
8. 检查数据库
9. 检查 Git
10. 检查备份
11. 制定恢复方案
12. 用户确认
13. 再恢复
14. 恢复后完整测试
```

---

# 39. 本项目核心开发循环

统一采用：

```text
理解
 ↓
检查现状
 ↓
定义边界
 ↓
评估风险
 ↓
备份（如有数据风险）
 ↓
建立分支
 ↓
最小实现
 ↓
Type Check
 ↓
Build
 ↓
Unit Test
 ↓
Integration Test
 ↓
Manual Test
 ↓
数据验证
 ↓
Git Diff
 ↓
用户确认
 ↓
Commit
 ↓
Push
 ↓
Tag
```

---

# 40. 绝对禁止

Agent 不得：

- 未询问就删除用户数据
- 未备份就进行高风险迁移
- 未确认就 reset 数据库
- 未确认就覆盖 Production
- 未确认就 force push
- 未测试就创建正式版本
- 用 `curl 200` 代替完整功能测试
- 用全局字符串替换代替数据库 API 迁移
- 自行判断旧数据不重要
- 为修一个 bug 顺手重构整个系统
- 修改用户原始人生记录
- 把真实数据当测试数据
- 在任务边界之外扩大修改范围

---

# 41. 每次交付前 DoD

## Architecture

- [ ] 前端没有直接操作数据库
- [ ] 跨模块通过 Service
- [ ] 数据关系没有被写死
- [ ] 核心对象使用 UUID / ULID
- [ ] 新功能模块化
- [ ] API 使用 `/v1/`
- [ ] Schema 变化通过 Migration

## Data

- [ ] 没有未授权删除数据
- [ ] 数据迁移前已备份
- [ ] 备份已验证
- [ ] 核心记录数量已验证
- [ ] Media 已验证
- [ ] 关联关系已验证

## Security

- [ ] 没有永久公开私密资源 URL
- [ ] 权限经过 Backend 校验
- [ ] 没有前端密钥
- [ ] 没有提交 `.env`

## Testing

- [ ] Type Check PASS
- [ ] Build PASS
- [ ] Unit Test PASS
- [ ] Integration Test PASS
- [ ] Manual Test PASS
- [ ] Regression Test PASS
- [ ] 没有已知严重错误

## Git

- [ ] 当前 branch 正确
- [ ] Git diff 已检查
- [ ] 没有意外文件
- [ ] 没有危险操作未确认
- [ ] 稳定版本才创建 Tag
- [ ] 已 Push 到远程

---

# 42. Agent 标准任务报告

```text
【任务】
xxx

【本次未做】
xxx

【完成】
- xxx
- xxx

【修改文件】
- xxx
- xxx

【数据库】
无修改 / Migration xxx / 已迁移

【数据】
备份：PASS
数据验证：PASS
Moment：xxx
Media：xxx

【测试】
TypeCheck：PASS
Build：PASS
Unit Test：PASS
Integration Test：PASS
Manual Test：PASS
Regression：PASS

【Git】
Branch：xxx
Commit：xxx
Working Tree：clean

【版本】
未创建 / v0.x.x

【已知问题】
无 / xxx
```

---

# 43. 最终原则

Today 记录的不是普通 CRUD 数据。

它记录的是：

> **一个人真实走过的人生。**

因此：

> **不要为了让代码更干净，而牺牲已经存在的人生记录。**

> **不要为了让开发更快，而跳过备份和测试。**

> **不要让 Agent 替用户决定数据是否重要。**

> **不要让“应该没问题”代替验证。**

最终目标不是：

> “把功能做出来。”

而是：

> **“在安全、可恢复、可验证的前提下，把产品持续做出来。”**
