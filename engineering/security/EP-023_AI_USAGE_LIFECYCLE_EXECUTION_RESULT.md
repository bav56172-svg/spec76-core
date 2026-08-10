# EP-023 — AI Usage Lifecycle Execution Result

| Поле | Значение |
|---|---|
| Version (версия) | 1.0 |
| Status (статус) | Production Verification Passed (производственная проверка пройдена) |
| Owner (владелец) | Platform Owner |
| Related Release (связанный релиз) | Release 0.4 |
| Related Capability (связанная возможность) | C-006 AI Request Foundation |
| Execution Date (дата выполнения) | 2026-08-10 |
| Supabase Project (проект Supabase) | `ficjhafnnrznfxgezfay` |

---

# Decision (решение)

Platform Owner утвердил реализацию additive lifecycle migration (добавочной миграции жизненного цикла), атомарных функций учёта и технического ограничения ИИ-запросов.

Технический rate limit (ограничение частоты запросов) установлен как:

```text
10 запросов / 60 секунд / пользователь
```

Это защитный технический лимит, а не пользовательский биллинг и не тарифное решение.

---

# Implemented Scope (реализованная граница)

Добавлены:

- lifecycle columns (колонки жизненного цикла) `request_id`, `status`, `completed_at`;
- уникальность `request_id`;
- состояния `reserved`, `completed`, `failed`;
- атомарная функция `public.reserve_ai_usage`;
- идемпотентная функция `public.finalize_ai_usage`;
- advisory transaction locks (транзакционные рекомендательные блокировки) для защиты от конкурентных запросов;
- явная проверка членства пользователя в компании проекта;
- вызов функций только через `service_role`;
- предварительная RLS-проверка лимита для `/api/ai/*`;
- серверный сервис `UsageBilling.reserve/finalize`;
- SQL verification test (SQL-тест проверки).

AI provider (поставщик ИИ) и пользовательский маршрут выполнения ИИ-операции не включались. Активный `auto-deploy` остаётся закрыт ответом `403`.

---

# Migration (миграция)

GitHub-файл:

```text
supabase/migrations/20260810191040_ep023_ai_usage_lifecycle_rate_limit.sql
```

Supabase migration history (история миграций Supabase):

```text
20260810191040 ep023_ai_usage_lifecycle_rate_limit
```

Перед применением production preflight (производственная предварительная проверка) подтвердил:

- `public.ai_usage` существует;
- строк: `0`;
- RLS включён;
- FORCE RLS включён;
- `authenticated` имеет `SELECT` и не имеет прав записи;
- lifecycle columns отсутствуют;
- функции `reserve_ai_usage` и `finalize_ai_usage` отсутствуют.

Миграция применена успешно и сохранила таблицу пустой.

---

# Local Verification (локальная проверка)

Финальная миграция повторно применена поверх базовой пустой схемы локальной Supabase.

Транзакционный тест подтвердил:

- `reserve` создаёт состояние `reserved`;
- повторный `reserve` с тем же контрактом идемпотентен;
- конфликтующее повторное использование `request_id` блокируется;
- посторонний пользователь не получает доступ к проекту;
- `reserved -> completed` работает;
- повторный same-state finalize (завершение в том же состоянии) идемпотентен;
- `completed -> failed` блокируется;
- 11-й запрос за 60 секунд блокируется;
- `anon` и `authenticated` не могут выполнять функции;
- `service_role` может выполнять функции;
- RLS, FORCE RLS и отсутствие клиентской записи сохранены.

После `ROLLBACK` количество локальных строк `ai_usage` равно `0`.

---

# Production Verification (производственная проверка)

После применения подтверждено:

```text
AI_USAGE ROW COUNT: 0
LIFECYCLE COLUMNS: PRESENT
LIFECYCLE CONSTRAINTS: PRESENT
RESERVE FUNCTION: PRESENT
FINALIZE FUNCTION: PRESENT
ANON EXECUTE: DENIED
AUTHENTICATED EXECUTE: DENIED
SERVICE_ROLE EXECUTE: ALLOWED
```

Supabase Security Advisor (советник безопасности Supabase) не выявил новых предупреждений для `ai_usage`, `reserve_ai_usage` или `finalize_ai_usage`.

Три информационных предупреждения о неиспользованных индексах `ai_usage` существовали до изменения и ожидаемы при пустой таблице.

---

# Engineering Quality Gate (инженерный контроль качества)

Пройдено:

- Lint (статическая проверка кода);
- TypeScript (проверка типов);
- Production Build (производственная сборка);
- SQL lint (статическая проверка SQL);
- локальный migration rehearsal (репетиция миграции);
- SQL verification test;
- Diff Check (проверка diff);
- Supabase advisors.

Next.js сообщил существующее предупреждение о будущем переходе от `middleware.ts` к `proxy.ts`. Файл `middleware.ts` сохранён, поскольку текущий hardened protocol (усиленный протокол) явно требует корневой Middleware и Next.js 16.2.9 продолжает его собирать.

---

# Rollback Boundary (граница отката)

До появления production usage records (производственных записей использования) возможен отдельный утверждённый rollback (откат): удалить функции, ограничения и lifecycle columns.

После начала runtime usage (использования во время работы) применяется только forward fix (исправление вперёд), если Platform Owner не утвердит отдельный план безопасного отката данных.

---

# Final Result (итоговый результат)

```text
PLATFORM OWNER APPROVAL: CONFIRMED
LOCAL MIGRATION REHEARSAL: PASSED
LOCAL FUNCTIONAL VERIFICATION: PASSED
PRODUCTION MIGRATION: APPLIED
PRODUCTION SCHEMA VERIFICATION: PASSED
FUNCTION SECURITY BOUNDARY: PASSED
RATE LIMIT FOUNDATION: IMPLEMENTED
AI PROVIDER EXECUTION: NOT ENABLED
```

Следующий этап C-006:

```text
один защищённый project-scoped AI route (ИИ-маршрут в границе проекта)
-> серверная идентичность
-> reserve_ai_usage
-> вызов поставщика
-> finalize_ai_usage
```
