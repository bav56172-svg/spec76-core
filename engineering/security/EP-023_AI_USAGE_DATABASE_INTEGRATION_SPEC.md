# EP-023 — AI Usage Database Integration Specification

| Поле | Значение |
|---|---|
| Version (версия) | 0.1 |
| Status (статус) | Architecture Integration Design |
| Owner (владелец) | Platform Owner |
| Related Release (связанный релиз) | Release 0.4 |
| Related Capability (связанная возможность) | C-006 AI Request Foundation |
| Related ADR | ADR-025 Platform Sovereignty and Autonomous Operations |

---

# Purpose (назначение)

Документ определяет интеграцию будущей сущности `ai_usage` с существующей Supabase domain model.

Документ не создаёт:

- таблицу `ai_usage`;
- Supabase migration;
- RLS policies;
- SQL function;
- AI provider integration.

---

# Confirmed Database Context (подтверждённый контекст базы)

Источник истины:

- Supabase migrations.

Подтверждены существующие сущности:

- `profiles`;
- `companies`;
- `company_members`;
- `projects`.

Существующая модель доступа:

User → Company Membership → Project Access

---

# Proposed Entity Integration (интеграция сущности)

Будущая сущность:

`public.ai_usage`

Назначение:

- аудит AI Operations;
- контроль использования;
- подготовка лимитов;
- поддержка billing controls.

---

# Entity Relationships (связи сущности)

Предполагаемые связи:

- `project_id` → `projects.id`
- `company_id` → `companies.id`
- `user_id` → `auth.users.id`

Требования:

- `project_id` является обязательным;
- `company_id` должен соответствовать проекту;
- `user_id` должен соответствовать пользователю операции;
- подмена принадлежности запрещена.

---

# Access Model (модель доступа)

Доступ определяется через:

User → Company Membership → Project Access → AI Usage

Используется существующая модель доступа проектов.

Запрещается создавать отдельную систему авторизации.

---

# RLS Design Requirements (требования RLS)

Будущая реализация должна:

- включить RLS;
- включить FORCE ROW LEVEL SECURITY;
- разрешить только необходимый доступ;
- запретить прямую запись клиента;
- использовать существующую project access модель.

---

# Security Requirements (требования безопасности)

Обязательно:

- отсутствие доступа между компаниями;
- невозможность подмены `user_id`;
- невозможность доступа к чужому проекту;
- отсутствие обхода RLS.

---

# Migration Requirements (требования миграции)

Будущая migration должна:

- соответствовать стилю существующих Supabase migrations;
- использовать transaction block;
- иметь rollback strategy;
- пройти Security Review.

---

# Implementation Boundary (граница реализации)

До отдельного утверждения запрещено:

- создавать таблицу `ai_usage`;
- создавать Supabase migration;
- менять существующие RLS;
- подключать AI provider;
- изменять billing logic.

---

# Next Step (следующий шаг)

После утверждения:

1. создать Supabase migration;
2. добавить RLS policies;
3. создать server-side usage operation;
4. выполнить verification tests.
