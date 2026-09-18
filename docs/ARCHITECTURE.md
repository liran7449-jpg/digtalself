# Digital Self - 项目架构图

## 📊 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                        用户浏览器                              │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   Next.js 应用 (Vercel/Railway)              │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   前端页面   │  │   API 路由    │  │  中间件      │       │
│  │             │  │              │  │              │       │
│  │ /login      │  │ /api/auth/*  │  │ middleware   │       │
│  │ /today      │  │ /api/v1/*    │  │ (认证保护)    │       │
│  │ /moments    │  │ /api/health  │  │              │       │
│  └─────────────┘  └──────────────┘  └──────────────┘       │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              业务逻辑层 (Services)                     │   │
│  │                                                        │   │
│  │  MediaService  │  MomentService  │  AuthService      │   │
│  └──────────────────────────────────────────────────────┘   │
│                         │                                     │
│  ┌──────────────────────┼────────────────────────────────┐  │
│  │            Repository 层 (数据访问)                     │  │
│  │                      │                                 │  │
│  │  ┌──────────────────┴───────────────┐                │  │
│  │  │      Database Adapter             │                │  │
│  │  │  (自动切换 SQLite/PostgreSQL)      │                │  │
│  │  └──────────────┬────────────────────┘                │  │
│  │                 │                                      │  │
│  │  ┌──────────────┴────────────────┐                    │  │
│  │  │     Storage Adapter            │                    │  │
│  │  │  (自动切换 Local/R2)            │                    │  │
│  │  └───────────────────────────────┘                    │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                    │                    │
                    │                    │
        ┌───────────┴───────┐   ┌────────┴─────────┐
        ▼                   ▼   ▼                  ▼
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   SQLite    │  OR  │ PostgreSQL  │      │   Local     │  OR  │    R2       │
│  (本地开发)  │      │  (Railway)  │      │   Files     │      │ (Cloudflare)│
└─────────────┘      └─────────────┘      └─────────────┘      └─────────────┘
     开发环境              生产环境              开发环境             生产环境
```

---

## 🔄 环境切换机制

### 数据库适配（Database Adapter）

```typescript
// src/db/client.ts
const DATABASE_URL = process.env.DATABASE_URL;

if (DATABASE_URL) {
  // 🔵 PostgreSQL (生产环境)
  db = drizzle(postgres(DATABASE_URL));
} else {
  // 🟢 SQLite (本地开发)
  db = drizzle(new Database("./data/digital-self.db"));
}
```

**切换方式：**
```bash
# 本地开发（默认）
npm run dev  # → 使用 SQLite

# 生产环境
DATABASE_URL=postgresql://... npm run dev  # → 使用 PostgreSQL
```

---

### 存储适配（Storage Adapter）

```typescript
// src/lib/storage.ts
const IS_R2 = !!(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY);

if (IS_R2) {
  // 🔵 Cloudflare R2 (生产环境)
  storage = new R2StorageAdapter();
} else {
  // 🟢 本地文件 (开发环境)
  storage = new LocalStorageAdapter();
}
```

**切换方式：**
```bash
# 本地开发（默认）
npm run dev  # → 使用 data/media/

# 生产环境
R2_ACCOUNT_ID=xxx R2_ACCESS_KEY_ID=xxx ... npm run dev  # → 使用 R2
```

---

## 📁 目录结构

```
digital-self/
├── src/
│   ├── app/                      # Next.js 应用
│   │   ├── api/                  # API 路由
│   │   │   ├── auth/             # 认证相关
│   │   │   │   ├── login/        # 登录 API
│   │   │   │   └── logout/       # 登出 API
│   │   │   ├── v1/               # 业务 API
│   │   │   │   ├── moments/      # Moment CRUD
│   │   │   │   ├── media/        # 图片访问
│   │   │   │   └── ...
│   │   │   └── health/           # 健康检查
│   │   ├── login/                # 登录页面
│   │   ├── today/                # Today 视图
│   │   ├── moments/              # Moments 列表
│   │   └── ...
│   │
│   ├── db/                       # 数据库层
│   │   ├── client.ts             # 🔑 数据库适配器（SQLite/PostgreSQL）
│   │   └── schema.ts             # 数据库 Schema
│   │
│   ├── repositories/             # 数据访问层
│   │   ├── types.ts              # Repository 接口
│   │   ├── sqlite/               # SQLite 实现
│   │   └── index.ts              # 统一导出
│   │
│   ├── services/                 # 业务逻辑层
│   │   ├── media-service.ts      # 媒体服务
│   │   └── ...
│   │
│   ├── lib/                      # 工具库
│   │   ├── storage.ts            # 🔑 存储适配器（Local/R2）
│   │   └── session.ts            # 🔑 Session 管理
│   │
│   └── middleware.ts             # 🔑 认证中间件
│
├── scripts/                      # 迁移脚本
│   ├── migrate-to-postgres.ts    # SQLite → PostgreSQL
│   └── migrate-media-to-r2.ts    # Local → R2
│
├── docs/                         # 文档
│   ├── DEPLOYMENT.md             # 部署指南
│   └── AUTH.md                   # 认证配置
│
├── .env.example                  # 环境变量模板
├── drizzle.config.ts             # Drizzle 配置
└── package.json                  # 依赖和脚本
```

---

## 🔑 关键组件关系

### 1. 认证流程

```
用户访问 / 
    │
    ▼
middleware.ts 检查 Session
    │
    ├─ 已登录 ────────────► 允许访问
    │
    └─ 未登录 ────────────► 重定向到 /login
                              │
                              ▼
                        用户输入密码
                              │
                              ▼
                    POST /api/auth/login
                              │
                              ▼
                    验证密码（bcrypt）
                              │
                              ▼
                    设置 Session (iron-session)
                              │
                              ▼
                    重定向到首页
```

### 2. 图片上传流程

```
用户上传图片
    │
    ▼
POST /api/v1/moments
    │
    ▼
MediaService.uploadImage()
    │
    ▼
storage.upload(key, buffer, type)
    │
    ├─ 本地环境 ──► writeFileSync(data/media/...)
    │
    └─ 生产环境 ──► S3Client.send(PutObjectCommand) → R2
                    │
                    ▼
                数据库记录 storageKey
                    │
                    ▼
                返回 Media 对象
```

### 3. 图片访问流程

```
<img src="/api/v1/media/abc123" />
    │
    ▼
GET /api/v1/media/abc123
    │
    ▼
查询数据库获取 storageKey
    │
    ▼
storage.read(storageKey)
    │
    ├─ 本地环境 ──► readFileSync(data/media/...)
    │
    └─ 生产环境 ──► S3Client.send(GetObjectCommand) → R2
                    │
                    ▼
                返回图片 Buffer
```

---

## 🧪 测试流程

### 测试 1：编译通过

```bash
npm run build
# ✓ Compiled successfully
```

✅ **通过标准：** 无 TypeScript 错误，构建成功

---

### 测试 2：本地开发（SQLite + Local）

```bash
# 1. 启动开发服务器
npm run dev

# 2. 访问 http://localhost:3000
# → 自动跳转到 /login

# 3. 先设置密码
npm run auth:hash-password mypassword
# 复制输出的哈希值

# 4. 创建 .env.local
echo "AUTH_PASSWORD_HASH=哈希值" > .env.local
echo "SESSION_SECRET=<已脱敏：真实凭据不入库>" >> .env.local

# 5. 重启服务器
npm run dev

# 6. 登录并测试
# - 输入密码登录
# - 创建 Moment
# - 上传图片
# - 查看图片显示

# 7. 检查数据
ls data/digital-self.db      # SQLite 数据库
ls data/media/               # 本地图片
```

✅ **通过标准：** 
- 登录成功
- 图片上传成功
- 图片显示正常
- 数据保存在 `data/` 目录

---

### 测试 3：PostgreSQL 切换

```bash
# 1. 启动本地 PostgreSQL（Docker）
docker run --name postgres-test -e POSTGRES_PASSWORD=test -p 5432:5432 -d postgres

# 2. 设置环境变量
export DATABASE_URL="postgresql://postgres:test@localhost:5432/postgres"

# 3. 推送 Schema
npm run db:push

# 4. 迁移数据（可选）
npm run migrate:to-postgres

# 5. 启动应用
npm run dev

# 6. 检查健康状态
curl http://localhost:3000/api/health
# 应该返回：
# {
#   "status": "healthy",
#   "database": { "type": "postgresql", "connected": true }
# }
```

✅ **通过标准：**
- 健康检查显示 PostgreSQL
- 应用功能正常
- 数据保存在 PostgreSQL

---

### 测试 4：R2 存储切换

```bash
# 1. 设置 R2 环境变量
export R2_ACCOUNT_ID=your-account-id
export R2_ACCESS_KEY_ID=your-key
export R2_SECRET_ACCESS_KEY=your-secret
export R2_BUCKET_NAME=digital-self

# 2. 启动应用
npm run dev

# 3. 上传图片

# 4. 检查健康状态
curl http://localhost:3000/api/health
# 应该返回：
# {
#   "storage": "r2"
# }

# 5. 检查 R2 Bucket
# 登录 Cloudflare Dashboard → R2 → 查看文件
```

✅ **通过标准：**
- 健康检查显示 r2
- 图片上传到 R2
- 图片访问正常

---

## 🚀 部署验证

```bash
# 1. 部署到 Vercel
# - 连接 GitHub
# - 设置所有环境变量
# - 部署

# 2. 验证健康检查
curl https://your-app.vercel.app/api/health

# 3. 测试登录
# 访问 https://your-app.vercel.app
# → 跳转到登录页
# → 输入密码
# → 登录成功

# 4. 测试完整流程
# - 创建 Moment
# - 上传图片
# - 查看图片（来自 R2）
```

✅ **通过标准：**
- `/api/health` 返回 healthy
- 认证系统工作
- PostgreSQL 连接正常
- R2 图片显示正常

---

## 📦 迁移关系

```
本地开发环境                    生产环境
┌─────────────┐              ┌─────────────┐
│   SQLite    │              │ PostgreSQL  │
│ (data/*.db) │──migrate────▶│  (Railway)  │
└─────────────┘              └─────────────┘
       
┌─────────────┐              ┌─────────────┐
│ Local Files │              │     R2      │
│(data/media/)│──migrate────▶│(Cloudflare) │
└─────────────┘              └─────────────┘

迁移命令：
npm run migrate:to-postgres   # 数据库迁移
npm run migrate:media-to-r2   # 文件迁移
```

---

## 🎯 总结

**4 个 Feature 分支的作用：**

1. **`feature/postgres-support`** 
   - 让数据库可以从 SQLite 切换到 PostgreSQL
   - 本地开发用 SQLite，生产环境用 PostgreSQL

2. **`feature/r2-storage`**
   - 让文件存储可以从本地切换到 R2
   - 本地开发用文件系统，生产环境用 R2

3. **`feature/simple-auth`**
   - 添加密码认证，保护隐私
   - 基于 Cookie 的 Session

4. **`feature/deployment-config`**
   - 提供部署指南和配置模板
   - 健康检查接口

**所有功能都是环境变量驱动的自动切换，无需修改代码！**
