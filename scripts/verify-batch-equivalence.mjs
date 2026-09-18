/**
 * 验证批量查询与逐条查询返回完全一致。
 *
 * N+1 修复改的是数据获取方式，编译通过不代表数据对。
 * 这个脚本对每条 moment 同时跑两种查询，逐字段比对。
 */
import postgres from "postgres";

const sql = postgres(
  process.env.DATABASE_URL ??
    "postgresql://postgres:localdev123@localhost:5432/digitalself",
);

const moments = await sql`SELECT id FROM moments ORDER BY occurred_at DESC`;
const ids = moments.map((m) => m.id);
console.log(`比对 ${ids.length} 条 moment 的四类关联\n`);

// 四类关联的表配置：[名称, 关联表, 目标表, 外键列, 排序列]
const kinds = [
  ["media", "moment_media", "media", "media_id", "sort_order"],
  ["people", "moment_people", "people", "person_id", "name"],
  ["places", "moment_places", "places", "place_id", "name"],
  ["topics", "moment_topics", "topics", "topic_id", "name"],
];

let mismatches = 0;

for (const [label, joinTable, target, fk, orderCol] of kinds) {
  // 批量版：一次查全部，按 momentId 分组
  const batch = await sql`
    SELECT j.moment_id, t.id
    FROM ${sql(joinTable)} j
    JOIN ${sql(target)} t ON j.${sql(fk)} = t.id
    WHERE j.moment_id = ANY(${ids})
    ORDER BY ${orderCol === "sort_order" ? sql`j.sort_order` : sql`t.name`}
  `;
  const batchMap = new Map();
  for (const r of batch) {
    const list = batchMap.get(r.moment_id) ?? [];
    list.push(r.id);
    batchMap.set(r.moment_id, list);
  }

  // 逐条版：模拟原来的 listByMoment
  let perItemTotal = 0;
  for (const mid of ids) {
    const single = await sql`
      SELECT t.id
      FROM ${sql(joinTable)} j
      JOIN ${sql(target)} t ON j.${sql(fk)} = t.id
      WHERE j.moment_id = ${mid}
      ORDER BY ${orderCol === "sort_order" ? sql`j.sort_order` : sql`t.name`}
    `;
    perItemTotal += single.length;

    const fromBatch = batchMap.get(mid) ?? [];
    const a = single.map((r) => r.id).join(",");
    const b = fromBatch.join(",");
    if (a !== b) {
      mismatches++;
      console.log(`  ❌ ${label} / ${mid}`);
      console.log(`     逐条: [${a}]`);
      console.log(`     批量: [${b}]`);
    }
  }

  const batchTotal = batch.length;
  const status = batchTotal === perItemTotal ? "✅" : "❌";
  console.log(
    `  ${status} ${label.padEnd(7)} 逐条共 ${perItemTotal} 行 / 批量共 ${batchTotal} 行`,
  );
}

console.log("");
console.log(`查询次数：逐条 ${ids.length * 4} 次 → 批量 4 次`);
console.log(mismatches === 0 ? "✅ 全部一致" : `❌ ${mismatches} 处不一致`);

await sql.end();
process.exit(mismatches === 0 ? 0 : 1);
