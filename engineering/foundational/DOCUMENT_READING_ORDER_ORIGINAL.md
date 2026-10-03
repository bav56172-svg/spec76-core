# Рекомендуемый порядок чтения документов проекта (оригинал)

- Document ID (идентификатор документа): SPEC76-FOUNDATIONAL-READING-ORDER
- Version (версия): 1.0 (оригинальный текст)
- Status (статус): Historical Source Document — **разрешает конфликт по Конституции, см. ниже**
- Date (дата): без точной даты в тексте; по содержанию — написан позже создания Release 0.4 и `ADR-025` (ссылается на них по точным путям файлов); добавлен в репозиторий 2026-10-03
- Owner (владелец): Platform Owner
- Origin (происхождение): файл `Документы в коком порядке читать.rtf`, обнаружен на `~/Desktop/Спец76/`, никогда ранее не был закоммичен в GitHub

## Разрешает ранее найденный конфликт по Конституции

Этот документ прямо называет точные пути файлов текущего репозитория: `engineering/constitution/PROJECT_CONSTITUTION.md`, `engineering/constitution/SPEC76_DIGITAL_CONSTITUTION.md`, `ADR-024`, `ADR-025`, `Release 0.4`, `C-006_AI_REQUEST_FOUNDATION.md` — все проверены, существуют в репозитории именно по этим путям. В отличие от `ST76-CONST-001` (чистый текст без единой ссылки на файл репозитория), этот документ явно писался позже, когда текущая структура `engineering/` уже существовала.

**Вывод**: `ST76-CONST-001` — более ранний черновик/версия, которая не была продолжена; **текущие `engineering/constitution/PROJECT_CONSTITUTION.md` и `SPEC76_DIGITAL_CONSTITUTION.md` — действующая, предназначенная версия**. Конфликт, зафиксированный в `DECISION_LOG.md` (запись 2026-10-03, "Найдена оригинальная Конституция v2.0.0"), считается разрешённым этим документом.

## Полезность как гайд по онбордингу

Помимо разрешения конфликта, сам документ — готовая, точная карта чтения документации проекта. Имеет смысл не просто архивировать его, а по согласованию с Platform Owner оформить как действующий ориентир (например, `engineering/README.md` или аналог) — см. предложение в ответе.

## Полный текст

Если говорить именно о SPEC76 и связанных проектах (SES-001, ЕЦЭУПО и т.д.), рекомендуется воспринимать документы в таком порядке.

### 1. Конституция проекта — фундамент

Главный документ, определяющий принципы всей платформы:
- `engineering/constitution/PROJECT_CONSTITUTION.md`
- `engineering/constitution/SPEC76_DIGITAL_CONSTITUTION.md`

Из них становятся понятны: цели платформы; роль Platform Owner; принципы Human First; Security by Design; Platform First; Governed Intelligence; правила принятия решений.

### 2. SES-001 — стандарт инженерной работы

`engineering/standards/SES-001_ENGINEERING_EXECUTION_STANDARD.md`

Операционная инструкция, как должна происходить работа: порядок выполнения задач; требования к Git; проверки перед изменениями; Architecture Readiness; порядок применения миграций; правила подготовки команд для Terminal; требования к большим файлам (последняя версия 1.2).

### 3. ADR (Architecture Decision Records)

Начинать стоит с:
- `engineering/adr/ADR-000-engineering-operating-system.md`
- `engineering/adr/ADR-024_PLATFORM_DOMAIN_FOUNDATION.md`
- `engineering/adr/ADR-025_PLATFORM_SOVEREIGNTY_AND_AUTONOMOUS_OPERATIONS.md`

После них становятся понятны: архитектура платформы; Platform Domain; автономная работа; суверенность платформы.

### 4. Release-документы

Затем — релизная документация:
- `engineering/releases/0.4/README.md`
- `engineering/releases/0.4/RELEASE_BLUEPRINT.md`
- `engineering/releases/0.4/CAPABILITY_MAP.md`
- `engineering/releases/0.4/RELEASE_DEFINITION_OF_DONE.md`

Они показывают: что входит в Release; что уже реализовано; что ещё планируется.

### 5. Capability (возможности платформы)

Например, `engineering/capabilities/C-006_AI_REQUEST_FOUNDATION.md`. Capability отвечает на вопрос: что должна уметь платформа?

### 6. Engineering Standards (инженерные стандарты)

Раздел `engineering/standards/`, наиболее важные: `CODING_STANDARD.md`, `DATABASE_STANDARD.md`, `SECURITY_STANDARD.md`, `DEFINITION_OF_READY.md`, `DEFINITION_OF_DONE.md`, `GIT_WORKFLOW.md`.

### 7. Registry (реестры)

Когда устройство проекта уже понятно, удобно пользоваться реестрами из `engineering/registry/`, особенно: `ADR_REGISTRY.md`, `CAPABILITY_REGISTRY.md`, `DOCUMENT_REGISTRY.md`, `RELEASE_REGISTRY.md`. Они работают как оглавление всей инженерной документации.

### Рекомендуемый порядок чтения (итог)

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

Такой порядок позволяет сначала понять философию проекта, затем правила работы, потом архитектуру, и только после этого переходить к реализации конкретных возможностей.
