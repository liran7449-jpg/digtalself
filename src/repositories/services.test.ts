/**
 * Service 层集成测试：Person/Place/Topic/Goal 关联 + Memory 标记
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PersonService } from "@/services/person-service";
import { PlaceService } from "@/services/place-service";
import { TopicService } from "@/services/topic-service";
import { GoalLinkService } from "@/services/goal-link-service";
import { GoalService } from "@/services/goal-service";
import { MemoryService } from "@/services/memory-service";
import { repoFor } from "@/repositories";
import { useTempDb, dropTempDb, TEST_USER_ID } from "./test-setup";

/** 所有 Service 调用都以这个用户身份发起。 */
const U = TEST_USER_ID;
const repo = repoFor(U);

describe("Service 层", () => {
  let tempDir: string;

  beforeAll(async () => {
    tempDir = await useTempDb();
  });

  afterAll(() => {
    dropTempDb(tempDir);
  });

  it("PersonService: linkToMoment 自动创建 Person 并关联", async () => {
    const moment = await repo.moments.capture({ content: "见了老王", type: "thought" });

    const person = await PersonService.linkToMoment(U, moment.id, "老王");
    expect(person.name).toBe("老王");

    const linked = await PersonService.listByMoment(U, moment.id);
    expect(linked).toHaveLength(1);
    expect(linked[0].name).toBe("老王");
  });

  it("PersonService: 重复 link 不会报错", async () => {
    const moment = await repo.moments.capture({ content: "又见老王", type: "thought" });

    await PersonService.linkToMoment(U, moment.id, "老王");
    await PersonService.linkToMoment(U, moment.id, "老王"); // 第二次

    const linked = await PersonService.listByMoment(U, moment.id);
    expect(linked).toHaveLength(1); // 不重复
  });

  it("PlaceService: linkToMoment 自动创建 Place", async () => {
    const moment = await repo.moments.capture({ content: "在咖啡馆", type: "thought" });

    const place = await PlaceService.linkToMoment(U, moment.id, "三里屯咖啡馆");
    expect(place.name).toBe("三里屯咖啡馆");

    const linked = await PlaceService.listByMoment(U, moment.id);
    expect(linked).toHaveLength(1);
  });

  it("TopicService: linkToMoment 自动创建 Topic", async () => {
    const moment = await repo.moments.capture({ content: "学了 TypeScript", type: "thought" });

    const topic = await TopicService.linkToMoment(U, moment.id, "编程");
    expect(topic.name).toBe("编程");

    const linked = await TopicService.listByMoment(U, moment.id);
    expect(linked).toHaveLength(1);
  });

  it("GoalLinkService: linkToMoment 关联已存在的 Goal", async () => {
    const goal = await repo.goals.create({
      title: "学会 Next.js",
      description: null,
      type: "personal",
      priority: 3,
      startDate: null,
      targetDate: null,
      completedDate: null,
      parentGoalId: null,
    });

    const moment = await repo.moments.capture({ content: "看了 Next.js 文档", type: "thought" });

    await GoalLinkService.linkToMoment(U, moment.id, goal.id);

    const linked = await GoalLinkService.listByMoment(U, moment.id);
    expect(linked).toHaveLength(1);
    expect(linked[0].title).toBe("学会 Next.js");
  });

  it("Goal 编辑与删除：删除后关联消失，Moment 保留", async () => {
    const service = new GoalService(repo.goals, async () => [], async () => []);
    const goal = await service.create("学吉他");

    const renamed = await service.update(goal.id, { title: "学会弹吉他" });
    expect(renamed.title).toBe("学会弹吉他");
    expect(renamed.status).toBe("active");

    const moment = await repo.moments.capture({ content: "上了第一节吉他课", type: "thought" });
    await GoalLinkService.linkToMoment(U, moment.id, goal.id);
    expect((await GoalLinkService.countByGoals(U)).get(goal.id)).toBe(1);
    expect(await GoalLinkService.listEvidence(U, goal.id)).toHaveLength(1);

    await service.remove(goal.id);

    expect(await repo.goals.find(goal.id)).toBeNull();
    expect(await repo.moments.find(moment.id)).not.toBeNull();
    expect(await GoalLinkService.listByMoment(U, moment.id)).toHaveLength(0);
    expect((await GoalLinkService.countByGoals(U)).has(goal.id)).toBe(false);
  });

  it("MemoryService: markMomentAsMemory 创建 Memory 记录", async () => {
    const moment = await repo.moments.capture({
      content: "第一次在海边看日出，特别震撼",
      type: "thought",
    });

    const memory = await MemoryService.markMomentAsMemory(U, moment);
    expect(memory.content).toBe(moment.content);
    expect(memory.userConfirmed).toBe(true);
    expect(memory.confidence).toBe(1.0);

    const isMarked = await MemoryService.isMomentMarkedAsMemory(U, moment.id);
    expect(isMarked).toBe(true);
  });

  it("MemoryService: unmarkMomentAsMemory 软删除 Memory", async () => {
    const moment = await repo.moments.capture({
      content: "误标记的一条",
      type: "thought",
    });

    await MemoryService.markMomentAsMemory(U, moment);
    await MemoryService.unmarkMomentAsMemory(U, moment.id);

    const isMarked = await MemoryService.isMomentMarkedAsMemory(U, moment.id);
    expect(isMarked).toBe(false);
  });
});
