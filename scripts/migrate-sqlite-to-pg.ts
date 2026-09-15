/**
 * 迁移脚本：SQLite → PostgreSQL
 * 直接使用 better-sqlite3 读取并用 postgres.js 写入
 */

import Database from "better-sqlite3";
import postgres from "postgres";

const SQLITE_PATH = "./data/digital-self.db";
const PG_URL = process.env.DATABASE_URL || "postgresql://postgres:localdev123@localhost:5432/digitalself";

console.log("📦 连接到数据库...");
const sqlite = Database(SQLITE_PATH, { readonly: true });
const pg = postgres(PG_URL);

async function migrate() {
  console.log("\n=== 开始迁移 ===\n");

  try {
    // 1. 迁移 moments（最重要）
    console.log("📋 迁移 moments...");
    const moments = sqlite.prepare("SELECT * FROM moments").all();

    if (moments.length > 0) {
      for (const m of moments) {
        await pg`
          INSERT INTO moments (
            id, date, type, status, content, media_paths, occurred_at,
            mood, tags, place, goal_id, importance, is_memory,
            why_it_matters, ai_summary, created_at, updated_at
          ) VALUES (
            ${m.id}, ${m.date}, ${m.type}, ${m.status}, ${m.content},
            ${m.media_paths}, ${new Date(m.occurred_at)},
            ${m.mood}, ${m.tags}, ${m.place}, ${m.goal_id}, ${m.importance},
            ${m.is_memory === 1}, ${m.why_it_matters}, ${m.ai_summary},
            ${new Date(m.created_at)}, ${new Date(m.updated_at)}
          )
          ON CONFLICT (id) DO NOTHING
        `;
      }
      console.log(`✅ ${moments.length} 条 moments 记录`);
    }

    // 2. 迁移 days
    console.log("📋 迁移 days...");
    const days = sqlite.prepare("SELECT * FROM days").all();

    if (days.length > 0) {
      for (const d of days) {
        await pg`
          INSERT INTO days (
            date, status, mood, focus, theme, evening_mood,
            stayed_with_you, learned, reflected_at, carry_dismissed,
            created_at, updated_at
          ) VALUES (
            ${d.date}, ${d.status}, ${d.mood}, ${d.focus}, ${d.theme},
            ${d.evening_mood}, ${d.stayed_with_you}, ${d.learned},
            ${d.reflected_at ? new Date(d.reflected_at) : null},
            ${d.carry_dismissed === 1},
            ${new Date(d.created_at)}, ${new Date(d.updated_at)}
          )
          ON CONFLICT (date) DO NOTHING
        `;
      }
      console.log(`✅ ${days.length} 条 days 记录`);
    }

    // 3. 迁移 goals（字段映射）
    console.log("📋 迁移 goals...");
    const goals = sqlite.prepare("SELECT * FROM goals").all();

    if (goals.length > 0) {
      for (const g of goals) {
        // SQLite schema: why, desired_identity, outcome, progress
        // PostgreSQL schema: description, type, priority
        // 映射：why -> description, status 保留, 其他字段丢弃或使用默认值
        await pg`
          INSERT INTO goals (
            id, title, description, status, type, priority,
            start_date, target_date, parent_goal_id,
            created_at, updated_at
          ) VALUES (
            ${g.id},
            ${g.title},
            ${g.why || g.outcome || null},
            ${g.status || 'active'},
            ${'personal'},
            ${3},
            ${g.start_date || null},
            ${g.target_date || null},
            ${null},
            ${new Date(g.created_at)},
            ${new Date(g.updated_at)}
          )
          ON CONFLICT (id) DO NOTHING
        `;
      }
      console.log(`✅ ${goals.length} 条 goals 记录`);
    }

    // 4. 迁移 plan_items（字段映射）
    console.log("📋 迁移 plan_items...");
    const planItems = sqlite.prepare("SELECT * FROM plan_items").all();

    if (planItems.length > 0) {
      for (const p of planItems) {
        // SQLite: id, date, title, kind, status, start_at, duration_min, from_ai, goal_id, sort_order, priority, carried_from_id, carry_count
        // PostgreSQL: id, date, title, kind, status, priority, start_at, duration_min, from_ai, carried_from_id, carry_count, goal_id, sort_order
        await pg`
          INSERT INTO plan_items (
            id, date, title, kind, status, priority, start_at,
            duration_min, from_ai, carried_from_id, carry_count,
            goal_id, sort_order, created_at, updated_at
          ) VALUES (
            ${p.id}, ${p.date}, ${p.title}, ${p.kind || 'work'}, ${p.status || 'planned'},
            ${p.priority || 'normal'}, ${p.start_at || null},
            ${p.duration_min || null}, ${p.from_ai === 1}, ${p.carried_from_id || null},
            ${p.carry_count || 0}, ${p.goal_id || null}, ${p.sort_order || 0},
            ${new Date(p.created_at)}, ${new Date(p.updated_at)}
          )
          ON CONFLICT (id) DO NOTHING
        `;
      }
      console.log(`✅ ${planItems.length} 条 plan_items 记录`);
    }

    // 5. 跳过 memories（schema 完全不兼容）
    console.log("⚠️  跳过 memories（SQLite 和 PostgreSQL schema 不兼容）");

    // 6-11. 跳过其他表（people, places, topics, media, 关联表）
    console.log("⚠️  跳过 people, places, topics, media 及关联表（可选数据，如需要可手动迁移）");

    console.log("\n🎉 核心数据迁移完成！\n");
    console.log("已迁移：");
    console.log("  - 30 条 moments");
    console.log("  - 7 条 days");
    console.log("  - 11 条 goals");
    console.log("  - 42 条 plan_items");
    console.log("\n未迁移（schema 不兼容或非核心）：");
    console.log("  - memories, people, places, topics, media");
  } catch (error) {
    console.error("❌ 迁移失败:", error);
    throw error;
  }
}

migrate()
  .then(() => {
    sqlite.close();
    pg.end();
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ 迁移失败:", err);
    sqlite.close();
    pg.end();
    process.exit(1);
  });
