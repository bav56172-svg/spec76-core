# EP-023 — AI Usage Implementation Readiness

| Поле | Значение |
|---|---|
| Version (версия) | 0.1 |
| Status (статус) | Architecture Approval |
| Owner (владелец) | Platform Owner |
| Related Release (связанный релиз) | Release 0.4 |
| Related Capability (связанная возможность) | C-006 AI Request Foundation |
| Related ADR | ADR-025 Platform Sovereignty and Autonomous Operations |
| Source of Truth (источник истины) | GitHub для кода и документов; Supabase для данных |

---

# Purpose (назначение)

Документ фиксирует готовность EP-023 к переходу от архитектурного проектирования к реализации.

Документ не создаёт:

- Supabase migration (миграцию Supabase);
- таблицу `ai_usage`;
- SQL function (SQL-функцию);
- AI API;
- подключение AI provider (поставщика AI).

---

# Confirmed Context (подтверждённый контекст)

Подтверждено:

- Release 0.4 активен;
- C-006 AI Request Foundation утверждена;
- ADR-025 утверждён;
- AI provider не подключён;
- активные AI API routes отсутствуют;
- `ai_usage` отсутствует в Supabase.

Подготовлены документы:

- EP-023 AI Usage Schema Design;
- EP-023 AI Usage RLS Test Plan;
- EP-023 AI Usage Atomic Function Design;
- EP-023 AI Usage Migration Design;
- EP-023 AI Usage Supabase Migration Specification.

---

# Architecture Readiness Check (проверка готовности архитектуры)

| Проверка | Статус |
|---|---|
| Data model (модель данных) | Ready |
| Security model (модель безопасности) | Ready |
| RLS strategy (стратегия RLS) | Ready |
| Atomic operation design (дизайн атомарной операции) | Ready |
| Rollback strategy (стратегия отката) | Ready |
| AI provider isolation (изоляция AI provider) | Ready |

---

# Implementation Gates (этапы допуска реализации)

Перед реализацией необходимо:

1. подтвердить migration design;
2. подтвердить RLS implementation;
3. проверить безопасность доступа;
4. выполнить тестовый набор;
5. получить Platform Owner approval.

---

# Security Boundaries (границы безопасности)

Запрещено до отдельного утверждения:

- прямой клиентский доступ к `ai_usage`;
- запись `ai_usage` без серверной операции;
- хранение AI provider keys в клиенте;
- обход RLS;
- автоматическое изменение production данных.

---

# Next Implementation Step (следующий шаг реализации)

После утверждения:

1. Supabase migration;
2. RLS policies (политики RLS);
3. atomic server operation (атомарная серверная операция);
4. verification tests (проверочные тесты).

---
