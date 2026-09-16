# 回滚操作手册

> 出问题时看这份文档。按场景找到对应操作，复制命令执行。

---

## 当前回滚点

| 类型 | 标识 | 说明 |
|------|------|------|
| **回滚分支** | `rollback/stable-single-user` | 单用户稳定版，云端曾部署此版本 |
| **Tag** | `v0.9.0-before-multiuser` | 同上，指向 commit `05c0bd7` |
| **云端数据备份** | `backups/cloud-backup-2026-09-15.json` | 40 moments |
| **本地数据备份** | `backup-2026-09-15.json` | 34 moments |

---

## 场景 1：云端部署后功能坏了

**症状**：Railway 部署成功但页面报错 / 登不进去 / 数据看不到

### 操作

```bash
# 1. 把 main 指回稳定版
git checkout main
git reset --hard v0.9.0-before-multiuser
git push origin main --force

# 2. Railway 会自动重新部署（约 2 分钟）
```

**注意**：`--force` 会改写远程历史。这是回滚场景下可接受的，但要确认没有其他人在用这个分支。

### 如果数据库 schema 也改了

Schema 改动无法用 git 回滚，需要手动恢复：

```bash
# 恢复云端数据（会清空当前数据，用备份覆盖）
CLOUD_DB_URL="<Railway Public URL>" node scripts/import-data.mjs backups/cloud-backup-2026-09-15.json
```

⚠️ 导入是增量的（`ON CONFLICT DO NOTHING`），不会删除新数据。如果需要完全回到备份状态，得先清空表。

---

## 场景 2：本地开发环境坏了

**症状**：本地跑不起来 / 数据错乱

### 操作

```bash
# 1. 代码回到稳定版
git checkout rollback/stable-single-user

# 2. 重置本地数据库 schema
DATABASE_URL='postgresql://postgres:localdev123@localhost:5432/digitalself' npx drizzle-kit push --force

# 3. 恢复本地数据
node scripts/import-data.mjs backup-2026-09-15.json
```

---

## 场景 3：改到一半想放弃

**症状**：多用户改造做了一半，想回到开始状态

### 操作

```bash
# 丢弃 feature/multi-user 分支的所有改动
git checkout main
git branch -D feature/multi-user

# 本地数据库如果推过新 schema，需要重置
DATABASE_URL='postgresql://postgres:localdev123@localhost:5432/digitalself' npx drizzle-kit push --force
node scripts/import-data.mjs backup-2026-09-15.json
```

---

## 场景 4：数据丢了

### 先别慌，按顺序检查

```bash
# 1. 云端还有数据吗？
node scripts/verify-cloud.mjs

# 2. 本地还有数据吗？
node scripts/check-data.mjs

# 3. 备份文件在吗？
ls -lh backups/ backup-*.json
```

### 从备份恢复

```bash
# 云端
CLOUD_DB_URL="<Railway Public URL>" node scripts/import-data.mjs backups/cloud-backup-2026-09-15.json

# 本地
node scripts/import-data.mjs backup-2026-09-15.json
```

---

## 场景 5：只想临时看看旧版本

```bash
# 不改变任何东西，只是切过去看
git checkout rollback/stable-single-user
npm run dev

# 看完切回来
git checkout feature/multi-user
```

---

## 紧急联系信息

**Railway 数据库连接串**（用于数据恢复）：
- Public URL：Railway → Postgres 服务 → Variables → `DATABASE_PUBLIC_URL`
- 本地连不上时用 Public，云端服务内部用 Internal

**当前密码**：`ranli1025`
- 哈希在 Railway 环境变量 `AUTH_PASSWORD_HASH`
- 重新生成：`npm run auth:hash-password <新密码>`

---

## 操作前的检查习惯

每次危险操作前问自己：

1. 备份了吗？（`node scripts/backup-cloud.mjs`）
2. 知道怎么回退吗？（看本文档对应场景）
3. 云端数据会受影响吗？

**不确定就先备份，备份不要钱。**
