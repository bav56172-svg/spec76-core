# EP-023 — AI Usage Supabase Migration Specification

| Поле | Значение |
|---|---|
| Version (версия) | 0.1 |
| Status (статус) | Architecture Design |
| Owner (владелец) | Platform Owner |
| Related Release (связанный релиз) | Release 0.4 |
| Related Capability (связанная возможность) | C-006 AI Request Foundation |
| Related ADR | ADR-025 Platform Sovereignty and Autonomous Operations |

---

# Purpose (назначение)

Документ определяет техническую спецификацию будущей Supabase migration (миграции Supabase) для сущности ai_usage.

Документ не выполняет миграцию.

---

# Confirmed Context (подтверждённый контекст)

Подтверждено:

- Release 0.4 активен;
- C-006 AI Request Foundation утверждена;
- ADR-025 утверждён;
- EP-023 Architecture Gate пройден;
- таблица ai_usage отсутствует.

Существующая модель:

- profiles;
- companies;
- company_members;
- projects;
- RLS.

---

# Proposed Schema (предлагаемая схема)

Будущая таблица:

public.ai_usage

Назначение:

- аудит AI Operations;
- контроль использования;
- подготовка лимитов.

---

# Constraints (ограничения)

Будущая схема должна обеспечивать:

- связь с project;
- связь с company;
- контроль пользователя через серверный контекст;
- запрет прямой записи клиента.

---

# Index Strategy (стратегия индексов)

Индексы должны поддерживать:

- аудит операций;
- поиск по проекту;
- контроль использования.

---

# RLS Policy Design (проект RLS)

Будущая реализация использует:

User → Company Membership → Project Access → AI Usage

Требования:

- отсутствие доступа между компаниями;
- запрет подмены user_id;
- запрет обхода RLS.

---

# Rollback Strategy (стратегия отката)

При невозможности безопасного внедрения:

- миграция не активируется;
- существующая модель доступа сохраняется;
- результат фиксируется.

---

# Implementation Boundary (граница реализации)

До отдельного утверждения запрещено:

- создавать Supabase migration;
- создавать таблицу ai_usage;
- изменять RLS;
- создавать SQL function;
- подключать AI provider.
