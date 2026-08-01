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
