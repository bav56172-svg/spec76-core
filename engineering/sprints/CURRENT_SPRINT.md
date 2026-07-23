# Current Sprint — Release 0.4 / Security Recovery

## Goal (цель)

Восстановить критические контуры устаревшей ветки без прямого объединения с Release 0.4 и без переноса небезопасной архитектуры.

## Completed (завершено)

- Release 0.4 Architecture Package (архитектурный пакет релиза 0.4).
- OP-019 SPEC76 OS Skeleton (каркас SPEC76 OS).
- OP-020 Documentation Standards (стандарты документации).
- EP-021 SPEC76 Build System (система сборки SPEC76).
- EP-022 Agent Work and Conversation Governance (управление работой агентов и перепиской).
- EP-023 Repository Classification (классификация репозитория): 155 файлов.
- EP-023 Billing Recovery (восстановление биллинга): RLS 10/10, webhook 4/4, rollback и Stripe CLI проверены.
- Platform Owner 2026-07-22 утвердил границы Billing Recovery.

## In Progress (в работе)

- EP-023 Security and Recovery Engineering Package (инженерный пакет безопасности и восстановления).

## Next (далее)

- Architecture Gate (архитектурный допуск) следующего контура EP-023.
- Выбор между AI API Recovery и Service Contract Recovery на основании рисков и зависимостей Release 0.4.
- Отдельное проектирование Capability пользовательского платёжного сценария; не включать его автоматически в закрытую границу Billing Recovery.

## Blockers (блокеры)

Подтверждённых блокеров для нормативного закрытия контура Billing Recovery нет. Следующий контур EP-023 требует архитектурного выбора, но не повторного утверждения уже завершённых проверок Billing.

## Evidence Note (примечание о доказательствах)

Технические результаты Billing Recovery зафиксированы в `engineering/security/EP-023_BILLING_RECOVERY.md`. EP-023 в целом остаётся в работе, поскольку AI API Recovery и Service Contract Recovery не завершены.

## Service Contract Recovery — Foundation

Первый кодовый этап EP-023 направлен на унификацию сервисного результата и ошибок в основном потоке заявки. Миграции базы данных не требуются.

## Service Contract Recovery — Project Execution

Унифицированы сервисные контракты проектного рабочего пространства, задач, календарного плана, контрольных точек и событий проекта.

## Service Contract Recovery — Collaboration

Унифицированы сервисные контракты обсуждений, сообщений и уведомлений.


## Service Contract Recovery — Companies and Documents

Унифицированы сервисные контракты компаний и документов.


## Service Contract Recovery — Application Boundary Cleanup

Устранён прямой доступ страниц авторизации и проектов к Supabase. Небезопасное увеличение счётчика ИИ отключено до AI API Recovery.
