# SPEC76 Repository Classification

Status: OP-002 in progress — TEST database baseline verified
Scope: current `engineering/ep-024-platform-domain-foundation` branch state
Goal: separate MVP core from platform support, future work, and experimental code before cleanup.

## Classification rules

- `CORE` — required for the first working SPEC76 MVP.
- `PLATFORM` — shared infrastructure required to run, test, secure, or deploy the MVP.
- `FUTURE` — potentially useful after the MVP, but excluded from the first release.
- `ARCHIVE` — experimental or historically useful code that must leave the active product tree.
- `REMOVE` — generated, duplicated, obsolete, or unsafe content that must not remain in the active repository.
- `REVIEW` — classification depends on source-level inspection or database confirmation.

## Root

| Object | Status | Decision |
|---|---|---|
| `.gitignore` | PLATFORM | Keep and verify secret/build exclusions. |
| `.env.local` | REMOVE | Keep only locally; never commit. Confirm it is ignored. |
| `.next/` | REMOVE | Generated build output; never commit. |
| `node_modules/` | REMOVE | Generated dependencies; never commit. |
| `package.json` | PLATFORM | Keep; reduce dependencies after archive cleanup. |
| `package-lock.json` | PLATFORM | Keep and regenerate only after dependency changes. |
| `tsconfig.json` | PLATFORM | Keep; later disable `allowJs` unless justified. |
| `next.config.ts` | PLATFORM | Keep. |
| `eslint.config.mjs` | PLATFORM | Keep. |
| `postcss.config.mjs` | PLATFORM | Keep. |
| `public/` | REVIEW | Remove default Next.js assets not used by SPEC76. |
| `README.md` | REVIEW | Rewrite as the single setup and launch guide. |
| `AGENTS.md` | REVIEW | Keep only if it governs active engineering work. |
| `CLAUDE.md` | REVIEW | Merge useful rules into one provider-neutral engineering guide or archive. |
| `LICENSE` | PLATFORM | Keep after confirming intended licensing model. |

## Active application

| Object | Status | Decision |
|---|---|---|
| `app/layout.tsx` | CORE | Keep and align metadata/navigation with SPEC76. |
| `app/globals.css` | CORE | Keep; simplify during UI rebuild. |
| `app/page.tsx` | CORE / REWRITE | Replace the current internal OS dashboard with the customer-facing SPEC76 entry point. |
| `app/auth/` | CORE | Keep and harden authentication flow. |
| `app/companies/` | CORE / REWRITE | Keep as executor/company onboarding and profile area. |
| `app/projects/` | CORE / REWRITE | Reframe `projects` into real customer jobs/orders or migrate to an explicit `orders` domain. |
| `app/components/` | REVIEW | Keep reusable UI; archive AI/kanban components that do not support MVP flows. |
| `app/hooks/` | REVIEW | Keep company/user hooks; inspect project and realtime-AI hooks before reuse. |
| `app/lib/supabase.ts` | REMOVE / MERGE | Duplicate Supabase client; consolidate into one canonical module. |
| `app/lib/usageBilling.ts` | FUTURE | Exclude from MVP until monetization flow is approved and implemented. |
| `app/api/health/` | PLATFORM | Keep as operational health endpoint. |
| `app/api/billing/` | FUTURE | Exclude from MVP until payment architecture is approved. |
| `app/api/agents/` | ARCHIVE | Remove from active tree; not required for first user flow. |
| `app/api/ai/actions/` | REVIEW | Keep only concrete task analysis/matching actions that support MVP. |
| `app/api/ai/chat/` | FUTURE | Generic AI chat is not MVP-critical. |
| `app/api/ai/tasks/` | REVIEW | Reuse only if it creates or validates real customer jobs. |
| Other `app/api/ai/*` experimental routes | ARCHIVE | Move out of active product tree. |

## Experimental application routes

The following routes are outside the approved MVP and must be archived:

- `app/civilization/`
- `app/ecosystem/`
- `app/existence/`
- `app/meta-consciousness/`
- `app/multi-civilization/`
- `app/self-universe/`
- `app/universal-rules/`

Status: `ARCHIVE`.

## Services

| Object | Status | Decision |
|---|---|---|
| `services/supabase.ts` | PLATFORM | Keep as the canonical browser client only after duplicate review. |
| `services/companies.ts` | CORE | Keep and rewrite around typed company/executor workflows. |
| `services/projects.ts` | CORE / REWRITE | Keep temporarily; migrate terminology and operations to jobs/orders. |
| `services/tasks.ts` | REVIEW | Keep only if tasks map to approved customer or operational workflows. |
| `services/ai/contextBuilder.ts` | REVIEW | Potentially reusable for structured job analysis. |
| `services/ai/gpt.ts` | REVIEW | Keep only as one provider adapter with server-only secret handling. |
| `services/ai/errorDetector.ts` | FUTURE | Useful for engineering, not the first customer release. |
| `services/ai/kanbanAI.ts` | ARCHIVE | Internal experiment, not MVP. |
| `services/ai/taskGenerator.ts` | REVIEW | Reuse only for real order decomposition. |
| Other `services/ai/*` autonomous/civilization/swarm files | ARCHIVE | Move out of active product tree. |

## Libraries

| Object | Status | Decision |
|---|---|---|
| `lib/spec76/governance/humanInTheLoop.ts` | REVIEW | Potentially retain as a safety rule for AI-assisted decisions. |
| `lib/spec76/core/hardening.ts` | REVIEW | Inspect and retain only concrete reliability controls. |
| `lib/spec76/binding/taskAgentStream.ts` | FUTURE | Not required for MVP unless directly used by job matching. |
| `lib/spec76/memory/*` | FUTURE | Exclude until there is a defined product need and data policy. |
| `lib/spec76/rules/*` | FUTURE | Exclude until rule evolution is approved. |
| `lib/billing/*` | FUTURE | Payment work follows the validated order flow. |
| `lib/kanban/board.ts` | ARCHIVE | Internal project-management artifact, not marketplace core. |
| `lib/ai/*` | ARCHIVE / REVIEW | Archive generic autonomy/multi-agent layers; retain only concrete safety or matching utilities after inspection. |
| `lib/civilization/*` | ARCHIVE | Move out of active tree. |
| `lib/ecosystem/*` | ARCHIVE | Move out of active tree. |
| `lib/network/*` | ARCHIVE | Move out of active tree. |
| `lib/company/autonomousCompany.ts` | ARCHIVE | Not part of MVP company profile flow. |
| `lib/growth/*` | FUTURE | Revisit after first pilot. |
| `lib/saas/*` | FUTURE | Revisit after validated monetization. |

## Shared hooks and types

| Object | Status | Decision |
|---|---|---|
| `hooks/useRealtimeAI.ts` | FUTURE / REVIEW | Exclude unless directly required by job matching UI. |
| `hooks/useRealtimeExecutionLoop.ts` | ARCHIVE | Experimental automation loop. |
| `types/company.ts` | CORE | Keep and align with database-generated types. |
| `types/project.ts` | CORE / REWRITE | Migrate to job/order language. |
| `types/user.ts` | CORE | Keep and align with role model. |

## Database

| Object | Status | Decision |
|---|---|---|
| `docs/database/migrations/002_create_projects.sql` | CORE / MOVE / REWRITE | Move to `database/migrations/`; reconsider `projects` as customer jobs/orders. |
| `docs/database/migrations/003_projects_rls.sql` | CORE / MOVE / REVIEW | Move to `database/migrations/`; verify policies against roles and ownership. |
| Missing canonical database directory | CRITICAL | Create `database/migrations`, `database/schema`, and optional `database/seed`. |
| Missing schema baseline | RESOLVED FOR TEST | TEST `public` schema exported and verified after migration `20260728000100`. |

TEST verification completed on 2026-07-30:

- linked Supabase project: `dmcqsxtvosuaicqwuygk`;
- local and remote migration histories match through `20260728000100`;
- `prevent_project_company_reassignment()` and its trigger exist;
- internal trigger functions are not executable by `anon` or `authenticated`;
- authorization helpers are not executable by `anon` and remain executable by `authenticated`;
- verification dump checksum: `42db572de6e48cbeb44de1992972cf42026f67925410cbd26e45ff29b52b8a66` for the pre-migration capture; the post-migration dump remains local audit evidence and is excluded from Git.

No database migration is to be deleted or rewritten until the PROD Supabase schema is separately exported and compared.

## Documentation

| Group | Status | Decision |
|---|---|---|
| Product vision, core specification, requirements | CORE / MERGE | Consolidate into one product baseline without losing approved decisions. |
| Architecture and architecture rules | PLATFORM / MERGE | Consolidate into one MVP architecture document. |
| Roadmap and execution flow | CORE / MERGE | Replace with one active delivery roadmap. |
| Changelog | PLATFORM | Keep. |
| City pilot and operating-city documents | FUTURE | Retain outside the immediate MVP working set. |
| Multi-city, national, global scaling documents | FUTURE / ARCHIVE | Preserve, but exclude from current implementation guidance. |
| Civilization-scale or unrelated concepts | ARCHIVE | Remove from active documentation if present. |

## Immediate cleanup candidates

Safe after creating a recovery tag/branch and confirming the application still builds:

1. Archive the seven experimental application routes.
2. Archive unrelated AI API routes and autonomous/civilization service layers.
3. Consolidate Supabase clients.
4. Move database migrations from `docs/database` to `database/migrations` without changing SQL content.
5. Remove generated/default assets only after verifying they are unused.
6. Rewrite the home page toward the approved customer journey.

## Blocking checks before OP-003

- [x] Export and inspect the TEST Supabase schema, policies, authorization-function grants, and migration history.
- [ ] Export and compare the PROD Supabase schema before any PROD migration action.
- [ ] Run `npm run lint`, TypeScript validation, and `npm run build` on the current branch after this documentation update.
- [ ] Confirm `.env.local`, `.next`, and `node_modules` are ignored by Git.
- [ ] Inspect all imports that reference archive candidates.
- [ ] Create a reversible archive branch or tag before moving files.

## OP-002 exit criteria

OP-002 is complete when:

- every active directory has one classification;
- source-level review resolves all `REVIEW` entries required for the MVP;
- the TEST and PROD Supabase schemas are captured and compared;
- the cleanup plan is reversible;
- the current application passes lint, TypeScript validation, and production build before cleanup.
