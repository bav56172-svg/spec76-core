#!/usr/bin/env bash
set -euo pipefail

mkdir -p \
  database/migrations \
  services \
  types \
  'app/projects/[id]/docs' \
  engineering/operations \
  engineering/knowledge/glossary

cat > types/document.ts <<'EOF'
import type { EntityId, IsoDateTime } from "./common";

export type DocumentType =
  | "contract"
  | "estimate"
  | "act"
  | "invoice"
  | "photo"
  | "technical"
  | "other";

export type DocumentStatus = "draft" | "active" | "archived";

export interface ProjectDocument {
  id: EntityId;
  project_id: EntityId;
  task_id: EntityId | null;
  owner_id: EntityId;
  document_type: DocumentType;
  title: string;
  description: string | null;
  status: DocumentStatus;
  current_version: number;
  archived_at: IsoDateTime | null;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
}

export interface DocumentVersion {
  id: EntityId;
  document_id: EntityId;
  version_number: number;
  storage_path: string;
  file_name: string;
  mime_type: string | null;
  size_bytes: number | null;
  checksum: string | null;
  uploaded_by: EntityId;
  created_at: IsoDateTime;
}

export type CreateDocumentInput = Pick<
  ProjectDocument,
  "project_id" | "document_type" | "title"
> &
  Partial<Pick<ProjectDocument, "task_id" | "description">>;

export type CreateDocumentVersionInput = Pick<
  DocumentVersion,
  "document_id" | "storage_path" | "file_name"
> &
  Partial<Pick<DocumentVersion, "mime_type" | "size_bytes" | "checksum">>;
EOF

if ! grep -q 'export \* from "./document";' types/index.ts; then
  printf '\nexport * from "./document";\n' >> types/index.ts
fi

cat > services/documents.ts <<'EOF'
import { supabase } from "@/services/supabase";
import type {
  CreateDocumentInput,
  CreateDocumentVersionInput,
  DocumentVersion,
  ProjectDocument,
} from "@/types/document";

export async function listProjectDocuments(projectId: string) {
  return await supabase
    .from("documents")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .returns<ProjectDocument[]>();
}

export async function getDocument(documentId: string) {
  return await supabase
    .from("documents")
    .select("*")
    .eq("id", documentId)
    .single<ProjectDocument>();
}

export async function listDocumentVersions(documentId: string) {
  return await supabase
    .from("document_versions")
    .select("*")
    .eq("document_id", documentId)
    .order("version_number", { ascending: false })
    .returns<DocumentVersion[]>();
}

export async function createDocument(input: CreateDocumentInput) {
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return {
      data: null,
      error: authError ?? new Error("Пользователь не авторизован."),
    };
  }

  return await supabase
    .from("documents")
    .insert({
      project_id: input.project_id,
      task_id: input.task_id ?? null,
      owner_id: authData.user.id,
      document_type: input.document_type,
      title: input.title.trim(),
      description: input.description?.trim() || null,
    })
    .select("*")
    .single<ProjectDocument>();
}

export async function createDocumentVersion(input: CreateDocumentVersionInput) {
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return {
      data: null,
      error: authError ?? new Error("Пользователь не авторизован."),
    };
  }

  return await supabase.rpc("create_document_version", {
    p_document_id: input.document_id,
    p_storage_path: input.storage_path,
    p_file_name: input.file_name,
    p_mime_type: input.mime_type ?? null,
    p_size_bytes: input.size_bytes ?? null,
    p_checksum: input.checksum ?? null,
  });
}

export async function archiveDocument(documentId: string) {
  return await supabase
    .from("documents")
    .update({ status: "archived", archived_at: new Date().toISOString() })
    .eq("id", documentId)
    .select("*")
    .single<ProjectDocument>();
}

export async function restoreDocument(documentId: string) {
  return await supabase
    .from("documents")
    .update({ status: "active", archived_at: null })
    .eq("id", documentId)
    .select("*")
    .single<ProjectDocument>();
}
EOF

cat > database/migrations/20260713_008_create_documents.sql <<'EOF'
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete set null,
  owner_id uuid not null references auth.users(id) on delete restrict,
  document_type text not null default 'other'
    check (document_type in ('contract', 'estimate', 'act', 'invoice', 'photo', 'technical', 'other')),
  title text not null check (char_length(trim(title)) between 2 and 200),
  description text,
  status text not null default 'active'
    check (status in ('draft', 'active', 'archived')),
  current_version integer not null default 0 check (current_version >= 0),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.document_versions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  version_number integer not null check (version_number > 0),
  storage_path text not null,
  file_name text not null check (char_length(trim(file_name)) between 1 and 255),
  mime_type text,
  size_bytes bigint check (size_bytes is null or size_bytes >= 0),
  checksum text,
  uploaded_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (document_id, version_number)
);

create index if not exists documents_project_created_idx
  on public.documents(project_id, created_at desc);

create index if not exists documents_task_idx
  on public.documents(task_id)
  where task_id is not null;

create index if not exists documents_status_idx
  on public.documents(project_id, status);

create index if not exists document_versions_document_idx
  on public.document_versions(document_id, version_number desc);

create or replace function public.set_document_updated_at()
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

drop trigger if exists documents_set_updated_at on public.documents;
create trigger documents_set_updated_at
before update on public.documents
for each row execute function public.set_document_updated_at();

alter table public.documents enable row level security;
alter table public.document_versions enable row level security;

drop policy if exists "Project participants read documents" on public.documents;
create policy "Project participants read documents"
on public.documents for select to authenticated
using (
  exists (
    select 1
    from public.projects
    left join public.companies on companies.id = projects.company_id
    where projects.id = documents.project_id
      and (projects.owner_id = auth.uid() or companies.owner_id = auth.uid())
  )
);

drop policy if exists "Project participants create documents" on public.documents;
create policy "Project participants create documents"
on public.documents for insert to authenticated
with check (
  owner_id = auth.uid()
  and exists (
    select 1
    from public.projects
    left join public.companies on companies.id = projects.company_id
    where projects.id = documents.project_id
      and (projects.owner_id = auth.uid() or companies.owner_id = auth.uid())
  )
);

drop policy if exists "Project participants update documents" on public.documents;
create policy "Project participants update documents"
on public.documents for update to authenticated
using (
  exists (
    select 1
    from public.projects
    left join public.companies on companies.id = projects.company_id
    where projects.id = documents.project_id
      and (projects.owner_id = auth.uid() or companies.owner_id = auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.projects
    left join public.companies on companies.id = projects.company_id
    where projects.id = documents.project_id
      and (projects.owner_id = auth.uid() or companies.owner_id = auth.uid())
  )
);

drop policy if exists "Project participants read document versions" on public.document_versions;
create policy "Project participants read document versions"
on public.document_versions for select to authenticated
using (
  exists (
    select 1
    from public.documents
    join public.projects on projects.id = documents.project_id
    left join public.companies on companies.id = projects.company_id
    where documents.id = document_versions.document_id
      and (projects.owner_id = auth.uid() or companies.owner_id = auth.uid())
  )
);

drop policy if exists "Project participants create document versions" on public.document_versions;
create policy "Project participants create document versions"
on public.document_versions for insert to authenticated
with check (
  uploaded_by = auth.uid()
  and exists (
    select 1
    from public.documents
    join public.projects on projects.id = documents.project_id
    left join public.companies on companies.id = projects.company_id
    where documents.id = document_versions.document_id
      and documents.status <> 'archived'
      and (projects.owner_id = auth.uid() or companies.owner_id = auth.uid())
  )
);

create or replace function public.create_document_version(
  p_document_id uuid,
  p_storage_path text,
  p_file_name text,
  p_mime_type text default null,
  p_size_bytes bigint default null,
  p_checksum text default null
)
returns public.document_versions
language plpgsql
security invoker
set search_path = public
as $$
declare
  next_version integer;
  created_version public.document_versions;
begin
  select current_version + 1
  into next_version
  from public.documents
  where id = p_document_id
    and status <> 'archived'
  for update;

  if next_version is null then
    raise exception 'Document is unavailable for version creation';
  end if;

  insert into public.document_versions (
    document_id,
    version_number,
    storage_path,
    file_name,
    mime_type,
    size_bytes,
    checksum,
    uploaded_by
  ) values (
    p_document_id,
    next_version,
    p_storage_path,
    p_file_name,
    p_mime_type,
    p_size_bytes,
    p_checksum,
    auth.uid()
  )
  returning * into created_version;

  update public.documents
  set current_version = next_version,
      status = 'active'
  where id = p_document_id;

  return created_version;
end;
$$;

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
    'document_version_created'
  ));

create or replace function public.log_document_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_table_name = 'documents' and tg_op = 'INSERT' then
    insert into public.project_activities (
      project_id, actor_id, event_type, title, description, metadata
    ) values (
      new.project_id,
      auth.uid(),
      'document_created',
      'Создан документ',
      new.title,
      jsonb_build_object('document_id', new.id, 'document_type', new.document_type)
    );
    return new;
  end if;

  if tg_table_name = 'documents' and tg_op = 'UPDATE'
     and old.status is distinct from new.status
     and new.status = 'archived' then
    insert into public.project_activities (
      project_id, actor_id, event_type, title, description, metadata
    ) values (
      new.project_id,
      auth.uid(),
      'document_archived',
      'Документ архивирован',
      new.title,
      jsonb_build_object('document_id', new.id)
    );
    return new;
  end if;

  if tg_table_name = 'document_versions' and tg_op = 'INSERT' then
    insert into public.project_activities (
      project_id, actor_id, event_type, title, description, metadata
    )
    select
      documents.project_id,
      auth.uid(),
      'document_version_created',
      'Добавлена версия документа',
      new.file_name,
      jsonb_build_object(
        'document_id', new.document_id,
        'version_id', new.id,
        'version_number', new.version_number
      )
    from public.documents
    where documents.id = new.document_id;
    return new;
  end if;

  return coalesce(new, old);
end;
$$;

drop trigger if exists documents_activity_created on public.documents;
create trigger documents_activity_created
after insert on public.documents
for each row execute function public.log_document_activity();

drop trigger if exists documents_activity_archived on public.documents;
create trigger documents_activity_archived
after update of status on public.documents
for each row execute function public.log_document_activity();

drop trigger if exists document_versions_activity_created on public.document_versions;
create trigger document_versions_activity_created
after insert on public.document_versions
for each row execute function public.log_document_activity();
EOF

cat > 'app/projects/[id]/docs/page.tsx' <<'EOF'
"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  archiveDocument,
  createDocument,
  listProjectDocuments,
  restoreDocument,
} from "@/services/documents";
import type {
  DocumentStatus,
  DocumentType,
  ProjectDocument,
} from "@/types/document";

const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  contract: "Договор",
  estimate: "Смета",
  act: "Акт",
  invoice: "Счёт",
  photo: "Фотография",
  technical: "Технический документ",
  other: "Другое",
};

const STATUS_LABELS: Record<DocumentStatus, string> = {
  draft: "Черновик",
  active: "Активен",
  archived: "В архиве",
};

export default function ProjectDocumentsPage() {
  const params = useParams<{ id: string | string[] }>();
  const projectId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [documentType, setDocumentType] = useState<DocumentType>("other");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadDocuments() {
    const { data, error: loadError } = await listProjectDocuments(projectId);

    if (loadError) {
      setError(loadError.message);
      setDocuments([]);
    } else {
      setDocuments(data ?? []);
      setError(null);
    }

    setLoading(false);
  }

  useEffect(() => {
    void loadDocuments();
  }, [projectId]);

  const activeCount = useMemo(
    () => documents.filter((document) => document.status !== "archived").length,
    [documents],
  );

  async function handleCreate() {
    const normalizedTitle = title.trim();
    if (!normalizedTitle || saving) return;

    setSaving(true);
    setError(null);

    const { data, error: createError } = await createDocument({
      project_id: projectId,
      document_type: documentType,
      title: normalizedTitle,
      description,
    });

    if (createError || !data) {
      setError(createError?.message ?? "Не удалось создать документ.");
    } else {
      setDocuments((current) => [data, ...current]);
      setTitle("");
      setDescription("");
      setDocumentType("other");
    }

    setSaving(false);
  }

  async function toggleArchive(document: ProjectDocument) {
    const action = document.status === "archived" ? restoreDocument : archiveDocument;
    const { data, error: updateError } = await action(document.id);

    if (updateError || !data) {
      setError(updateError?.message ?? "Не удалось изменить статус документа.");
      return;
    }

    setDocuments((current) =>
      current.map((item) => (item.id === data.id ? data : item)),
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-2xl bg-slate-950 p-6 text-white shadow-sm sm:p-8">
          <Link href={`/projects/${projectId}`} className="text-sm text-sky-300 hover:underline">
            ← К рабочему пространству проекта
          </Link>
          <p className="mt-5 text-sm font-semibold uppercase tracking-wide text-sky-300">
            Documents Engine (движок документов)
          </p>
          <h1 className="mt-2 text-3xl font-bold">Документы проекта</h1>
          <p className="mt-3 max-w-3xl text-slate-300">
            Единый реестр документов, их статусов и версий. На первом этапе сохраняются метаданные; загрузка файлов в Storage (файловое хранилище) подключается отдельной операцией.
          </p>
        </header>

        <section className="grid gap-4 sm:grid-cols-3">
          <article className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Всего документов</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{documents.length}</p>
          </article>
          <article className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Активных</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{activeCount}</p>
          </article>
          <article className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Версий файлов</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">
              {documents.reduce((sum, document) => sum + document.current_version, 0)}
            </p>
          </article>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-950">Создать документ</h2>
          <p className="mt-1 text-sm text-slate-600">
            Metadata (метаданные) описывают документ независимо от конкретного файла.
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">
              Название
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 p-3"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Например, Договор на выполнение работ"
              />
            </label>

            <label className="text-sm font-medium text-slate-700">
              Тип документа
              <select
                className="mt-1 w-full rounded-lg border border-slate-300 p-3"
                value={documentType}
                onChange={(event) => setDocumentType(event.target.value as DocumentType)}
              >
                {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>
          </div>

          <label className="mt-4 block text-sm font-medium text-slate-700">
            Описание
            <textarea
              className="mt-1 min-h-24 w-full rounded-lg border border-slate-300 p-3"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Краткое назначение документа"
            />
          </label>

          <button
            type="button"
            onClick={() => void handleCreate()}
            disabled={saving || !title.trim()}
            className="mt-4 rounded-lg bg-slate-950 px-5 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Сохраняем..." : "Создать документ"}
          </button>
        </section>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-950">Реестр документов</h2>

          {loading ? (
            <p className="mt-5 text-slate-600">Загрузка документов...</p>
          ) : documents.length === 0 ? (
            <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <p className="font-medium text-slate-900">Документов пока нет</p>
              <p className="mt-2 text-sm text-slate-600">Создай первую карточку документа выше.</p>
            </div>
          ) : (
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {documents.map((document) => (
                <article key={document.id} className="rounded-xl border border-slate-200 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">
                        {DOCUMENT_TYPE_LABELS[document.document_type]}
                      </p>
                      <h3 className="mt-2 text-lg font-semibold text-slate-950">{document.title}</h3>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                      {STATUS_LABELS[document.status]}
                    </span>
                  </div>

                  {document.description && (
                    <p className="mt-3 text-sm text-slate-600">{document.description}</p>
                  )}

                  <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="text-slate-500">Текущая версия</dt>
                      <dd className="font-medium text-slate-900">{document.current_version || "Нет файла"}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Создан</dt>
                      <dd className="font-medium text-slate-900">
                        {new Date(document.created_at).toLocaleDateString("ru-RU")}
                      </dd>
                    </div>
                  </dl>

                  <button
                    type="button"
                    onClick={() => void toggleArchive(document)}
                    className="mt-4 text-sm font-medium text-blue-700 hover:underline"
                  >
                    {document.status === "archived" ? "Восстановить" : "Переместить в архив"}
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
EOF

cat > engineering/operations/OP-015-documents-engine.md <<'EOF'
# OP-015 — Documents Engine (движок документов)

## Capability (возможность платформы)

C-001 Project Collaboration (совместная работа над проектом).

## Goal (цель)

Создать единый доменный объект Document (документ), независимый от конкретного файла, с поддержкой версий, статусов, RLS и событий проекта.

## Scope (состав)

- таблицы `documents` и `document_versions`;
- RLS (разграничение доступа на уровне строк);
- сервис управления документами;
- интерфейс реестра документов проекта;
- события создания, архивирования и новой версии;
- подготовка к Storage (файловому хранилищу), OCR (распознаванию текста) и AI Processing (обработке искусственным интеллектом).

## Out of Scope (не входит)

- фактическая загрузка файлов в Supabase Storage;
- OCR;
- поиск по содержимому;
- электронная подпись;
- согласование документов.

## Definition of Done (критерии завершения)

- миграция применена;
- документ создаётся из интерфейса;
- документ архивируется и восстанавливается;
- RLS ограничивает доступ участниками проекта;
- события попадают в `project_activities`;
- Lint, TypeScript и Production Build проходят;
- изменения зафиксированы в GitHub.
EOF

cat > engineering/knowledge/glossary/OP-015-documents-terms.md <<'EOF'
# Термины OP-015

## Document (документ)

Бизнес-объект с названием, типом, статусом и историей. Файл является только одной из версий документа.

## Metadata (метаданные)

Данные, описывающие документ: название, тип, автор, проект, статус и дата создания.

## Document Version (версия документа)

Отдельная сохранённая редакция файла документа. Версии нумеруются и не перезаписывают друг друга.

## Soft Delete (мягкое удаление)

Запись не удаляется физически, а переводится в состояние `archived` (в архиве). Это сохраняет историю и аудит.

## Storage (файловое хранилище)

Сервис для хранения физических файлов. В OP-015 создаётся модель и путь к файлу, а фактическая загрузка подключается отдельно.

## Checksum (контрольная сумма)

Короткое вычисляемое значение, позволяющее проверить, что файл не изменился и не был повреждён.
EOF

cat > engineering/sprints/CURRENT_SPRINT.md <<'EOF'
# Current Sprint — Release 0.3 Project Collaboration

## Goal (цель)

Реализовать Capability C-001 Project Collaboration (возможность совместной работы над проектом).

## Completed (завершено)

- OP-000 Engineering OS Foundation.
- OP-011 Execution Workspace Foundation.
- OP-012 Project Execution Workspace.
- OP-013 Project Activity Engine.
- OP-014 Task Engine.
- Architecture Sprint R0.3-A.

## In Progress (в работе)

- OP-015 Documents Engine.

## Next (далее)

- OP-016 Timeline & Milestones.
- OP-017 Notifications Engine.
- OP-018 Project Chat.

## Blockers (блокеры)

Нет подтверждённых блокеров.
EOF

cat >> engineering/daily/SESSION_LOG.md <<'EOF'

## 2026-07-13 — OP-015 Documents Engine

- Начата реализация Capability C-001 Project Collaboration.
- Добавлена доменная модель документов и версий.
- Добавлены RLS, события Activity Engine и интерфейс реестра документов.
- Добавлен двуязычный инженерный словарь терминов OP-015.
EOF

echo "OP-015 Documents Engine files created"
