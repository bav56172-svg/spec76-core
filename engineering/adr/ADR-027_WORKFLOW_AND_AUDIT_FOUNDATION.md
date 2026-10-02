# ADR-027 — Workflow and Audit Foundation (основа бизнес-процессов и аудита)

| Поле | Значение |
|---|---|
| Document ID (идентификатор документа) | SPEC76-ADR-027 |
| Version (версия) | 1.0 |
| Status (статус) | Proposed — Audit раздел реализован; Workflow раздел ожидает отдельного PR |
| Date (дата) | 2026-10-02 |
| Owner (владелец) | Platform Owner |
| Related Release (связанный релиз) | Release 0.4 / Wave 3 |
| Related Capabilities (связанные возможности) | C-003 Workflow Platform; C-004 Audit Platform |
| Related Operation (связанная операция) | OP-026 Audit Foundation (эта версия); OP-025 Workflow Foundation (следующий PR) |
| Related ADR (связанное архитектурное решение) | ADR-024 Platform Domain Foundation |
| Evidence (доказательная основа) | `engineering/registry/OPERATION_REGISTRY.md`, применение миграции на `apps-serve` (см. commit log) |

## Контекст

После Wave 2 (OP-022/023/024, завершена 2026-10-02) следующий шаг по `RELEASE_BACKLOG.md` — Wave 3: Workflow Foundation и Audit Foundation. До этого ADR в документах существовали только однострочные описания в `CAPABILITY_MAP.md`, без схемы и без зафиксированного решения.

Разбор существующей доменной модели показал:

1. **Подтверждённая дыра в безопасности**: таблица `public.platform_roles` получила в OP-024 возможность записи (platform_owner и administrator могут назначать роли через приложение), но не имеет никакого аудита. Кто кому какую роль назначил — нигде не фиксируется. Это прямое нарушение `engineering/standards/SECURITY_STANDARD.md`: "Административные и критичные действия должны быть пригодны для аудита".
2. Паттерн аудита в проекте уже есть и доказал себя: `public.project_activities` + триггеры `log_project_activity()`/`log_timeline_activity()` (`supabase/migrations/20260729000600_create_project_activities.sql`, `20260729000900_create_project_timeline.sql`). Но эта таблица жёстко привязана к `project_id` через `not null references projects` — не может покрыть события вне проектного контекста (назначение ролей, будущие изменения `companies`/`company_members`).
3. Весь проект последовательно использует `text + check` вместо enum-типов Postgres для состояний (`requests.status`, `offers.status`, `projects.status`, `tasks.status` и т.д.) — ни одного `create type ... as enum` в репозитории нет.
4. Единственный существующий multi-table переход состояния — функция `accept_offer()` (`20260729000500_create_project_activation.sql`), реализованная как конкретная SQL-функция, а не как общий движок.

## Решение

### Audit Foundation (эта версия ADR, OP-026)

Ввести отдельную, не привязанную к проекту таблицу `public.audit_log`:

```sql
create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);
```

Первая и единственная точка охвата в этой версии — `public.platform_roles` (назначение/изменение/удаление ролей), как самая критичная и уже обнаруженная дыра. Расширение на `companies`/`company_members` — отдельный follow-up, не в этом пакете (явно откладывается, не забывается).

Чтение `audit_log` — только `platform_owner`/`administrator` (через `has_platform_role()`, тот же RLS-паттерн, что и везде в проекте). Запись — только через `security definer` триггер, без прямой INSERT-политики для пользователей.

### Workflow Foundation (следующий PR, OP-025) — решение зафиксировано здесь заранее

Не строить общий настраиваемый workflow-движок (нарушило бы собственный стоп-фактор проекта — "не усложнять", `engineering/roadmap/PROJECT_CRITICAL_ASSESSMENT_AND_PLAN.md`, раздел 8) и не вводить enum-типы (нарушило бы единообразный стиль `text + check` во всей схеме). Вместо этого — guard-триггеры по образцу `accept_offer()`, по одному на каждую таблицу со значимым статусом (`requests`, `offers`, `projects`), которые отклоняют любой переход, не входящий в явно перечисленный список легальных. Будет реализовано отдельным PR и дополнит этот ADR.

Попутно зафиксирована находка: `types/project.ts` (`ProjectStatus`) объявляет 7 значений (включая `published`, `in_progress`), а DB CHECK в `projects` разрешает только 5. UI (`app/projects/[id]/page.tsx`, `STATUS_LABELS`) уже рассчитан на все 7 — значит почитать нужно БД (расширить CHECK), а не UI/TS. Исправление войдёт в PR с Workflow Foundation, вместе с guard-триггером для `projects.status`.

## Альтернативы

- **Расширить `project_activities` до общего audit log** — отклонено: таблица жёстко завязана на `project_id not null`, события вне проектного контекста (например, назначение платформенной роли до создания любых проектов) физически не вписываются без ломающей миграции существующей таблицы.
- **Enum-тип Postgres для статусов** — отклонено: единообразия ради (весь проект уже использует `text + check`), а также потому что enum в Postgres сложнее расширять миграциями (`ALTER TYPE ... ADD VALUE` не транзакционен в старых версиях, усложняет rollback).
- **Общий настраиваемый workflow-движок (таблица правил переходов, интерпретируемая рантаймом)** — отклонено на этой стадии проекта: стадия cold-start, продукт ещё не прошёл закрытый пилот (см. `PROJECT_CRITICAL_ASSESSMENT_AND_PLAN.md`), абстракция раньше необходимости — прямое нарушение собственного правила проекта не усложнять раньше времени.

## Последствия

- `platform_roles` получает аудит немедленно — самая критичная дыра закрывается в этом же пакете, а не откладывается.
- `audit_log` — расширяемая таблица; добавление аудита для новой сущности — это новый триггер + `insert`, без изменения схемы `audit_log`.
- Workflow guard-триггеры (следующий PR) сделают нелегальные переходы невозможными на уровне БД, а не только по соглашению в сервисном слое — это может выявить и сломать скрытые сценарии в существующем UI, если такие есть; это сознательно принятый риск (см. План), проверяется на `apps-serve` перед слиянием.

## Риски

- Триггер `log_platform_role_audit()` выполняется в той же транзакции, что и изменение роли — ошибка в триггере заблокирует само изменение роли. Триггер написан предельно просто (один `insert`) специально, чтобы минимизировать этот риск.
- Guard-триггеры (следующий PR) должны быть протестированы на `apps-serve` до слияния — нельзя полагаться только на `typecheck`/`lint`, так как это чисто SQL-уровневая логика.

## Связанные артефакты

- Domain Model: `public.platform_roles` (существующая, не изменяется структурно), `public.audit_log` (новая)
- Migration: `supabase/migrations/20261002000100_op026_audit_log_foundation.sql`
- Types: `types/audit-log.ts`
- Service: `services/auditLog.ts`
- UI: `app/admin/page.tsx` (секция "Журнал действий")
- Tests/Checks: `npm run verify`; ручная проверка на `apps-serve` (см. План)
