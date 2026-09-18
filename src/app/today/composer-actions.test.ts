/**
 * createMomentWithMedia 的守卫测试。
 *
 * 「不能既没文字又没图片」这条规则只能在这一层判断 ——
 * repo.capture() 的入参里没有图片，图片是 moment 建好之后才关联的。
 * 所以规则从 schema 移到了这里，测试也必须跟过来。
 */

import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { dropTempDb, useTempDb } from "@/repositories/test-setup";

// revalidatePath 只在 Next 请求上下文里有效，测试里换成空实现
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));

let tmpDir: string;
beforeAll(async () => {
  tmpDir = await useTempDb();
});
afterAll(() => {
  dropTempDb(tmpDir);
});

const load = async () => {
  const { createMomentWithMedia } = await import("./composer-actions");
  const { repo } = await import("@/repositories");
  return { createMomentWithMedia, repo };
};

/**
 * 造一个能通过 `value instanceof File` 且 sharp 能真正解码的图片。
 * 手写 base64 容易得到损坏的 PNG（踩过：libpng read error），用 sharp 生成。
 */
async function fakeImage(name = "a.png"): Promise<File> {
  const sharp = (await import("sharp")).default;
  const png = await sharp({
    create: { width: 40, height: 30, channels: 3, background: { r: 10, g: 120, b: 200 } },
  })
    .png()
    .toBuffer();
  return new File([png], name, { type: "image/png" });
}

describe("createMomentWithMedia 守卫", () => {
  it("既没文字又没图片时拒绝，且不留下空 moment", async () => {
    const { createMomentWithMedia, repo } = await load();
    const before = (await repo.moments.list({ limit: 1000 })).length;

    const fd = new FormData();
    fd.append("content", "   "); // 只有空白
    // 不 append 任何 image_*

    const res = await createMomentWithMedia(fd);
    expect(res.ok).toBe(false);
    expect(res.error).toBeTruthy();

    // 关键：拒绝之后不能有半条记录留在库里
    const after = (await repo.moments.list({ limit: 1000 })).length;
    expect(after).toBe(before);
  });

  it("只有文字可以创建", async () => {
    const { createMomentWithMedia, repo } = await load();

    const fd = new FormData();
    fd.append("content", "只写了一句话");

    const res = await createMomentWithMedia(fd);
    expect(res.ok).toBe(true);

    const all = await repo.moments.list({ limit: 1000 });
    expect(all.some((m) => m.content === "只写了一句话")).toBe(true);
  });

  it("只有图片、没有文字也可以创建，并且图片被关联上", async () => {
    const { createMomentWithMedia, repo } = await load();

    const fd = new FormData();
    fd.append("content", ""); // 明确无文字
    fd.append("image_0", await fakeImage());

    const res = await createMomentWithMedia(fd);
    expect(res.ok).toBe(true);

    // 找到刚建的那条空文字 moment
    const all = await repo.moments.list({ limit: 1000 });
    const empty = all.filter((m) => m.content === "");
    expect(empty.length).toBeGreaterThan(0);

    // 图片必须真的关联上了，否则就是一条什么都没有的空记录
    const withMedia = await Promise.all(
      empty.map(async (m) => (await repo.media.listByMoment(m.id)).length),
    );
    expect(withMedia.some((n) => n > 0)).toBe(true);
  });

  it("文字和图片可以同时提交", async () => {
    const { createMomentWithMedia, repo } = await load();

    const fd = new FormData();
    fd.append("content", "配图的一条");
    fd.append("image_0", await fakeImage("b.png"));

    const res = await createMomentWithMedia(fd);
    expect(res.ok).toBe(true);

    const all = await repo.moments.list({ limit: 1000 });
    const m = all.find((x) => x.content === "配图的一条");
    expect(m).toBeDefined();
    expect((await repo.media.listByMoment(m!.id)).length).toBe(1);
  });

  it("人物 / 地点 / 话题一起提交时都被关联", async () => {
    const { createMomentWithMedia, repo } = await load();

    const fd = new FormData();
    fd.append("content", "带关联的一条");
    fd.append("people", JSON.stringify(["老王"]));
    fd.append("places", JSON.stringify(["三里屯"]));
    fd.append("topics", JSON.stringify(["编程"]));

    const res = await createMomentWithMedia(fd);
    expect(res.ok).toBe(true);

    const all = await repo.moments.list({ limit: 1000 });
    const m = all.find((x) => x.content === "带关联的一条");
    expect(m).toBeDefined();

    const [people, places, topics] = await Promise.all([
      repo.people.listByMoment(m!.id),
      repo.places.listByMoment(m!.id),
      repo.topics.listByMoment(m!.id),
    ]);

    expect(people.map((p) => p.name)).toEqual(["老王"]);
    expect(places.map((p) => p.name)).toEqual(["三里屯"]);
    expect(topics.map((t) => t.name)).toEqual(["编程"]);
  });
});
