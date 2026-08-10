# SPEC76 OS — Master Index (главный индекс)

**Версия:** 1.3
**Статус:** Active (действует)
**Владелец:** Platform Owner (владелец платформы)
**Следующий пересмотр:** при закрытии Release 0.4

## Canonical Namespace (каноническое пространство имён)

Инженерные документы SPEC76 используют полный канонический идентификатор:

```text
SPEC76-<TYPE>-<NUMBER>
```

Поддерживаемые пространства: `SPEC76-EP-*`, `SPEC76-ADR-*`, `SPEC76-SES-*`, `SPEC76-STD-*`, `SPEC76-OP-*`, `SPEC76-C-*`.

Исторические имена файлов сохраняются. В межпроектных ссылках полный канонический идентификатор обязателен. Утверждённые пространства имён ЕЦЭУПО `PLATFORM-*`, `ASVO-*` и `NPB-KUD-*` остаются отдельной системой.

## L1 — Principles (принципы)

- `constitution/SPEC76_DIGITAL_CONSTITUTION.md`
- `VISION.md`
- `adr/`
- `adrs/`

## L2 — Standards (стандарты)

- `standards/`
- `playbook/`
- `security/`
- `ux/`
- `governance/`

## L3 — Operations (операции)

- `releases/`
- `roadmap/` — стратегические продуктовые горизонты; будущие направления не заменяют утверждённые Release и Capability.
- `capabilities/`
- `operations/`
- `packs/` — канонический реестр Engineering Pack находится в `packs/README.md`.
- `packs/EP-021_SPEC76_BUILD_SYSTEM.md` — `SPEC76-EP-021`, Build System (система сборки), завершён.
- `packs/EP-023_SECURITY_RECOVERY.md` — `SPEC76-EP-023`, классификация репозитория и восстановление критических контуров безопасности, в работе.
- `packs/EP-024_PLATFORM_DOMAIN_FOUNDATION.md` — `SPEC76-EP-024`, фундамент платформенного домена, активный пакет текущего спринта.
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
→ standards/SES-001_ENGINEERING_EXECUTION_STANDARD.md (`SPEC76-SES-001`)
→ standards/STD-001_DOCUMENTATION_STANDARD.md (`SPEC76-STD-001`)
→ constitution/PROJECT_CONSTITUTION.md
→ constitution/SPEC76_DIGITAL_CONSTITUTION.md
```

Переписка не является Source of Truth (источником истины). Подтверждённое содержание направляется в существующие ADR, OP, EP, стандарты, журналы решений, Session Log (журнал сессий), Knowledge Base (базу знаний) или Engineering Journal (инженерный журнал).

## Правило актуальности

Каждый существенный документ должен указывать владельца, статус, версию, связанные ADR, Capability (возможности платформы), Release (релиз), канонический идентификатор и дату следующего пересмотра, если эти поля применимы.

## Documentation System (система документации)

- `standards/STD-001_DOCUMENTATION_STANDARD.md` — `SPEC76-STD-001`, главный стандарт документации.
- `standards/SES-001_ENGINEERING_EXECUTION_STANDARD.md` — `SPEC76-SES-001`, стандарт исполнения и преобразования переписки в проверяемый результат.
- `standards/` — обязательные инженерные стандарты.
- `templates/` — утверждённые шаблоны.
- `metadata/` — статусы, версии и метаданные.
- `registry/` — реестры инженерных артефактов.
- `operations/OP-020-documentation-standards.md` — `SPEC76-OP-020`, паспорт OP-020.
