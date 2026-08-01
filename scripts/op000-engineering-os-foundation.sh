#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(pwd)"

if [[ ! -f "$ROOT/package.json" ]]; then
  echo "ERROR: run this script from the SPEC76 repository root" >&2
  exit 1
fi

mkdir -p \
  engineering/constitution \
  engineering/adr \
  engineering/roadmap \
  engineering/daily \
  engineering/decisions \
  engineering/technical-debt \
  engineering/standards \
  engineering/sprints \
  engineering/knowledge/glossary \
  engineering/knowledge/patterns \
  engineering/knowledge/incidents \
  engineering/knowledge/lessons \
  engineering/traceability

cat > engineering/README.md <<'EOF'
# SPEC76 Engineering OS v1.0

Engineering OS (инженерная операционная система) определяет единый способ подготовки, реализации, проверки и фиксации изменений SPEC76.

## Основной цикл

1. Анализ сводок и внешних изменений.
2. Daily Brief (ежедневный технический бриф).
3. Проверка Git и текущего спринта.
4. Definition of Ready (критерии готовности к началу).
5. Реализация OP (инженерной операции).
6. Проверки Lint, TypeScript и Production Build.
7. Definition of Done (критерии завершения).
8. Обновление журналов решений, сессий и трассируемости.
9. Commit и Push.

## Источники истины

- Код и миграции: репозиторий GitHub.
- Предметная область: `docs/00_SPEC76_DOMAIN_MODEL.md`.
- Главный замысел: `engineering/000_PROJECT_BLUEPRINT.md`.
- Архитектурные решения: `engineering/adr/`.
- Текущий план: `engineering/sprints/CURRENT_SPRINT.md`.

Чат используется для совместной работы, но не является единственным хранилищем знаний.
EOF

cat > engineering/000_PROJECT_BLUEPRINT.md <<'EOF'
# SPEC76 Project Blueprint v1.0

Статус: Active Baseline (действующая базовая версия)

## 1. Назначение

SPEC76 — цифровой диспетчер реальных работ. Система принимает проблему заказчика, формализует заявку, анализирует её, подбирает исполнителей, собирает предложения и сопровождает выполнение до завершения.

## 2. Целевая цепочка ценности

`Customer Problem → Request → Analysis → Matching → Offer → Project → Execution → Review`

## 3. Принципы

- Product first (приоритет продуктовой ценности).
- Domain Model first (сначала модель предметной области).
- Security by design (безопасность по замыслу).
- Traceability (сквозная трассируемость решений и реализации).
- Small vertical slices (небольшие законченные вертикальные срезы).
- No imaginary artifacts (никаких несуществующих артефактов).

## 4. Текущая граница MVP

В MVP входят:

- авторизация;
- создание заявки;
- анализ заявки;
- подбор исполнителей;
- предложения;
- выбор исполнителя;
- создание проекта;
- рабочее пространство проекта;
- задачи выполнения;
- завершение и отзыв.

Не входят до отдельного решения: сложный биллинг, мультиагентная автономия, глобальная масштабируемость и экспериментальные AI-модули.

## 5. Архитектурная основа

- Frontend: Next.js + React + TypeScript.
- Backend/Data: Supabase + PostgreSQL.
- Access Control: Supabase Auth + RLS.
- Source of Truth: GitHub repository.

## 6. Управление изменениями

Существенные архитектурные изменения требуют ADR. Изменения предметной области требуют обновления Domain Model. Изменения схемы данных требуют миграции и проверки RLS.
EOF

cat > engineering/constitution/PROJECT_CONSTITUTION.md <<'EOF'
# SPEC76 Project Constitution v1.0

1. GitHub — единственный источник истины для кода и инженерных артефактов.
2. Никаких воображаемых файлов, коммитов, миграций или результатов проверок.
3. Каждая рабочая сессия начинается с анализа сводок, Git-проверки и Daily Brief.
4. Каждый OP имеет цель, границы, Definition of Ready и Definition of Done.
5. Изменения предметной области согласуются с Domain Model.
6. Существенные архитектурные решения оформляются через ADR.
7. Новая таблица не принимается без RLS-оценки.
8. `service_role` запрещён в клиентском коде.
9. Секреты и `.env` не коммитятся.
10. Каждый OP завершается Lint, TypeScript, Build, Commit и Push.
11. Ошибки не скрываются: фиксируются как Bug, Technical Debt, Architecture или Blocked.
12. Приоритет — завершённый MVP, а не количество функций.
EOF

cat > engineering/daily/DAILY_BRIEF_TEMPLATE.md <<'EOF'
# SPEC76 Daily Brief

Дата:

- Repository: Clean / Dirty
- Branch:
- Current Release:
- Current OP:
- Previous OP:
- Build: OK / Failed / Unknown
- Database: Synced / Pending / Unknown
- New summaries reviewed:
- Risks:
- Technical Debt:
- Blockers:
- Today's Goal:
- Definition of Ready: Passed / Failed
EOF

cat > engineering/daily/SESSION_LOG.md <<'EOF'
# SPEC76 Session Log

## 2026-07-13

- Проанализированы ежедневная сводка, Legal Watch и сводка ЕЦЭУПО.
- Репозиторий подтверждён как clean и синхронизированный.
- Утверждено создание Engineering OS v1.0.
- Текущий функциональный приоритет после OP-000: OP-012 Project Execution Workspace.
EOF

cat > engineering/decisions/DECISION_LOG.md <<'EOF'
# SPEC76 Decision Log

## 2026-07-13 — Engineering OS

Решение: внедрить единый инженерный цикл подготовки, реализации и проверки OP.

Причина: сократить ошибки, исключить несуществующие артефакты и перенести знания из чата в репозиторий.

Последствия:

- каждая сессия начинается с Daily Brief;
- каждый OP проходит DoR и DoD;
- существенные решения оформляются через ADR;
- после OP-000 продолжается OP-012.
EOF

cat > engineering/technical-debt/TECH_DEBT.md <<'EOF'
# SPEC76 Technical Debt Register

## TD-001 — Multiple lockfiles

Статус: Open
Приоритет: Low

Next.js обнаруживает дополнительный `/Users/andraybalashov/package-lock.json` и может неверно определять workspace root.

Решение позже: проверить родительский lockfile и либо удалить его после подтверждения ненужности, либо явно задать `turbopack.root`.

Причина отсрочки: не влияет на Lint, TypeScript, Build и текущий MVP-поток.

## TD-002 — Security automation

Статус: Backlog
Приоритет: Medium

Добавить GitHub Actions для secret scanning, проверки клиентского использования `service_role`, базового контроля RLS и открытых API.
EOF

cat > engineering/technical-debt/BACKLOG.md <<'EOF'
# SPEC76 Engineering Backlog

- OP-012: Task Board and execution control.
- OP-013: Project Timeline.
- OP-014: Project Documents foundation.
- Security Pipeline v1.0.
- Supabase infrastructure audit: PostgreSQL version, logging, RLS and GraphQL settings.
- Resolve TD-001 multiple lockfiles warning.
EOF

cat > engineering/roadmap/ROADMAP.md <<'EOF'
# SPEC76 Engineering Roadmap

## Release 0.1 — Customer to Project Flow

- OP-008 Contractor Matching — completed.
- OP-009 Offer Center — completed.
- OP-010 Project Activation — completed.
- OP-011 Execution Workspace Foundation — completed.

## Release 0.2 — Project Execution

- OP-012 Task Board and execution workflow.
- OP-013 Project Timeline.
- OP-014 Documents foundation.
- OP-015 Completion and Review.

## Release 0.3 — Operational Hardening

- Security Pipeline.
- Infrastructure audit.
- Observability and incident handling.
- Release readiness review.
EOF

cat > engineering/roadmap/MVP_SCOPE.md <<'EOF'
# SPEC76 MVP Scope

## Included

- Customer authentication.
- Request creation and storage.
- Request analysis.
- Contractor matching.
- Offers and selection.
- Automatic project activation.
- Execution workspace and tasks.
- Completion and review.

## Excluded until separate approval

- Complex payments and escrow.
- Autonomous AI companies.
- Multi-city scaling automation.
- Advanced analytics.
- Native mobile applications.
EOF

cat > engineering/adr/README.md <<'EOF'
# Architecture Decision Records

ADR требуется, когда изменение:

- меняет bounded context или ключевую сущность;
- меняет авторизацию, роли или модель доступа;
- меняет инфраструктуру или внешнего поставщика;
- меняет способ хранения данных;
- создаёт долгосрочное архитектурное ограничение.

Исправление локального бага без изменения архитектуры ADR не требует.
EOF

cat > engineering/adr/ADR_TEMPLATE.md <<'EOF'
# ADR-NNN — Название

Статус: Proposed / Accepted / Superseded / Rejected
Дата:

## Контекст

## Решение

## Альтернативы

## Последствия

## Риски

## Связанные артефакты

- Domain Model:
- Migration:
- Types:
- Service:
- UI:
- Tests/Checks:
EOF

cat > engineering/adr/index.md <<'EOF'
# ADR Index

| ADR | Название | Статус | Дата |
|---|---|---|---|
| ADR-000 | Engineering Operating System | Accepted | 2026-07-13 |
EOF

cat > engineering/standards/DEFINITION_OF_READY.md <<'EOF'
# Definition of Ready

OP готов к началу, если:

- цель и пользовательская ценность сформулированы;
- границы OP определены;
- затрагиваемые сущности Domain Model известны;
- влияние на БД и RLS оценено;
- необходимость ADR определена;
- критерии готовности перечислены;
- блокирующие вопросы отсутствуют;
- репозиторий синхронизирован и clean.
EOF

cat > engineering/standards/DEFINITION_OF_DONE.md <<'EOF'
# Definition of Done

OP завершён, если:

- функциональность соответствует утверждённой цели;
- Domain Model и типы согласованы;
- миграции применимы и проверены, если они есть;
- RLS проверена для новых таблиц;
- обработаны ошибки и состояния загрузки;
- `npm run lint` успешно;
- `npx tsc --noEmit` успешно;
- `npm run build` успешно;
- выполнен ручной пользовательский сценарий, если применимо;
- документация и трассируемость обновлены;
- изменения закоммичены и отправлены в GitHub;
- `git status` показывает clean.
EOF

cat > engineering/standards/CODING_STANDARD.md <<'EOF'
# Coding Standard

- TypeScript strict mode обязателен.
- Бизнес-логика размещается в service/domain слоях, а не дублируется в UI.
- Типы импортируются из `types/`.
- Полные имена сущностей и функций предпочтительнее неясных сокращений.
- Ошибки возвращаются и отображаются явно.
- Никаких секретов и service role ключей в клиентском коде.
- Изменение схемы данных выполняется только миграцией.
EOF

cat > engineering/standards/GIT_WORKFLOW.md <<'EOF'
# Git Workflow

1. Проверить `git pull --ff-only` и `git status`.
2. Выполнить один утверждённый OP.
3. Запустить Lint, TypeScript и Build.
4. Проверить `git diff --check` и список файлов.
5. Создать содержательный commit.
6. Выполнить push в рабочую ветку.
7. Подтвердить clean status.
EOF

cat > engineering/standards/SECURITY_STANDARD.md <<'EOF'
# Security Standard

- RLS обязательна для пользовательских бизнес-таблиц.
- Политики строятся по принципу минимальных привилегий.
- `service_role` используется только в доверенной серверной среде и не передаётся браузеру.
- Секреты хранятся только в переменных окружения.
- Административные и критичные действия должны быть пригодны для аудита.
- Внешние SaaS и места хранения данных фиксируются архитектурно.
EOF

cat > engineering/standards/DATABASE_STANDARD.md <<'EOF'
# Database Standard

- Все изменения схемы идут через неизменяемые SQL-миграции.
- Имена таблиц и полей согласуются с Domain Model.
- Внешние ключи и поведение удаления задаются явно.
- Ограничения целостности реализуются в БД, когда это возможно.
- Для новых таблиц определяются индексы, RLS и правила владения.
- После миграции выполняется проверочный SQL-запрос.
EOF

cat > engineering/sprints/CURRENT_SPRINT.md <<'EOF'
# Current Sprint — Release 0.2 Project Execution

## Goal

Превратить активированный проект в рабочую среду управления выполнением заказа.

## Completed

- OP-000 Engineering OS Foundation — in progress.
- OP-011 Execution Workspace Foundation — completed.

## Next

- OP-012 Task Board and execution workflow.
- OP-013 Project Timeline.
- OP-014 Documents foundation.

## Blockers

Нет подтверждённых блокеров.
EOF

cat > engineering/sprints/RELEASE_PLAN.md <<'EOF'
# Release Plan

## Release 0.1

Customer to Project Flow — functional foundation completed.

## Release 0.2

Project Execution — current release.

Release exit criteria:

- tasks can be created and moved through execution statuses;
- project events are visible;
- project documents have a stable foundation;
- completion flow is testable;
- Lint, TypeScript and Build remain green.
EOF

cat > engineering/knowledge/README.md <<'EOF'
# SPEC76 Knowledge Base

Назначение: хранить повторно используемые инженерные знания.

- `glossary/` — термины проекта.
- `patterns/` — подтверждённые технические шаблоны.
- `incidents/` — значимые ошибки и разбор причин.
- `lessons/` — выводы, влияющие на будущую работу.

Первичные инциденты для последующего оформления:

- неверный Supabase alias в Contractor Matching;
- изменение возвращаемого типа PostgreSQL-функции без предварительного DROP.
EOF

for dir in engineering/knowledge/glossary engineering/knowledge/patterns engineering/knowledge/incidents engineering/knowledge/lessons; do
  cat > "$dir/README.md" <<EOF
# $(basename "$dir")

Раздел Engineering Knowledge Base. Новые записи добавляются только после подтверждения их практической ценности.
EOF
done

cat > engineering/traceability/TRACEABILITY_MATRIX.md <<'EOF'
# SPEC76 Traceability Matrix

| Capability | Domain Entity | Database | Service | UI | Verification | Status |
|---|---|---|---|---|---|---|
| Создание заявки | Request | requests | services/requests.ts | /projects/new, /requests/[id] | Lint, Types, Build, manual | Done |
| Анализ заявки | RequestAnalysis | request_analyses | services/requestAnalysis.ts | /requests/[id] | Lint, Types, Build, manual | Done |
| Подбор исполнителей | ContractorMatch | request_matches, company_services, company_equipment | services/contractorMatching.ts | /requests/[id] | Lint, Types, Build, manual | Done |
| Предложения | Offer | offers | services/offers.ts | /requests/[id] | Lint, Types, Build | Done |
| Активация проекта | Project | projects | services/offers.ts, services/projects.ts | /projects/[id] | Migration check, Build | Done |
| Исполнение проекта | Task | tasks | pending OP-012 | /projects/[id]/tasks | pending | Planned |
EOF

cat > engineering/adr/ADR-000-engineering-operating-system.md <<'EOF'
# ADR-000 — Engineering Operating System

Статус: Accepted
Дата: 2026-07-13

## Контекст

Разработка SPEC76 ускорилась, но часть решений и рабочего контекста оставалась только в чате. Возник риск появления несуществующих артефактов, расхождения документации и кода, а также потери истории решений.

## Решение

Ввести Engineering OS с обязательными Daily Brief, Definition of Ready, Definition of Done, ADR, журналами решений, технического долга и трассируемости.

## Последствия

Положительные:

- воспроизводимый процесс;
- меньше ошибок и потери контекста;
- GitHub становится фактическим источником истины;
- новые OP имеют единый стандарт.

Отрицательные:

- каждый OP требует небольшого объёма инженерной документации;
- документы нужно поддерживать актуальными.

## Контроль

OP не считается завершённым без зелёных проверок и clean Git status.
EOF

echo "===== ENGINEERING OS FILES ====="
find engineering -type f | sort

echo "===== REQUIRED FILE CHECK ====="
required=(
  engineering/README.md
  engineering/000_PROJECT_BLUEPRINT.md
  engineering/constitution/PROJECT_CONSTITUTION.md
  engineering/adr/ADR-000-engineering-operating-system.md
  engineering/adr/ADR_TEMPLATE.md
  engineering/daily/DAILY_BRIEF_TEMPLATE.md
  engineering/standards/DEFINITION_OF_READY.md
  engineering/standards/DEFINITION_OF_DONE.md
  engineering/sprints/CURRENT_SPRINT.md
  engineering/traceability/TRACEABILITY_MATRIX.md
)

for file in "${required[@]}"; do
  [[ -s "$file" ]] || { echo "ERROR: missing or empty $file" >&2; exit 1; }
done

echo "OP-000 Engineering OS Foundation created successfully."
