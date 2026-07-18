# EP-023 — Security and Recovery Engineering Package

**Версия:** 0.1  
**Статус:** In Progress (в работе)  
**Владелец:** Platform Owner (владелец платформы)  
**Release:** 0.4  
**Базовая ветка:** `recovery/op-002-repository-classification`  
**Анализируемая ветка:** `main`  
**Анализируемый коммит:** `1ac1f4db3038dd0db238b02ebee7c678851b047d`  
**Следующий пересмотр:** после проверки Supabase Billing и RLS

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

## Billing Recovery — начат

### Подтверждённый критический дефект

В `main` обработчики `customer.subscription.updated` и `customer.subscription.deleted` вызывают `supabase.from("billing").update(...)` без фильтра конкретной записи. Это создаёт риск массового изменения всех доступных строк таблицы `billing`.

### Принятое решение

Существующий webhook получает статус **Replace**. Новая реализация должна обеспечить:

1. проверку подписи Stripe;
2. строгую типизацию событий Stripe SDK (комплект разработки Stripe);
3. связь `stripe_customer_id` и `stripe_subscription_id` с конкретным пользователем;
4. обновление ровно одной записи;
5. Idempotency (идемпотентность — безопасная повторная обработка события);
6. журнал `stripe_event_id`;
7. безопасную обработку отсутствующих metadata (метаданных);
8. отсутствие финансовых изменений без подтверждённого соответствия пользователя;
9. RLS Review (проверка безопасности на уровне строк);
10. тест, доказывающий невозможность массового обновления.

### Блокеры до реализации

Необходимо проверить в Supabase:

- фактическую таблицу `billing`;
- первичный ключ;
- `user_id`;
- `stripe_customer_id`;
- `stripe_subscription_id`;
- действующие RLS policies (политики безопасности на уровне строк);
- механизм хранения обработанных Stripe-событий.

До этой проверки миграции и новый webhook не создаются.

## Definition of Done (критерии завершения)

- классификация 155 файлов записана в GitHub;
- billing webhook заменён безопасной реализацией;
- проверены схема Supabase и RLS;
- AI API защищены аутентификацией и авторизацией;
- сервисные контракты типизированы и согласованы;
- выполнены Lint, TypeScript, Production Build, Diff Check и Migration Check;
- обновлены инженерные журналы и индекс.

## Статус

| Этап | Статус |
|---|---|
| Architecture Readiness Check | Пройден для классификации; Billing ожидает Supabase Review |
| Repository Classification | Завершено |
| Billing Recovery | Начато: дефект, решение и требования зафиксированы |
| Implementation | Заблокирована до проверки Supabase |
| Migration Check | Требуется |
| Documentation Update | Выполнено частично |

## Главный следующий шаг

Проверить фактическую схему `billing` и её RLS policies в Supabase, затем подготовить безопасную миграцию и новый webhook.
