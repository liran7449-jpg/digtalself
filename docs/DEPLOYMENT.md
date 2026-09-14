# Digital Self - 部署指南

完整的云端部署教程，包括数据库、存储和应用部署。

---

## 🎯 部署架构

```
┌─────────────────┐
│  Vercel / Railway│  ← Next.js 应用
│  (应用服务器)    │
└────────┬────────┘
         │
         ├─────────► Railway PostgreSQL (数据库)
         │
         └─────────► Cloudflare R2 (媒体存储)
```

---

## 📋 准备清单

部署前需要：

- [ ] GitHub 账号（代码托管）
- [ ] Railway 账号（PostgreSQL 数据库）
- [ ] Cloudflare 账号（R2 存储）
- [ ] Vercel 或 Railway 账号（应用部署）

---

## 1️⃣ 数据库：Railway PostgreSQL

### 1.1 创建数据库

1. 访问 [Railway](https://railway.app)
2. 创建新项目 → **Provision PostgreSQL**
3. 等待创建完成

### 1.2 获取连接字符串

在 PostgreSQL 服务页面：
- 点击 **Connect** → **Database URL**
- 复制连接字符串（格式：`postgresql://user:pass@host:5432/railway`）

### 1.3 迁移数据

```bash
# 本地设置环境变量
export DATABASE_URL='postgresql://...'

# 1. 生成迁移文件
npm run db:generate

# 2. 推送 schema 到 PostgreSQL
npm run db:push

# 3. 迁移现有数据（可选）
npm run migrate:to-postgres
```

---

## 2️⃣ 存储：Cloudflare R2

### 2.1 创建 R2 Bucket

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 左侧菜单 → **R2 Object Storage**
3. **Create Bucket** → 名称：`digital-self`

### 2.2 创建 API Token

1. 在 R2 页面 → **Manage R2 API Tokens**
2. **Create API Token**
   - Token Name: `digital-self-app`
   - Permissions: **Object Read & Write**
   - Apply to specific buckets: 选择 `digital-self`
3. 保存以下信息：
   - Access Key ID
   - Secret Access Key
   - Account ID（在 R2 Overview 页面）

### 2.3 配置公开访问（可选）

如果需要直接访问图片：

1. Bucket 设置 → **Public Access**
2. 启用公开访问
3. 记录公开 URL：`https://pub-<account-id>.r2.dev`

### 2.4 迁移媒体文件

```bash
# 设置环境变量
export R2_ACCOUNT_ID='your-account-id'
export R2_ACCESS_KEY_ID='your-access-key'
export R2_SECRET_ACCESS_KEY='your-secret-key'

# 上传本地图片到 R2
npm run migrate:media-to-r2
```

---

## 3️⃣ 应用部署

### 方案 A：Vercel（推荐）

#### 3.1 连接 GitHub

1. 将代码推送到 GitHub
2. 访问 [Vercel](https://vercel.com)
3. **Import Project** → 选择你的仓库

#### 3.2 配置环境变量

在 Vercel 项目设置 → **Environment Variables** 添加：

```bash
# 数据库
DATABASE_URL=postgresql://user:pass@host:5432/railway

# 存储
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=digital-self
R2_PUBLIC_URL=https://pub-xxx.r2.dev

# 认证（重要！）
AUTH_PASSWORD_HASH=$2a$10$...
SESSION_SECRET=your-32-char-random-secret

# 应用
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

#### 3.3 部署

点击 **Deploy** → 等待构建完成

#### 3.4 验证

访问 `https://your-app.vercel.app/api/health` 检查状态：

```json
{
  "status": "healthy",
  "database": { "type": "postgresql", "connected": true },
  "storage": "r2",
  "auth": true
}
```

---

### 方案 B：Railway

#### 3.1 创建应用服务

1. Railway 项目 → **New Service** → **GitHub Repo**
2. 选择你的仓库

#### 3.2 配置环境变量

在 Service 设置 → **Variables** 添加所有环境变量（同 Vercel）

#### 3.3 配置构建

Railway 会自动检测 Next.js：

```bash
# 构建命令（自动）
npm run build

# 启动命令（自动）
npm run start
```

#### 3.4 分配域名

Settings → **Generate Domain** → 获得 `*.up.railway.app` 域名

---

## 4️⃣ 认证配置

### 4.1 生成密码哈希

```bash
# 本地生成
npm run auth:hash-password your-secure-password

# 复制输出的哈希值
$2a$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 4.2 生成 Session Secret

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 输出 64 字符的十六进制字符串
```

### 4.3 设置环境变量

将生成的值添加到部署平台：

```bash
AUTH_PASSWORD_HASH=$2a$10$...
SESSION_SECRET=64-char-hex-string
```

---

## 5️⃣ 部署后检查

### 5.1 健康检查

```bash
curl https://your-app.vercel.app/api/health
```

### 5.2 登录测试

1. 访问 `https://your-app.vercel.app`
2. 自动跳转到 `/login`
3. 输入密码登录

### 5.3 上传测试

1. 创建一个 Moment
2. 上传图片
3. 检查图片是否显示（来自 R2）

---

## 🔒 安全建议

1. **不要提交 .env 文件到 Git**
   ```bash
   # 确保 .gitignore 包含
   .env
   .env.local
   .env.production.local
   ```

2. **使用强密码**
   - 至少 16 字符
   - 包含大小写字母、数字、符号

3. **定期轮换密钥**
   - 每 3-6 个月更换密码
   - 更换 Session Secret

4. **启用 HTTPS**
   - Vercel/Railway 默认启用
   - 自定义域名需要配置 SSL

5. **限制 R2 访问**
   - 使用最小权限 API Token
   - 仅授权必要的 Bucket

---

## 🐛 故障排查

### 数据库连接失败

```bash
# 检查连接字符串
echo $DATABASE_URL

# 测试连接
psql $DATABASE_URL -c "SELECT 1"
```

### R2 上传失败

```bash
# 检查环境变量
echo $R2_ACCOUNT_ID
echo $R2_ACCESS_KEY_ID

# 测试上传（使用 AWS CLI）
aws s3 ls --endpoint-url https://$R2_ACCOUNT_ID.r2.cloudflarestorage.com s3://digital-self
```

### 认证失败

```bash
# 检查密码哈希是否设置
echo $AUTH_PASSWORD_HASH

# 重新生成哈希
npm run auth:hash-password your-password
```

### 健康检查返回 unhealthy

1. 检查所有环境变量是否正确
2. 查看部署日志
3. 确认数据库迁移完成

---

## 📊 监控

### Vercel Analytics

免费自带：
- 访问量统计
- 性能监控
- 错误追踪

### Railway Metrics

内置监控：
- CPU / 内存使用
- 数据库连接数
- 响应时间

### Cloudflare R2 Analytics

Dashboard 查看：
- 存储使用量
- 请求次数
- 流量统计

---

## 💰 成本估算

| 服务 | 免费额度 | 付费价格 |
|------|---------|---------|
| **Vercel** | 100 GB-hours/月 | $20/月起 |
| **Railway** | $5 免费额度 | 按用量计费 |
| **PostgreSQL (Railway)** | ~$5/月 | $5-20/月 |
| **Cloudflare R2** | 10 GB 存储 | $0.015/GB/月 |

个人使用预计：**$5-10/月**

---

## 🚀 自动化部署

### GitHub Actions

创建 `.github/workflows/deploy.yml`：

```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build
      - run: npm test
```

Vercel 会自动监听 `main` 分支并部署。

---

## 📚 相关文档

- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Railway Documentation](https://docs.railway.app)
- [Cloudflare R2 API](https://developers.cloudflare.com/r2/api/s3/)
- [Iron Session](https://github.com/vvo/iron-session)

---

## ✅ 部署检查清单

完成部署后，确认：

- [ ] `/api/health` 返回 `healthy`
- [ ] 数据库连接正常
- [ ] R2 存储配置正确
- [ ] 认证系统工作（能登录）
- [ ] 图片上传和显示正常
- [ ] HTTPS 已启用
- [ ] 环境变量已设置
- [ ] 日志监控已配置

---

🎉 **恭喜！你的 Digital Self 已成功部署到云端！**
