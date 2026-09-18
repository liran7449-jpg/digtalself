# SQLite 时代的 migration（已归档，不再执行）

这些是项目还在用 SQLite 时的 migration，2026-09-18 从 `drizzle/` 归档到这里。

## 为什么归档而不是删除

规范 §12 要求 migration append-only、不得删除。所以文件原样保留，历史查得到。

## 为什么不能留在 `drizzle/` 里

它们对现在的项目已经不可执行，而且会挡住新机制：

1. **语法是 SQLite 的** —— `PRAGMA foreign_keys=OFF`、反引号标识符、
   `integer` 存时间戳。PostgreSQL 执行会直接语法报错。
2. **drizzle-kit 读不了它们的快照** —— `drizzle.config.ts` 的 dialect 是
   `postgresql`，但 `meta/_journal.json` 写的是 `sqlite`。
   `drizzle-kit check` 对全部 6 个快照报 "data is malformed"。
   留在原地，任何 generate / migrate 命令都跑不起来。
3. **对应的数据库已经不存在** —— 生产和本地都是 PostgreSQL，
   SQLite 文件（`data/digital-self.db`）已不是数据源。

## 当前基线

PostgreSQL 的基线在 `drizzle/` 下，从 2026-09-18 的实际数据库结构生成。
在此之前 schema 变更是用 `drizzle-kit push` 直推的，没有 migration 记录 ——
基线就是把那段无记录的历史封口，之后的变更都走正规 migration。
