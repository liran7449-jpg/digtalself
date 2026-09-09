/**
 * Repository 单一入口。业务代码 import { repo } from "@/repositories"，
 * 不直接 import sqlite 实现。换存储时只改这个文件。
 */

import type { Repositories } from "./types";
import { sqliteUserRepo } from "./sqlite/user-repo";
import { sqliteDayRepo } from "./sqlite/day-repo";
import { sqlitePlanRepo } from "./sqlite/plan-repo";
import { sqliteMomentRepo } from "./sqlite/moment-repo";
import { sqliteGoalRepo } from "./sqlite/goal-repo";
import { sqliteMemoryRepo } from "./sqlite/memory-repo";
import { sqliteInsightRepo } from "./sqlite/insight-repo";
import { sqliteExportRepo } from "./sqlite/export-repo";
import { createPersonRepository } from "./sqlite/person-repo";
import { createPlaceRepository } from "./sqlite/place-repo";
import { createTopicRepository } from "./sqlite/topic-repo";
import { createMediaRepository } from "./sqlite/media-repo";
import { createGrowthEvidenceRepository } from "./sqlite/growth-evidence-repo";

export const repo: Repositories = {
  users: sqliteUserRepo,
  days: sqliteDayRepo,
  plans: sqlitePlanRepo,
  moments: sqliteMomentRepo,
  goals: sqliteGoalRepo,
  memories: sqliteMemoryRepo,
  insights: sqliteInsightRepo,
  people: createPersonRepository(),
  places: createPlaceRepository(),
  topics: createTopicRepository(),
  media: createMediaRepository(),
  growthEvidences: createGrowthEvidenceRepository(),
  exports: sqliteExportRepo,
};

export type { Repositories } from "./types";
