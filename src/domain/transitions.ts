/**
 * 状态机流转表。IA 第 42 节。
 * 每个状态列出允许进入的下一个状态；空数组表示终态。
 */

import type {
  DayStatus,
  PlanStatus,
  MomentStatus,
  GoalStatus,
  MemoryStatus,
} from "./enums";

type Graph<S extends string> = Readonly<Record<S, readonly S[]>>;

export const DAY_TRANSITIONS: Graph<DayStatus> = {
  not_started: ["started"],
  started: ["in_progress", "ready_to_reflect"],
  in_progress: ["ready_to_reflect"],
  ready_to_reflect: ["reflected"],
  reflected: [],
};

export const PLAN_TRANSITIONS: Graph<PlanStatus> = {
  planned: ["in_progress", "completed", "skipped"],
  in_progress: ["completed", "skipped", "planned"],
  completed: ["planned"], // 允许撤销误操作
  skipped: ["planned"],
};

export const MOMENT_TRANSITIONS: Graph<MomentStatus> = {
  draft: ["saved"],
  saved: ["enriched", "linked"],
  enriched: ["linked"],
  linked: ["enriched"],
};

export const GOAL_TRANSITIONS: Graph<GoalStatus> = {
  draft: ["active", "abandoned"],
  active: ["paused", "achieved", "abandoned"],
  paused: ["active", "abandoned"],
  achieved: ["active"], // 目标可以重新开启
  abandoned: ["active"],
};

/**
 * Memory 的 forgotten 是终态但不删除行。
 * AI 需要知道「这条被用户否决过」，否则下次会重新推断出同一条。
 */
export const MEMORY_TRANSITIONS: Graph<MemoryStatus> = {
  candidate: ["confirmed", "forgotten"],
  confirmed: ["active", "forgotten"],
  active: ["forgotten"],
  forgotten: [],
};

export function canTransition<S extends string>(
  graph: Graph<S>,
  from: S,
  to: S,
): boolean {
  return graph[from]?.includes(to) ?? false;
}

export class InvalidTransitionError extends Error {
  constructor(entity: string, from: string, to: string) {
    super(`${entity}: 不允许从 ${from} 流转到 ${to}`);
    this.name = "InvalidTransitionError";
  }
}

export function assertTransition<S extends string>(
  entity: string,
  graph: Graph<S>,
  from: S,
  to: S,
): void {
  if (!canTransition(graph, from, to)) {
    throw new InvalidTransitionError(entity, from, to);
  }
}
