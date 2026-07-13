# OP-014 — Task Engine

## Status

Prepared.

## Goal

Создать рабочий контур задач проекта с хранением в PostgreSQL, RLS, приоритетами, сроками и автоматической регистрацией событий в Project Activity Engine.

## Scope

- таблица `tasks`;
- RLS для участников проекта;
- статусы `todo`, `in_progress`, `review`, `done`, `cancelled`;
- приоритеты `low`, `normal`, `high`, `urgent`;
- сроки и назначение исполнителя;
- сервисный слой;
- Kanban UI (интерфейс доски задач);
- интеграция с `project_activities`.

## Definition of Done

- миграция применена;
- создание задачи работает;
- смена статуса работает;
- события появляются в `project_activities`;
- Lint, TypeScript и Build проходят;
- изменения зафиксированы в Git.
