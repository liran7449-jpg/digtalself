# 开发规范与检查清单

## 数据库字段变更流程

当添加/修改数据库字段时，必须按以下顺序同步更新：

### 1. 数据库 Schema
- 文件：`src/db/schema.ts`
- 添加字段定义（包含类型、约束、注释）

### 2. 领域模型
- 文件：`src/domain/models.ts`
- 在对应的 Zod schema 中添加字段
- 示例：
  ```typescript
  export const userSchema = z.object({
    // ... 其他字段
    lastReadChangelogDate: ts.nullable(),
  });
  ```

### 3. Repository 映射函数
- 文件：`src/repositories/sqlite/*-repo.ts` 或 `src/repositories/pg/*-repo.ts`
- 在 `toModel()` 函数中添加字段映射
- 示例：
  ```typescript
  function toUser(r: Row): User {
    return {
      // ... 其他字段
      lastReadChangelogDate: r.lastReadChangelogDate,
    };
  }
  ```

### 4. 数据库迁移
```bash
npm run db:generate  # 生成迁移文件
npm run db:migrate   # 本地测试迁移
```

### 5. 线上数据库
- 在 Vercel Postgres 控制台执行生成的 SQL
- 或使用 Vercel CLI 连接线上数据库执行迁移

---

## 推送前检查清单

**必须在推送代码前执行以下检查**：

### ✅ TypeScript 类型检查
```bash
npm run build
```
- 确保没有类型错误
- 确保构建成功

### ✅ 本地测试
```bash
npm run dev
```
- 在浏览器中测试新功能
- 检查控制台是否有错误

### ✅ Git 提交前确认
```bash
git status
git diff
```
- 确认没有意外的文件改动
- 检查改动内容是否正确

---

## 常见错误与预防

### 1. TypeScript 类型不匹配
**症状**：`Property 'xxx' is missing in type...`

**原因**：
- 数据库 schema 添加字段，但领域模型未更新
- Repository 映射函数缺少字段

**预防**：
- 使用上面的「数据库字段变更流程」
- 推送前运行 `npm run build`

### 2. Vercel 构建失败：动态文件读取
**症状**：`Dynamic filesystem access causes tracing of the whole project`

**原因**：
- 使用 `fs.readFileSync(path.join(process.cwd(), ...))`
- Vercel/Turbopack 不支持动态路径

**解决方案**：
- 使用硬编码内容
- 或使用静态导入
- 或添加 `/*turbopackIgnore: true*/` 注释

### 3. 环境变量未设置
**症状**：`DATABASE_URL 环境变量未设置`

**解决方案**：
```bash
export $(cat .env.local | grep -v '^#' | xargs)
npm run db:migrate
```

---

## 开发工作流建议

### 新功能开发
1. 在本地开发分支开发
2. 增量提交（每完成一个小功能就提交）
3. 本地构建验证：`npm run build`
4. 推送到 GitHub
5. 观察 Vercel 部署结果

### 紧急修复
1. 先在本地验证修复有效
2. 运行 `npm run build` 确保没有类型错误
3. 提交并推送
4. 立即观察 Vercel 部署状态

### 数据库变更
1. 本地开发环境测试迁移
2. 线上数据库执行迁移
3. 推送代码（确保类型定义同步）
4. 验证线上功能

---

## 工具与命令

### 本地开发
```bash
npm run dev              # 启动开发服务器
npm run build            # 构建并类型检查
npm run lint             # 代码检查
```

### 数据库
```bash
npm run db:generate      # 生成迁移文件
npm run db:migrate       # 执行迁移（本地）
npm run db:studio        # 打开数据库 GUI
```

### Git
```bash
git status               # 查看改动
git diff                 # 查看具体改动内容
git add -A               # 暂存所有改动
git commit -m "message"  # 提交
git push origin main     # 推送
```

---

## 记住

1. **推送前必须 `npm run build`** - 本地验证通过再推送
2. **数据库字段变更 = 4 个文件同步更新** - schema + models + repo + migration
3. **增量开发，增量验证** - 不要堆积太多改动再一起测试
4. **类型错误不要猜** - 看清错误信息，找到根本原因

---

最后更新：2026-10-17
