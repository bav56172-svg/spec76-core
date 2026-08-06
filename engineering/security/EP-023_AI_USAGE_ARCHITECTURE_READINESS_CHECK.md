# EP-023 — AI Usage Architecture Readiness Check

| Поле | Значение |
|---|---|
| Version (версия) | 0.1 |
| Status (статус) | Architecture Readiness Review |
| Owner (владелец) | Platform Owner |
| Related Release (связанный релиз) | Release 0.4 |
| Related Capability (связанная возможность) | C-006 AI Request Foundation |
| Related ADR | ADR-025 Platform Sovereignty and Autonomous Operations |

---

# Purpose (назначение)

Документ фиксирует проверку архитектурной готовности перед созданием Supabase migration для `ai_usage`.

Документ не создаёт:

- таблицу `ai_usage`;
- Supabase migration;
- RLS policies;
- SQL function.

---

# Release Compatibility (совместимость с релизом)

Проверка:

| Область | Статус |
|---|---|
| Release 0.4 | Ready |
| C-006 AI Request Foundation | Ready |
| ADR-025 | Ready |

Вывод:

EP-023 соответствует текущему архитектурному направлению.

---

# Existing Domain Compatibility (совместимость существующих доменов)

Проверены зависимости:

- `profiles`;
- `companies`;
- `company_members`;
- `projects`;
- существующая модель RLS.

Требование:

`ai_usage` не должна изменять существующую модель доступа.

---

# Data Ownership Check (проверка владения данными)

Источник истины:

- Supabase для данных;
- GitHub для миграций и документации.

Владелец AI usage данных:

- серверная операция;
- Platform controlled backend flow.

Клиент не является владельцем записи.

---

# Security Readiness Check (проверка безопасности)

Требования:

| Проверка | Статус |
|---|---|
| RLS обязательна | Ready |
| FORCE ROW LEVEL SECURITY | Ready |
| Client INSERT запрещён | Ready |
| Client UPDATE запрещён | Ready |
| Cross-company access запрещён | Ready |
| Project ownership validation | Ready |

---

# RLS Architecture Check (проверка архитектуры RLS)

Модель доступа:

User
↓
Company Membership
↓
Project Access
↓
AI Usage

Используется существующая функция:

`public.can_access_project(project_id)`

Новая система авторизации не создаётся.

---

# Migration Safety Check (проверка безопасности миграции)

Требования:

- migration выполняется транзакционно;
- rollback должен быть подготовлен;
- существующие таблицы не изменяются;
- существующие политики RLS не заменяются.

Статус:

Ready.

---

# Business Impact Check (влияние на заказчика)

Положительное влияние:

- появляется аудит AI операций;
- появляется основа контроля использования;
- появляется подготовка к лимитам.

Риски:

- неправильный RLS может раскрыть данные;
- некорректный usage tracking может исказить billing.

Меры:

- отдельная migration;
- review;
- verification tests.

---

# Contractor Impact Check (влияние на исполнителя)

Требования:

- AI операции должны идти через серверный слой;
- прямой доступ к usage таблице запрещён;
- ответственность за запись остаётся у backend.

---

# Human Accountability Check (человеческая ответственность)

ИИ может:

- анализировать usage;
- предлагать оптимизации;
- помогать в разработке.

ИИ не принимает:

- юридические решения;
- финансовые решения;
- production access decisions.

---

# Final Readiness Decision (финальное решение)

Статус:

READY FOR MIGRATION DESIGN REVIEW

Следующий этап:

1. создать SQL migration draft;
2. проверить SQL;
3. проверить RLS;
4. выполнить verification tests.
