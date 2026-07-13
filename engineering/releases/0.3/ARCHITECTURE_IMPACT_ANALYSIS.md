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
