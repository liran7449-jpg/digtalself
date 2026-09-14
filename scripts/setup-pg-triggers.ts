/**
 * 为 PostgreSQL 创建 updated_at 自动更新触发器
 */

import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ 请设置 DATABASE_URL 环境变量");
  process.exit(1);
}

const sql = postgres(DATABASE_URL);

async function main() {
  try {
    console.log("🔧 创建 updated_at 触发器函数...");

    // 创建触发器函数
    await sql`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = now();
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `;

    console.log("✅ 触发器函数已创建");

    // 为所有表创建触发器
    const tables = [
      'users',
      'days',
      'goals',
      'plan_items',
      'moments',
      'moment_topics',
      'moment_people',
      'moment_places',
      'moment_media',
      'moment_goals',
      'memories',
      'topics',
      'people',
      'places',
      'media',
      'insights'
    ];

    for (const table of tables) {
      const triggerName = `${table}_updated_at`;

      // 先删除旧触发器
      await sql.unsafe(`DROP TRIGGER IF EXISTS ${triggerName} ON ${table};`);

      // 创建新触发器
      await sql.unsafe(`
        CREATE TRIGGER ${triggerName}
        BEFORE UPDATE ON ${table}
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
      `);

      console.log(`  ✅ ${table}`);
    }

    console.log("\n🎉 所有触发器已创建");

  } catch (error) {
    console.error("❌ 错误:", error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

main();
