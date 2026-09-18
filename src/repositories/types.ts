/**
 * Repository 接口。业务代码只依赖这里，不依赖 Drizzle 或 SQLite。
 * 换存储实现（Postgres / IndexedDB）时只需另写一份实现，UI 与 action 不动。
 */

import type { DayKey, MonthKey } from "@/domain/day-key";
import type {
  Day,
  Goal,
  GrowthEvidence,
  Insight,
  Media,
  Memory,
  Moment,
  MorningSetupInput,
  Person,
  Place,
  PlanItem,
  QuickCaptureInput,
  Topic,
  User,
} from "@/domain/models";
import type {
  GoalStatus,
  MemoryStatus,
  MomentType,
  PlanPriority,
  PlanStatus,
} from "@/domain/enums";

/**
 * 认证用的用户记录。带 passwordHash，**只允许在服务端认证流程里使用**。
 *
 * 跟 User 分开是有意的：User 会被传到 UI / Server Component 的 props，
 * 一旦哈希混进那条链路就可能出现在 HTML 里。类型分开让它不可能被误传。
 */
export interface UserCredentials {
  id: string;
  username: string;
  passwordHash: string | null;
  mustChangePassword: boolean;
}

export interface UserRepository {
  /** 按 id 取，不存在返回 null */
  findById(id: string): Promise<User | null>;
  /** 按 id 取，不存在则创建空白记录（需要 username 兜底） */
  getOrCreate(id: string, username: string): Promise<User>;
  update(
    id: string,
    patch: Partial<Omit<User, "id" | "username" | "createdAt">>,
  ): Promise<User>;

  // ---- 认证：只在服务端认证流程使用 ----
  /** 按用户名取认证信息（含哈希）。登录时用。 */
  findCredentialsByUsername(username: string): Promise<UserCredentials | null>;
  /** 建号。password 传明文，实现负责哈希。 */
  create(input: {
    username: string;
    password: string;
    name?: string | null;
    mustChangePassword?: boolean;
  }): Promise<User>;
  /** 改密码。同时清掉 mustChangePassword。 */
  setPassword(id: string, password: string): Promise<void>;
  /** 列出全部用户，管理脚本用。 */
  listAll(): Promise<User[]>;
}

/**
 * 日历用的单日摘要。不是领域实体，是读模型。
 * momentCount 让日历能标出「这天有记录」，mood 决定圆点颜色。
 */
export interface DaySummary {
  date: DayKey;
  mood: Day["mood"];
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
    patch: Partial<Pick<Day, "mood" | "focus">>,
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
        | "description"
        | "type"
        | "priority"
        | "targetDate"
        | "completedDate"
        | "parentGoalId"
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
  /** 根据 sourceId 查找 Memory（用于判断 Moment 是否已标记为 Memory） */
  findBySourceId(sourceId: string): Promise<Memory | null>;
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

export interface PersonRepository {
  findById(id: string): Promise<Person | null>;
  findByName(name: string): Promise<Person | null>;
  /** 查找或创建。用户在 Moment 输入「某人」时，系统自动建立 Person 记录 */
  findOrCreate(name: string): Promise<Person>;
  list(): Promise<Person[]>;
  /** 查询 Moment 关联的所有 Person */
  listByMoment(momentId: string): Promise<Person[]>;
  /**
   * 批量查询多条 Moment 的 Person，按 momentId 分组。
   * 列表页用这个 —— 逐条调 listByMoment 是 N+1，34 条记录就是 34 次往返。
   */
  listByMoments(momentIds: string[]): Promise<Map<string, Person[]>>;
  update(id: string, patch: Partial<Pick<Person, "name" | "notes">>): Promise<Person>;
}

export interface PlaceRepository {
  findById(id: string): Promise<Place | null>;
  findByName(name: string): Promise<Place | null>;
  findOrCreate(name: string): Promise<Place>;
  list(): Promise<Place[]>;
  /** 查询 Moment 关联的所有 Place */
  listByMoment(momentId: string): Promise<Place[]>;
  /**
   * 批量查询多条 Moment 的 Place，按 momentId 分组。
   * 列表页用这个 —— 逐条调 listByMoment 是 N+1。
   */
  listByMoments(momentIds: string[]): Promise<Map<string, Place[]>>;
  update(id: string, patch: Partial<Pick<Place, "name" | "notes">>): Promise<Place>;
}

export interface TopicRepository {
  findById(id: string): Promise<Topic | null>;
  findByName(name: string): Promise<Topic | null>;
  findOrCreate(name: string): Promise<Topic>;
  list(): Promise<Topic[]>;
  /** 查询 Moment 关联的所有 Topic */
  listByMoment(momentId: string): Promise<Topic[]>;
  /**
   * 批量查询多条 Moment 的 Topic，按 momentId 分组。
   * 列表页用这个 —— 逐条调 listByMoment 是 N+1。
   */
  listByMoments(momentIds: string[]): Promise<Map<string, Topic[]>>;
}

export interface MediaRepository {
  findById(id: string): Promise<Media | null>;
  /** 查询 Moment 关联的所有 Media */
  listByMoment(momentId: string): Promise<Media[]>;
  /**
   * 批量查询多条 Moment 的 Media，按 momentId 分组，按 sortOrder 排序。
   * 列表页用这个 —— 逐条调 listByMoment 是 N+1。
   */
  listByMoments(momentIds: string[]): Promise<Map<string, Media[]>>;
  /**
   * 上传并存储。返回 Media 记录（含 id 和 storageKey）。
   *
   * 没有 userId 入参是有意的：归属由 repo 实例绑定的用户决定。
   * 让调用方传 userId 就等于让它可以把文件写到别人名下。
   */
  create(input: {
    file: Buffer;
    type: string;
    size: number;
    width?: number;
    height?: number;
  }): Promise<Media>;
  /** 删除文件和记录。不属于当前用户时抛错。 */
  delete(id: string): Promise<void>;
}

export interface GrowthEvidenceRepository {
  findById(id: string): Promise<GrowthEvidence | null>;
  list(): Promise<GrowthEvidence[]>;
  create(input: Omit<GrowthEvidence, "id" | "createdAt" | "updatedAt">): Promise<GrowthEvidence>;
}

/**
 * 全量导出。PRD 第 31 节把「用户能看到全部数据」列为 P0。
 *
 * ⚠️ 归属由 repo 实例绑定的 userId 决定，方法不收 userId 参数 ——
 * 导出是最容易泄露的一条路径，一个漏掉过滤的 exportAll 会把所有人的
 * 日记打包成一个 JSON 交出去。不给调用方指定用户的机会。
 */
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
  people: PersonRepository;
  places: PlaceRepository;
  topics: TopicRepository;
  media: MediaRepository;
  growthEvidences: GrowthEvidenceRepository;
  exports: ExportRepository;
}
