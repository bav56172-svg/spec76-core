# EP-023 — Billing Recovery

**Версия:** 0.4  
**Статус:** In Progress (в работе)  
**Владелец:** Platform Owner (владелец платформы)  
**Release:** 0.4  
**Engineering Package:** `EP-023`  
**Ветка:** `engineering/ep-023-security-recovery`  
**Следующий пересмотр:** после проверки Stripe webhook и rollback-процедуры

## Проверенные факты

Первичная проверка Supabase подтвердила отсутствие устаревшей таблицы `public.billing`. Поэтому legacy webhook (устаревший обработчик событий) из ветки `main` остаётся классифицированным как **Replace (заменить)**.

В ветке `engineering/ep-023-security-recovery` подтверждено:

- установлен Stripe SDK (комплект разработки Stripe) версии `22.3.2`;
- создан серверный Supabase-клиент `lib/supabase/admin.ts`;
- создан серверный Stripe-клиент `lib/billing/stripe.ts`;
- создан новый обработчик `app/api/billing/webhook/route.ts`;
- локально успешно выполнены Lint (проверка кода), TypeScript (проверка типов), Production Build (продукционная сборка) и Diff Check (проверка корректности различий);
- маршрут `/api/billing/webhook` включён в продукционную сборку;
- функциональная проверка RLS под ролями `authenticated` и `service_role` завершена успешно: пройдено 10 из 10 тестов, ошибок нет.

## Архитектурное решение

Billing Recovery разделяет данные на три области ответственности:

1. `billing_customers` — связь пользователя SPEC76 с Stripe Customer (клиентом Stripe).
2. `billing_subscriptions` — серверное состояние подписки.
3. `billing_webhook_events` — приватный журнал Idempotency (идемпотентности — защиты от повторной обработки одного события) и аудита.

Одна универсальная таблица `billing` не создаётся.

## Миграция

Файл:

`supabase/migrations/202607190001_ep_023_billing_recovery.sql`

Миграция применена в Supabase и структурно проверена.

### Подтверждённые таблицы

- `public.billing_customers`;
- `public.billing_subscriptions`;
- `public.billing_webhook_events`.

У всех трёх таблиц:

- `rls_enabled = true`;
- `rls_forced = true`.

### Подтверждённые ограничения

Проверены:

- первичные ключи UUID;
- внешний ключ `billing_customers.user_id -> auth.users.id` с `ON DELETE CASCADE`;
- уникальность `billing_customers.user_id`;
- уникальность `billing_customers.stripe_customer_id`;
- составной внешний ключ `(billing_customer_id, user_id)`;
- уникальность `billing_subscriptions.stripe_subscription_id`;
- проверка допустимых статусов подписки;
- проверка корректности периода подписки;
- уникальность `billing_webhook_events.stripe_event_id`;
- проверки статуса и количества попыток обработки webhook.

### Подтверждённые индексы

Проверены уникальные и рабочие индексы для:

- `billing_customers.user_id`;
- `billing_customers.stripe_customer_id`;
- пары `billing_customers(id, user_id)`;
- `billing_subscriptions.user_id`;
- `billing_subscriptions.billing_customer_id`;
- `billing_subscriptions.status`;
- `billing_subscriptions.stripe_subscription_id`;
- `billing_webhook_events.stripe_event_id`;
- `billing_webhook_events.event_type`;
- `billing_webhook_events.processing_status`;
- `billing_webhook_events.received_at desc`.

## RLS-модель

### `billing_customers`

Authenticated user (аутентифицированный пользователь) имеет только `SELECT` и только для собственной строки:

```sql
auth.uid() = user_id
```

Пользовательские `INSERT`, `UPDATE` и `DELETE` не разрешены.

### `billing_subscriptions`

Authenticated user имеет только `SELECT` и только для собственной строки:

```sql
auth.uid() = user_id
```

Пользовательские `INSERT`, `UPDATE` и `DELETE` не разрешены.

### `billing_webhook_events`

Пользовательские политики отсутствуют. Роли `anon` и `authenticated` не имеют прямых прав на таблицу.

### Права ролей

Структурный аудит подтвердил:

- `authenticated` имеет только `SELECT` на `billing_customers`;
- `authenticated` имеет только `SELECT` на `billing_subscriptions`;
- `authenticated` не имеет прав на `billing_webhook_events`;
- `service_role` имеет необходимые серверные права на все три таблицы;
- `anon` не имеет прав на billing-таблицы.

## Security by Design

- Stripe identifiers (идентификаторы Stripe) записывает только сервер.
- Финансовое состояние не изменяется из браузера.
- Повторное событие блокируется уникальным `stripe_event_id`.
- Подписка связывается с конкретным пользователем через составной внешний ключ.
- Raw payload (необработанное содержимое события) не сохраняется целиком без необходимости.
- Обычный пользователь не видит внутреннюю механику Stripe и webhook.

## Webhook Recovery

Новый webhook:

1. проверяет подпись Stripe по исходному телу запроса;
2. использует серверный `service_role` только внутри серверного модуля;
3. регистрирует уникальный `stripe_event_id` до изменения состояния подписки;
4. обрабатывает повторную доставку события без повторного финансового изменения;
5. ищет пользователя через `billing_customers`, а не доверяет внешним metadata;
6. обновляет подписку только по конкретному `stripe_subscription_id` и связанной записи пользователя;
7. проверяет количество изменённых строк;
8. сохраняет минимизированный журнал обработки;
9. не возвращает внутренние ошибки и секреты во внешний ответ.

## Verification

Локально успешно выполнены:

```text
npm run lint
npm run typecheck
npm run build
git diff --check
```

Структурный post-migration audit (аудит после миграции) в Supabase успешно подтвердил таблицы, колонки, индексы, ограничения, права и конфигурацию RLS.

### Функциональная проверка RLS

Функциональный тест выполнен в Supabase SQL Editor внутри транзакции с финальным `ROLLBACK` (откатом транзакции). Тестовые таблицы и записи после выполнения не сохранены.

Итог:

```json
{
  "all_passed": true,
  "passed_count": 10,
  "failed_count": 0
}
```

Подтверждено:

1. `authenticated` читает собственную строку `billing_customers`;
2. `authenticated` не читает чужую строку `billing_customers`;
3. `authenticated` читает собственную строку `billing_subscriptions`;
4. `authenticated` не читает чужую строку `billing_subscriptions`;
5. пользовательский `INSERT` в billing-данные запрещён;
6. пользовательский `UPDATE` billing-данных запрещён;
7. пользовательский `DELETE` billing-данных запрещён;
8. `authenticated` не имеет доступа к `billing_webhook_events`;
9. повторный `stripe_event_id` отклоняется ограничением уникальности;
10. `service_role` может записывать события в `billing_webhook_events`.

Функциональная проверка RLS завершена успешно.

## Оставшиеся проверки

До production (продуктивной среды) необходимо:

1. проверить webhook с тестовыми Stripe-событиями;
2. проверить повторную доставку одного Stripe-события на уровне HTTP-обработчика;
3. проверить обработку неподдерживаемого типа события;
4. проверить отказ при неверной подписи Stripe;
5. проверить откат на отдельной тестовой базе;
6. получить окончательное утверждение Platform Owner.

## Статус этапов

| Этап | Статус |
|---|---|
| Supabase schema audit | Завершён |
| Architecture Readiness Check | Пройден для миграции и webhook |
| Migration implementation | Завершена в GitHub |
| Migration application | Выполнена в Supabase |
| Structural RLS verification | Завершена |
| Functional RLS verification | Завершена: 10/10 |
| Stripe SDK | Установлен и зафиксирован |
| Server clients | Реализованы |
| Webhook implementation | Реализован |
| Lint | Пройден локально |
| TypeScript | Пройден локально |
| Production Build | Пройден локально |
| Diff Check | Пройден локально |
| Stripe webhook functional verification | Требуется |
| Rollback verification | Требуется |
| Platform Owner approval | Требуется перед production |

## Главный следующий шаг

Выполнить функциональную проверку `/api/billing/webhook` с тестовыми Stripe-событиями, включая валидную подпись, повторную доставку, неподдерживаемый тип события и отказ при неверной подписи.