# EP-023 — AI Usage Migration Approval

| Поле | Значение |
|---|---|
| Version (версия) | 0.1 |
| Status (статус) | Approval Review |
| Owner (владелец) | Platform Owner |
| Related Release (связанный релиз) | Release 0.4 |
| Related Capability (связанная возможность) | C-006 
AI Request Foundation |
| Related ADR | ADR-025 Platform Sovereignty and 
Autonomous Operations |

---

# Purpose (назначение)

Документ фиксирует условия перехода EP-023 от 
архитектурной подготовки к реализации.

Документ является контрольной точкой перед:

- Supabase migration (миграцией Supabase);
- RLS implementation (реализацией RLS);
- atomic server operation (атомарной серверной 
операцией).

---

# Approval Context (контекст утверждения)

Подтверждено:

- Release 0.4 активен;
- C-006 AI Request Foundation утверждена;
- ADR-025 утверждён;
- EP-023 Architecture Design завершён;
- EP-023 Implementation Readiness завершён;
- активный AI API слой отсутствует;
- AI provider не подключён.

---

# Approved Scope (утверждённая область)

Разрешается подготовка:

- Supabase migration для `ai_usage`;
- RLS policies (политик RLS);
- server-side usage operation (серверной операции 
учёта);
- verification tests (проверочных тестов).

---

# Forbidden Scope (запрещённая область)

До отдельного утверждения запрещено:

- подключение AI provider;
- хранение AI ключей в клиентском коде;
- прямые записи клиента в `ai_usage`;
- обход RLS;
- автоматическое принятие значимых решений;
- изменение существующих ролей доступа.

---

# Implementation Requirements (требования 
реализации)

Любая реализация должна пройти:

1. Architecture Readiness Check;
2. Migration Check;
3. RLS Verification;
4. Security Review;
5. Production Build;
6. Diff Check;
7. Documentation Update.

---

# Rollback Requirement (требование отката)

Перед применением миграции необходимо иметь:

- обратимый migration path (путь миграции);
- проверяемый rollback;
- отсутствие нарушения существующего доступа.

---

# Human Accountability (ответственность человека)

ИИ-компоненты могут:

- анализировать;
- рекомендовать;
- подготовить данные.

Финальные решения с юридическим, финансовым, 
репутационным или безопасностным влиянием принимает 
Platform Owner.

---

# Approval Decision (решение утверждения)

Статус:

Pending Platform Owner approval

Следующий шаг после утверждения:

1. создание Supabase migration;
2. реализация RLS;
3. создание atomic operation;
4. тестирование.

---
