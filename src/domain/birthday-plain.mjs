/**
 * 生日格式的纯 JS 实现。
 *
 * 为什么单独一个 .mjs：scripts/ 下的管理脚本是 .mjs，用 node 直接跑，
 * 没有 TS 编译步骤，import 不了 .ts。而这段逻辑必须和应用里的完全一致 ——
 * 建号脚本存进去的格式，得正好是 isBirthdayToday 能认的那个格式。
 *
 * 所以这里是唯一实现，birthday.ts 从这里 re-export，不复制一份。
 * 复制两份的话，哪天改了正则只改一处，就会出现「脚本存进去了、
 * 彩蛋不显示」这种查半天的问题。
 */

/** "MM-DD"，01-01 到 12-31。 */
const BIRTHDAY_RE = /^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

export function isValidBirthday(value) {
  return BIRTHDAY_RE.test(value);
}

function pad(m, d) {
  const out = `${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  return isValidBirthday(out) ? out : null;
}

/**
 * 把常见的生日写法归一成 "MM-DD"。
 *
 * 接受 "09-18" / "9-18" / "9/18" / "2026-09-18" / "0918"，
 * 让建号脚本不必挑输入格式。无法识别时返回 null —— 不猜，
 * 猜错会让用户在错误的日期收到祝福。
 */
export function normalizeBirthday(raw) {
  const s = String(raw ?? "").trim();

  // 带年份的完整日期，取后面的月日
  const full = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/.exec(s);
  if (full) return pad(full[2], full[3]);

  // 月-日
  const md = /^(\d{1,2})[-/](\d{1,2})$/.exec(s);
  if (md) return pad(md[1], md[2]);

  // 紧凑的 MMDD
  const compact = /^(\d{2})(\d{2})$/.exec(s);
  if (compact) return pad(compact[1], compact[2]);

  return null;
}
