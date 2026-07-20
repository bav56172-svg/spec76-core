# EP-023 — Security and Recovery Engineering Package

**Версия:** 0.2  
**Статус:** In Progress (в работе)  
**Владелец:** Platform Owner (владелец платформы)  
**Release:** 0.4  
**Базовая ветка:** `recovery/op-002-repository-classification`  
**Анализируемая ветка:** `main`  
**Анализируемый коммит:** `1ac1f4db3038dd0db238b02ebee7c678851b047d`  
**Следующий пересмотр:** после проверки rollback-процедуры Billing и определения следующего контура EP-023

## Цель

Классифицировать устаревшую ветку `main`, запретить её прямое объединение с Release 0.4 и восстановить критические контуры Billing, AI API и сервисных контрактов.

## Решения классификации

- **Adopt (принять)** — можно использовать как основу после проверки совместимости.
- **Refactor (переработать)** — идея полезна, но реализация требует изменения.
- **Replace (заменить)** — существующую реализацию переносить нельзя.
- **Archive (архивировать)** — не включать в Release 0.4.

## Итог

| Решение | Количество |
|---|---:|
| Adopt | 12 |
| Refactor | 73 |
| Replace | 34 |
| Archive | 36 |
| **Всего** | **155** |

## Adopt

- `.gitignore`
- `LICENSE`
- `eslint.config.mjs`
- `next.config.ts`
- `postcss.config.mjs`
- `tsconfig.json`
- `app/favicon.ico`
- `public/file.svg`
- `public/globe.svg`
- `public/next.svg`
- `public/vercel.svg`
- `public/window.svg`

## Replace

### API и Billing

- `app/api/agents/stream/route.ts`
- `app/api/agents/task-check/route.ts`
- `app/api/ai/actions/route.ts`
- `app/api/ai/auto-deploy/route.ts`
- `app/api/ai/autonomous-company/route.ts`
- `app/api/ai/autonomy/route.ts`
- `app/api/ai/autopilot/route.ts`
- `app/api/ai/break-task/route.ts`
- `app/api/ai/chat/route.ts`
- `app/api/ai/civilization/route.ts`
- `app/api/ai/ecosystem/route.ts`
- `app/api/ai/error-detector/route.ts`
- `app/api/ai/existence/route.ts`
- `app/api/ai/governance/route.ts`
- `app/api/ai/improve-task/route.ts`
- `app/api/ai/market/route.ts`
- `app/api/ai/meta-consciousness/route.ts`
- `app/api/ai/multi-civilization/route.ts`
- `app/api/ai/realtime/route.ts`
- `app/api/ai/revenue/route.ts`
- `app/api/ai/self-creating-universe/route.ts`
- `app/api/ai/self-modifying/route.ts`
- `app/api/ai/swarm/route.ts`
- `app/api/ai/tasks/route.ts`
- `app/api/ai/universal-rules/route.ts`
- `app/api/billing/webhook/route.ts`

Причины: нет подтверждённых Authentication (аутентификация — проверка личности), Authorization (авторизация — проверка прав), Validation (валидация — проверка входных данных), контроля затрат и единых сервисных контрактов.

### Supabase и миграции

- `app/lib/supabase.ts`
- `services/supabase.ts`
- `app/projects/[id]/docs/database/migrations/004_create_tasks.sql`
- `app/projects/[id]/docs/database/migrations/005_tasks_rls.sql`
- `docs/database/migrations/002_create_projects.sql`
- `docs/database/migrations/003_projects_rls.sql`

### Зависимости

- `package.json`
- `package-lock.json`

## Archive

### Страницы вне Release 0.4

- `app/civilization/page.tsx`
- `app/ecosystem/page.tsx`
- `app/existence/page.tsx`
- `app/meta-consciousness/page.tsx`
- `app/multi-civilization/page.tsx`
- `app/self-universe/page.tsx`
- `app/universal-rules/page.tsx`

### Исторические документы

- `CLAUDE.md`
- `docs/03_FOUNDER_MANIFESTO.md`
- `docs/11_SPEC76_CITY_PILOT_LAUNCH.md`
- `docs/12_SPEC76_FIRST_OPERATING_CITY_SYSTEM.md`
- `docs/13_SPEC76_MULTI_CITY_EXPANSION_SYSTEM.md`
- `docs/14_SPEC76_NATIONAL_SCALING_SYSTEM.md`
- `docs/15_SPEC76_GLOBAL_INFRASTRUCTURE_SYSTEM.md`

### Спекулятивные библиотеки

- `lib/ai/fImprovingSystem.ts`
- `lib/civilization/digitalCivilization.ts`
- `lib/company/autonomousCompany.ts`
- `lib/ecosystem/multiCompanyEcosystem.ts`
- `lib/growth/growthEngine.ts`
- `lib/network/multiCivilizationNetwork.ts`
- `lib/saas/saasEngine.ts`

### Спекулятивные AI-сервисы

- `services/ai/autoDeploy.ts`
- `services/ai/autonomousCompany.ts`
- `services/ai/autonomy.ts`
- `services/ai/autopilot.ts`
- `services/ai/digitalCivilization.ts`
- `services/ai/ecosystem.ts`
- `services/ai/existenceTheoryEngine.ts`
- `services/ai/marketSystem.ts`
- `services/ai/metaConsciousness.ts`
- `services/ai/multiCivilizationNetwork.ts`
- `services/ai/revenueSystem.ts`
- `services/ai/selfCreatingUniverse.ts`
- `services/ai/selfModifying.ts`
- `services/ai/swarm.ts`
- `services/ai/universalRuleEngine.ts`

## Refactor

### Корневые документы и базовые файлы

- `AGENTS.md`
- `README.md`
- `app/api/health/route.ts`
- `app/globals.css`

### Аутентификация, проекты и компании

- `app/auth/page.tsx`
- `app/companies/page.tsx`
- `app/page.tsx`
- `app/layout.tsx`
- `app/projects/page.tsx`
- `app/projects/new/page.tsx`
- `app/projects/[id]/layout.tsx`
- `app/projects/[id]/page.tsx`
- `app/projects/[id]/docs/page.tsx`
- `app/projects/[id]/governance/page.tsx`

### AI-интерфейс

- `app/projects/[id]/ai-dashboard/page.tsx`
- `app/projects/[id]/ai/dashboard/page.tsx`
- `app/projects/[id]/ai/page.tsx`
- `app/projects/[id]/components/AgentFeedbackPanel.tsx`

### Tasks and Kanban (задачи и канбан)

- `app/components/kanban/KanbanBoard.tsx`
- `app/projects/[id]/tasks/components/TaskCard.tsx`
- `app/projects/[id]/tasks/page.tsx`
- `lib/kanban/board.ts`

### Hooks (хуки — функции React для повторного использования состояния)

- `app/hooks/useCompanies.ts`
- `app/hooks/useCurrentUser.ts`
- `app/hooks/useProjectContext.ts`
- `app/hooks/useProjects.ts`
- `app/hooks/useRealtimeAI.ts`
- `hooks/useRealtimeAI.ts`
- `hooks/useRealtimeExecutionLoop.ts`

### Вспомогательные библиотеки

- `app/lib/product/launchSystem.ts`
- `app/lib/usageBilling.ts`

### Продуктовая документация

- `docs/00_CORE_PRODUCT_SPEC.md`
- `docs/01_PRODUCT_VISION.md`
- `docs/01_SPEC76_GLOSSARY.md`
- `docs/02_PRINCIPLES.md`
- `docs/04_ROADMAP.md`
- `docs/05_ARCHITECTURE.md`
- `docs/06_CHANGELOG.md`
- `docs/06_EXECUTION_FLOW_V1.md`
- `docs/07_REQUIREMENTS_TZ.md`
- `docs/07_SPEC76_DEPLOYMENT_ARCHITECTURE.md`
- `docs/08_SPEC76_MVP_LAUNCH_SYSTEM.md`
- `docs/10_SPEC76_REAL_WORLD_SERVICE_FLOW.md`
- `docs/16_SPEC76_CITY_EXECUTION_FOCUS.md`
- `docs/ARCHITECTURE_RULES.md`

### AI-библиотеки

- `lib/ai/autonomyPolicy.ts`
- `lib/ai/costOptimizationEngine.ts`
- `lib/ai/multiAgentSystem.ts`
- `lib/ai/observabilityLayer.ts`
- `lib/ai/ruleEngine.ts`
- `lib/ai/stabilityLayer.ts`

### Billing-библиотеки

- `lib/billing/stripe.ts`
- `lib/billing/usageBilling.ts`

### SPEC76 Core

- `lib/spec76/binding/taskAgentStream.ts`
- `lib/spec76/core/hardening.ts`
- `lib/spec76/governance/humanInTheLoop.ts`
- `lib/spec76/memory/agentDecisionStore.ts`
- `lib/spec76/memory/agentLearningLoop.ts`
- `lib/spec76/rules/ruleEvolutionEngine.ts`

### Полезные AI-сервисы

- `services/ai/contextBuilder.ts`
- `services/ai/errorDetector.ts`
- `services/ai/governance.ts`
- `services/ai/gpt.ts`
- `services/ai/kanbanAI.ts`
- `services/ai/memory.ts`
- `services/ai/projectBrain.ts`
- `services/ai/taskGenerator.ts`

### Доменные сервисы и типы

- `services/companies.ts`
- `services/projects.ts`
- `services/tasks.ts`
- `types/company.ts`
- `types/project.ts`
- `types/user.ts`

## Billing Recovery — восстановление подтверждено

### Подтверждённый критический дефект

В `main` обработчики `customer.subscription.updated` и `customer.subscription.deleted` вызывали `supabase.from("billing").update(...)` без фильтра конкретной записи. Это создавало риск массового изменения всех доступных строк таблицы `billing`.

### Реализованное решение

Устаревший webhook сохранил классификацию **Replace**. В ветке `engineering/ep-023-security-recovery` реализована новая архитектура:

1. подпись Stripe проверяется по исходному телу запроса;
2. используется Stripe SDK (комплект разработки Stripe) версии `22.3.2`;
3. `stripe_customer_id` и `stripe_subscription_id` связаны с конкретным пользователем;
4. обновление подписки ограничено конкретной записью;
5. Idempotency (идемпотентность — защита от повторной обработки события) обеспечивается уникальным `stripe_event_id`;
6. события фиксируются в приватном журнале `billing_webhook_events`;
7. финансовое состояние изменяется только сервером;
8. пользовательские роли не имеют прав на изменение billing-данных;
9. RLS (безопасность на уровне строк) включена и принудительно применяется;
10. внутренние ошибки и секреты не возвращаются клиенту.

### Подтверждённая схема Supabase

Устаревшая таблица `public.billing` отсутствует. Созданы и проверены:

- `public.billing_customers`;
- `public.billing_subscriptions`;
- `public.billing_webhook_events`.

Миграция:

`supabase/migrations/202607190001_ep_023_billing_recovery.sql`

### Результаты проверки

Подтверждено:

- структурный аудит схемы, ограничений, индексов, прав и RLS;
- функциональная проверка RLS: `10/10` тестов пройдено;
- функциональная проверка Stripe webhook: `4/4` теста пройдено;
- запрос без подписи отклоняется;
- запрос с неверной подписью отклоняется;
- валидное неподдерживаемое событие аутентифицируется и записывается как проигнорированное;
- повторная доставка обрабатывается идемпотентно;
- Lint (проверка кода), TypeScript (проверка типов) и Production Build (продукционная сборка) проходят;
- маршрут `/api/billing/webhook` присутствует в продукционной сборке.

Подробный журнал проверки находится в:

`engineering/security/EP-023_BILLING_RECOVERY.md`

### Оставшиеся действия Billing

До допуска в production (продуктивную среду) остаются:

1. проверить rollback (откат — возврат базы данных к состоянию до миграции) на отдельной тестовой базе;
2. при необходимости выполнить сквозную проверку через Stripe CLI (интерфейс командной строки Stripe — средство отправки тестовых событий);
3. получить окончательное утверждение Platform Owner.

## Definition of Done (критерии завершения)

- [x] классификация 155 файлов записана в GitHub;
- [x] billing webhook заменён безопасной реализацией;
- [x] проверены схема Supabase и RLS;
- [x] выполнены Lint, TypeScript, Production Build, Diff Check и Migration Check для Billing Recovery;
- [x] обновлён журнал Billing Recovery;
- [ ] проверена rollback-процедура Billing на отдельной тестовой базе;
- [ ] AI API защищены аутентификацией и авторизацией;
- [ ] сервисные контракты типизированы и согласованы;
- [ ] обновлены итоговые инженерные журналы и индекс;
- [ ] получено окончательное утверждение Platform Owner.

## Статус

| Этап | Статус |
|---|---|
| Architecture Readiness Check | Пройден для классификации и Billing Recovery |
| Repository Classification | Завершено |
| Billing Recovery | Восстановление подтверждено: RLS 10/10, webhook 4/4 |
| Billing Implementation | Завершена |
| Billing Migration Check | Завершён |
| Billing Rollback Check | Требуется на отдельной тестовой базе |
| AI API Recovery | Не начато в рамках текущего подтверждённого этапа |
| Service Contract Recovery | Не начато в рамках текущего подтверждённого этапа |
| Documentation Update | Billing-документация синхронизирована |
| Platform Owner approval | Требуется перед production |

## Главный следующий шаг

Проверить rollback-процедуру Billing на отдельной тестовой базе, зафиксировать результат в инженерном журнале и передать Billing Recovery на окончательное утверждение Platform Owner.