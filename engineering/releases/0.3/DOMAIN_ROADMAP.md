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
