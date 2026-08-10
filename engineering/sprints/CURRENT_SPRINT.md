# Current Sprint — Release 0.4 / Platform Domain Foundation and Security Recovery

## Goal (цель)

Завершить `SPEC76-EP-024` Platform Domain Foundation (фундамент платформенного домена) как обязательную архитектурную и безопасностную основу перед продолжением следующего контура `SPEC76-EP-023`, не перенося небезопасную архитектуру из устаревшей ветки.

## Completed (завершено)

- Release 0.4 Architecture Package (архитектурный пакет релиза 0.4).
- `SPEC76-OP-019` SPEC76 OS Skeleton (каркас SPEC76 OS).
- `SPEC76-OP-020` Documentation Standards (стандарты документации).
- `SPEC76-EP-021` SPEC76 Build System (система сборки SPEC76).
- `SPEC76-EP-022` Agent Work and Conversation Governance (управление работой агентов и перепиской). Результат представлен нормативными документами и журналом решений; отдельный паспорт Engineering Pack не создавался.
- `SPEC76-EP-023` Repository Classification (классификация репозитория): 155 файлов.
- `SPEC76-EP-023` Billing Recovery (восстановление биллинга): RLS 10/10, webhook 4/4, rollback и Stripe CLI проверены.
- Platform Owner 2026-07-22 утвердил границы Billing Recovery.
- Platform Owner 2026-07-31 утвердил ADR-024 и разделение Greenfield migration и Upgrade migration.

- `SPEC76-EP-024` Platform Domain Foundation — завершён: Upgrade migration, rehearsal, verification, Lint, TypeScript, Production Build и документация проверены.
- `SPEC76-EP-023` Security and Recovery Engineering Package — общий пакет остаётся в работе; следующий контур AI API Recovery приостановлен до завершения применимых проверок `SPEC76-EP-024`.

## Next (далее)

- Вернуться к Data Security Foundation в составе `SPEC76-EP-023` AI API Recovery.
- Пользовательский платёжный сценарий проектировать как отдельную Capability (возможность платформы), не включая его автоматически в закрытую границу Billing Recovery.

## Blockers (блокеры)

Внешних блокеров для `SPEC76-EP-024` не зафиксировано. SQL Implementation заблокирована внутренним Architecture Gate до завершения Documentation Recovery, Data Readiness Audit и проектирования совместимой Upgrade migration. Следующий контур `SPEC76-EP-023` зависит от завершения применимых проверок EP-024.

## Evidence Note (примечание о доказательствах)

- Паспорт активного пакета: `engineering/packs/EP-024_PLATFORM_DOMAIN_FOUNDATION.md`.
- Архитектурное решение: `engineering/adr/ADR-024_PLATFORM_DOMAIN_FOUNDATION.md`.
- Технические результаты Billing Recovery: `engineering/security/EP-023_BILLING_RECOVERY.md`.
- `SPEC76-EP-023` в целом остаётся в работе, поскольку AI API Recovery не завершён.

## Service Contract Recovery — Foundation

Первый кодовый этап `SPEC76-EP-023` был направлен на унификацию сервисного результата и ошибок в основном потоке заявки. Миграции базы данных для этого этапа не требовались.

## Service Contract Recovery — Project Execution

Унифицированы сервисные контракты проектного рабочего пространства, задач, календарного плана, контрольных точек и событий проекта.

## Service Contract Recovery — Collaboration

Унифицированы сервисные контракты обсуждений, сообщений и уведомлений.

## Service Contract Recovery — Companies and Documents

Унифицированы сервисные контракты компаний и документов.

## Service Contract Recovery — Application Boundary Cleanup

Устранён прямой доступ страниц авторизации и проектов к Supabase. Небезопасное увеличение счётчика ИИ отключено до AI API Recovery.

## AI API Recovery — отложенный следующий контур

Architecture Gate (архитектурный допуск) завершён 2026-07-23. Утверждена `SPEC76-C-006` AI Request Foundation.

Data Security Foundation (основа безопасности данных) для `ai_usage` реализована 2026-08-10 после решения Platform Owner:

- базовая и lifecycle migrations (миграции жизненного цикла) применены в основной Supabase-базе;
- RLS, FORCE RLS и запрет клиентской записи подтверждены;
- атомарные `reserve_ai_usage` и `finalize_ai_usage` доступны только `service_role`;
- технический rate limit (лимит частоты запросов) установлен как `10 запросов за 60 секунд на пользователя`;
- локальная и production verification (производственная проверка) пройдены.

AI provider (поставщик ИИ-модели) и пользовательский маршрут выполнения ИИ-операции не подключены. Следующий этап — один защищённый project-scoped AI route (ИИ-маршрут в границе проекта), который обязан вызывать `reserve_ai_usage` перед поставщиком и `finalize_ai_usage` после результата.
