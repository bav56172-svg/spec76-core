# OP-018 — Project Communication Platform (Платформа коммуникаций проекта)

## Status (статус)

Implementation (реализация).

## Goal (цель)

Завершить Capability C-001 Project Collaboration (возможность совместной работы над проектом), добавив диалоги и сообщения внутри проекта.

## Scope (состав)

- Conversation (диалог).
- Participant (участник).
- Message (сообщение).
- Message Attachment (вложение сообщения).
- RLS — Row-Level Security (разграничение доступа на уровне строк).
- Activity и Notification integration (интеграция с активностью и уведомлениями).

## Definition of Done (критерии завершения)

- Миграция применена в Supabase.
- Созданы четыре таблицы коммуникаций.
- Пользователь может создать диалог и отправить сообщение.
- События `conversation_created` и `message_created` попадают в `project_activities`.
- Уведомления создаются существующим Notifications Engine (движком уведомлений).
- ESLint, TypeScript и Build проходят успешно.
