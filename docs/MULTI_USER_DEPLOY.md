# 多用户改造上线手册

分支 `feature/multi-user-v2`，阶段 0-4 已完成并验证。本文件是阶段 5（上线）的执行清单。

---

## 一、上线前必须知道的两件事

### 1. Migration 不会自动跑

仓库里没有 `railway.json` / `Procfile` / `Dockerfile`，Railway 用默认的
`npm run build` + `npm start`，**不包含 `drizzle-kit migrate`**。

所以顺序不能反：**先跑 migration，再部署代码**。

反了会怎样：新代码查询带 `user_id`，而生产库还没有这一列 →
全站 500。反过来（先 migration 后部署）是安全的，旧代码不认识新列但也不会碰它。

### 2. Railway 数据库密码需要更换

`scripts/` 下 4 个脚本曾把生产库连接串（含密码）硬编码在第一行，已提交到
GitHub。仓库是私有的所以未外泄，但凭证进了 git 历史，改当前文件没用。

代码已改成读 `CLOUD_DB_URL`，但**历史里那串仍是有效凭证**。
彻底解决只能在 Railway 换密码，让旧的失效。换完把新连接串用于下面的命令。

---

## 二、上线步骤

### 步骤 1：备份并验证（已完成，上线当天重跑一次）

```bash
cd /Users/ranli/Desktop/ranlee

CLOUD_DB_URL="<Railway 连接串>" node scripts/backup-cloud.mjs
node scripts/verify-backup.mjs backups/cloud-backup-<今天>.json
```

第二条必须输出 `✅ 备份已验证：可读取 + 能恢复 + 条数一致`。
它会真的把备份灌进一个临时库比对条数，不是只看文件在不在（§30）。

### 步骤 2：演练（已完成，改动后重跑）

```bash
CLOUD_DB_URL="<Railway 连接串>" node scripts/rehearse-migration.mjs
```

拿生产数据的副本跑一遍 migration，校验条数、归属、复合主键。
生产库全程只读。必须全绿才继续。

### 步骤 3：标记基线

生产库的表是 `drizzle-kit push` 直推的，没有 migration 记录。
基线 `0000_pg_baseline.sql` 里 17 个 `CREATE TABLE` 没有 `IF NOT EXISTS`，
对有数据的库直接执行会报错。所以只写记录、不执行 SQL：

```bash
DATABASE_URL="<Railway 连接串>" node scripts/baseline-mark.mjs --dry-run
DATABASE_URL="<Railway 连接串>" node scripts/baseline-mark.mjs
```

幂等，重复执行安全。

### 步骤 4：跑 migration（⚠️ 这一步真正改生产库）

```bash
DATABASE_URL="<Railway 连接串>" npx drizzle-kit migrate
```

`0001_multi_user.sql` 会：
- 8 张表加 `user_id`（`DEFAULT 'me'`，现有数据自动归到你名下）
- `days` 主键从 `date` 改成 `(user_id, date)`
- `users` 加 `username` / `password_hash` / `must_change_password`，
  并把现有那行的 username 回填为 `ran`

### 步骤 5：验证生产库

```bash
DATABASE_URL="<Railway 连接串>" node -e "
const postgres=require('postgres');const sql=postgres(process.env.DATABASE_URL,{ssl:'prefer'});
(async()=>{
for (const t of ['moments','media','days','plan_items','goals','people','topics']) {
  const r=await sql.unsafe(\`select count(*)::int c, count(*) filter (where user_id='me')::int mine from \${t}\`);
  console.log(t.padEnd(12), '总', r[0].c, '/ 属于 me', r[0].mine);
}
console.log(await sql\`select id, username, must_change_password from users\`);
await sql.end()})()"
```

对照上线前的备份统计：**moments 57 / media 16 / plan_items 66 / days 11**。
条数不一致就停下，走 §38。

### 步骤 6：设置你的密码

migration 之后 `password_hash` 是 NULL，此时**登录不进去**。

```bash
DATABASE_URL="<Railway 连接串>" node scripts/user-admin.mjs set-password-plain ran '<你的密码>'
```

用你现在的密码即可，不用改。

### 步骤 7：确认 Railway 环境变量

必需：

| 变量 | 说明 |
|---|---|
| `SESSION_SECRET` | ≥32 字符。**没有 fallback 了**，缺失会启动失败 |
| `DATABASE_URL` | Railway 自动注入 |
| `TZ=Asia/Shanghai` | 时区，否则日期切换错 |
| `S3_*` 四项 | Backblaze B2，否则图片每次部署丢 |

`AUTH_PASSWORD_HASH` 已不再使用（密码进了数据库），可以删掉。

### 步骤 8：合并并部署

```bash
git checkout main
git merge feature/multi-user-v2
git push origin main
```

Railway 自动部署。等部署完成再做步骤 9。

### 步骤 9：生产验证

```bash
curl -s https://<你的域名>/api/health
```

应看到 `"database":{"connected":true}` / `"storage":"cloud"` / `"auth":true`。

然后浏览器手测：

- [ ] 用 `ran` + 密码登录
- [ ] Today / Moments 数据都在，图片显示正常
- [ ] 点开一条 moment，关联的人物 / 地点 / 话题还在
- [ ] 点「退出」→ 回到登录页，按浏览器后退不能看到内容
- [ ] 关掉浏览器进程重开 → 要求重新登录（会话 cookie）

### 步骤 10：给对方开号

```bash
DATABASE_URL="<Railway 连接串>" node scripts/user-admin.mjs create <用户名> '<显示名>'
```

输出里有临时密码，把用户名和它给对方。对方首次登录会被强制改密码，
改完你就不知道对方密码了。

**开号后务必自己验一次隔离**：用对方账号登录，确认 Today / Moments
是空的，看不到你的任何记录。

### 步骤 11：打 tag

全部验证通过后：

```bash
git tag -a v0.10.0 -m "多用户支持：数据隔离 + 建号 + 改密码 + 登出"
git push origin v0.10.0
```

---

## 三、出问题怎么回退

### Migration 之后、部署之前发现问题

这时生产库已改、代码还是旧的。旧代码不认识 `user_id` 列，但也不会碰它，
所以**线上仍然正常**。不用急着回滚，慢慢查。

### 部署之后发现问题

先回退代码（数据不动）：

```bash
git revert -m 1 <merge commit>
git push origin main
```

`user_id` 列留在库里不影响旧代码。

### 数据出问题

停止一切操作（§38），然后从备份恢复：

```bash
# backups/cloud-backup-<日期>.json 已经过 verify-backup 验证可恢复
```

恢复前先跟我说，不要自己直接灌 —— 需要先确认现场。

---

## 四、回滚锚点

| 类型 | 标识 | 说明 |
|---|---|---|
| Tag | `v0.9.0-before-multiuser` | 多用户改造前 |
| Commit | `07fc172` | 骨架屏上线后，本轮改造的起点 |
| 备份 | `backups/cloud-backup-2026-09-18.json` | 57 moments，已验证可恢复 |
