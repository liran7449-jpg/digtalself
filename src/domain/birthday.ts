/**
 * 生日判断。
 *
 * 存的是 "MM-DD"（不含年份），因为唯一的用途就是「今天是不是生日」。
 * 年份用不上，而且能推算年龄，属于不必要的敏感信息（§6）。
 *
 * 格式校验与归一在 birthday-plain.mjs —— scripts/ 下的管理脚本是 .mjs、
 * 没有 TS 编译步骤，import 不了 .ts。那边是唯一实现，这里 re-export，
 * 保证「建号脚本存进去的格式」和「这里能认的格式」永远一致。
 */

import { isValidBirthday as _isValid, normalizeBirthday as _normalize } from "./birthday-plain.mjs";
import { toDayKey } from "./day-key";

// 显式标注签名：.mjs 那边推断出的类型比较宽（参数是 any）
export const isValidBirthday: (value: string) => boolean = _isValid;
export const normalizeBirthday: (raw: string) => string | null = _normalize;

/**
 * 今天是不是这个人的生日。
 *
 * 用 toDayKey() 而不是 new Date().getMonth() —— 这个产品的「今天」
 * 以凌晨 4 点为界（见 day-key.ts）。凌晨 2 点还算前一天，
 * 生日祝福也该按同一个「今天」来判断，否则会出现
 * 「Today 页显示的是 17 日，却祝你 18 日生日快乐」。
 */
export function isBirthdayToday(
  birthday: string | null | undefined,
  now = new Date(),
): boolean {
  if (!birthday || !isValidBirthday(birthday)) return false;
  // toDayKey 返回 "YYYY-MM-DD"，取后 5 位就是 "MM-DD"
  return toDayKey(now).slice(5) === birthday;
}
