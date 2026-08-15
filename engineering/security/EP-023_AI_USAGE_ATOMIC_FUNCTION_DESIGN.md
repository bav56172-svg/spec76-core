# EP-023 — AI Usage Atomic Function Design

| Поле | Значение |
|---|---|
| Version (версия) | 0.2 |
| Status (статус) | Architecture Readiness Update |
| Owner (владелец) | Platform Owner |
| Related Release (связанный релиз) | Release 0.4 |
| Related Capability (связанная возможность) | C-006 AI Request Foundation |
| Related ADR | ADR-025 Platform Sovereignty and Autonomous Operations |
| Related Documents | EP-023 AI Usage Schema Design; EP-023 AI Usage RLS Test Plan |
| Source of Truth (источник истины) | GitHub для кода и документов; Supabase для данных |

---

# Purpose (назначение)

Документ определяет архитектуру следующего этапа атомарной серверной операции для управления AI Usage.

Базовая таблица `public.ai_usage` уже применена и проверена локально и в основной Supabase базе.

Документ не изменяет уже применённую migration `20260802000100_ep023_ai_usage.sql`.

Все дальнейшие изменения модели допускаются только новой additive migration (добавочной миграцией).

---

# Confirmed Context (подтверждённый контекст)

Подтверждено:

- Release 0.4 активен;
- C-006 AI Request Foundation утверждена;
- ADR-025 утверждён;
- AI API отсутствует;
- AI provider не подключён;
- `public.ai_usage` существует в основной Supabase базе;
- EP-023 remote migration execution завершено успешно;
- RLS и FORCE RLS включены;
- `authenticated` имеет только SELECT;
- client write policies отсутствуют;
- `service_role` имеет server-side write access.

Существующая модель доступа:

- profiles;
- companies;
- company_members;
- projects.

---

# Atomic Operation Goal (цель атомарной операции)

Будущая операция должна обеспечить:

- проверку права пользователя;
- проверку лимита;
- создание резервирования;
- фиксацию результата;
- защиту от конкурентных запросов.

Операция должна выполняться как единое неделимое действие.

---

# Input Model (модель входных данных)

Серверная операция принимает только необходимые параметры:

- project_id;
- operation_type;
- usage_metadata.

Пользовательская идентичность не передаётся клиентом.

Источник пользователя:

серверный authentication context (контекст аутентификации).

---

# Execution Flow (поток выполнения)

Предлагаемый порядок:

1. Получить пользователя из серверного контекста.
2. Проверить доступ к проекту.
3. Проверить доступ компании.
4. Проверить лимит.
5. Создать reservation.
6. Выполнить AI operation.
7. Зафиксировать:

reserved → completed

или

reserved → failed

---

# Concurrency Protection (защита от конкурентных запросов)

Запрещено:

прочитать лимит

↓

отдельно записать использование

без блокировки.

Будущая реализация должна обеспечивать:

- атомарную проверку;
- атомарное резервирование;
- отсутствие двойного списания лимита.

---

# Failure Handling (обработка ошибок)

Ошибки должны быть:

- предсказуемыми;
- безопасными;
- без раскрытия внутренних деталей.

Не возвращать:

- секреты;
- ключи поставщика;
- внутренние ошибки базы.

---

# Audit Requirements (требования аудита)

Операция должна позволять восстановить:

- кто инициировал действие;
- для какого проекта;
- когда выполнено;
- какой результат получен.

---

# Rollback Strategy (стратегия отката)

При невозможности безопасной реализации:

- изменения не переводятся в активный режим;
- существующая модель доступа сохраняется;
- результат фиксируется в инженерном журнале.

---

# Required Lifecycle Extension (необходимое расширение lifecycle)

Текущая production schema поддерживает audit logging, но не полный lifecycle, требуемый C-006.

Для atomic reservation/finalization необходима новая additive migration.

Минимально требуемые поля:

- `request_id`;
- `status`;
- `completed_at`.

Целевой lifecycle:

```text
reserved -> completed
reserved -> failed
```

Допустимые состояния должны быть ограничены database constraint (ограничением базы данных).

---

# Atomic Operation Contract (контракт атомарной операции)

Server-side operation (серверная операция) должна:

1. получать authenticated user identity из серверного контекста;
2. принимать `project_id` и `operation_type`;
3. определять `company_id` через проект;
4. проверять доступ через существующую project access model;
5. создавать reservation атомарно;
6. возвращать идентификатор usage record;
7. после AI operation переводить reservation в `completed` или `failed`;
8. не позволять клиенту напрямую выполнять lifecycle transitions.

`user_id` и `company_id` не считаются доверенными клиентскими параметрами.

---

# Concurrency Requirement (требование конкурентности)

Reservation должна создаваться внутри database transaction (транзакции базы данных).

Будущая реализация лимитов не должна использовать небезопасную схему:

```text
read usage
-> check limit
-> separate insert
```

Проверка лимита и reservation должны выполняться как единая атомарная операция.

---

# Security Boundary (граница безопасности)

Сохраняются действующие ограничения:

- прямой client write запрещён;
- lifecycle mutation выполняется только server-side;
- project access проверяется до reservation;
- пользователь не может подменить `user_id`;
- пользователь не может подменить `company_id`;
- полный prompt и полный AI response не сохраняются в `ai_usage`;
- provider secret не передаётся клиенту.

---

# Additive Migration Requirement (требование добавочной миграции)

Запрещено изменять уже применённую:

```text
20260802000100_ep023_ai_usage.sql
```

Следующее изменение схемы оформляется отдельной новой migration.

Migration должна:

- добавлять lifecycle columns без удаления существующих данных;
- иметь безопасные defaults или staged constraints;
- добавить необходимые indexes;
- сохранить действующие RLS controls;
- пройти local reset/rehearsal;
- пройти Migration Check;
- получить отдельный Platform Owner approval до production execution.

---

# Implementation Boundary (граница реализации)

На текущем этапе разрешено:

- проектирование additive migration;
- проектирование reserve/finalize SQL functions;
- подготовка verification tests;
- подготовка server-side service contract.

До отдельного Architecture Readiness approval запрещено:

- применять новую lifecycle migration в production;
- подключать AI provider;
- создавать пользовательский AI API route;
- вводить финансовые лимиты или billing decisions.

---

# Architecture Readiness Status (статус архитектурной готовности)

```text
BASE AI_USAGE FOUNDATION: IMPLEMENTED
REMOTE MIGRATION: VERIFIED
RLS FOUNDATION: VERIFIED
ATOMIC LIFECYCLE: DESIGN REQUIRED
ADDITIVE MIGRATION: REQUIRED
RUNTIME IMPLEMENTATION: BLOCKED UNTIL LIFECYCLE DESIGN APPROVAL
```

Следующий этап:

1. подготовить additive lifecycle migration design;
2. определить reserve/finalize function contracts;
3. подготовить verification plan;
4. выполнить Architecture Readiness Review;
5. передать Platform Owner на approval.
