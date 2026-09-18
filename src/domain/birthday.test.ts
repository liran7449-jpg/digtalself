/**
 * 生日判断的测试。
 *
 * 重点在两处容易错的地方：
 * 1. 凌晨 4 点日界 —— 这个产品的「今天」不是自然日
 * 2. 非法输入不能误判成「今天是生日」
 */

import { describe, expect, it } from "vitest";
import { isBirthdayToday, isValidBirthday, normalizeBirthday } from "./birthday";

describe("isValidBirthday", () => {
  it("接受合法的 MM-DD", () => {
    expect(isValidBirthday("09-18")).toBe(true);
    expect(isValidBirthday("01-01")).toBe(true);
    expect(isValidBirthday("12-31")).toBe(true);
  });

  it("拒绝越界和格式错误", () => {
    expect(isValidBirthday("00-01")).toBe(false); // 0 月
    expect(isValidBirthday("13-01")).toBe(false); // 13 月
    expect(isValidBirthday("09-00")).toBe(false); // 0 日
    expect(isValidBirthday("09-32")).toBe(false); // 32 日
    expect(isValidBirthday("9-18")).toBe(false); // 没补零
    expect(isValidBirthday("2026-09-18")).toBe(false); // 带年份
    expect(isValidBirthday("")).toBe(false);
  });
});

describe("normalizeBirthday", () => {
  it("接受几种常见写法", () => {
    expect(normalizeBirthday("09-18")).toBe("09-18");
    expect(normalizeBirthday("9-18")).toBe("09-18");
    expect(normalizeBirthday("9/18")).toBe("09-18");
    expect(normalizeBirthday("2026-09-18")).toBe("09-18");
    expect(normalizeBirthday("2026/9/18")).toBe("09-18");
    expect(normalizeBirthday("0918")).toBe("09-18");
    expect(normalizeBirthday("  09-18  ")).toBe("09-18");
  });

  it("识别不了就返回 null，不猜", () => {
    expect(normalizeBirthday("九月十八")).toBeNull();
    expect(normalizeBirthday("13-45")).toBeNull();
    expect(normalizeBirthday("")).toBeNull();
    expect(normalizeBirthday("18")).toBeNull();
  });
});

describe("isBirthdayToday", () => {
  it("同月同日为真", () => {
    const noon = new Date("2026-09-18T12:00:00+08:00");
    expect(isBirthdayToday("09-18", noon)).toBe(true);
    expect(isBirthdayToday("09-17", noon)).toBe(false);
    expect(isBirthdayToday("10-18", noon)).toBe(false);
  });

  it("空值和非法值一律为假 —— 不能因为格式错就误报生日", () => {
    expect(isBirthdayToday(null)).toBe(false);
    expect(isBirthdayToday(undefined)).toBe(false);
    expect(isBirthdayToday("")).toBe(false);
    expect(isBirthdayToday("garbage")).toBe(false);
    expect(isBirthdayToday("2026-09-18")).toBe(false);
  });

  /**
   * 凌晨 4 点日界：这个产品的「今天」跟着 toDayKey() 走。
   * 18 日凌晨 2 点在产品语义里还是 17 日，所以那一刻
   * 不该祝 18 日的生日 —— 否则会出现「页面显示 17 日，
   * 却祝你 18 日生日快乐」。
   */
  it("跟随凌晨 4 点日界，不是自然日", () => {
    const at2am = new Date("2026-09-18T02:00:00+08:00");
    expect(isBirthdayToday("09-18", at2am)).toBe(false);
    expect(isBirthdayToday("09-17", at2am)).toBe(true);

    const at5am = new Date("2026-09-18T05:00:00+08:00");
    expect(isBirthdayToday("09-18", at5am)).toBe(true);
    expect(isBirthdayToday("09-17", at5am)).toBe(false);
  });

  it("跨年边界：1 月 1 日凌晨 2 点仍算 12 月 31 日", () => {
    const newYearEarly = new Date("2027-01-01T02:00:00+08:00");
    expect(isBirthdayToday("12-31", newYearEarly)).toBe(true);
    expect(isBirthdayToday("01-01", newYearEarly)).toBe(false);
  });
});
