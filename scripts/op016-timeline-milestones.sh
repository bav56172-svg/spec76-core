#!/usr/bin/env bash
set -Eeuo pipefail

mkdir -p \
  app/projects/'[id]'/timeline \
  engineering/operations \
  engineering/knowledge/glossary

cat > types/timeline.ts <<'EOF'
import type { EntityId, IsoDateTime } from "./common";

export type TimelineStatus = "planned" | "active" | "completed" | "cancelled";
export type MilestoneStatus = "planned" | "completed" | "cancelled";

export interface ProjectTimeline {
  id: EntityId;
  project_id: EntityId;
  title: string;
  description: string | null;
  planned_start: string | null;
  planned_finish: string | null;
  actual_start: string | null;
  actual_finish: string | null;
  status: TimelineStatus;
  progress: number;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
}

export interface ProjectMilestone {
  id: EntityId;
  project_id: EntityId;
  timeline_id: EntityId | null;
  title: string;
  description: string | null;
  due_date: string | null;
  completed_at: IsoDateTime | null;
  status: MilestoneStatus;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
}
EOF

if ! grep -q 'export \* from "./timeline";' types/index.ts; then
  printf '\nexport * from "./timeline";\n' >> types/index.ts
fi

cat > services/timeline.ts <<'EOF'
import { supabase } from "@/services/supabase";
import type {
  ProjectMilestone,
  ProjectTimeline,
  TimelineStatus,
} from "@/types/timeline";

export async function listProjectTimelines(projectId: string) {
  return await supabase
    .from("project_timelines")
    .select("*")
    .eq("project_id", projectId)
    .order("planned_start", { ascending: true })
    .returns<ProjectTimeline[]>();
}

export async function listProjectMilestones(projectId: string) {
  return await supabase
    .from("project_milestones")
    .select("*")
    .eq("project_id", projectId)
    .order("due_date", { ascending: true })
    .returns<ProjectMilestone[]>();
}

export async function createTimeline(input: {
  project_id: string;
  title: string;
  description?: string;
  planned_start?: string;
  planned_finish?: string;
}) {
  return await supabase
    .from("project_timelines")
    .insert({ ...input, status: "planned", progress: 0 })
    .select("*")
    .single<ProjectTimeline>();
}

export async function updateTimeline(
  id: string,
  updates: Partial<{
    title: string;
    description: string | null;
    planned_start: string | null;
    planned_finish: string | null;
    actual_start: string | null;
    actual_finish: string | null;
    status: TimelineStatus;
    progress: number;
  }>,
) {
  return await supabase
    .from("project_timelines")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single<ProjectTimeline>();
}

export async function createMilestone(input: {
  project_id: string;
  timeline_id?: string | null;
  title: string;
  description?: string;
  due_date?: string;
}) {
  return await supabase
    .from("project_milestones")
    .insert({ ...input, status: "planned" })
    .select("*")
    .single<ProjectMilestone>();
}

export async function completeMilestone(id: string) {
  return await supabase
    .from("project_milestones")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single<ProjectMilestone>();
}
EOF

cat > database/migrations/20260714_009_create_project_timeline.sql <<'EOF'
create table if not exists public.project_timelines (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 2 and 200),
  description text,
  planned_start date,
  planned_finish date,
  actual_start date,
  actual_finish date,
  status text not null default 'planned'
    check (status in ('planned', 'active', 'completed', 'cancelled')),
  progress integer not null default 0 check (progress between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (planned_finish is null or planned_start is null or planned_finish >= planned_start),
  check (actual_finish is null or actual_start is null or actual_finish >= actual_start)
);

create table if not exists public.project_milestones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  timeline_id uuid references public.project_timelines(id) on delete set null,
  title text not null check (char_length(trim(title)) between 2 and 200),
  description text,
  due_date date,
  completed_at timestamptz,
  status text not null default 'planned'
    check (status in ('planned', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists project_timelines_project_start_idx
  on public.project_timelines(project_id, planned_start);

create index if not exists project_milestones_project_due_idx
  on public.project_milestones(project_id, due_date);

create index if not exists project_milestones_timeline_idx
  on public.project_milestones(timeline_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists project_timelines_set_updated_at on public.project_timelines;
create trigger project_timelines_set_updated_at
before update on public.project_timelines
for each row execute function public.set_updated_at();

drop trigger if exists project_milestones_set_updated_at on public.project_milestones;
create trigger project_milestones_set_updated_at
before update on public.project_milestones
for each row execute function public.set_updated_at();

alter table public.project_timelines enable row level security;
alter table public.project_milestones enable row level security;

drop policy if exists "Project participants read timelines" on public.project_timelines;
create policy "Project participants read timelines"
on public.project_timelines for select to authenticated
using (
  exists (
    select 1
    from public.projects
    left join public.companies on companies.id = projects.company_id
    where projects.id = project_timelines.project_id
      and (projects.owner_id = auth.uid() or companies.owner_id = auth.uid())
  )
);

drop policy if exists "Project participants manage timelines" on public.project_timelines;
create policy "Project participants manage timelines"
on public.project_timelines for all to authenticated
using (
  exists (
    select 1
    from public.projects
    left join public.companies on companies.id = projects.company_id
    where projects.id = project_timelines.project_id
      and (projects.owner_id = auth.uid() or companies.owner_id = auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.projects
    left join public.companies on companies.id = projects.company_id
    where projects.id = project_timelines.project_id
      and (projects.owner_id = auth.uid() or companies.owner_id = auth.uid())
  )
);

drop policy if exists "Project participants read milestones" on public.project_milestones;
create policy "Project participants read milestones"
on public.project_milestones for select to authenticated
using (
  exists (
    select 1
    from public.projects
    left join public.companies on companies.id = projects.company_id
    where projects.id = project_milestones.project_id
      and (projects.owner_id = auth.uid() or companies.owner_id = auth.uid())
  )
);

drop policy if exists "Project participants manage milestones" on public.project_milestones;
create policy "Project participants manage milestones"
on public.project_milestones for all to authenticated
using (
  exists (
    select 1
    from public.projects
    left join public.companies on companies.id = projects.company_id
    where projects.id = project_milestones.project_id
      and (projects.owner_id = auth.uid() or companies.owner_id = auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.projects
    left join public.companies on companies.id = projects.company_id
    where projects.id = project_milestones.project_id
      and (projects.owner_id = auth.uid() or companies.owner_id = auth.uid())
  )
);

alter table public.project_activities
  drop constraint if exists project_activities_event_type_check;

alter table public.project_activities
  add constraint project_activities_event_type_check
  check (event_type in (
    'project_created',
    'project_status_changed',
    'task_created',
    'task_status_changed',
    'document_created',
    'document_archived',
    'document_restored',
    'document_version_created',
    'timeline_created',
    'timeline_status_changed',
    'milestone_created',
    'milestone_completed'
  ));

create or replace function public.log_timeline_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_table_name = 'project_timelines' and tg_op = 'INSERT' then
    insert into public.project_activities (
      project_id, actor_id, event_type, title, description, metadata
    ) values (
      new.project_id,
      auth.uid(),
      'timeline_created',
      'Создан этап временной шкалы',
      new.title,
      jsonb_build_object('timeline_id', new.id, 'status', new.status)
    );
    return new;
  end if;

  if tg_table_name = 'project_timelines' and tg_op = 'UPDATE'
     and old.status is distinct from new.status then
    insert into public.project_activities (
      project_id, actor_id, event_type, title, description, metadata
    ) values (
      new.project_id,
      auth.uid(),
      'timeline_status_changed',
      'Статус этапа изменён',
      new.title || ': ' || old.status || ' → ' || new.status,
      jsonb_build_object('timeline_id', new.id, 'from', old.status, 'to', new.status)
    );
    return new;
  end if;

  if tg_table_name = 'project_milestones' and tg_op = 'INSERT' then
    insert into public.project_activities (
      project_id, actor_id, event_type, title, description, metadata
    ) values (
      new.project_id,
      auth.uid(),
      'milestone_created',
      'Создан контрольный этап',
      new.title,
      jsonb_build_object('milestone_id', new.id, 'due_date', new.due_date)
    );
    return new;
  end if;

  if tg_table_name = 'project_milestones' and tg_op = 'UPDATE'
     and old.status is distinct from new.status
     and new.status = 'completed' then
    insert into public.project_activities (
      project_id, actor_id, event_type, title, description, metadata
    ) values (
      new.project_id,
      auth.uid(),
      'milestone_completed',
      'Контрольный этап достигнут',
      new.title,
      jsonb_build_object('milestone_id', new.id, 'completed_at', new.completed_at)
    );
    return new;
  end if;

  return coalesce(new, old);
end;
$$;

drop trigger if exists project_timelines_activity_insert on public.project_timelines;
create trigger project_timelines_activity_insert
after insert on public.project_timelines
for each row execute function public.log_timeline_activity();

drop trigger if exists project_timelines_activity_status on public.project_timelines;
create trigger project_timelines_activity_status
after update of status on public.project_timelines
for each row execute function public.log_timeline_activity();

drop trigger if exists project_milestones_activity_insert on public.project_milestones;
create trigger project_milestones_activity_insert
after insert on public.project_milestones
for each row execute function public.log_timeline_activity();

drop trigger if exists project_milestones_activity_complete on public.project_milestones;
create trigger project_milestones_activity_complete
after update of status on public.project_milestones
for each row execute function public.log_timeline_activity();
EOF

python3 - <<'PY'
from pathlib import Path
path = Path('types/project-activity.ts')
text = path.read_text(encoding='utf-8')
old = '''  | "task_created"\n  | "task_status_changed";'''
new = '''  | "task_created"\n  | "task_status_changed"\n  | "document_created"\n  | "document_archived"\n  | "document_restored"\n  | "document_version_created"\n  | "timeline_created"\n  | "timeline_status_changed"\n  | "milestone_created"\n  | "milestone_completed";'''
if old not in text:
    raise SystemExit('Не найден ожидаемый блок типов активности')
path.write_text(text.replace(old, new, 1), encoding='utf-8')
PY

cat > app/projects/'[id]'/timeline/page.tsx <<'EOF'
"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  completeMilestone,
  createMilestone,
  createTimeline,
  listProjectMilestones,
  listProjectTimelines,
  updateTimeline,
} from "@/services/timeline";
import type { ProjectMilestone, ProjectTimeline } from "@/types/timeline";

export default function ProjectTimelinePage() {
  const params = useParams<{ id: string | string[] }>();
  const projectId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [timelines, setTimelines] = useState<ProjectTimeline[]>([]);
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([]);
  const [timelineTitle, setTimelineTitle] = useState("");
  const [milestoneTitle, setMilestoneTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    void Promise.all([
      listProjectTimelines(projectId),
      listProjectMilestones(projectId),
    ]).then(([timelineResult, milestoneResult]) => {
      if (!active) return;

      const loadError = timelineResult.error ?? milestoneResult.error;
      if (loadError) {
        setError(loadError.message);
      } else {
        setTimelines(timelineResult.data ?? []);
        setMilestones(milestoneResult.data ?? []);
        setError(null);
      }

      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [projectId]);

  const overallProgress = useMemo(() => {
    if (timelines.length === 0) return 0;
    return Math.round(
      timelines.reduce((sum, item) => sum + item.progress, 0) / timelines.length,
    );
  }, [timelines]);

  async function handleCreateTimeline() {
    const title = timelineTitle.trim();
    if (!title || saving) return;

    setSaving(true);
    const { data, error: createError } = await createTimeline({ project_id: projectId, title });

    if (createError || !data) {
      setError(createError?.message ?? "Не удалось создать этап.");
    } else {
      setTimelines((current) => [...current, data]);
      setTimelineTitle("");
    }
    setSaving(false);
  }

  async function handleCreateMilestone() {
    const title = milestoneTitle.trim();
    if (!title || saving) return;

    setSaving(true);
    const { data, error: createError } = await createMilestone({ project_id: projectId, title });

    if (createError || !data) {
      setError(createError?.message ?? "Не удалось создать контрольный этап.");
    } else {
      setMilestones((current) => [...current, data]);
      setMilestoneTitle("");
    }
    setSaving(false);
  }

  async function handleProgress(item: ProjectTimeline, progress: number) {
    const status = progress === 100 ? "completed" : progress > 0 ? "active" : "planned";
    const { data, error: updateError } = await updateTimeline(item.id, { progress, status });
    if (updateError || !data) {
      setError(updateError?.message ?? "Не удалось обновить этап.");
      return;
    }
    setTimelines((current) => current.map((value) => (value.id === data.id ? data : value)));
  }

  async function handleCompleteMilestone(item: ProjectMilestone) {
    const { data, error: updateError } = await completeMilestone(item.id);
    if (updateError || !data) {
      setError(updateError?.message ?? "Не удалось завершить контрольный этап.");
      return;
    }
    setMilestones((current) => current.map((value) => (value.id === data.id ? data : value)));
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-2xl bg-slate-950 p-6 text-white">
          <Link href={`/projects/${projectId}`} className="text-sm text-sky-300 hover:underline">
            ← К рабочему пространству проекта
          </Link>
          <h1 className="mt-3 text-3xl font-bold">Timeline & Milestones (временная шкала и контрольные этапы)</h1>
          <p className="mt-2 text-slate-300">Общий прогресс проекта: {overallProgress}%</p>
        </header>

        {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>}

        <section className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">Этапы временной шкалы</h2>
            <div className="mt-4 flex gap-3">
              <input
                className="w-full rounded-lg border p-3"
                value={timelineTitle}
                onChange={(event) => setTimelineTitle(event.target.value)}
                placeholder="Например: Подготовительные работы"
              />
              <button
                type="button"
                onClick={() => void handleCreateTimeline()}
                disabled={saving || !timelineTitle.trim()}
                className="rounded-lg bg-slate-900 px-4 py-3 text-white disabled:opacity-50"
              >
                Добавить
              </button>
            </div>

            <div className="mt-5 space-y-4">
              {loading ? (
                <p>Загрузка...</p>
              ) : timelines.length === 0 ? (
                <p className="text-slate-500">Этапы ещё не созданы.</p>
              ) : (
                timelines.map((item) => (
                  <div key={item.id} className="rounded-xl border p-4">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-semibold">{item.title}</h3>
                      <span className="text-sm text-slate-500">{item.progress}%</span>
                    </div>
                    <input
                      className="mt-4 w-full"
                      type="range"
                      min="0"
                      max="100"
                      step="10"
                      value={item.progress}
                      onChange={(event) => void handleProgress(item, Number(event.target.value))}
                    />
                  </div>
                ))
              )}
            </div>
          </article>

          <article className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">Контрольные этапы</h2>
            <div className="mt-4 flex gap-3">
              <input
                className="w-full rounded-lg border p-3"
                value={milestoneTitle}
                onChange={(event) => setMilestoneTitle(event.target.value)}
                placeholder="Например: Договор подписан"
              />
              <button
                type="button"
                onClick={() => void handleCreateMilestone()}
                disabled={saving || !milestoneTitle.trim()}
                className="rounded-lg bg-slate-900 px-4 py-3 text-white disabled:opacity-50"
              >
                Добавить
              </button>
            </div>

            <div className="mt-5 space-y-4">
              {loading ? (
                <p>Загрузка...</p>
              ) : milestones.length === 0 ? (
                <p className="text-slate-500">Контрольные этапы ещё не созданы.</p>
              ) : (
                milestones.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-4 rounded-xl border p-4">
                    <div>
                      <h3 className="font-semibold">{item.title}</h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {item.status === "completed" ? "Достигнут" : "Запланирован"}
                      </p>
                    </div>
                    {item.status !== "completed" && (
                      <button
                        type="button"
                        onClick={() => void handleCompleteMilestone(item)}
                        className="rounded-lg bg-emerald-700 px-3 py-2 text-sm text-white"
                      >
                        Завершить
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
EOF

python3 - <<'PY'
from pathlib import Path
path = Path('app/projects/[id]/page.tsx')
text = path.read_text(encoding='utf-8')
old = '''                <Link href={`/projects/${project.id}/governance`} className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 transition hover:shadow-md">\n                  <h3 className="font-semibold text-emerald-950">Контроль проекта</h3>\n                  <p className="mt-2 text-sm text-emerald-900">Правила, решения и контрольные точки выполнения.</p>\n                </Link>'''
new = '''                <Link href={`/projects/${project.id}/timeline`} className="rounded-xl border border-violet-200 bg-violet-50 p-5 transition hover:shadow-md">\n                  <h3 className="font-semibold text-violet-950">Временная шкала</h3>\n                  <p className="mt-2 text-sm text-violet-900">Этапы, прогресс и контрольные результаты проекта.</p>\n                </Link>\n                <Link href={`/projects/${project.id}/governance`} className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 transition hover:shadow-md">\n                  <h3 className="font-semibold text-emerald-950">Контроль проекта</h3>\n                  <p className="mt-2 text-sm text-emerald-900">Правила, решения и контрольные точки выполнения.</p>\n                </Link>'''
if old not in text:
    raise SystemExit('Не найден ожидаемый блок карточки управления проектом')
path.write_text(text.replace(old, new, 1), encoding='utf-8')
PY

cat > engineering/operations/OP-016-timeline-milestones.md <<'EOF'
# OP-016 — Timeline & Milestones (временная шкала и контрольные этапы)

## Цель

Добавить календарное планирование этапов проекта, контроль прогресса и фиксацию значимых результатов.

## Состав

- `project_timelines` — этапы и прогресс;
- `project_milestones` — контрольные этапы;
- RLS (разграничение доступа на уровне строк);
- Activity Engine (движок активности);
- страница `/projects/[id]/timeline`;
- сервисный слой и типы TypeScript.

## Definition of Done (критерии завершения)

- миграция применена;
- RLS включена;
- этапы создаются и обновляются;
- контрольные этапы создаются и завершаются;
- события попадают в `project_activities`;
- Lint, TypeScript и Build проходят успешно.
EOF

cat > engineering/knowledge/glossary/OP-016-timeline-terms.md <<'EOF'
# OP-016 — Инженерный словарь

## Timeline (временная шкала)

План проекта во времени, объединяющий этапы, сроки и прогресс.

## Milestone (контрольный этап)

Значимый результат проекта. Отвечает на вопрос: «Какой важный результат достигнут?»

## Planned Date (плановая дата)

Дата, запланированная до начала выполнения.

## Actual Date (фактическая дата)

Дата, когда действие действительно началось или завершилось.

## Progress (прогресс)

Числовая оценка выполнения этапа от 0 до 100 процентов.
EOF

cat >> engineering/daily/SESSION_LOG.md <<'EOF'

## 2026-07-14 — OP-016 Timeline & Milestones

Подготовлены временная шкала проекта, контрольные этапы, RLS, события Activity Engine и пользовательский интерфейс.
EOF

cat > engineering/sprints/CURRENT_SPRINT.md <<'EOF'
# Current Sprint — Release 0.3 Project Collaboration

## Goal

Реализовать Capability C-001 Project Collaboration (возможность совместной работы над проектом).

## Completed

- OP-000 Engineering OS Foundation.
- OP-011 Execution Workspace Foundation.
- OP-012 Project Execution Workspace.
- OP-013 Project Activity Engine.
- OP-014 Task Engine.
- OP-015 Documents Engine.

## In Progress

- OP-016 Timeline & Milestones.

## Next

- OP-017 Notifications Engine.
- OP-018 Project Chat.

## Blockers

Нет подтверждённых блокеров.
EOF

echo "OP-016 Timeline & Milestones files created"
