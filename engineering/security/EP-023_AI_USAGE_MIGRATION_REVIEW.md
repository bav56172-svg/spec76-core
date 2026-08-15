# EP-023 — AI Usage Migration Review

| Поле | Значение |
|---|---|
| Version (версия) | 0.1 |
| Status (статус) | Migration Review |
| Owner (владелец) | Platform Owner |
| Related Release (связанный релиз) | Release 0.4 |
| Related Capability (связанная возможность) | C-006 AI Request Foundation |
| Related ADR | ADR-025 Platform Sovereignty and Autonomous Operations |

---

# Purpose (назначение)

Документ фиксирует техническую проверку Supabase migration EP-023 перед применением.

Проверяется:

- структура таблицы;
- связи;
- ограничения;
- индексы;
- RLS;
- grants;
- rollback.

---

# Migration Under Review (проверяемая migration)

Файл:

supabase/migrations/20260802000100_ep023_ai_usage.sql

Статус:

Migration Draft.

---

# Architecture Compatibility (совместимость архитектуры)

Проверено:

- Release 0.4;
- Capability C-006 AI Request Foundation;
- ADR-025 Platform Sovereignty and Autonomous Operations.

Результат:

READY.

---

# Schema Review (проверка схемы)

Проверено:

- public.ai_usage;
- связь с пользователем;
- связь с компанией;
- связь с проектом;
- usage metadata.

Результат:

READY.

---

# Foreign Key Review (проверка связей)

Проверено:

- auth.users;
- public.companies;
- public.projects.

Результат:

READY.

---

# Constraint Review (проверка ограничений)

Проверено:

- NOT NULL;
- CHECK constraints;
- идентификаторы;
- целостность данных.

Результат:

READY.

---

# Index Review (проверка индексов)

Проверено:

- project lookup;
- user lookup;
- chronological access.

Результат:

READY.

---

# RLS Review (проверка RLS)

Проверено:

- RLS включён;
- FORCE RLS включён;
- клиентская запись запрещена;
- доступ зависит от project access.

Используется:

public.can_access_project(project_id)

Результат:

READY.

---

# Grants Review (проверка разрешений)

Проверено:

authenticated:

- SELECT через RLS.

service_role:

- серверская запись;
- серверское чтение;
- серверское обновление.

Результат:

READY.

---

# EP-024 Compatibility Review (совместимость с EP-024)

Не изменяются:

- profiles;
- companies;
- company_members;
- projects;
- существующие RLS policies.

Результат:

READY.

---

# Billing Compatibility (совместимость billing)

Проверено:

- billing tables не изменяются;
- Stripe flow не изменяется;
- billing webhook не изменяется.

Результат:

READY.

---

# Rollback Review (проверка отката)

Rollback:

- удалить новую таблицу;
- удалить новые policies;
- удалить новые grants.

Существующие доменные данные не изменяются.

Результат:

READY.

---

# Risks (риски)

Риски:

1. migration без approval;
2. отсутствие server-side usage operation;
3. попытка клиентской записи.

Mitigation:

- Platform Owner approval;
- RLS;
- server-side operation.

---

# Final Review Decision (итоговое решение)

Текущий статус:

READY FOR MIGRATION APPROVAL

Следующий этап:

1. Platform Owner approval;
2. migration execution;
3. RLS verification execution;
4. server-side usage operation.

