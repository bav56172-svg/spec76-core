# EP-023 — AI Usage Migration Design

| Поле | Значение |
|---|---|
| Version (версия) | 0.1 |
|---|---|
| Status (статус) | Architecture Design |
| Owner (владелец) | Platform Owner |
| Related Release (связанный релиз) | Release 0.4 |
| Related Capability (связанная возможность) | C-006 AI Request Foundation |
| Related ADR | ADR-025 Platform Sovereignty and Autonomous Operations |

---

# Purpose (назначение)

Документ определяет проектирование будущей Supabase
migration (миграции Supabase) для сущности
`ai_usage`.

Документ не выполняет миграцию.

---

# Migration Principles (принципы миграции)

Будущая миграция должна:

- быть обратимой;
- иметь проверяемый rollback;
- не нарушать существующий доступ;
- не изменять существующие роли;
- не создавать обход RLS.

---

# Proposed Entity (предлагаемая сущность)

```text
public.ai_usage
```

# RLS Preparation (подготовка RLS)

Будущая миграция должна предусматривать:

- включение RLS;
- проверку через company membership;
- проверку проектного доступа;
- запрет прямой записи клиента.

---

# Rollback Strategy (стратегия отката)

При проблеме:

- миграция не считается успешной;
- выполняется проверенный rollback;
- данные не удаляются автоматически;
- результат фиксируется в инженерном журнале.

---

# Implementation Boundary (граница реализации)

До отдельного утверждения запрещено:

- создавать Supabase migration;
- создавать таблицу `ai_usage`;
- создавать SQL function;
- изменять RLS;
- подключать AI provider.
