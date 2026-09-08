/**
 * Repository 接口。业务代码只依赖这里，不依赖 Drizzle 或 SQLite。
 * 换存储实现（Postgres / IndexedDB）时只需另写一份实现，UI 与 action 不动。
 */

import type { DayKey, MonthKey } from "@/domain/day-key";
import type {
  Day,
  Goal,
  Insight,
  Memory,
  Moment,
  MorningSetupInput,
  PlanItem,
  QuickCaptureInput,
  User,
} from "@/domain/models";
import type {
  GoalStatus,
  MemoryStatus,
  MomentType,
  PlanPriority,
  PlanStatus,
} from "@/domain/enums";

export interface UserRepository {
  /** 单用户产品，没有则创建空白记录 */
  getOrCreate(): Promise<User>;
  update(patch: Partial<Omit<User, "id" | "createdAt">>): Promise<User>;
}

/**
 * 日历用的单日摘要。不是领域实体，是读模型。
 * momentCount 让日历能标出「这天有记录」，mood 决定圆点颜色。
 */
export interface DaySummary {
  date: DayKey;
  mood: Day["mood"];
  energy: Day["energy"];
  status: Day["status"] | null;
  momentCount: number;
  hasFocus: boolean;
}

export interface DayRepository {
  find(date: DayKey): Promise<Day | null>;
  /** 不存在则以 not_started 建一条 */
  ensure(date: DayKey): Promise<Day>;
  /**
   * 整月摘要，一次查完供日历渲染。
   * 包含只有 Moment 而没有 Day 行的日期 —— Quick Capture 不建 Day 行。
   */
  listMonth(month: MonthKey): Promise<DaySummary[]>;
  /** Morning Setup 提交，同时把 Day 推进到 started */
  applyMorningSetup(date: DayKey, input: MorningSetupInput): Promise<Day>;
  /**
   * 部分更新状态，只写传入的字段。
   * 与 applyMorningSetup 分开：后者是整体覆盖，用它单改 mood 会把 focus 清空。
   * 传 null 表示显式清除该字段，不传（undefined）表示不动。
   */
  updateState(
    date: DayKey,
    patch: Partial<Pick<Day, "mood" | "energy" | "focus">>,
  ): Promise<Day>;
  markReadyToReflect(date: DayKey): Promise<Day>;
  markReflected(date: DayKey): Promise<Day>;
  /**
   * 保存晚间反思，并把 Day 推进到 reflected。
   *
   * 一旦 reflectedAt 非空就拒绝再写 —— 反思存的是那一刻的真实想法，
   * 不该被日后的自己修饰。UI 会转成只读，但约束必须在这一层，
   * 否则并发提交或直接调用就绕过去了。
   *
   * 全部字段可空：IA 第 21 节要求每个问题都能跳过。
   */
  saveReflection(date: DayKey, input: ReflectionInput): Promise<Day>;
  /** 记下用户对「把没做完的带到今天」说了「不用」，别再问 */
  dismissCarry(date: DayKey): Promise<Day>;
  recent(limit: number): Promise<Day[]>;
}

/** 晚间反思的输入。三项都可空 —— 每个问题都能跳过。 */
export interface ReflectionInput {
  eveningMood?: Day["eveningMood"];
  stayedWithYou?: string | null;
  learned?: string | null;
}

/** 顺延结果。没有可顺延的项时 count 为 0。 */
export interface CarryOverResult {
  count: number;
  /** 来源日期，null 表示没找到可顺延的一天 */
  from: DayKey | null;
}

export interface PlanRepository {
  listByDate(date: DayKey): Promise<PlanItem[]>;
  create(
    input: Omit<
      PlanItem,
      | "id"
      | "createdAt"
      | "updatedAt"
      | "sortOrder"
      | "priority"
      | "carriedFromId"
      | "carryCount"
    > & {
      sortOrder?: number;
      priority?: PlanPriority;
      carriedFromId?: string | null;
      carryCount?: number;
    },
  ): Promise<PlanItem>;
  setStatus(id: string, status: PlanStatus): Promise<PlanItem>;
  update(
    id: string,
    patch: Partial<
      Pick<PlanItem, "title" | "startAt" | "durationMin" | "kind" | "priority">
    >,
  ): Promise<PlanItem>;
  remove(id: string): Promise<void>;
  /**
   * 把最近一天未完成的项顺延到 date。
   *
   * 语义上是复制而非搬移：源日期保留自己的记录（没做完就是没做完，
   * 那是真实的历史），目标日期生成新行并用 carriedFromId 指回去。
   * 若改源行的日期，昨天的 Day 视图会显示这件事从未存在过。
   *
   * 只顺延 planned / in_progress。skipped 是用户主动决定不做，
   * 顺延它等于否认那个决定。
   *
   * 往回找最近有未完成项的一天（上限 lookbackDays），因为用户可能
   * 隔了几天没打开；只看前一天会什么都找不到。
   *
   * 幂等：已经从某条源项顺延过的，不会重复生成。
   */
  carryOverUnfinished(
    date: DayKey,
    opts?: { lookbackDays?: number },
  ): Promise<CarryOverResult>;
  /**
   * 只读探测：有多少项可以顺延到 date。
   * 用于决定是否显示顺延入口 —— 不能用 carryOverUnfinished 来试探，它会写库。
   */
  peekCarryable(
    date: DayKey,
    opts?: { lookbackDays?: number },
  ): Promise<CarryOverResult>;
}

export interface MomentRepository {
  /** Quick Capture 入口 */
  capture(input: QuickCaptureInput, at?: Date): Promise<Moment>;
  listByDate(date: DayKey): Promise<Moment[]>;
  list(opts?: {
    limit?: number;
    offset?: number;
    type?: MomentType;
  }): Promise<Moment[]>;
  find(id: string): Promise<Moment | null>;
  update(
    id: string,
    patch: Partial<
      Pick<
        Moment,
        | "content"
        | "type"
        | "mood"
        | "tags"
        | "place"
        | "goalId"
        | "importance"
        | "isMemory"
        | "whyItMatters"
        | "aiSummary"
      >
    >,
  ): Promise<Moment>;
  /** 用户主动删除是硬删除，不留残留 —— PRD 第 31 节隐私要求 */
  remove(id: string): Promise<void>;
  countByDate(date: DayKey): Promise<number>;
}

export interface GoalRepository {
  list(status?: GoalStatus): Promise<Goal[]>;
  listActive(): Promise<Goal[]>;
  find(id: string): Promise<Goal | null>;
  create(
    input: Omit<Goal, "id" | "createdAt" | "updatedAt" | "progress" | "status">,
  ): Promise<Goal>;
  update(
    id: string,
    patch: Partial<
      Pick<
        Goal,
        | "title"
        | "why"
        | "desiredIdentity"
        | "outcome"
        | "progress"
        | "targetDate"
      >
    >,
  ): Promise<Goal>;
  setStatus(id: string, status: GoalStatus): Promise<Goal>;
  remove(id: string): Promise<void>;
}

export interface MemoryRepository {
  /** 默认只返回 active + confirmed，forgotten 不出现在用户视图里 */
  listVisible(limit?: number): Promise<Memory[]>;
  listByStatus(status: MemoryStatus): Promise<Memory[]>;
  create(
    input: Omit<Memory, "id" | "createdAt" | "updatedAt" | "status">,
  ): Promise<Memory>;
  confirm(id: string): Promise<Memory>;
  /** 软状态流转，不删行：AI 需要知道这条被否决过，否则会重新推断出来 */
  forget(id: string): Promise<Memory>;
  updateContent(id: string, content: string): Promise<Memory>;
}

export interface InsightRepository {
  findDaily(date: DayKey): Promise<Insight | null>;
  create(input: Omit<Insight, "id" | "createdAt">): Promise<Insight>;
  recent(limit: number): Promise<Insight[]>;
  rate(id: string, feedback: Insight["userFeedback"]): Promise<Insight>;
}

/** 全量导出。PRD 第 31 节把「用户能看到全部数据」列为 P0。 */
export interface ExportRepository {
  exportAll(): Promise<{
    exportedAt: string;
    schemaVersion: number;
    user: User;
    days: Day[];
    planItems: PlanItem[];
    moments: Moment[];
    goals: Goal[];
    memories: Memory[];
    insights: Insight[];
  }>;
}

export interface Repositories {
  users: UserRepository;
  days: DayRepository;
  plans: PlanRepository;
  moments: MomentRepository;
  goals: GoalRepository;
  memories: MemoryRepository;
  insights: InsightRepository;
  exports: ExportRepository;
}
