# SPEC76 Namespace Migration Plan

| Поле | Значение |
|---|---|
| ID | SPEC76-TRACE-001 |
| Version (версия) | 1.0 |
| Status (статус) | Approved — Inventory Complete / Execution Not Started |
| Owner (владелец) | Platform Owner |
| Project (проект) | SPEC76 |
| Scope (область) | Инженерная документация и её идентификаторы |
| Source of Truth (источник истины) | GitHub для кода и документов; Supabase для данных |
| Database Impact (влияние на базу данных) | None |
| Code Impact (влияние на код) | None expected; requires verification |
| Execution Gate (допуск к исполнению) | Separate Platform Owner approval required |

## 1. Purpose (назначение)

Цель плана — исключить смешение артефактов SPEC76 с артефактами ЕЦЭУПО и будущих проектов за счёт явного Project Namespace (пространства имён проекта), не изменяя общие инженерные стандарты и не затрагивая историю базы данных.

## 2. Confirmed Facts (подтверждённые факты)

- В репозитории используются идентификаторы ADR-000, ADR-001, ADR-005, ADR-006, ADR-007, ADR-024.
- Используются Capability (возможности платформы) C-001–C-007.
- Используются Engineering Pack (инженерные пакеты) EP-021–EP-025.
- Используются Operation (инженерные операции) OP-000, OP-002, OP-003, OP-008–OP-031.
- Найдено 135 ссылок на EP-*, ADR-* и C-* в `engineering/` и `docs/`.
- В `engineering/packs/README.md` уже зафиксировано, что пространства имён ЕЦЭУПО `PLATFORM-*`, `ASVO-*` и `NPB-KUD-*` не входят в реестр SPEC76.
- Имена применённых Supabase migration (миграций Supabase) являются частью истории базы данных и не должны переименовываться.

## 3. Scope (границы)

### 3.1. Входит

Проектные артефакты SPEC76:

- `SPEC76-ADR-*`
- `SPEC76-C-*`
- `SPEC76-EP-*`
- `SPEC76-OP-*` после отдельной классификации каждого Operation
- Registry (реестры), Release (релизы), Sprint (спринты), Changelog (журнал изменений) и внутренние ссылки, которые относятся к SPEC76

### 3.2. Не входит

Общие инженерные артефакты:

- `SES-*`
- `STD-*`
- `TPL-*`
- `DATABASE_STANDARD`
- `SECURITY_STANDARD`
- конституционные и общеплатформенные принципы
- канонические пространства имён ЕЦЭУПО

### 3.3. Запрещено в рамках этого плана без отдельного допуска

- `git mv`
- массовая замена идентификаторов
- изменение Supabase schema (схемы Supabase)
- изменение применённых SQL migration (SQL-миграций)
- изменение RLS (Row Level Security — построчной безопасности)
- изменение runtime code (исполняемого кода)
- создание новых подидентификаторов для EP-023 без утверждённого стандарта

## 4. Target Naming Model (целевая модель именования)

### 4.1. Проектные идентификаторы

```text
SPEC76-ADR-024
SPEC76-C-006
SPEC76-EP-024
SPEC76-OP-019
```

### 4.2. Переходные метаданные

До переименования файлов проектный документ получает:

```text
Project: SPEC76
Canonical ID: SPEC76-EP-024
Legacy ID: EP-024
```

### 4.3. Общие идентификаторы

Остаются без изменений:

```text
SES-001
STD-001
STD-010
TPL-001
```

## 5. Classification Matrix (матрица классификации)

### 5.1. Явные кандидаты SPEC76

- ADR-001
- ADR-024
- C-001–C-007
- EP-021–EP-025

### 5.2. Требуют отдельной проверки

- ADR-000
- ADR-005
- ADR-006
- ADR-007
- OP-000
- OP-002
- OP-003
- OP-008–OP-031

### 5.3. Особый случай EP-023

`SPEC76-EP-023` остаётся одним Engineering Pack.

Файлы:

- `EP-023_SECURITY_RECOVERY.md`
- `EP-023_AI_API_RECOVERY.md`
- `EP-023_BILLING_RECOVERY.md`
- `EP-023_SERVICE_CONTRACT_RECOVERY.md`

не считаются четырьмя независимыми EP. Они должны быть связаны через метаданные:

```text
Parent Pack: SPEC76-EP-023
Document Role: Recovery Track
Track: AI API | Billing | Service Contract
```

Новые формы вроде `SPEC76-EP-023-AI-API` не вводятся без отдельного стандарта.

## 6. Migration Phases (этапы миграции)

### Phase 0 — Freeze (заморозка)

- новые проектные документы не создаются с неоднозначными ID;
- переименования и массовые замены запрещены;
- применённые миграции Supabase не изменяются.

### Phase 1 — File Classification (классификация файлов)

Для каждого файла определить:

- Project Scope (область проекта): SPEC76 / Shared Engineering / External Project / Unknown;
- Current ID (текущий идентификатор);
- Canonical ID (канонический идентификатор);
- Legacy ID (прежний идентификатор);
- необходимость переименования файла;
- количество входящих ссылок.

### Phase 2 — Metadata Namespace (пространство имён в метаданных)

Сначала изменить только метаданные SPEC76-документов.

Файлы на этом этапе не переименовываются.

### Phase 3 — Registry Migration (миграция реестров)

Обновить:

- `engineering/registry/ADR_REGISTRY.md`
- `engineering/registry/CAPABILITY_REGISTRY.md`
- `engineering/registry/DOCUMENT_REGISTRY.md`
- `engineering/adr/index.md`

Реестры используют Canonical ID и временно сохраняют Legacy ID.

### Phase 4 — Reference Migration (миграция ссылок)

Обновить ссылки в документах SPEC76:

```text
EP-024 → SPEC76-EP-024
ADR-024 → SPEC76-ADR-024
C-006 → SPEC76-C-006
```

Не изменять:

- исторические evidence (доказательства);
- сообщения коммитов;
- применённые SQL migration;
- пространства имён ЕЦЭУПО;
- общие SES / STD / TPL.

### Phase 5 — Optional File Rename (необязательное переименование файлов)

Только после отдельного утверждения Platform Owner и полной проверки ссылок.

Переименование выполняется через `git mv`.

## 7. Impact Analysis (анализ влияния)

### 7.1. GitHub

Ожидается документационный diff и изменение реестров. При переименовании файлов потребуется проверка всех ссылок.

### 7.2. Код

Runtime code не должен измениться. Обязательно проверить:

- скрипты, читающие имена документов;
- CI (Continuous Integration — непрерывную интеграцию);
- генераторы реестров;
- тесты и конфигурации с жёстко заданными путями.

### 7.3. Supabase

Не изменяются:

- schema;
- data;
- RLS;
- migration history;
- имена применённых migration.

### 7.4. Пользовательский интерфейс

Изменений для заказчика и исполнителя нет.

## 8. Rollback Plan (план отката)

Перед исполнением:

```bash
git tag spec76-before-namespace-migration
```

До merge (слияния):

```bash
git reset --hard spec76-before-namespace-migration
```

После merge исправления выполняются отдельным revert commit (коммитом отмены), без переписывания общей истории.

Supabase rollback не требуется.

## 9. Verification Plan (план проверки)

Обязательные проверки:

```bash
git diff --check
git status --short
npm run lint
npx tsc --noEmit
npm run build
```

Дополнительно:

- проверка битых Markdown links (ссылок Markdown);
- поиск старых ID;
- проверка реестров;
- проверка отсутствия изменений в `supabase/migrations`;
- проверка отсутствия изменений в runtime code без явного обоснования;
- Diff Check (проверка различий);
- Migration Check (проверка миграций): должно быть `NO DATABASE CHANGE`.

## 10. Definition of Done (критерии завершения)

Namespace Migration завершена, когда:

- каждый проектный документ имеет `Project: SPEC76`;
- каждый проектный артефакт имеет Canonical ID с префиксом `SPEC76-`;
- общие SES / STD / TPL сохранены;
- документы и namespace ЕЦЭУПО не изменены;
- Registry соответствует фактическим файлам;
- старые ID сохранены как Legacy ID на переходный период;
- битых ссылок нет;
- GitHub проверки проходят;
- Supabase migration history не изменена;
- Platform Owner утвердил результат.

## 11. Current Status (текущий статус)

```text
Inventory: COMPLETED
Classification: PARTIAL
Metadata Migration: NOT STARTED
Registry Migration: NOT STARTED
Reference Migration: NOT STARTED
File Rename: NOT STARTED
Database Changes: NONE
Code Changes: NONE
Execution Approval: REQUIRED
```
