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
- `SPEC76-ADR-026` слит в `main` вместе с полной инженерной веткой (`engineering/ep-025-ses001-review-governance-extension-v2`, PR не создавался — прямое слияние Platform Owner 2026-08-15) — конституция, ADR, стандарты и реестры перестали быть отдельной веткой.
- **Release 0.4 / Wave 1 — Identity & Access (2026-08-15):**
  - `SPEC76-OP-032` Role Model Foundation (основа ролевой модели): таблица `platform_roles`, функция `has_platform_role()`, RLS. Platform Owner (`bav56172@gmail.com`) назначен `platform_owner`. Переименовано из `OP-019` в бэклоге — конфликт нумерации с уже занятым `OP-019` зафиксирован и устранён.
  - `SPEC76-OP-021` Permission Enforcement (применение разрешений): `services/permissions.ts` (`requirePlatformRole`), защита `/api/admin/*` в `middleware.ts` для `moderator`/`administrator`/`platform_owner`.
  - `SPEC76-OP-033` Organization Membership (членство в организации): `listCompanyMembers`/`inviteCompanyMember`/`removeCompanyMember` в `services/companies.ts`, приглашение по `user_id` (email-приглашения — отдельная область, не входит).
  - Lint и TypeScript проверены чистыми на всех трёх PR (#5, #6, #7), смёржены в `main`.

## Next (далее)

- **Release 0.4 / Wave 2 — User Experience:** путь заказчика, путь исполнителя, кабинет владельца платформы (`Customer Journey`, `Contractor Journey`, `Platform Owner Control Center`) — в работе.
- Подготовить пакет для профильного российского юриста на основе `SPEC76-ADR-026` и проверенного аудита зависимостей.
- Определить критерии выбора российского производственного контура без выполнения миграции и без привязки к непроверенному поставщику.
- Пользовательский платёжный сценарий проектировать как отдельную Capability (возможность платформы) с российским поставщиком, не включая его автоматически в закрытую границу Billing Recovery.
- Продолжать C-006 только через заменяемый адаптер поставщика; не включать OpenAI или иной пользовательский AI provider (поставщика ИИ) до отдельного юридического и архитектурного допуска.

## Blockers (блокеры)

Внешних блокеров для завершённого `SPEC76-EP-024` не зафиксировано.

Публичный российский производственный запуск заблокирован до:

- письменного заключения профильного российского юриста;
- выбора российского первичного контура базы, Auth и Storage;
- отдельного Migration Readiness Check (проверки готовности миграции), репетиции и плана отката;
- отдельного решения по российскому платёжному поставщику;
- юридического и архитектурного допуска пользовательского ИИ-поставщика;
- финального решения Platform Owner по Launch Gate (допуску запуска).

## Evidence Note (примечание о доказательствах)

- Паспорт активного пакета: `engineering/packs/EP-024_PLATFORM_DOMAIN_FOUNDATION.md`.
- Архитектурное решение: `engineering/adr/ADR-024_PLATFORM_DOMAIN_FOUNDATION.md`.
- Технические результаты Billing Recovery: `engineering/security/EP-023_BILLING_RECOVERY.md`.
- Российская производственная граница: `engineering/adr/ADR-026_RUSSIAN_PRODUCTION_DATA_BOUNDARY.md`.
- Проверенный аудит зависимостей: `engineering/security/EP-023_RUSSIAN_PRODUCTION_DEPENDENCY_AUDIT.md`.
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

После принятия `SPEC76-ADR-026` защищённый маршрут может проектироваться только через заменяемый Provider Adapter (адаптер поставщика). Подключение конкретного пользовательского поставщика и отправка ему данных не разрешены без отдельного юридического и архитектурного допуска.

## Russian Production Boundary (российская производственная граница) — ADR-026

- основной зарубежный Supabase-проект признан ограниченным переходным контуром, а не готовой основой публичного российского запуска;
- предпочтительное направление — self-hosted Supabase или совместимый PostgreSQL-контур в российском центре обработки данных;
- конкретный поставщик, конфигурация, перенос данных и удаление зарубежных копий требуют отдельных решений и проверок;
- Stripe не считается российским пользовательским платёжным способом;
- OpenAI не включается в российский пользовательский Runtime без подтверждённого допустимого сценария;
- интерфейсы заказчика и исполнителя сохраняются, а инфраструктурная сложность остаётся невидимой пользователю.
