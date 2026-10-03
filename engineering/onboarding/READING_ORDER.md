# Рекомендуемый порядок чтения документации SPEC76

- Document ID (идентификатор документа): SPEC76-ONBOARDING-READING-ORDER
- Version (версия): 1.0
- Status (статус): Active (действует)
- Owner (владелец): Platform Owner
- Related (связанный документ): `engineering/foundational/DOCUMENT_READING_ORDER_ORIGINAL.md` — исходный материал из переписки с ChatGPT, адаптирован здесь как действующий онбординг-гайд

Эта страница закрывает пункт "План наполнения" из `engineering/onboarding/README.md` — отвечает на вопрос "с чего начать", без устных договорённостей.

## 1. Конституция проекта — фундамент

Главный документ, определяющий принципы всей платформы:
- [`../constitution/PROJECT_CONSTITUTION.md`](../constitution/PROJECT_CONSTITUTION.md)
- [`../constitution/SPEC76_DIGITAL_CONSTITUTION.md`](../constitution/SPEC76_DIGITAL_CONSTITUTION.md)

Из них становится понятно: цели платформы; роль Platform Owner; принципы Human First, Security by Design, Platform First, Governed Intelligence; правила принятия решений.

## 2. SES-001 — стандарт инженерной работы

[`../standards/SES-001_ENGINEERING_EXECUTION_STANDARD.md`](../standards/SES-001_ENGINEERING_EXECUTION_STANDARD.md)

Операционная инструкция, как должна происходить работа: порядок выполнения задач; требования к Git; проверки перед изменениями; Architecture Readiness; порядок применения миграций; правила подготовки команд для Terminal; требования к большим файлам.

## 3. ADR (Architecture Decision Records)

Начинать стоит с:
- [`../adr/ADR-000-engineering-operating-system.md`](../adr/ADR-000-engineering-operating-system.md)
- [`../adr/ADR-024_PLATFORM_DOMAIN_FOUNDATION.md`](../adr/ADR-024_PLATFORM_DOMAIN_FOUNDATION.md)
- [`../adr/ADR-025_PLATFORM_SOVEREIGNTY_AND_AUTONOMOUS_OPERATIONS.md`](../adr/ADR-025_PLATFORM_SOVEREIGNTY_AND_AUTONOMOUS_OPERATIONS.md)

После них становится понятна архитектура платформы, Platform Domain, модель автономных ИИ-операций и суверенность платформы. Полный список — в [`../registry/ADR_REGISTRY.md`](../registry/ADR_REGISTRY.md).

## 4. Release-документы

Затем — релизная документация текущего релиза:
- [`../releases/0.4/README.md`](../releases/0.4/README.md)
- [`../releases/0.4/RELEASE_BLUEPRINT.md`](../releases/0.4/RELEASE_BLUEPRINT.md)
- [`../releases/0.4/CAPABILITY_MAP.md`](../releases/0.4/CAPABILITY_MAP.md)
- [`../releases/0.4/RELEASE_DEFINITION_OF_DONE.md`](../releases/0.4/RELEASE_DEFINITION_OF_DONE.md)

Они показывают, что входит в релиз, что уже реализовано, что ещё планируется.

## 5. Capability (возможности платформы)

Например, [`../capabilities/C-006_AI_REQUEST_FOUNDATION.md`](../capabilities/C-006_AI_REQUEST_FOUNDATION.md). Capability отвечает на вопрос: что должна уметь платформа? Полный список — в [`../registry/CAPABILITY_REGISTRY.md`](../registry/CAPABILITY_REGISTRY.md).

## 6. Engineering Standards (инженерные стандарты)

Раздел [`../standards/`](../standards/), наиболее важные: `CODING_STANDARD.md`, `DATABASE_STANDARD.md`, `SECURITY_STANDARD.md`, `DEFINITION_OF_READY.md`, `DEFINITION_OF_DONE.md`, `GIT_WORKFLOW.md`.

## 7. Registry (реестры)

Когда устройство проекта уже понятно, дальше удобно пользоваться реестрами из [`../registry/`](../registry/) — они работают как оглавление всей инженерной документации:
- [`ADR_REGISTRY.md`](../registry/ADR_REGISTRY.md)
- [`CAPABILITY_REGISTRY.md`](../registry/CAPABILITY_REGISTRY.md)
- [`DOCUMENT_REGISTRY.md`](../registry/DOCUMENT_REGISTRY.md)
- [`RELEASE_REGISTRY.md`](../registry/RELEASE_REGISTRY.md)
- [`OPERATION_REGISTRY.md`](../registry/OPERATION_REGISTRY.md)

## 8. Текущее состояние работы

После общей карты — куда смотреть за актуальным статусом:
- [`../sprints/CURRENT_SPRINT.md`](../sprints/CURRENT_SPRINT.md) — что сделано, что в работе, какие блокеры.
- [`../decisions/DECISION_LOG.md`](../decisions/DECISION_LOG.md) — журнал решений Platform Owner, в хронологическом порядке.
- [`../roadmap/PROJECT_CRITICAL_ASSESSMENT_AND_PLAN.md`](../roadmap/PROJECT_CRITICAL_ASSESSMENT_AND_PLAN.md) — критическая оценка проекта и поэтапный план.
- [`../foundational/`](../foundational/) — исходные документы (ТЗ, PRD, Конституция v2.0.0 и др.), восстановленные из переписки с ChatGPT в октябре 2026; статус Historical Source Document, часть — Superseded, см. пометки в каждом файле.

## Итоговый порядок

1. `PROJECT_CONSTITUTION.md`
2. `SPEC76_DIGITAL_CONSTITUTION.md`
3. `SES-001_ENGINEERING_EXECUTION_STANDARD.md`
4. `ADR-000`
5. `ADR-024`
6. `ADR-025`
7. Release 0.4
8. `C-006_AI_REQUEST_FOUNDATION.md`
9. `engineering/standards/*`
10. `engineering/registry/*`
11. `CURRENT_SPRINT.md` + `DECISION_LOG.md` (актуальное состояние)

Такой порядок сначала даёт понять философию проекта, затем правила работы, потом архитектуру, и только после этого — реализацию конкретных возможностей и текущий статус.
