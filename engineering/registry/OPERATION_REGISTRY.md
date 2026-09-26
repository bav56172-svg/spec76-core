# Operation Registry (реестр инженерных операций)

Источник истины: фактическое состояние PR на GitHub (`gh pr list`) и связанные документы (`RELEASE_BACKLOG.md`, `CURRENT_SPRINT.md`, `TEST_LAUNCH_PLAN.md`). Обновлено 2026-09-26 — таблица ранее отражала только 5 из 15 операций Release 0.4.

| Operation | Название | Статус | Доказательство |
|---|---|---|---|
| OP-019 | SPEC76 OS Skeleton | Implemented | — |
| OP-020 | Documentation Standards | In Progress | — |
| OP-021 | Permission Enforcement | Implemented | PR #6, merged 2026-08-15 |
| OP-032 | Role Model Foundation | Implemented | PR #5, merged 2026-08-15 (переименовано из OP-019 — конфликт номера) |
| OP-033 | Organization Membership | Implemented | PR #7, merged 2026-08-15 (переименовано из OP-020 — конфликт номера) |
| OP-022 | Customer Journey | Partial — часть смёржена, часть открыта | PR #14 (role-aware home page) merged 2026-08-23; PR #9 (fix request/project routing) **OPEN**, не смёржен |
| OP-023 | Contractor Journey | Implemented | PR #10 (Доступные заказы), #11 (Моя техника), #12 (Мои отклики) — все merged 2026-08-15 |
| OP-024 | Platform Owner Control Center | Blocked — код готов, не смёржен | PR #13 **OPEN** с 2026-08-23; блокировка — платформенный сбой Supabase (HTTP 401/timeout, подтверждён на status.supabase.com), см. `TEST_LAUNCH_PLAN.md` |
| OP-025 | Workflow Foundation | Not Started | PR не найден |
| OP-026 | Audit Foundation | Not Started | PR не найден |
| OP-027 | Decision Memory | Not Started | PR не найден |
| OP-028 | Case Library | Not Started | PR не найден |
| OP-029 | Policy Versioning | Not Started | PR не найден |
| OP-030 | AI Operations Foundation | Not Started | PR не найден |
| OP-031 | AI Executive Assistant | Not Started | PR не найден |

## Примечание по PR #9 и #13

Оба открытых PR датированы 2026-08-15 и 2026-08-23 соответственно и с тех пор не обновлялись (`gh pr view --json updatedAt`) — то есть простаивают около месяца. Причина простоя PR #13 задокументирована (внешний сбой Supabase); причина простоя PR #9 в документах не зафиксирована — требует проверки у Platform Owner: забыт, ждёт ревью, или заблокирован по другой причине.
