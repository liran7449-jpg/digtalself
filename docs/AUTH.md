# 认证系统配置

## 设置密码

使用 bcrypt 生成密码哈希：

```bash
# 方法 1：使用 Node.js
node -e "console.log(require('bcryptjs').hashSync('your-password', 10))"

# 方法 2：使用 npm script（推荐）
npm run auth:hash-password
```

将生成的哈希值设置为环境变量：

```bash
# .env.local
AUTH_PASSWORD_HASH=$2a$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SESSION_SECRET=your-random-32-character-secret-key-here
```

## 生成 Session Secret

```bash
# 生成随机密钥
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 登录页面

访问 `/login` 输入密码登录。

## 环境变量

必需：
- `AUTH_PASSWORD_HASH` - bcrypt 加密的密码哈希
- `SESSION_SECRET` - Session 加密密钥（至少 32 字符）

## 安全建议

1. **不要在代码中硬编码密码**
2. **定期更换密码和 Session Secret**
3. **生产环境确保使用 HTTPS**
4. **Session Secret 保密，不要提交到 Git**
