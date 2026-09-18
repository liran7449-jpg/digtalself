/**
 * 跨用户数据隔离测试。
 *
 * ⚠️ 这是多用户改造里唯一真正的安全网，别删、别 skip。
 *
 * 为什么需要它：显式传 userId 参数只能保证参数**传到位**，
 * 保证不了参数**被用上** —— repository 里忘写一个 where，
 * TypeScript 一样编译通过，页面一样正常渲染，测试一样全绿。
 * 唯一能抓住这种漏洞的办法就是建两个用户、各塞数据，
 * 然后断言 A 的每个读取方法都拿不到 B 的任何一行。
 *
 * 这个产品存的是日记、私密照片、对人的评价（规范 §6）。
 * 漏一个 where 不是显示错误，是把一个人的人生记录端给另一个人，
 * 而且页面看起来完全正常，没人会发现。
 *
 * 加新的 repository 方法时，必须在这里补一条对应断言。
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { dropTempDb, useTempDb } from "./test-setup";

let tmpDir: string;

/** 两个用户：alice 是 'me'（历史数据归属），bob 是后来建的号。 */
const ALICE = "me";
const BOB = "01BOBBOBBOBBOBBOBBOBBOBBOB";

beforeAll(async () => {
  tmpDir = await useTempDb();
});
afterAll(() => {
  dropTempDb(tmpDir);
});

const load = async () => {
  const { repoFor } = await import("./index");
  const dayKey = await import("@/domain/day-key");
  return { repoFor, ...dayKey };
};

/** 建 bob 这个用户，并给两人各塞一份数据。 */
async function seed() {
  const { repoFor } = await load();
  const alice = repoFor(ALICE);
  const bob = repoFor(BOB);

  // bob 的用户行（alice 的由 test-setup 建好）
  await alice.users.create({
    username: "bob",
    password: "bob-password-123",
  });
  // create 用 ULID 生成 id，这里需要固定 id 方便断言，直接补一行
  const { db } = await import("@/db/client");
  const { users } = await import("@/db/schema");
  await db.insert(users).values({ id: BOB, username: "bob-fixed" }).onConflictDoNothing();

  return { alice, bob };
}

describe("跨用户隔离", () => {
  it("Moment：各自只看到自己的", async () => {
    const { repoFor, toDayKey } = await load();
    await seed();
    const alice = repoFor(ALICE);
    const bob = repoFor(BOB);
    const date = toDayKey();

    const aliceMoment = await alice.moments.capture({
      content: "alice 的私密日记",
      type: "thought",
    });
    const bobMoment = await bob.moments.capture({
      content: "bob 的私密日记",
      type: "thought",
    });

    // list
    const aliceList = await alice.moments.list();
    expect(aliceList.map((m) => m.id)).toContain(aliceMoment.id);
    expect(aliceList.map((m) => m.id)).not.toContain(bobMoment.id);
    expect(aliceList.some((m) => m.content.includes("bob"))).toBe(false);

    // listByDate
    const aliceByDate = await alice.moments.listByDate(date);
    expect(aliceByDate.map((m) => m.id)).not.toContain(bobMoment.id);

    // find：拿到别人的 id 也不能读出来
    expect(await alice.moments.find(bobMoment.id)).toBeNull();
    expect(await bob.moments.find(aliceMoment.id)).toBeNull();

    // countByDate 不能把别人的算进来
    expect(await alice.moments.countByDate(date)).toBe(1);
    expect(await bob.moments.countByDate(date)).toBe(1);

    // remove：不能删别人的
    await expect(alice.moments.remove(bobMoment.id)).rejects.toThrow();
    expect(await bob.moments.find(bobMoment.id)).not.toBeNull();

    // update：不能改别人的
    await expect(
      alice.moments.update(bobMoment.id, { content: "被篡改" }),
    ).rejects.toThrow();
  });

  it("Day：同一天两个用户各自独立", async () => {
    const { repoFor, toDayKey } = await load();
    const alice = repoFor(ALICE);
    const bob = repoFor(BOB);
    const date = toDayKey();

    await alice.days.ensure(date);
    await bob.days.ensure(date);

    await alice.days.updateState(date, { focus: "alice 的重点" });
    await bob.days.updateState(date, { focus: "bob 的重点" });

    const aliceDay = await alice.days.find(date);
    const bobDay = await bob.days.find(date);
    expect(aliceDay?.focus).toBe("alice 的重点");
    expect(bobDay?.focus).toBe("bob 的重点");

    // recent 不能混
    const aliceRecent = await alice.days.recent(30);
    expect(aliceRecent.every((d) => d.focus !== "bob 的重点")).toBe(true);

    // listMonth 的 momentCount 不能把别人的 moment 算进来
    const month = date.slice(0, 7);
    const aliceMonth = await alice.days.listMonth(month);
    const bobMonth = await bob.days.listMonth(month);
    const aliceToday = aliceMonth.find((d) => d.date === date);
    const bobToday = bobMonth.find((d) => d.date === date);
    expect(aliceToday?.momentCount).toBe(1);
    expect(bobToday?.momentCount).toBe(1);
  });

  it("Plan：各自只看到自己的", async () => {
    const { repoFor, toDayKey } = await load();
    const alice = repoFor(ALICE);
    const bob = repoFor(BOB);
    const date = toDayKey();

    const planBase = {
      date,
      kind: "work" as const,
      status: "planned" as const,
      startAt: null,
      durationMin: null,
      fromAi: false,
      goalId: null,
    };
    const alicePlan = await alice.plans.create({ ...planBase, title: "alice 的计划" });
    const bobPlan = await bob.plans.create({ ...planBase, title: "bob 的计划" });

    const aliceList = await alice.plans.listByDate(date);
    expect(aliceList.map((p) => p.id)).toContain(alicePlan.id);
    expect(aliceList.map((p) => p.id)).not.toContain(bobPlan.id);

    await expect(alice.plans.remove(bobPlan.id)).rejects.toThrow();
    await expect(alice.plans.setStatus(bobPlan.id, "completed")).rejects.toThrow();
  });

  it("Goal：各自只看到自己的", async () => {
    const { repoFor } = await load();
    const alice = repoFor(ALICE);
    const bob = repoFor(BOB);

    const goalBase = {
      description: null,
      type: "personal",
      priority: 3,
      startDate: null,
      targetDate: null,
      completedDate: null,
      parentGoalId: null,
    };
    const aliceGoal = await alice.goals.create({ ...goalBase, title: "alice 的目标" });
    const bobGoal = await bob.goals.create({ ...goalBase, title: "bob 的目标" });

    const aliceList = await alice.goals.list();
    expect(aliceList.map((g) => g.id)).toContain(aliceGoal.id);
    expect(aliceList.map((g) => g.id)).not.toContain(bobGoal.id);

    expect(await alice.goals.find(bobGoal.id)).toBeNull();
    await expect(alice.goals.remove(bobGoal.id)).rejects.toThrow();
  });

  it("Person / Place / Topic：同名也不共享", async () => {
    const { repoFor } = await load();
    const alice = repoFor(ALICE);
    const bob = repoFor(BOB);

    // 关键：同名。findOrCreate 不能把 bob 的「妈妈」返回给 alice
    const alicePerson = await alice.people.findOrCreate("妈妈");
    const bobPerson = await bob.people.findOrCreate("妈妈");
    expect(alicePerson.id).not.toBe(bobPerson.id);

    expect((await alice.people.list()).map((p) => p.id)).not.toContain(bobPerson.id);
    expect(await alice.people.findById(bobPerson.id)).toBeNull();
    expect((await alice.people.findByName("妈妈"))?.id).toBe(alicePerson.id);

    const alicePlace = await alice.places.findOrCreate("家");
    const bobPlace = await bob.places.findOrCreate("家");
    expect(alicePlace.id).not.toBe(bobPlace.id);
    expect((await alice.places.list()).map((p) => p.id)).not.toContain(bobPlace.id);
    expect(await alice.places.findById(bobPlace.id)).toBeNull();

    const aliceTopic = await alice.topics.findOrCreate("工作");
    const bobTopic = await bob.topics.findOrCreate("工作");
    expect(aliceTopic.id).not.toBe(bobTopic.id);
    expect((await alice.topics.list()).map((t) => t.id)).not.toContain(bobTopic.id);
    expect(await alice.topics.findById(bobTopic.id)).toBeNull();
  });

  it("Media：拿到别人的 id 也读不到（照片是最敏感的）", async () => {
    const { repoFor } = await load();
    const alice = repoFor(ALICE);
    const bob = repoFor(BOB);
    const sharp = (await import("sharp")).default;

    const png = await sharp({
      create: { width: 8, height: 8, channels: 3, background: "#333" },
    })
      .png()
      .toBuffer();

    const aliceMedia = await alice.media.create({
      file: png,
      type: "image/png",
      size: png.length,
    });
    const bobMedia = await bob.media.create({
      file: png,
      type: "image/png",
      size: png.length,
    });

    // findById 是 /api/v1/media/[id] 的入口，这条断言直接对应
    // 「换个 id 就能拿别人照片」那个漏洞
    expect(await alice.media.findById(bobMedia.id)).toBeNull();
    expect(await bob.media.findById(aliceMedia.id)).toBeNull();

    // 存储路径也要按用户分区
    expect(aliceMedia.storageKey.startsWith(`${ALICE}/`)).toBe(true);
    expect(bobMedia.storageKey.startsWith(`${BOB}/`)).toBe(true);

    await expect(alice.media.delete(bobMedia.id)).rejects.toThrow();
  });

  it("Memory：各自只看到自己的", async () => {
    const { repoFor } = await load();
    const alice = repoFor(ALICE);
    const bob = repoFor(BOB);

    const memBase = {
      category: "experience" as const,
      sourceIds: [],
      confidence: 1,
      importance: 3,
      userConfirmed: true,
    };
    const aliceMem = await alice.memories.create({
      ...memBase,
      content: "alice 的记忆",
    });
    const bobMem = await bob.memories.create({ ...memBase, content: "bob 的记忆" });

    const aliceVisible = await alice.memories.listVisible();
    expect(aliceVisible.map((m) => m.id)).not.toContain(bobMem.id);
    expect((await alice.memories.listByStatus("candidate")).map((m) => m.id)).not.toContain(
      bobMem.id,
    );
    await expect(alice.memories.forget(bobMem.id)).rejects.toThrow();
    expect(aliceMem.id).not.toBe(bobMem.id);
  });

  it("Export：导出只包含自己的数据（§32 最危险的一条路径）", async () => {
    const { repoFor } = await load();
    const alice = repoFor(ALICE);

    const dump = await alice.exports.exportAll();

    // 一条 bob 的数据都不该出现
    const json = JSON.stringify(dump);
    expect(json).not.toContain("bob 的私密日记");
    expect(json).not.toContain("bob 的计划");
    expect(json).not.toContain("bob 的目标");
    expect(json).not.toContain("bob 的记忆");
    expect(dump.user.id).toBe(ALICE);
    expect(dump.moments.every((m) => !m.content.includes("bob"))).toBe(true);
  });
});
