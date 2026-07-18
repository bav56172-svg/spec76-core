# SPEC76 OS — Master Index (главный индекс)

**Версия:** 1.1  
**Статус:** Active (действует)  
**Владелец:** Platform Owner (владелец платформы)  
**Следующий пересмотр:** при закрытии Release 0.4

## L1 — Principles (принципы)

- `constitution/SPEC76_DIGITAL_CONSTITUTION.md`
- `VISION.md`
- `adr/`

## L2 — Standards (стандарты)

- `standards/`
- `playbook/`
- `security/`
- `ux/`
- `governance/`

## L3 — Operations (операции)

- `releases/`
- `capabilities/`
- `operations/`
- `sprints/`
- `daily/`

## L4 — Experience (опыт)

- `knowledge/`
- `knowledge-platform/`
- `journal/`
- `academy/`

## Рабочее окружение

- `workplace/`
- `onboarding/`
- `templates/`

## ИИ и управляемые знания

- `../AGENTS.md` — единая точка входа и обязательные правила работы управляемых ИИ-агентов.
- `ai/`
- `knowledge-platform/`

Нормативная цепочка работы ИИ:

```text
AGENTS.md
→ standards/SES-001_ENGINEERING_EXECUTION_STANDARD.md
→ standards/STD-001_DOCUMENTATION_STANDARD.md
→ constitution/PROJECT_CONSTITUTION.md
→ constitution/SPEC76_DIGITAL_CONSTITUTION.md
```

Переписка не является Source of Truth (источником истины). Подтверждённое содержание направляется в существующие ADR, OP, EP, стандарты, журналы решений, Session Log (журнал сессий), Knowledge Base (базу знаний) или Engineering Journal (инженерный журнал).

## Правило актуальности

Каждый существенный документ должен указывать владельца, статус, версию, связанные ADR, Capability (возможности платформы), Release (релиз) и дату следующего пересмотра.

## Documentation System (система документации)

- `standards/STD-001_DOCUMENTATION_STANDARD.md` — главный стандарт документации.
- `standards/SES-001_ENGINEERING_EXECUTION_STANDARD.md` — стандарт исполнения и преобразования переписки в проверяемый результат.
- `standards/` — обязательные инженерные стандарты.
- `templates/` — утверждённые шаблоны.
- `metadata/` — статусы, версии и метаданные.
- `registry/` — реестры инженерных артефактов.
- `operations/OP-020-documentation-standards.md` — паспорт OP-020.