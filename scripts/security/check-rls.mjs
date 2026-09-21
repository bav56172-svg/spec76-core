#!/usr/bin/env node
// TD-002: basic RLS control. Scans all supabase/migrations/*.sql, collects every
// table ever created and every table that ever gets "enable row level security",
// then warns (does not fail the build) about tables that are never covered.
// A table can be created in one migration and have RLS enabled in a later one,
// so tables are matched across the whole migrations history, not per-file.

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const MIGRATIONS_DIR = "supabase/migrations";
const CREATE_TABLE_RE = /create\s+table\s+(?:if\s+not\s+exists\s+)?("?[\w.]+"?)/gi;
const ENABLE_RLS_RE = /alter\s+table\s+("?[\w.]+"?)\s+enable\s+row\s+level\s+security/gi;

function normalize(tableName) {
  const unquoted = tableName.replace(/"/g, "");
  return unquoted.includes(".") ? unquoted : `public.${unquoted}`;
}

let files;
try {
  files = readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith(".sql"));
} catch {
  console.log(`No ${MIGRATIONS_DIR} directory found, skipping RLS check.`);
  process.exit(0);
}

const created = new Map();
const rlsEnabled = new Set();

for (const file of files) {
  const content = readFileSync(join(MIGRATIONS_DIR, file), "utf8");

  for (const match of content.matchAll(CREATE_TABLE_RE)) {
    const table = normalize(match[1]);
    if (!created.has(table)) created.set(table, file);
  }

  for (const match of content.matchAll(ENABLE_RLS_RE)) {
    rlsEnabled.add(normalize(match[1]));
  }
}

const withoutRls = [...created.entries()].filter(([table]) => !rlsEnabled.has(table));

if (withoutRls.length > 0) {
  console.log("::warning::TD-002 RLS control found tables without ENABLE ROW LEVEL SECURITY:");
  for (const [table, file] of withoutRls) {
    console.log(`::warning file=${join(MIGRATIONS_DIR, file)}::Table ${table} (created in ${file}) has no ENABLE ROW LEVEL SECURITY found in migrations`);
  }
} else {
  console.log(`OK: all ${created.size} table(s) created in ${MIGRATIONS_DIR} have ENABLE ROW LEVEL SECURITY.`);
}

// Informational only — see TD-002 (Medium priority, basic control), does not fail the build.
process.exit(0);
