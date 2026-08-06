# EP-023 — AI Usage Migration Design

| Поле | Значение |
|---|---|
| Version (версия) | 0.1 |
| Status (статус) | Migration Design |
| Owner (владелец) | Platform Owner |
| Related Release (связанный релиз) | Release 0.4 |
| Related Capability (связанная возможность) | C-006 AI Request Foundation |
| Related ADR | ADR-025 Platform Sovereignty and Autonomous Operations |

---

# Purpose (назначение)

Документ определяет дизайн будущей Supabase migration для сущности `ai_usage`.

Документ не выполняет миграцию.

---

# Confirmed Context (подтверждённый контекст)

Источник истины:

- GitHub для документов и кода;
- Supabase для данных.

Подтверждено:

- `companies` существует;
- `company_members` существует;
- `projects` существует;
- RLS используется как основной механизм контроля доступа.

---

# Proposed Schema (предлагаемая схема)

Будущая таблица:

`public.ai_usage`

Назначение:

- аудит AI Operations;
- контроль использования;
- подготовка лимитов;
- поддержка billing controls.

Предлагаемые поля:

- `id uuid primary key`;
- `project_id uuid not null`;
- `company_id uuid not null`;
- `user_id uuid not null`;
- `operation_type text not null`;
- `provider text`;
- `model text`;
- `input_tokens integer`;
- `output_tokens integer`;
- `created_at timestamptz`.

---

# Constraints (ограничения)

Обязательные ограничения:

- `project_id` должен ссылаться на `projects.id`;
- `company_id` должен ссылаться на `companies.id`;
- `user_id` должен ссылаться на `auth.users.id`;
- запрещены пустые идентификаторы;
- запрещены отрицательные значения token counters.

---

# Index Strategy (стратегия индексов)

Необходимые индексы:

- поиск по проекту;
- поиск по пользователю;
- контроль использования за период;
- аудит операций.

Предварительно:

- `(project_id, created_at desc)`;
- `(user_id, created_at desc)`;
- `(company_id, created_at desc)`.

---

# RLS Policy Design (проект RLS)

Требования:

- включить RLS;
- включить FORCE ROW LEVEL SECURITY.

Доступ должен определяться через:

User → Company Membership → Project Access → AI Usage

Использовать существующую модель:

`public.can_access_project(project_id)`

---

# Write Security Model (модель безопасности записи)

Запись:

- только серверная операция;
- через доверенный backend context.

Запрещено:

- прямой INSERT клиентом;
- UPDATE пользователем;
- DELETE пользователем.

---

# Grants (разрешения)

Предполагается:

authenticated:

- только необходимый SELECT.

service_role:

- полный доступ для серверных операций.

---

# Rollback Strategy (стратегия отката)

При проблемах:

- migration должна иметь безопасный rollback;
- существующая модель доступа не изменяется;
- AI функции не должны зависеть от незавершённой миграции.

---

# Implementation Boundary (граница реализации)

До отдельного утверждения запрещено:

- создавать SQL migration;
- создавать таблицу `ai_usage`;
- изменять существующий RLS;
- подключать AI provider.

---

# Next Step (следующий шаг)

После утверждения:

1. создать Supabase migration;
2. реализовать RLS;
3. добавить verification tests;
4. подключить server-side usage tracking.
