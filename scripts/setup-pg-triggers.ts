/**
 * 为 PostgreSQL 创建 updated_at 自动更新触发器。
 *
 * 目标表不再硬编码：改成查 information_schema，只给**真的有
 * updated_at 列**的表装触发器。
 *
 * 之前是一份手写清单，里面混进了 6 张没有 updated_at 列的表
 * （insights + 5 张 moment_* 关联表）。触发器函数体是
 * `NEW.updated_at = now()`，装到没这个列的表上，任何 UPDATE 都会
 * 报 `record "new" has no field "updated_at"`。
 *
 * 线上没被这个咬到纯属运气：关联表只做 INSERT / DELETE 从不 UPDATE，
 * insights.rate 应用里没有调用点。但测试会走这些路径，于是 12 个测试
 * 一直红着。清单和真实结构迟早会漂移，所以让脚本自己去问数据库。
 *
 * 幂等：每次都先 DROP TRIGGER IF EXISTS，重复运行安全。
 *
 * 用法：DATABASE_URL="postgresql://..." npx tsx scripts/setup-pg-triggers.ts
 */

import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ 请设置 DATABASE_URL 环境变量");
  process.exit(1);
}

const sql = postgres(DATABASE_URL, { ssl: "prefer" });

async function main() {
  try {
    console.log("🔧 创建 updated_at 触发器函数...");

    await sql`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = now();
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `;

    console.log("✅ 触发器函数已创建\n");

    // 真实拥有 updated_at 列的表 —— 唯一可信来源是数据库自己
    const withColumn = await sql<{ table_name: string }[]>`
      SELECT table_name
      FROM information_schema.columns
      WHERE table_schema = 'public' AND column_name = 'updated_at'
      ORDER BY table_name
    `;

    // 装了触发器但没有对应列的表 —— 历史遗留，要拆掉
    const stale = await sql<{ tbl: string; trigger_name: string }[]>`
      SELECT DISTINCT t.event_object_table AS tbl, t.trigger_name
      FROM information_schema.triggers t
      WHERE t.trigger_schema = 'public'
        AND t.action_statement LIKE '%update_updated_at_column%'
        AND NOT EXISTS (
          SELECT 1 FROM information_schema.columns c
          WHERE c.table_schema = 'public'
            AND c.table_name = t.event_object_table
            AND c.column_name = 'updated_at'
        )
      ORDER BY 1
    `;

    if (stale.length > 0) {
      console.log("🧹 拆除装错的触发器（表上没有 updated_at 列）：");
      for (const { tbl, trigger_name } of stale) {
        await sql.unsafe(`DROP TRIGGER IF EXISTS "${trigger_name}" ON "${tbl}";`);
        console.log(`  ✓ ${tbl} (${trigger_name})`);
      }
      console.log();
    }

    console.log("📌 安装触发器：");
    for (const { table_name: table } of withColumn) {
      const triggerName = `${table}_updated_at`;
      await sql.unsafe(`DROP TRIGGER IF EXISTS "${triggerName}" ON "${table}";`);
      await sql.unsafe(`
        CREATE TRIGGER "${triggerName}"
        BEFORE UPDATE ON "${table}"
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
      `);
      console.log(`  ✓ ${table}`);
    }

    console.log(`\n🎉 完成：${withColumn.length} 张表装上触发器，${stale.length} 个错装的已拆除`);
  } catch (error) {
    console.error("❌ 错误:", error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

main();
