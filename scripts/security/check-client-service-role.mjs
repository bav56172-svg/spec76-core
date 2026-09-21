#!/usr/bin/env node
// TD-002: fails CI if a Supabase service_role reference leaks into client-reachable code.
// Client-reachable = app/ (Next.js App Router: pages, layouts, "use client" components,
// and Route Handlers that ship as part of the app bundle) — server-only code that
// intentionally uses the service role belongs in services/ or lib/supabase/admin.ts.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const SCAN_DIRS = ["app", "components"];
const CODE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const PATTERN = /service_role/i;

function walk(dir, files = []) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return files;
  }
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      walk(fullPath, files);
    } else if (CODE_EXTENSIONS.has(extname(fullPath))) {
      files.push(fullPath);
    }
  }
  return files;
}

const offenders = [];

for (const dir of SCAN_DIRS) {
  for (const file of walk(dir)) {
    const content = readFileSync(file, "utf8");
    const lines = content.split("\n");
    lines.forEach((line, index) => {
      if (PATTERN.test(line)) {
        offenders.push({ file, line: index + 1, text: line.trim() });
      }
    });
  }
}

if (offenders.length > 0) {
  console.error("Found service_role references in client-reachable code:\n");
  for (const { file, line, text } of offenders) {
    console.error(`  ${file}:${line}: ${text}`);
  }
  console.error(
    "\nservice_role must only be used in server-only code (e.g. services/, lib/supabase/admin.ts), never in app/ or components/."
  );
  process.exit(1);
}

console.log("OK: no service_role references found in app/ or components/.");
