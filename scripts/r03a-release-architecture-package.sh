#!/usr/bin/env bash
set -Eeuo pipefail

mkdir -p engineering/releases/0.3 engineering/daily engineering/sprints

cat > engineering/releases/0.3/RELEASE_BLUEPRINT.md <<'EOF'
# Release 0.3 — Project Collaboration Platform

Статус: Approved / Architecture Preparation

## Цель релиза

Превратить активированный Project (проект) в единое пространство совместной работы заказчика и исполнителя.

## Бизнес-ценность

Пользователь не должен уходить из SPEC76 в мессенджеры, облачные диски и таблицы после выбора исполнителя. Документы, этапы, уведомления и коммуникации должны оставаться внутри проекта и формировать единую проверяемую историю.

## Состав релиза

- OP-015 Documents Engine (движок документов)
- OP-016 Timeline & Milestones (временная шкала и контрольные точки)
- OP-017 Notifications Engine (движок уведомлений)
- OP-018 Project Chat (чат проекта)

## Пользовательские сценарии

1. Участник проекта создаёт документ и добавляет его версию.
2. Документ связывается с проектом и при необходимости с задачей.
3. Участник видит этапы проекта и ближайшие контрольные точки.
4. Система создаёт уведомления по событиям документов, задач, этапов и чата.
5. Участники обсуждают проект в едином чате.
6. Все существенные действия фиксируются в Project Activity Engine (движке активности проекта).

## Архитектурные ограничения

- Все новые таблицы защищаются RLS (разграничением доступа на уровне строк).
- Клиентский код не использует service_role.
- Activity Engine остаётся единым журналом существенных событий.
- Модули не дублируют данные друг друга без необходимости.
- Каждый OP применяется отдельной миграцией и проверяется независимо.
- Фактические файлы документов хранятся отдельно от метаданных документа.

## Последовательность реализации

OP-015 → OP-016 → OP-017 → OP-018

Архитектура проектируется общим пакетом, реализация выполняется последовательно.
EOF

cat > engineering/releases/0.3/DOMAIN_ROADMAP.md <<'EOF'
# Domain Roadmap — Release 0.3

## Существующее ядро

Customer → Request → RequestAnalysis → Match → Offer → Project → Task → ProjectActivity

## Расширение Release 0.3

Project
- Document
  - DocumentVersion
- Milestone
- Notification
- ProjectMessage

## Ответственность сущностей

### Document
Бизнес-объект документа: тип, название, описание, статус, принадлежность проекту и задаче.

### DocumentVersion
Неизменяемая версия файла или содержимого документа: номер версии, путь хранения, контрольная сумма, автор загрузки.

### Milestone
Контрольная точка проекта со сроком и статусом. Не заменяет Task (задачу), а объединяет задачи вокруг значимого результата.

### Notification
Персональное уведомление участнику о значимом событии. Не является источником истины: источником остаётся доменное событие и ProjectActivity.

### ProjectMessage
Сообщение внутри проекта. Может ссылаться на Document, Task или Milestone, но не хранит их содержимое.

## Жизненные циклы

Document: draft → active → archived

Milestone: planned → in_progress → completed | cancelled

Notification: unread → read | archived

ProjectMessage: active → edited | deleted

## Инварианты

- DocumentVersion не изменяется после создания.
- Milestone принадлежит ровно одному Project.
- Notification принадлежит ровно одному User.
- ProjectMessage доступно только участникам Project.
- Существенные действия публикуют запись в ProjectActivity.
EOF

cat > engineering/releases/0.3/INTEGRATION_MATRIX.md <<'EOF'
# Integration Matrix — Release 0.3

| Модуль | Использует | Публикует события | Потребители |
|---|---|---|---|
| Documents | Project, Task, Storage, User | document_created, document_version_added, document_archived | Activity, Notifications, Chat |
| Timeline | Project, Task | milestone_created, milestone_status_changed, milestone_due | Activity, Notifications |
| Notifications | Activity, User | notification_created, notification_read | UI |
| Project Chat | Project, User, Document, Task, Milestone | message_created, message_edited, message_deleted | Activity, Notifications |

## Правила интеграции

1. ProjectActivity — единый журнал аудируемых событий проекта.
2. Notification создаётся как реакция на событие, но не заменяет его.
3. Chat может ссылаться на другие объекты только по идентификатору.
4. Documents не зависят от Chat и Notifications напрямую.
5. Timeline не изменяет Task автоматически без отдельного подтверждённого правила.
6. Каждый сервис отвечает только за свой bounded context (ограниченный контекст).

## Минимальный каталог событий Release 0.3

- document_created
- document_version_added
- document_archived
- milestone_created
- milestone_status_changed
- notification_created
- notification_read
- message_created
- message_edited
- message_deleted
EOF

cat > engineering/releases/0.3/ARCHITECTURE_IMPACT_ANALYSIS.md <<'EOF'
# Architecture Impact Analysis — Release 0.3

## OP-015 Documents Engine

Затрагивает:
- Domain Model
- Database
- Supabase Storage
- RLS
- Service Layer
- Project UI
- Activity Engine

Основные риски:
- смешение метаданных и бинарных файлов;
- небезопасные Storage policies (политики хранилища);
- отсутствие версионирования;
- доступ к документам вне состава участников проекта.

## OP-016 Timeline & Milestones

Затрагивает:
- Domain Model
- Database
- Project Workspace
- Tasks
- Activity Engine

Основные риски:
- дублирование Task и Milestone;
- неоднозначная логика просрочки;
- ошибки часовых поясов.

## OP-017 Notifications Engine

Затрагивает:
- Database
- Activity Engine
- User UI
- будущие внешние каналы доставки

Основные риски:
- дублирование уведомлений;
- чрезмерный информационный шум;
- утечка информации между участниками.

## OP-018 Project Chat

Затрагивает:
- Database
- Realtime
- Project Workspace
- Activity Engine
- Notifications

Основные риски:
- некорректные RLS-политики;
- отсутствие ограничения размера сообщений;
- редактирование истории без аудита;
- преждевременное добавление файлов в чат вместо Documents Engine.

## Общие архитектурные решения

- Реализация выполняется отдельными OP и отдельными миграциями.
- Для изменения общей событийной модели потребуется ADR.
- Выделение enterprise-core и реорганизация monorepo не входят в Release 0.3.
- AI/OCR/embeddings не входят в MVP Release 0.3, но модель документов должна допускать последующее расширение.
EOF

cat > engineering/releases/0.3/RELEASE_DEFINITION_OF_DONE.md <<'EOF'
# Release Definition of Done — 0.3

Release 0.3 считается завершённым только при выполнении всех условий.

## Функциональность

- OP-015, OP-016, OP-017 и OP-018 завершены.
- Документы создаются, версионируются и архивируются.
- Контрольные точки создаются и меняют статус.
- Уведомления создаются, читаются и не дублируются.
- Чат доступен только участникам проекта.
- Activity Engine фиксирует существенные действия всех четырёх модулей.

## Данные и безопасность

- Все миграции применяются на чистой схеме последовательно.
- Для каждой новой таблицы включён RLS.
- Политики SELECT/INSERT/UPDATE/DELETE проверены по ролям.
- service_role отсутствует в клиентском коде.
- Storage policies проверены отдельно.

## Качество

- ESLint проходит.
- TypeScript проходит.
- Production Build (производственная сборка) проходит.
- git diff --check проходит.
- Нет незадокументированных ручных изменений базы.

## Engineering OS

- Для каждого OP существует инженерный паспорт.
- Session Log обновлён.
- Current Sprint обновлён.
- Traceability Matrix обновлена.
- Technical Debt содержит известные ограничения.

## Демонстрация

Проходит сценарий:

Project → Document → Version → Milestone → Notification → Chat → Activity Feed

Результат демонстрации и ограничения фиксируются в Release Notes (заметках к релизу).
EOF

cat > engineering/releases/0.3/README.md <<'EOF'
# Release 0.3 Architecture Package

Этот каталог является единым архитектурным пакетом Release 0.3 — Project Collaboration Platform.

Состав:
- RELEASE_BLUEPRINT.md
- DOMAIN_ROADMAP.md
- INTEGRATION_MATRIX.md
- ARCHITECTURE_IMPACT_ANALYSIS.md
- RELEASE_DEFINITION_OF_DONE.md

Документы определяют общую архитектуру OP-015…OP-018. Реализация каждого OP выполняется отдельно и не объединяется в одну миграцию.
EOF

cat >> engineering/daily/SESSION_LOG.md <<'EOF'

## 2026-07-13 — Release 0.3 Architecture Sprint

- Подготовлен единый архитектурный пакет Release 0.3.
- Зафиксированы Blueprint, Domain Roadmap, Integration Matrix, Architecture Impact Analysis и Release Definition of Done.
- Установлено правило: OP-015…OP-018 проектируются совместно, но реализуются и проверяются последовательно.
EOF

cat > engineering/sprints/CURRENT_SPRINT.md <<'EOF'
# Current Sprint — Release 0.3 Architecture and Collaboration

## Goal

Спроектировать и последовательно реализовать среду совместной работы проекта: документы, контрольные точки, уведомления и чат.

## Completed

- OP-000 Engineering OS Foundation
- OP-011 Execution Workspace Foundation
- OP-012 Project Execution Workspace
- OP-013 Project Activity Engine
- OP-014 Task Engine
- Release 0.3 Architecture Package

## In Progress

- OP-015 Documents Engine — Engineering Preparation

## Next

- OP-016 Timeline & Milestones
- OP-017 Notifications Engine
- OP-018 Project Chat

## Blockers

Нет подтверждённых блокеров.
EOF

echo "created: engineering/releases/0.3 architecture package"
