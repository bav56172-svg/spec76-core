# EP-023 — AI Usage Lifecycle Migration Design

| Поле | Значение |
|---|---|
| Version (версия) | 1.0 |
| Status (статус) | Implemented and Verified (реализовано и проверено) |
| Owner (владелец) | Platform Owner |
| Related Release (связанный релиз) | Release 0.4 |
| Related Capability (связанная возможность) | C-006 AI Request Foundation |
| Related ADR | ADR-025 Platform Sovereignty and Autonomous Operations |
| Related Documents | EP-023 AI Usage Atomic Function Design v0.2; EP-023 AI Usage Execution Result |
| Source of Truth (источник истины) | GitHub для кода и документов; Supabase для данных |

---

# Purpose (назначение)

Документ определяет additive lifecycle migration design (дизайн добавочной миграции жизненного цикла) для `public.ai_usage` и фиксирует результат его утверждения.

Цель — расширить уже применённую и проверенную базовую модель `ai_usage`, чтобы она поддерживала атомарный lifecycle резервирования и завершения, требуемый C-006 AI Request Foundation.

Реализация design выполнена отдельной SQL migration (SQL-миграцией) `20260810191040_ep023_ai_usage_lifecycle_rate_limit.sql`. Фактический результат записан в `EP-023_AI_USAGE_LIFECYCLE_EXECUTION_RESULT.md`.

---

# Confirmed Baseline (подтверждённый baseline)

Подтверждено:

- Release 0.4 активен;
- C-006 AI Request Foundation утверждена;
- ADR-025 утверждён;
- `public.ai_usage` существует в основной Supabase базе;
- базовая EP-023 migration применена и проверена;
- RLS включён;
- FORCE RLS включён;
- `authenticated` имеет только SELECT;
- client write policies для `INSERT`, `UPDATE`, `DELETE` отсутствуют;
- `service_role` имеет server-side write access;
- текущая таблица не содержит lifecycle-полей `request_id`, `status`, `completed_at`;
- production preflight 2026-08-10 подтвердил `public.ai_usage` row count = `0`.

Уже применённая migration:

```text
20260802000100_ep023_ai_usage.sql
```

не изменяется.

Все дальнейшие изменения выполняются только новой additive migration (добавочной миграцией).

---

# Architecture Goal (архитектурная цель)

Расширение должно позволить серверному контуру выполнить:

```text
reserve
-> AI operation
-> finalize completed
```

или:

```text
reserve
-> AI operation failed
-> finalize failed
```

Lifecycle mutation (изменение жизненного цикла) выполняется только server-side (на серверной стороне).

Клиент не получает право напрямую создавать, завершать или изменять usage records.

---

# Target Lifecycle Model (целевая модель жизненного цикла)

Минимальное расширение `public.ai_usage`:

| Column (колонка) | Назначение |
|---|---|
| `request_id` | Идемпотентный идентификатор AI request (ИИ-запроса) |
| `status` | Текущее lifecycle state (состояние жизненного цикла) |
| `completed_at` | Время завершения terminal state (конечного состояния) |

Целевые состояния:

```text
reserved
completed
failed
```

Допустимые переходы:

```text
reserved -> completed
reserved -> failed
```

Запрещённые переходы:

```text
completed -> reserved
completed -> failed
failed -> reserved
failed -> completed
```

Повторный finalize (завершение) уже завершённой записи не должен незаметно менять terminal state.

---

# request_id Design (дизайн request_id)

`request_id` должен:

- быть генерируемым server-side;
- не зависеть от недоверенного клиентского `user_id`;
- позволять безопасную идемпотентность reserve operation (операции резервирования);
- быть уникальным для одной логической AI operation.

Рекомендуемый тип:

```text
uuid
```

Для новых lifecycle records:

```text
request_id NOT NULL
```

Historical backfill не выполняется при подтверждённом пустом `public.ai_usage`. Если preflight обнаруживает строки, migration fail-closed останавливается и требует отдельного review.

---

# Existing Data Compatibility (совместимость существующих данных)

Production preflight (предварительная проверка основной базы) 2026-08-09 подтвердил:

```text
public.ai_usage row count = 0
```

Поэтому текущий design не использует synthetic backfill (искусственное дозаполнение) и не создаёт фиктивные historical `request_id`.

Будущая additive migration должна начинаться с fail-closed preflight (предварительной проверки с безопасной остановкой):

```text
public.ai_usage MUST BE EMPTY
```

Если к моменту execution существует хотя бы одна строка:

- migration останавливается до изменения lifecycle schema;
- существующие данные автоматически не преобразуются;
- требуется отдельный Architecture Review;
- требуется отдельная data migration strategy (стратегия миграции данных);
- требуется новое решение Platform Owner.

Если таблица остаётся пустой, lifecycle columns вводятся сразу с финальными ограничениями без historical backfill.

---

# Constraint Design (дизайн ограничений)

Новая migration должна добавить constraint на `status`:

```text
status in ('reserved', 'completed', 'failed')
```

При подтверждённой пустой таблице lifecycle columns вводятся сразу с финальными ограничениями:

- `request_id` должен быть `NOT NULL`;
- `status` должен быть `NOT NULL`;
- `request_id` должен быть unique (уникальным).

`completed_at`:

- должен быть `NULL` для `reserved`;
- должен быть `NOT NULL` для `completed`;
- должен быть `NOT NULL` для `failed`.

Рекомендуется database check constraint (проверочное ограничение базы), обеспечивающее согласованность `status` и `completed_at`.

---

# Token Usage Semantics (семантика учёта токенов)

Для `reserved` допускается:

```text
input_tokens = null
output_tokens = null
```

или предварительно известное значение `input_tokens`, если серверный provider contract (контракт поставщика) позволяет безопасно определить его до выполнения.

Для `completed`:

- фактические `input_tokens` записываются после успешной операции;
- фактические `output_tokens` записываются после успешной операции.

Для `failed`:

- фактические известные usage values могут быть сохранены;
- неизвестные значения остаются `NULL`;
- искусственные нулевые значения не должны использоваться для сокрытия неизвестности.

---

# Index Design (дизайн индексов)

Существующие индексы сохраняются:

```text
ai_usage_project_created_idx
ai_usage_company_created_idx
ai_usage_user_created_idx
```

Новая migration должна рассмотреть:

```text
unique(request_id)
```

и индекс для operational lifecycle queries (операционных запросов жизненного цикла), например:

```text
(status, created_at)
```

Индекс добавляется только при подтверждённом runtime query pattern (шаблоне запросов исполнения), чтобы не создавать лишнюю стоимость записи.

---

# Reserve Function Contract (контракт reserve function)

Целевой identity flow (поток идентичности):

```text
Browser
-> protected server AI route
-> server verifies authenticated user
-> server obtains actor_user_id
-> service_role calls reserve database function
```

`actor_user_id` не является доверенным browser parameter (параметром браузера). Его формирует серверный маршрут только после Authentication (аутентификации).

Reserve function (функция резервирования) должна:

1. принимать server-verified `actor_user_id`;
2. принимать `project_id`;
3. принимать `operation_type`;
4. принимать server-generated `request_id`;
5. получать `company_id` через `public.projects`;
6. явно проверять membership/access `actor_user_id` к проекту и компании;
7. создавать одну запись со статусом `reserved`;
8. записывать `user_id = actor_user_id`;
9. возвращать usage record ID и `request_id`.

Idempotency contract (контракт идемпотентности):

- первый reserve с новым `request_id` создаёт reservation;
- повторный reserve с тем же `request_id`, `actor_user_id`, `project_id` и `operation_type` возвращает существующую reservation;
- тот же `request_id` с отличающимся actor/project/operation отклоняется conflict error (ошибкой конфликта);
- unique constraint на `request_id` является database-level защитой от гонки.

---

# Finalize Function Contract (контракт finalize function)

Finalize function (функция завершения) должна:

1. принимать `request_id` или usage record ID;
2. находить существующее `reserved` reservation;
3. проверять допустимость terminal transition;
4. записывать `completed` или `failed`;
5. записывать provider/model и фактический usage, если известен;
6. выставлять `completed_at = now()`;
7. запрещать изменение project/company/user ownership;
8. возвращать финальное состояние.

Finalization idempotency contract:

- `completed -> completed` возвращает существующее состояние без изменения;
- `failed -> failed` возвращает существующее состояние без изменения;
- `completed -> failed` запрещён;
- `failed -> completed` запрещён;
- неизвестный `request_id` возвращает безопасную not-found error (ошибку отсутствия записи);
- finalize проверяет разрешённый server-side actor context.

---

# Concurrency and Transaction Requirements (требования конкурентности и транзакций)

Reserve operation должна выполняться как единая database transaction (транзакция базы данных).

Минимальная защита от гонок:

- unique constraint на `request_id`;
- атомарная проверка project access;
- атомарное создание reservation.

Будущая проверка лимитов не должна реализовываться как:

```text
read usage
-> check limit
-> separate insert
```

Проверка лимита и создание reservation должны быть частью одной атомарной операции.

Finalize operation должна блокировать или атомарно обновлять только запись, находящуюся в `reserved`.

---

# Access and RLS Preservation (сохранение доступа и RLS)

Действующая модель доступа сохраняется:

```text
User
-> Company Membership
-> Project Access
-> AI Usage
```

Новая migration не расширяет client write access.

Целевой function security contract (контракт безопасности функций):

```text
SECURITY DEFINER
fixed search_path
EXECUTE: service_role only
anon: forbidden
authenticated: forbidden
```

Lifecycle mutation выполняется только через защищённый server route (серверный маршрут).

Поскольку `service_role` способен обходить обычный RLS, reserve/finalize functions обязаны явно проверять `actor_user_id`, project membership и company relationship.

Обязательно:

- сохранить RLS и FORCE RLS;
- сохранить SELECT для `authenticated` через project access;
- сохранить отсутствие client write policies;
- использовать фиксированный минимальный `search_path`;
- использовать квалифицированные schema names;
- выполнить `REVOKE EXECUTE` у `public`, `anon`, `authenticated`;
- выполнить `GRANT EXECUTE` только `service_role`;
- пройти отдельный Security Review перед implementation.

---

# Security Requirements (требования безопасности)

Обязательно:

- идентичность пользователя определяется сервером;
- `company_id` выводится из проекта;
- `user_id` не принимается как доверенный клиентский параметр;
- lifecycle state нельзя подменить с клиента;
- нельзя завершить чужой usage record;
- нельзя повторно списать/зарезервировать один `request_id`;
- provider secrets не сохраняются в `ai_usage`;
- полный prompt и полный AI response не сохраняются в `ai_usage`;
- внутренние database errors (ошибки базы) не возвращаются пользователю напрямую.

---

# Customer Impact (влияние на заказчика)

Для заказчика изменение должно быть Invisible Complexity (невидимой сложностью).

Заказчик не должен видеть:

- `request_id`;
- lifecycle state;
- token accounting;
- SQL functions;
- RLS;
- provider metadata, если это не является отдельной продуктовой функцией.

Пользовательский эффект — более надёжная обработка ИИ-запроса без двойного учёта и без необходимости понимать внутреннюю инфраструктуру.

---

# Contractor Impact (влияние на исполнителя)

Для исполнителя действуют те же принципы:

- доступ только в рамках разрешённого проекта;
- отсутствие технической сложности в интерфейсе;
- отсутствие возможности менять usage lifecycle вручную;
- понятная безопасная ошибка при невозможности выполнить AI operation.

---

# Migration Execution Strategy (стратегия выполнения миграции)

Будущая additive migration выполняется по этапам:

1. preflight существующей `public.ai_usage`;
2. fail, если таблица содержит хотя бы одну строку;
3. при пустой таблице добавить lifecycle columns с финальной семантикой;
4. добавить constraints;
5. добавить unique/index requirements;
6. создать reserve/finalize functions после подтверждения contracts;
7. применить `SECURITY DEFINER` + `service_role only`;
8. подтвердить RLS и grants;
9. выполнить verification tests;
10. выполнить local reset/rehearsal;
11. повторно проверить production row count перед remote execution;
12. получить Platform Owner approval;
13. только после approval выполнять production migration.

---

# Rollback Strategy (стратегия отката)

До production execution должен существовать rollback plan (план отката).

Если новая migration ещё не используется runtime code:

- удалить новые functions;
- удалить новые constraints/indexes;
- удалить lifecycle columns только если подтверждено отсутствие зависимого production data.

После начала runtime использования destructive rollback (разрушающий откат) не допускается без отдельного review.

Предпочтительный production rollback после активации runtime — forward fix (исправление вперёд), а не удаление исторических usage records.

---

# Verification Plan (план проверки)

До production approval необходимо проверить минимум:

- migration применяется поверх актуального production-compatible baseline;
- preflight подтверждает пустой `public.ai_usage`;
- migration fail-closed останавливается при наличии хотя бы одной строки;
- `request_id` уникален;
- новый reserve создаёт только одну запись;
- повторный reserve с тем же `request_id` не создаёт дубль;
- conflicting reserve с тем же `request_id` блокируется;
- `reserved -> completed` работает;
- `reserved -> failed` работает;
- same-state finalize идемпотентен;
- conflicting terminal transition блокируется;
- authenticated client не может INSERT/UPDATE/DELETE;
- SELECT остаётся ограничен project access;
- другой пользователь/компания не получает доступ;
- reserve/finalize недоступны `anon` и `authenticated`;
- reserve/finalize доступны только `service_role`;
- `SECURITY DEFINER` functions используют фиксированный `search_path`;
- service-side finalize не меняет ownership;
- `git diff --check` проходит;
- local migration reset/rehearsal проходит;
- Security Review пройден.

---

# Out of Scope (вне границы)

На этом этапе не выполняются:

- AI provider integration (интеграция поставщика ИИ);
- пользовательский AI API route;
- streaming generation (потоковая генерация);
- финансовые лимиты;
- billing decisions (решения биллинга);
- автоматическое списание денежных средств;
- автономные агенты;
- изменение уже применённой migration `20260802000100_ep023_ai_usage.sql`;
- подключение AI provider (поставщика ИИ) и выполнение пользовательской ИИ-операции.

---

# Architecture Readiness Gate (допуск архитектурной готовности)

Перед созданием SQL migration должны быть утверждены:

1. точные lifecycle columns и типы;
2. empty-table fail-closed preflight strategy;
3. status/completed_at constraints;
4. `request_id` idempotency contract;
5. server identity propagation contract;
6. reserve function contract;
7. finalize idempotency contract;
8. `SECURITY DEFINER` + fixed `search_path`;
9. `service_role only` execute grants;
10. RLS boundary и explicit membership checks;
11. concurrency strategy;
12. rollback strategy;
13. verification criteria.

Финальное архитектурное и production решение принадлежит Platform Owner.

---

# Definition of Done (критерии завершения design)

Design считается готовым, когда:

- [x] согласована lifecycle schema;
- [x] согласован empty-table fail-closed preflight;
- [x] согласован `request_id` contract;
- [x] согласован server identity propagation contract;
- [x] согласованы допустимые lifecycle transitions;
- [x] согласован reserve contract;
- [x] согласован finalize idempotency contract;
- [x] согласована concurrency protection;
- [x] согласован `SECURITY DEFINER` + fixed `search_path`;
- [x] подтверждён `service_role only` execute boundary;
- [x] подтверждено сохранение RLS;
- [x] подтверждено отсутствие client write access;
- [x] подготовлен verification plan;
- [x] подготовлен rollback plan;
- [x] выполнен Architecture Readiness Review;
- [x] получено решение Platform Owner о создании additive migration.

---

# Current Status (текущий статус)

```text
BASE AI_USAGE FOUNDATION: IMPLEMENTED
REMOTE BASE MIGRATION: VERIFIED
RLS FOUNDATION: VERIFIED
LIFECYCLE MIGRATION: APPLIED AND VERIFIED
PRODUCTION AI_USAGE ROW COUNT: 0
EMPTY-TABLE PREFLIGHT: PASSED
SERVER IDENTITY CONTRACT: DEFINED
FUNCTION SECURITY CONTRACT: DEFINED
FINALIZE IDEMPOTENCY: DEFINED
SQL MIGRATION: 20260810191040 APPLIED
RATE LIMIT: 10 REQUESTS / 60 SECONDS / USER
RUNTIME PREFLIGHT: IMPLEMENTED
ATOMIC RESERVE/FINALIZE SERVICE: IMPLEMENTED
AI PROVIDER ROUTE INTEGRATION: NOT STARTED
PRODUCTION LIFECYCLE CHANGE: VERIFIED
```

Следующий этап:

```text
Protected project-scoped AI route
-> server-verified actor identity
-> reserve_ai_usage
-> provider operation
-> finalize_ai_usage
```
