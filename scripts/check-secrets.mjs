#!/usr/bin/env node
/**
 * 扫描仓库里是否有真实凭据。
 *
 * 为什么需要这个：同一类问题已经发生三次。
 * 1. /api/debug-env 把 AUTH_PASSWORD_HASH 挂在公网上
 * 2. 4 个脚本硬编码生产库连接串（含密码），已推到 GitHub
 * 3. docs/TEST_REPORT.md 写着生产在用的 SESSION_SECRET ——
 *    拿它能伪造任意用户的登录 cookie，不需要密码。已实测复现。
 *
 * 靠「记得别写进去」防守不可靠，所以让机器查。
 *
 * 用法：
 *   node scripts/check-secrets.mjs           # 扫工作区
 *   node scripts/check-secrets.mjs --staged  # 只扫暂存区（提交前用）
 *
 * 退出码非 0 表示发现疑似凭据。
 */

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const STAGED = process.argv.includes("--staged");

/**
 * 每条规则都要能区分「真实凭据」和「文档占位符」，
 * 否则误报多了就会被忽略，等于没有。
 */
const RULES = [
  {
    name: "完整 bcrypt 哈希",
    // 真实哈希的 salt+hash 部分是 53 个字符；占位符通常是 xxx... 或被截断
    re: /\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}/,
    hint: "密码哈希不能进仓库 —— 可以拿去离线爆破",
    /**
     * 排除两类合法情况，否则误报会让人习惯性无视这个检查：
     * - 文档里的 xxxxx 占位符（连续 8 个以上相同字符不可能是真哈希）
     * - login/route.ts 的 DUMMY_HASH：故意存在的固定假哈希，
     *   用来在用户名不存在时消耗同样的比对时间，防止时序侧信道
     */
    allow: (line) => /(.)\1{7,}/.test(line) || line.includes("DUMMY_HASH"),
  },
  {
    name: "Postgres 连接串带密码",
    // 排除本地 dev 那个众所皆知的 localdev123
    re: /postgres(?:ql)?:\/\/[^:\s]+:(?!localdev123)[^@\s]{8,}@(?!localhost|127\.0\.0\.1)/,
    hint: "生产库连接串必须走环境变量（见 scripts/cloud-db.mjs）",
  },
  {
    name: "疑似真实 session secret",
    // 32+ 位的十六进制串，或明确写成 SESSION_SECRET=<非占位符>
    re: /SESSION_SECRET\s*=\s*["']?(?![<x]|your-|random-|64-char|\(随机)[A-Za-z0-9_-]{32,}/,
    hint: "拿到它就能伪造任意用户的登录 cookie，不需要密码",
  },
  {
    name: "AWS/S3 密钥",
    re: /(?:AKIA|ASIA)[A-Z0-9]{16}/,
    hint: "对象存储凭据泄露 = 所有照片可被下载或删除",
  },
];

/** 这些路径本来就该有真实值，或者只是示例。 */
const SKIP = [
  /^\.env/,
  /node_modules\//,
  /^\.next\//,
  /package-lock\.json$/,
  /^scripts\/check-secrets\.mjs$/, // 自己的规则里含样例模式
  /^drizzle\/legacy-sqlite\//,
];

function listFiles() {
  const args = STAGED
    ? ["diff", "--cached", "--name-only", "--diff-filter=ACM"]
    : ["ls-files"];
  return execFileSync("git", args, { encoding: "utf8" })
    .split("\n")
    .filter(Boolean)
    .filter((f) => !SKIP.some((re) => re.test(f)));
}

const findings = [];

for (const file of listFiles()) {
  let content;
  try {
    content = readFileSync(file, "utf8");
  } catch {
    continue; // 二进制或已删除
  }
  content.split("\n").forEach((line, i) => {
    for (const rule of RULES) {
      if (rule.re.test(line) && !rule.allow?.(line)) {
        findings.push({
          file,
          line: i + 1,
          rule: rule.name,
          hint: rule.hint,
          // 只显示片段，不把完整凭据再打印一遍
          snippet: line.trim().slice(0, 60) + (line.trim().length > 60 ? "…" : ""),
        });
      }
    }
  });
}

if (findings.length === 0) {
  console.log(`✅ 未发现疑似凭据（扫了 ${listFiles().length} 个文件）`);
  process.exit(0);
}

console.error(`\n❌ 发现 ${findings.length} 处疑似真实凭据：\n`);
for (const f of findings) {
  console.error(`  ${f.file}:${f.line}  [${f.rule}]`);
  console.error(`    ${f.snippet}`);
  console.error(`    ⚠️  ${f.hint}\n`);
}
console.error("凭据必须走环境变量。已经提交过的，改文件不够 ——");
console.error("要在服务端换掉它，让旧值失效（git 历史删不干净）。\n");
process.exit(1);
