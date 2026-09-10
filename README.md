# Digital Self - 数字人生

一个专注于记录、反思和成长的个人生活管理应用。

## 🚀 快速开始

### 安装依赖
```bash
npm install
```

### 开发模式
```bash
npm run dev
```
访问 http://localhost:3000

### 构建生产版本
```bash
npm run build
npm start
```

### 运行测试
```bash
npm test
```

## 📁 项目结构

```
ranlee_副本/
├── src/
│   ├── app/              # Next.js 页面路由
│   │   ├── today/        # Today 页面（日程 + 记录）
│   │   ├── moments/      # Moments 页面
│   │   ├── days/         # 历史日期视图
│   │   └── calendar/     # 月历视图
│   ├── components/       # React 组件
│   │   ├── ui/          # 基础 UI 组件
│   │   ├── layout/      # 布局组件
│   │   ├── state/       # 状态相关组件
│   │   ├── calendar/    # 日历组件
│   │   └── day/         # 日视图组件
│   ├── domain/          # 领域模型和业务逻辑
│   ├── repositories/    # 数据访问层
│   └── lib/            # 工具函数
├── data/               # SQLite 数据库
├── docs/               # 项目文档
├── public/             # 静态资源
└── drizzle/            # 数据库迁移文件
```

## 📚 文档

- [版本管理指南](./版本管理指南.md) - Git 使用和备份策略
- [项目开发规范](./docs/项目开发规范.md) - 代码规范和最佳实践
- [版本说明](./docs/版本说明.md) - 版本更新历史
- [Product Bible](./docs/Product_Bible_v1.0_数字人生.md) - 产品理念和原则
- [PRD](./docs/PRD_V1.0_数字人生.md) - 产品需求文档
- [IA & User Flow](./docs/IA_User_Flow_V1.0_数字人生.md) - 信息架构和用户流程
- [开发需求文档](./docs/090823点开发需求文档.md) - 详细开发需求
- [Moment 优化需求](./docs/Moment%20交互与架构优化需求%20V1.0.md) - Moment 功能优化

## 🛠 技术栈

- **框架**: Next.js 15 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **数据库**: SQLite + Drizzle ORM
- **测试**: Vitest
- **图标**: Lucide React

## 🗄️ 数据库

使用 SQLite 存储数据，数据文件位于 `data/digital-self.db`。

### 运行迁移
```bash
npm run db:push
```

### 查看数据库
```bash
npm run db:studio
```

## 🔐 备份策略

项目配置了自动备份：
- **项目代码**: 每天晚上 10 点自动备份（保留 7 天）
- **数据库**: 每 6 小时自动备份（保留 30 天）
- **备份位置**: `~/Desktop/backups/`

手动备份：
```bash
~/backup-project.sh    # 备份项目代码
~/backup-database.sh   # 备份数据库
```

## 📝 日常工作流

1. **开始工作前拉取最新代码**
   ```bash
   git pull origin main
   ```

2. **修改代码并测试**
   ```bash
   npm run build && npm test
   ```

3. **提交修改**
   ```bash
   git add -A
   git commit -m "描述改动内容"
   ```

4. **推送到 GitHub**
   ```bash
   git push origin main
   ```

详细的版本管理指南见 [版本管理指南.md](./版本管理指南.md)。

## 🌟 核心功能

### Today 页面
- **左栏**: 问候、三色状态、Focus、日程列表
- **右栏**: Quick Capture 输入条、记录流（Moments）
- **Morning Setup**: 早上设定一天的状态和意图
- **Evening Reflection**: 晚上反思和收尾

### Moments 页面
- **记录流**: 按时间线展示所有 Moments
- **Composer**: 富文本输入，支持图片和关联
- **类型**: Thought（想法）、Event（发生）、Feeling（感受）

### Calendar 页面
- **月历视图**: 查看每天的状态和记录
- **快速导航**: 点击日期查看详情

### Day 视图
- 查看历史某一天的完整记录
- 晚间反思内容展示

## 🚨 故障排查

### 端口被占用
```bash
# 查找占用 3000 端口的进程
lsof -ti:3000 | xargs kill -9
```

### 数据库问题
```bash
# 重新生成数据库
npm run db:push
```

### 依赖问题
```bash
# 清理并重新安装
rm -rf node_modules package-lock.json
npm install
```

## 📄 License

Private Project

## 👤 作者

ranli

---

**记住：代码可以重写，数据丢了就真的没了。勤提交，勤备份。** 💾
