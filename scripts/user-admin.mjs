#!/usr/bin/env node
/**
 * 用户管理命令行工具。
 *
 * 故意不做网页管理后台：建号是低频操作，命令行少一个攻击面，
 * 也不需要考虑「谁有权限进管理页」这个问题。
 *
 * 用法：
 *   node scripts/user-admin.mjs list
 *   node scripts/user-admin.mjs create <用户名> [显示名] [生日 MM-DD] [初始密码] [--keep-password]
 *   node scripts/user-admin.mjs set-birthday <用户名> <生日 MM-DD>
 *   node scripts/user-admin.mjs set-password <用户名>
 *   node scripts/user-admin.mjs set-password-plain <用户名> <密码>
 *
 * create 默认生成随机临时密码并要求首次登录改掉。
 * 传了初始密码就用那个；加 --keep-password 则连改密要求也去掉。
 *
 * 目标库由 DATABASE_URL 决定；操作生产库时传 Railway 的连接串。
 */

import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import postgres from "postgres";
import { ulid } from "ulid";
import { normalizeBirthday } from "../src/domain/birthday-plain.mjs";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌ 缺少 DATABASE_URL");
  console.error("   本地：set -a; . ./.env.local; set +a");
  console.error("   生产：DATABASE_URL=\"<Railway 连接串>\"");
  process.exit(1);
}

const BCRYPT_ROUNDS = 10;
const USERNAME_RE = /^[a-z0-9_-]{3,32}$/;

const sql = postgres(DATABASE_URL, { ssl: "prefer" });

/**
 * 生成临时密码。
 *
 * 用 crypto.randomBytes 而不是 Math.random —— 后者可预测，
 * 而这串东西是别人账号的唯一凭据。去掉容易看错的字符（0/O、1/l/I）。
 */
function tempPassword() {
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
  const bytes = crypto.randomBytes(16);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

function normalizeUsername(raw) {
  const username = String(raw ?? "").trim().toLowerCase();
  if (!USERNAME_RE.test(username)) {
    console.error(`❌ 用户名不合法：${JSON.stringify(raw)}`);
    console.error("   规则：小写字母 / 数字 / 下划线 / 连字符，3-32 位");
    process.exit(1);
  }
  return username;
}

async function list() {
  const rows = await sql`
    SELECT id, username, name, birthday, must_change_password,
           (password_hash IS NOT NULL) AS has_password, created_at
    FROM users ORDER BY created_at
  `;
  if (rows.length === 0) {
    console.log("（没有用户）");
    return;
  }
  console.log(`\n${rows.length} 个用户：\n`);
  for (const r of rows) {
    const flags = [
      r.has_password ? "有密码" : "⚠️ 无密码",
      r.must_change_password ? "待改密" : null,
      r.birthday ? `生日 ${r.birthday}` : null,
    ].filter(Boolean);
    console.log(`  ${r.username.padEnd(16)} ${(r.name ?? "").padEnd(12)} ${flags.join(" / ")}`);
    console.log(`  ${"".padEnd(16)} id=${r.id}`);
  }
  console.log();
}

async function create(rawUsername, name, rawBirthday, rawPassword) {
  const username = normalizeUsername(rawUsername);

  const existing = await sql`SELECT id FROM users WHERE username = ${username}`;
  if (existing.length > 0) {
    console.error(`❌ 用户名已存在：${username}`);
    process.exit(1);
  }

  /**
   * 生日只存 MM-DD。给的格式不认识就直接报错，不静默存 null ——
   * 静默的话你会以为设好了，到生日那天才发现彩蛋没出现。
   */
  let birthday = null;
  if (rawBirthday) {
    birthday = normalizeBirthday(rawBirthday);
    if (!birthday) {
      console.error(`❌ 生日格式无法识别：${JSON.stringify(rawBirthday)}`);
      console.error("   支持：09-18 / 9-18 / 2026-09-18 / 0918");
      process.exit(1);
    }
  }

  /**
   * 允许指定初始密码。
   *
   * 默认是随机临时密码 + 强制改密 —— 那是更安全的做法，
   * 改完之后连管理员都不知道对方密码。
   *
   * --keep-password 关掉强制改密：适合「这个密码就是给她长期用的」
   * 的场合。代价是你知道她的密码，所以只在你和对方之间本来就没有
   * 这层隔阂时用。
   */
  const password = rawPassword || tempPassword();
  if (rawPassword && rawPassword.length < 4) {
    console.error("❌ 初始密码至少 4 位");
    process.exit(1);
  }
  const mustChange = !process.argv.includes("--keep-password");

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const id = ulid();

  await sql`
    INSERT INTO users (id, username, name, birthday, password_hash, must_change_password)
    VALUES (${id}, ${username}, ${name ?? null}, ${birthday}, ${passwordHash}, ${mustChange})
  `;

  console.log(`\n✅ 已建号\n`);
  console.log(`   用户名：${username}`);
  console.log(`   初始密码：${password}${rawPassword ? "（你指定的）" : "（随机生成）"}`);
  if (birthday) console.log(`   生日：${birthday}`);
  console.log(`   id：${id}`);
  if (mustChange) {
    console.log(`\n   把用户名和初始密码给对方。首次登录会强制改密码，`);
    console.log(`   改完之后你就不知道对方密码了。\n`);
  } else {
    console.log(`\n   把用户名和密码给对方，直接就能用（不要求改密）。`);
    console.log(`   她随时可以自己在 /change-password 改。\n`);
  }
}

/** 单独设置生日，给已存在的账号用。 */
async function setBirthday(rawUsername, rawBirthday) {
  const username = normalizeUsername(rawUsername);
  const birthday = normalizeBirthday(rawBirthday ?? "");
  if (!birthday) {
    console.error(`❌ 生日格式无法识别：${JSON.stringify(rawBirthday)}`);
    console.error("   支持：09-18 / 9-18 / 2026-09-18 / 0918");
    process.exit(1);
  }
  const rows = await sql`
    UPDATE users SET birthday = ${birthday} WHERE username = ${username} RETURNING id
  `;
  if (rows.length === 0) {
    console.error(`❌ 用户不存在：${username}`);
    process.exit(1);
  }
  console.log(`\n✅ 已设置 ${username} 的生日：${birthday}\n`);
}

async function setPassword(rawUsername) {
  const username = normalizeUsername(rawUsername);
  const rows = await sql`SELECT id FROM users WHERE username = ${username}`;
  if (rows.length === 0) {
    console.error(`❌ 用户不存在：${username}`);
    process.exit(1);
  }

  const password = tempPassword();
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  await sql`
    UPDATE users SET password_hash = ${passwordHash}, must_change_password = true
    WHERE id = ${rows[0].id}
  `;

  console.log(`\n✅ 已重置 ${username} 的密码\n`);
  console.log(`   临时密码：${password}`);
  console.log(`\n   对方下次登录会被要求改密码。\n`);
}

/**
 * 把明文密码直接设给某个用户，不要求改密。
 *
 * 只给一个场景用：把原本存在环境变量里的密码搬进数据库，
 * 让 owner 的密码保持不变。日常改密码走应用里的改密码页。
 */
async function setPasswordPlain(rawUsername, password) {
  const username = normalizeUsername(rawUsername);
  if (!password || password.length < 6) {
    console.error("❌ 密码至少 6 位");
    process.exit(1);
  }
  const rows = await sql`SELECT id FROM users WHERE username = ${username}`;
  if (rows.length === 0) {
    console.error(`❌ 用户不存在：${username}`);
    process.exit(1);
  }
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  await sql`
    UPDATE users SET password_hash = ${passwordHash}, must_change_password = false
    WHERE id = ${rows[0].id}
  `;
  console.log(`\n✅ 已设置 ${username} 的密码（不要求改密）\n`);
}

const [cmd, ...args] = process.argv.slice(2).filter((a) => !a.startsWith("--"));

try {
  switch (cmd) {
    case "list":
      await list();
      break;
    case "create":
      await create(args[0], args[1], args[2], args[3]);
      break;
    case "set-birthday":
      await setBirthday(args[0], args[1]);
      break;
    case "set-password":
      await setPassword(args[0]);
      break;
    case "set-password-plain":
      await setPasswordPlain(args[0], args[1]);
      break;
    default:
      console.log("用法：");
      console.log("  node scripts/user-admin.mjs list");
      console.log("  node scripts/user-admin.mjs create <用户名> [显示名] [生日 MM-DD] [初始密码] [--keep-password]");
      console.log("  node scripts/user-admin.mjs set-birthday <用户名> <生日 MM-DD>");
      console.log("  node scripts/user-admin.mjs set-password <用户名>");
      console.log("  node scripts/user-admin.mjs set-password-plain <用户名> <密码>");
      process.exitCode = 1;
  }
} catch (e) {
  console.error("\n❌ 失败：", e.message);
  process.exitCode = 1;
} finally {
  await sql.end();
}
