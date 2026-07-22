# Release Plan

## Release 0.1

Customer to Project Flow — functional foundation completed.

## Release 0.2

Project Execution — completed foundation.

## Release 0.3

Project Collaboration — implementation completed; release evidence still requires preservation of the manual demonstration result and separate RLS verification as recorded in the Release Registry.

## Release 0.4 — Current Release

Trusted Platform Operations (доверенные платформенные операции) — текущий релиз.

Release goal (цель релиза):

- безопасное управление ролями и полномочиями;
- простой пользовательский опыт по ролям;
- управляемые бизнес-процессы;
- аудит действий;
- память подтверждённых решений;
- архитектурная основа управляемых ИИ-операций.

Release sequence (порядок реализации):

1. Identity & Access (идентификация и управление доступом).
2. User Experience (пользовательский опыт).
3. Workflow (бизнес-процессы).
4. Audit (аудит).
5. Knowledge (знания).
6. AI Operations (ИИ-операции).

Current engineering package (текущий инженерный пакет):

- EP-023 Security and Recovery Engineering Package.
- Repository Classification завершена.
- Billing Recovery утверждён в зафиксированных границах.
- AI API Recovery и Service Contract Recovery остаются незавершёнными контурами EP-023.

Release exit criteria (критерии выхода):

- Capability Release 0.4 реализованы в утверждённом порядке;
- роли, RLS и серверные границы доступа подтверждены;
- значимые действия доступны для аудита;
- пользовательская сложность не раскрывает внутреннюю архитектуру;
- Lint, TypeScript, Tests и Production Build проходят;
- миграции и rollback проверены;
- документация и трассируемость синхронизированы;
- решения, требующие Human Approval Boundary, утверждены Platform Owner.
