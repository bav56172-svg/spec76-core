# Operation Registry (реестр инженерных операций)

Источник истины: фактическое состояние PR на GitHub (`gh pr list`) и связанные документы (`RELEASE_BACKLOG.md`, `CURRENT_SPRINT.md`, `TEST_LAUNCH_PLAN.md`). Обновлено 2026-10-02.

| Operation | Название | Статус | Доказательство |
|---|---|---|---|
| OP-019 | SPEC76 OS Skeleton | Implemented | — |
| OP-020 | Documentation Standards | In Progress | — |
| OP-021 | Permission Enforcement | Implemented | PR #6, merged 2026-08-15 |
| OP-032 | Role Model Foundation | Implemented | PR #5, merged 2026-08-15 (переименовано из OP-019 — конфликт номера) |
| OP-033 | Organization Membership | Implemented | PR #7, merged 2026-08-15 (переименовано из OP-020 — конфликт номера) |
| OP-022 | Customer Journey | Implemented | PR #14 (role-aware home page) merged 2026-08-23; PR #9 (fix request/project routing) merged 2026-10-02 после проверки typecheck/lint на актуальном main |
| OP-023 | Contractor Journey | Implemented | PR #10 (Доступные заказы), #11 (Моя техника), #12 (Мои отклики) — все merged 2026-08-15 |
| OP-024 | Platform Owner Control Center | Implemented | PR #13 merged 2026-10-02. Миграция `20260816000100_op024_control_center_role_management_rls.sql` применена и проверена напрямую на self-hosted Supabase (`apps-serve`) перед слиянием: обе RLS-политики созданы без ошибок и корректно сосуществуют с read-политиками OP-032 (проверено `pg_policies`) |
| OP-025 | Workflow Foundation | Not Started | PR не найден |
| OP-026 | Audit Foundation | Not Started | PR не найден |
| OP-027 | Decision Memory | Not Started | PR не найден |
| OP-028 | Case Library | Not Started | PR не найден |
| OP-029 | Policy Versioning | Not Started | PR не найден |
| OP-030 | AI Operations Foundation | Not Started | PR не найден |
| OP-031 | AI Executive Assistant | Not Started | PR не найден |

## Примечание о слиянии PR #9 и #13 (2026-10-02)

Оба PR провисели открытыми около 1.5 месяцев (с 2026-08-15 и 2026-08-23). Причина простоя PR #9 в документах зафиксирована не была. Причина простоя PR #13 (сбой Supabase на момент проверки) к 2026-10-02 была уже неактуальна — вместо внешнего Supabase миграция проверена на собственном self-hosted стенде (`apps-serve`), который к этому моменту уже был развёрнут. Оба PR слиты после чистой проверки `typecheck`/`lint` на актуальном `main` и (для PR #13) фактического применения миграции.

Наблюдение не по этому пакету: при проверке `apps-serve` была высокая нагрузка (load average ~9.5, команды выполнялись медленно) и контейнер `supabase-studio` в статусе `unhealthy` — не блокирует работу БД, но стоит посмотреть отдельно.
