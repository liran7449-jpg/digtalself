import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { dropTempDb, useTempDb } from "./test-setup";

// 必须先建临时库再 import repositories，import 顺序有副作用
let tmpDir: string;
beforeAll(async () => {
  tmpDir = await useTempDb();
});
afterAll(() => {
  dropTempDb(tmpDir);
});

const load = async () => {
  const { repo } = await import("./index");
  const dayKey = await import("@/domain/day-key");
  const transitions = await import("@/domain/transitions");
  return { repo, ...dayKey, ...transitions };
};

describe("User", () => {
  it("getOrCreate 幂等，update 生效", async () => {
    const { repo } = await load();
    const a = await repo.users.getOrCreate();
    const b = await repo.users.getOrCreate();
    expect(a.id).toBe(b.id);
    const named = await repo.users.update({ name: "Ran" });
    expect(named.name).toBe("Ran");
  });
});

describe("Day 状态机", () => {
  it("ensure → morning setup → reflected，状态只前进不后退", async () => {
    const { repo, toDayKey } = await load();
    const today = toDayKey();

    const d0 = await repo.days.ensure(today);
    expect(d0.status).toBe("not_started");
    expect((await repo.days.ensure(today)).date).toBe(today);

    const d1 = await repo.days.applyMorningSetup(today, {
      mood: "good",
      focus: "写完存储层",
    });
    expect(d1.status).toBe("started");
    expect(d1.mood).toBe("good");
    expect(d1.focus).toBe("写完存储层");

    // 重复提交不该把状态推得更远
    const d2 = await repo.days.applyMorningSetup(today, {
      mood: "okay",
      focus: null,
    });
    expect(d2.status).toBe("started");

    const d3 = await repo.days.markReflected(today);
    expect(d3.status).toBe("reflected");

    // 已反思的一天仍可改 mood，但状态不能倒退回 started
    const d4 = await repo.days.applyMorningSetup(today, {
      mood: "good",
      focus: "x",
    });
    expect(d4.status).toBe("reflected");
    expect(d4.mood).toBe("good");
  });
});

describe("Day 部分更新", () => {
  it("改 mood 不会清空 focus", async () => {
    const { repo, toDayKey, addDays } = await load();
    const date = addDays(toDayKey(), 20);

    await repo.days.applyMorningSetup(date, {
      mood: "bad",
      focus: "工作太多了",
    });

    // 只改 mood，其他字段必须保持原样。
    // 若误用 applyMorningSetup 实现此功能，focus 会被清成 null。
    const after = await repo.days.updateState(date, { mood: "good" });
    expect(after.mood).toBe("good");
    expect(after.focus).toBe("工作太多了");
  });

  it("显式传 null 才清空，不传则不动", async () => {
    const { repo, toDayKey, addDays } = await load();
    const date = addDays(toDayKey(), 21);

    await repo.days.applyMorningSetup(date, {
      mood: "good",
      focus: "写完存储层",
    });

    const cleared = await repo.days.updateState(date, { focus: null });
    expect(cleared.focus).toBeNull();
    expect(cleared.mood).toBe("good"); // 没传的不动
  });

  it("已反思的一天改状态不会让 status 倒退", async () => {
    const { repo, toDayKey, addDays } = await load();
    const date = addDays(toDayKey(), 22);

    await repo.days.applyMorningSetup(date, {
      mood: "okay",
      focus: null,
    });
    await repo.days.markReflected(date);

    const after = await repo.days.updateState(date, { mood: "good" });
    expect(after.status).toBe("reflected");
    expect(after.mood).toBe("good");
  });
});

describe("Day 晚间反思", () => {
  it("写入三项并推进到 reflected", async () => {
    const { repo, toDayKey, addDays } = await load();
    const date = addDays(toDayKey(), 300);
    await repo.days.ensure(date);

    const d = await repo.days.saveReflection(date, {
      eveningMood: "good",
      stayedWithYou: "下午那通电话",
      learned: "先问清楚再动手",
    });

    expect(d.eveningMood).toBe("good");
    expect(d.stayedWithYou).toBe("下午那通电话");
    expect(d.learned).toBe("先问清楚再动手");
    expect(d.reflectedAt).not.toBeNull();
    expect(d.status).toBe("reflected");
  });

  it("不覆盖早上的 mood —— 两个一起看才有一天的走向", async () => {
    const { repo, toDayKey, addDays } = await load();
    const date = addDays(toDayKey(), 301);
    await repo.days.ensure(date);
    await repo.days.applyMorningSetup(date, {
      mood: "bad",
      focus: "撑过今天",
    });

    const d = await repo.days.saveReflection(date, { eveningMood: "good" });
    expect(d.mood).toBe("bad"); // 早上的还在
    expect(d.eveningMood).toBe("good");
    expect(d.focus).toBe("撑过今天"); // focus 也不能被清掉
  });

  it("交了就锁住：第二次写入被拒绝", async () => {
    const { repo, toDayKey, addDays } = await load();
    const date = addDays(toDayKey(), 302);
    await repo.days.ensure(date);

    await repo.days.saveReflection(date, { stayedWithYou: "当时真实的想法" });

    // 反思存的是那一刻的想法，不该被日后的自己修饰。
    // 约束必须在 repo 层，UI 隐藏表单挡不住并发提交或多标签页。
    await expect(
      repo.days.saveReflection(date, { stayedWithYou: "改过的说法" }),
    ).rejects.toThrow();

    const d = await repo.days.find(date);
    expect(d?.stayedWithYou).toBe("当时真实的想法");
  });

  it("三项全跳过也能提交", async () => {
    const { repo, toDayKey, addDays } = await load();
    const date = addDays(toDayKey(), 303);
    await repo.days.ensure(date);

    // IA 第 21 节：每个问题都能跳过。什么都不写也是一种回答。
    const d = await repo.days.saveReflection(date, {});
    expect(d.eveningMood).toBeNull();
    expect(d.stayedWithYou).toBeNull();
    expect(d.learned).toBeNull();
    expect(d.reflectedAt).not.toBeNull(); // 但确实反思过了
    expect(d.status).toBe("reflected");
  });

  it("空白字符串归一为 null", async () => {
    const { repo, toDayKey, addDays } = await load();
    const date = addDays(toDayKey(), 304);
    await repo.days.ensure(date);

    const d = await repo.days.saveReflection(date, {
      stayedWithYou: "   ",
      learned: "\n\n",
    });
    expect(d.stayedWithYou).toBeNull();
    expect(d.learned).toBeNull();
  });

  it("没走过 Morning Setup 的一天也能直接反思", async () => {
    const { repo, toDayKey, addDays } = await load();
    const date = addDays(toDayKey(), 305);
    const d0 = await repo.days.ensure(date);
    expect(d0.status).toBe("not_started");

    // 早上没打开 app、晚上想记两句。状态机只允许逐跳前进，
    // 中间的跳必须补齐，否则会出现 reflectedAt 已写而 status
    // 还停在 not_started 的矛盾状态。
    const d = await repo.days.saveReflection(date, { eveningMood: "okay" });
    expect(d.status).toBe("reflected");
    expect(d.reflectedAt).not.toBeNull();
  });

  it("已 ready_to_reflect 的一天可以正常反思", async () => {
    const { repo, toDayKey, addDays } = await load();
    const date = addDays(toDayKey(), 306);
    await repo.days.ensure(date);
    await repo.days.markReadyToReflect(date);

    const d = await repo.days.saveReflection(date, { learned: "别硬撑" });
    expect(d.status).toBe("reflected");
    expect(d.learned).toBe("别硬撑");
  });
});

describe("Day 顺延提示", () => {
  it("dismissCarry 落库，刷新后不再问", async () => {
    const { repo, toDayKey, addDays } = await load();
    const date = addDays(toDayKey(), 310);

    const d0 = await repo.days.ensure(date);
    expect(d0.carryDismissed).toBe(false);

    await repo.days.dismissCarry(date);

    // 关键：重新读取仍为 true。只存客户端状态的话刷新就丢了，
    // 提示会反复冒出来。
    const d1 = await repo.days.find(date);
    expect(d1?.carryDismissed).toBe(true);
  });

  it("dismissCarry 不影响其他字段", async () => {
    const { repo, toDayKey, addDays } = await load();
    const date = addDays(toDayKey(), 311);
    await repo.days.ensure(date);
    await repo.days.applyMorningSetup(date, {
      mood: "good",
      focus: "写完那份东西",
    });

    const d = await repo.days.dismissCarry(date);
    expect(d.mood).toBe("good");
    expect(d.focus).toBe("写完那份东西");
    expect(d.status).toBe("started");
  });
});

describe("Day 月度摘要", () => {
  it("包含只有 Moment 而没有 Day 行的日期", async () => {
    const { repo, toDayKey, toMonthKey, addDays } = await load();

    // 选一个远离其他用例的月份，避免相互干扰
    const anchor = addDays(toDayKey(), 400);
    const month = toMonthKey(anchor);

    // A 日：走 Morning Setup，有 Day 行
    const withDay = `${month}-10`;
    await repo.days.applyMorningSetup(withDay, {
      mood: "good",
      focus: "有 focus",
    });

    // B 日：只有 Moment。Quick Capture 不调 ensure()，所以没有 Day 行
    const onlyMoments = `${month}-11`;
    const at = new Date(
      Number(month.slice(0, 4)),
      Number(month.slice(5, 7)) - 1,
      11,
      10,
      0,
    );
    await repo.moments.capture({ content: "只有记录没有 Day 行" }, at);
    await repo.moments.capture({ content: "同一天第二条" }, at);
    expect(await repo.days.find(onlyMoments)).toBeNull();

    const summaries = await repo.days.listMonth(month);
    const byDate = new Map(summaries.map((s) => [s.date, s]));

    const a = byDate.get(withDay);
    expect(a?.mood).toBe("good");
    expect(a?.hasFocus).toBe(true);
    expect(a?.status).toBe("started");

    // 关键：这一天不能从日历上消失
    const b = byDate.get(onlyMoments);
    expect(b).toBeDefined();
    expect(b?.momentCount).toBe(2);
    expect(b?.mood).toBeNull();
    expect(b?.status).toBeNull();

    // 按日期升序
    expect(summaries.map((s) => s.date)).toEqual(
      [...summaries.map((s) => s.date)].sort(),
    );
  });

  it("不返回月份之外的日期", async () => {
    const { repo, toDayKey, toMonthKey, addDays, addMonths } = await load();
    const anchor = addDays(toDayKey(), 800);
    const month = toMonthKey(anchor);
    const nextMonth = addMonths(month, 1);

    await repo.days.ensure(`${month}-15`);
    await repo.days.ensure(`${nextMonth}-15`);

    const dates = (await repo.days.listMonth(month)).map((s) => s.date);
    expect(dates).toContain(`${month}-15`);
    expect(dates).not.toContain(`${nextMonth}-15`);
  });
});

describe("Moment", () => {
  it("capture 默认值与查询", async () => {
    const { repo, toDayKey } = await load();
    const today = toDayKey();

    const m = await repo.moments.capture({ content: "第一条想法" });
    expect(m.type).toBe("thought");
    expect(m.status).toBe("saved");
    expect(m.date).toBe(today);

    await repo.moments.capture({ content: "第二条", type: "diary" });
    const list = await repo.moments.listByDate(today);
    expect(list).toHaveLength(2);
    expect(list[0].occurredAt.getTime()).toBeGreaterThanOrEqual(
      list[1].occurredAt.getTime(),
    );
    expect(await repo.moments.countByDate(today)).toBe(2);
  });

  it("允许空内容：纯图片 moment 先建行、后关联图片", async () => {
    const { repo } = await load();

    // capture() 的入参里没有图片 —— 图片是 moment 建好之后才插 momentMedia 的。
    // 所以「不能既没文字又没图片」这条规则在这一层无法判断，只能放 action 层。
    // 这里放开是为了支持「只上传图片」，不是放弃校验。
    const m = await repo.moments.capture({ content: "   " });
    expect(m.content).toBe("");
  });

  it("删除是硬删除", async () => {
    const { repo, toDayKey } = await load();
    const today = toDayKey();
    const before = await repo.moments.countByDate(today);
    const m = await repo.moments.capture({ content: "待删除" });
    await repo.moments.remove(m.id);
    expect(await repo.moments.find(m.id)).toBeNull();
    expect(await repo.moments.countByDate(today)).toBe(before);
  });

  it("凌晨 2:30 归属前一天", async () => {
    const { repo, toDayKey, previousDay } = await load();
    const at = new Date();
    at.setHours(2, 30, 0, 0);
    const m = await repo.moments.capture({ content: "凌晨两点半" }, at);
    // at 当天的 09:00 对应的 DayKey 才是「自然日」，凌晨应落在它前一天
    const natural = new Date(at);
    natural.setHours(9, 0, 0, 0);
    expect(m.date).toBe(previousDay(toDayKey(natural)));
  });
});

describe("Plan", () => {
  it("排序、状态流转与非法流转拦截", async () => {
    const { repo, toDayKey, InvalidTransitionError } = await load();
    const today = toDayKey();
    await repo.days.ensure(today);

    const p1 = await repo.plans.create({
      date: today,
      title: "Deep Work",
      kind: "focus",
      status: "planned",
      startAt: "09:30",
      durationMin: 120,
      fromAi: true,
      goalId: null,
    });
    const p2 = await repo.plans.create({
      date: today,
      title: "Gym",
      kind: "life",
      status: "planned",
      startAt: "18:30",
      durationMin: null,
      fromAi: false,
      goalId: null,
    });

    const plans = await repo.plans.listByDate(today);
    expect(plans).toHaveLength(2);
    expect(plans[0].startAt).toBe("09:30");
    expect(p2.sortOrder).toBe(p1.sortOrder + 1);

    const done = await repo.plans.setStatus(p1.id, "completed");
    expect(done.status).toBe("completed");

    await expect(repo.plans.setStatus(p1.id, "skipped")).rejects.toThrow(
      InvalidTransitionError,
    );
  });

  it("不定时的项排在有时间的项之后", async () => {
    const { repo, toDayKey, addDays } = await load();
    // 用另一天，避免和上一个用例的数据混在一起
    const date = addDays(toDayKey(), 3);
    await repo.days.ensure(date);

    const base = {
      date,
      kind: "work" as const,
      status: "planned" as const,
      durationMin: null,
      fromAi: false,
      goalId: null,
    };

    // 故意先插无时间的，模拟真实录入顺序
    await repo.plans.create({ ...base, title: "报销车票", startAt: null });
    await repo.plans.create({ ...base, title: "申请住房补贴", startAt: null });
    await repo.plans.create({ ...base, title: "下午的会", startAt: "14:00" });
    await repo.plans.create({ ...base, title: "早会", startAt: "09:30" });

    const list = await repo.plans.listByDate(date);
    expect(list.map((p) => p.title)).toEqual([
      "早会",
      "下午的会",
      "报销车票",
      "申请住房补贴",
    ]);
  });
});

describe("Plan 优先级", () => {
  const base = {
    kind: "work" as const,
    status: "planned" as const,
    durationMin: null,
    fromAi: false,
    goalId: null,
  };

  it("不定时的项之间按优先级排序", async () => {
    const { repo, toDayKey, addDays } = await load();
    const date = addDays(toDayKey(), 100);
    await repo.days.ensure(date);

    // 故意按 low → high 的顺序插入，验证排序不是靠录入顺序
    await repo.plans.create({
      ...base, date, title: "低", startAt: null, priority: "low",
    });
    await repo.plans.create({
      ...base, date, title: "普通", startAt: null, priority: "normal",
    });
    await repo.plans.create({
      ...base, date, title: "高", startAt: null, priority: "high",
    });

    const list = await repo.plans.listByDate(date);
    expect(list.map((p) => p.title)).toEqual(["高", "普通", "低"]);
  });

  it("优先级不打乱有时间的项", async () => {
    const { repo, toDayKey, addDays } = await load();
    const date = addDays(toDayKey(), 101);
    await repo.days.ensure(date);

    // 低优先级的早会必须留在低优先级的位置之前 —— 时间优先于优先级，
    // 09:30 的会不该因为标了 low 就被挪到下午之后。
    await repo.plans.create({
      ...base, date, title: "早会", startAt: "09:30", priority: "low",
    });
    await repo.plans.create({
      ...base, date, title: "下午的会", startAt: "14:00", priority: "high",
    });
    await repo.plans.create({
      ...base, date, title: "不定时高优先", startAt: null, priority: "high",
    });

    const list = await repo.plans.listByDate(date);
    expect(list.map((p) => p.title)).toEqual([
      "早会",
      "下午的会",
      "不定时高优先",
    ]);
  });

  it("默认是 normal，可改", async () => {
    const { repo, toDayKey, addDays } = await load();
    const date = addDays(toDayKey(), 102);
    await repo.days.ensure(date);

    const p = await repo.plans.create({
      ...base, date, title: "没指定优先级", startAt: null,
    });
    expect(p.priority).toBe("normal");
    expect(p.carryCount).toBe(0);
    expect(p.carriedFromId).toBeNull();

    const bumped = await repo.plans.update(p.id, { priority: "high" });
    expect(bumped.priority).toBe("high");
  });
});

describe("Plan 顺延", () => {
  const base = {
    kind: "work" as const,
    durationMin: null,
    fromAi: false,
    goalId: null,
  };

  it("复制而非搬移：源日期保留原记录", async () => {
    const { repo, toDayKey, addDays } = await load();
    const from = addDays(toDayKey(), 120);
    const to = addDays(toDayKey(), 121);
    await repo.days.ensure(from);

    const src = await repo.plans.create({
      ...base, date: from, title: "没做完的事", status: "planned",
      startAt: "09:30", priority: "high",
    });

    const res = await repo.plans.carryOverUnfinished(to);
    expect(res).toEqual({ count: 1, from });

    // 关键：源行必须还在原来那天，状态不变。
    // 若实现改的是源行的 date，昨天的 Day 视图会显示这件事从未存在过。
    const sourceDay = await repo.plans.listByDate(from);
    expect(sourceDay).toHaveLength(1);
    expect(sourceDay[0].id).toBe(src.id);
    expect(sourceDay[0].date).toBe(from);
    expect(sourceDay[0].status).toBe("planned");

    const carried = await repo.plans.listByDate(to);
    expect(carried).toHaveLength(1);
    expect(carried[0].id).not.toBe(src.id);
    expect(carried[0].title).toBe("没做完的事");
    expect(carried[0].carriedFromId).toBe(src.id);
    expect(carried[0].carryCount).toBe(1);
    expect(carried[0].priority).toBe("high"); // 优先级带过来
    expect(carried[0].startAt).toBeNull(); // 时间不带过来
  });

  it("只顺延未完成的：completed 和 skipped 不动", async () => {
    const { repo, toDayKey, addDays } = await load();
    const from = addDays(toDayKey(), 130);
    const to = addDays(toDayKey(), 131);
    await repo.days.ensure(from);

    await repo.plans.create({
      ...base, date: from, title: "该顺延", status: "planned", startAt: null,
    });
    await repo.plans.create({
      ...base, date: from, title: "已完成", status: "completed", startAt: null,
    });
    // 跳过是用户主动决定不做，顺延它等于否认那个决定
    await repo.plans.create({
      ...base, date: from, title: "已跳过", status: "skipped", startAt: null,
    });

    const res = await repo.plans.carryOverUnfinished(to);
    expect(res.count).toBe(1);

    const carried = await repo.plans.listByDate(to);
    expect(carried.map((p) => p.title)).toEqual(["该顺延"]);
  });

  it("in_progress 顺延后重置为 planned", async () => {
    const { repo, toDayKey, addDays } = await load();
    const from = addDays(toDayKey(), 135);
    const to = addDays(toDayKey(), 136);
    await repo.days.ensure(from);

    const src = await repo.plans.create({
      ...base, date: from, title: "做了一半", status: "planned", startAt: null,
    });
    await repo.plans.setStatus(src.id, "in_progress");

    await repo.plans.carryOverUnfinished(to);
    const carried = await repo.plans.listByDate(to);
    // 新的一天还没动过，显示成「正在做」是假的
    expect(carried[0].status).toBe("planned");
  });

  it("幂等：重复调用不会重复生成", async () => {
    const { repo, toDayKey, addDays } = await load();
    const from = addDays(toDayKey(), 140);
    const to = addDays(toDayKey(), 141);
    await repo.days.ensure(from);

    await repo.plans.create({
      ...base, date: from, title: "只该出现一次", status: "planned", startAt: null,
    });

    const first = await repo.plans.carryOverUnfinished(to);
    expect(first.count).toBe(1);

    const second = await repo.plans.carryOverUnfinished(to);
    expect(second.count).toBe(0);

    expect(await repo.plans.listByDate(to)).toHaveLength(1);
  });

  it("隔了几天没打开也能接上", async () => {
    const { repo, toDayKey, addDays } = await load();
    const from = addDays(toDayKey(), 145);
    const to = addDays(toDayKey(), 148); // 中间隔了两天
    await repo.days.ensure(from);

    await repo.plans.create({
      ...base, date: from, title: "三天前没做完的", status: "planned", startAt: null,
    });

    const res = await repo.plans.carryOverUnfinished(to);
    expect(res).toEqual({ count: 1, from });
  });

  it("超过回溯上限就不再顺延", async () => {
    const { repo, toDayKey, addDays } = await load();
    const from = addDays(toDayKey(), 150);
    const to = addDays(toDayKey(), 160); // 相隔 10 天 > 默认 7 天
    await repo.days.ensure(from);

    await repo.plans.create({
      ...base, date: from, title: "太久以前的", status: "planned", startAt: null,
    });

    const res = await repo.plans.carryOverUnfinished(to);
    expect(res).toEqual({ count: 0, from: null });
    expect(await repo.plans.listByDate(to)).toHaveLength(0);
  });

  it("carryCount 会累加", async () => {
    const { repo, toDayKey, addDays } = await load();
    const d1 = addDays(toDayKey(), 170);
    const d2 = addDays(toDayKey(), 171);
    const d3 = addDays(toDayKey(), 172);
    await repo.days.ensure(d1);

    await repo.plans.create({
      ...base, date: d1, title: "一直没做的事", status: "planned", startAt: null,
    });

    await repo.plans.carryOverUnfinished(d2);
    await repo.plans.carryOverUnfinished(d3);

    const day3 = await repo.plans.listByDate(d3);
    expect(day3).toHaveLength(1);
    // 顺延两次，用户该看到这件事跟了自己 2 天
    expect(day3[0].carryCount).toBe(2);
  });

  it("没有可顺延的项时返回 0", async () => {
    const { repo, toDayKey, addDays } = await load();
    const to = addDays(toDayKey(), 200);
    const res = await repo.plans.carryOverUnfinished(to);
    expect(res).toEqual({ count: 0, from: null });
  });

  it("peekCarryable 不写库，且与实际顺延数量一致", async () => {
    const { repo, toDayKey, addDays } = await load();
    const from = addDays(toDayKey(), 210);
    const to = addDays(toDayKey(), 211);
    await repo.days.ensure(from);

    await repo.plans.create({
      ...base, date: from, title: "甲", status: "planned", startAt: null,
    });
    await repo.plans.create({
      ...base, date: from, title: "乙", status: "planned", startAt: null,
    });

    const peek = await repo.plans.peekCarryable(to);
    expect(peek).toEqual({ count: 2, from });

    // 探测过后目标日必须还是空的 —— 否则「有没有可顺延的」这个问题
    // 本身就会造成顺延
    expect(await repo.plans.listByDate(to)).toHaveLength(0);

    // 探测数量必须等于实际顺延数量
    const actual = await repo.plans.carryOverUnfinished(to);
    expect(actual.count).toBe(peek.count);

    // 顺延完再探测应为 0
    expect((await repo.plans.peekCarryable(to)).count).toBe(0);
  });
});

describe("Goal", () => {
  it("draft → active，非法流转被拒", async () => {
    const { repo, toDayKey, InvalidTransitionError } = await load();
    const g = await repo.goals.create({
      title: "完成论文",
      description: "想给这段研究一个交代",
      type: "能把一件事做完的人",
      priority: 3,
      startDate: toDayKey(),
      targetDate: null,
      completedDate: null,
      parentGoalId: null,
    });
    expect(g.status).toBe("draft");

    const active = await repo.goals.setStatus(g.id, "active");
    expect(active.status).toBe("active");
    expect(await repo.goals.listActive()).toHaveLength(1);

    await expect(repo.goals.setStatus(g.id, "draft")).rejects.toThrow(
      InvalidTransitionError,
    );
  });
});

describe("Memory", () => {
  it("forget 后移出视图但保留行", async () => {
    const { repo, InvalidTransitionError } = await load();
    const mem = await repo.memories.create({
      content: "你目前最关注职业发展",
      category: "identity",
      sourceIds: [],
      confidence: 0.7,
      importance: 4,
      userConfirmed: false,
    });
    expect(mem.status).toBe("candidate");
    // candidate 尚未确认，不该出现在用户视图
    expect(await repo.memories.listVisible()).toHaveLength(0);

    const confirmed = await repo.memories.confirm(mem.id);
    expect(confirmed.status).toBe("confirmed");
    expect(confirmed.userConfirmed).toBe(true);
    expect(await repo.memories.listVisible()).toHaveLength(1);

    const forgotten = await repo.memories.forget(mem.id);
    expect(forgotten.status).toBe("forgotten");
    expect(await repo.memories.listVisible()).toHaveLength(0);
    // 行必须还在：AI 需要知道这条被否决过，否则会重新推断出来
    expect(await repo.memories.listByStatus("forgotten")).toHaveLength(1);

    await expect(repo.memories.confirm(mem.id)).rejects.toThrow(
      InvalidTransitionError,
    );
  });
});

describe("Insight", () => {
  it("findDaily 与评分", async () => {
    const { repo, toDayKey } = await load();
    const today = toDayKey();
    expect(await repo.insights.findDaily(today)).toBeNull();

    const ins = await repo.insights.create({
      type: "daily",
      title: "今天你把注意力守住了",
      content: "两次分心都被你拉回来了。",
      evidenceIds: [],
      confidence: 0.6,
      rangeStart: today,
      rangeEnd: today,
      userFeedback: "unrated",
    });
    expect((await repo.insights.findDaily(today))?.id).toBe(ins.id);

    const rated = await repo.insights.rate(ins.id, "accurate");
    expect(rated.userFeedback).toBe("accurate");
  });
});

describe("Export", () => {
  it("导出包含全部实体与版本号", async () => {
    const { repo } = await load();
    const dump = await repo.exports.exportAll();
    expect(dump.schemaVersion).toBe(1);
    expect(dump.user).toBeTruthy();
    expect(dump.days.length).toBeGreaterThan(0);
    expect(dump.moments.length).toBeGreaterThan(0);
    expect(dump.goals.length).toBeGreaterThan(0);
    // forgotten 的 memory 也要能导出：用户有权看到全部数据
    expect(dump.memories.length).toBeGreaterThan(0);
    expect(dump.insights.length).toBeGreaterThan(0);
    expect(() => JSON.stringify(dump)).not.toThrow();
  });
});
