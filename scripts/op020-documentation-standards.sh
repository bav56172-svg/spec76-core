#!/usr/bin/env bash
set -Eeuo pipefail

mkdir -p engineering/standards engineering/templates engineering/metadata engineering/registry engineering/operations

write_doc() {
  local path="$1"
  local id="$2"
  local title="$3"
  local purpose="$4"
  local rules="$5"

  cat > "$path" <<EOF
# ${id} — ${title}

| Поле | Значение |
|---|---|
| Document ID (идентификатор документа) | ${id} |
| Version (версия) | 1.0 |
| Status (статус) | Approved (утверждён) |
| Owner (владелец) | Platform Owner (владелец платформы) |
| Source of Truth (источник истины) | GitHub |
| Related Release (связанный релиз) | Release 0.4 |
| Related Operation (связанная операция) | OP-020 |
| Last Updated (последнее обновление) | 2026-07-15 |
| Next Review (следующий пересмотр) | При изменении инженерного процесса |

## Назначение

${purpose}

## Обязательные правила

${rules}

## Использование человеком и ИИ

Документ обязателен для Platform Owner (владельца платформы), разработчиков и управляемых ИИ-агентов. ИИ может применять правила и предлагать изменения, но изменение утверждённого стандарта подтверждает Platform Owner.

## Критерии актуальности

- содержание соответствует текущему Release (релизу);
- ссылки ведут на существующие артефакты;
- статус, версия и владелец указаны;
- правила не противоречат Конституции SPEC76 OS.
EOF
}

write_doc engineering/standards/STD-001_DOCUMENTATION_STANDARD.md \
  "STD-001" \
  "Documentation Standard (стандарт документации)" \
  "Устанавливает единые требования ко всем инженерным документам SPEC76 OS." \
  "- Каждый документ имеет постоянный идентификатор, версию, статус и владельца.\n- Документ хранится в GitHub и изменяется через Git.\n- Английский технический термин при первом употреблении сопровождается русским переводом.\n- Факты, предположения и рекомендации разделяются.\n- Документ содержит назначение, связи, критерии актуальности и порядок пересмотра."

write_doc engineering/standards/STD-002_MARKDOWN_STANDARD.md \
  "STD-002" \
  "Markdown Standard (стандарт Markdown)" \
  "Определяет единый формат Markdown-документов." \
  "- Один заголовок первого уровня на файл.\n- Заголовки используются последовательно без пропуска уровней.\n- Таблицы применяются только для структурированных сравнений.\n- Команды и пути оформляются блоками кода.\n- Длинные декоративные разделители и эмодзи не используются в нормативных документах."

write_doc engineering/standards/STD-003_README_STANDARD.md \
  "STD-003" \
  "README Standard (стандарт README)" \
  "Определяет структуру входных документов каталогов." \
  "- README объясняет назначение каталога.\n- Содержит владельца, источники истины и навигацию.\n- Перечисляет существующие, а не предполагаемые файлы.\n- Содержит правило добавления новых артефактов."

write_doc engineering/standards/STD-004_ADR_STANDARD.md \
  "STD-004" \
  "ADR Standard (стандарт архитектурных решений)" \
  "Определяет требования к Architecture Decision Record (записи архитектурного решения)." \
  "- ADR содержит контекст, решение, альтернативы и последствия.\n- После утверждения смысл ADR не переписывается; изменение оформляется новым ADR.\n- Статусы: Proposed, Accepted, Superseded, Deprecated.\n- ADR связывается с Release, Capability и Operation."

write_doc engineering/standards/STD-005_RELEASE_STANDARD.md \
  "STD-005" \
  "Release Standard (стандарт релиза)" \
  "Определяет обязательные артефакты и критерии релиза." \
  "- Релиз имеет Blueprint, Scope, Capability Map, Backlog и Definition of Done.\n- Пользовательская ценность формулируется отдельно для заказчика и исполнителя.\n- Безопасность, RLS, миграции и документация проверяются до закрытия.\n- Закрытие подтверждается Release Review и фактическими доказательствами."

write_doc engineering/standards/STD-006_OPERATION_STANDARD.md \
  "STD-006" \
  "Operation Standard (стандарт инженерной операции)" \
  "Определяет жизненный цикл OP (инженерной операции)." \
  "- Одна OP даёт один законченный результат.\n- До реализации проводится Architecture Readiness Check.\n- Обязательны Lint, TypeScript, Production Build и Diff Check.\n- Миграция проверяется отдельно, если затрагивается база данных.\n- Результат фиксируется коммитом и обновлением документации."

write_doc engineering/standards/STD-007_CAPABILITY_STANDARD.md \
  "STD-007" \
  "Capability Standard (стандарт возможности платформы)" \
  "Определяет описание крупной возможности платформы." \
  "- Capability решает измеримую бизнес-проблему.\n- Указывает пользователей, доменные объекты, зависимости и события.\n- Содержит UX-влияние на заказчика и исполнителя.\n- Перечисляет OP, которые её реализуют."

write_doc engineering/standards/STD-008_TRACEABILITY_STANDARD.md \
  "STD-008" \
  "Traceability Standard (стандарт трассируемости)" \
  "Обеспечивает связь требования с архитектурой, реализацией и проверкой." \
  "- Минимальная цепочка: Requirement → Capability → ADR → OP → Code/Migration → Test/Check → Document.\n- Каждая связь использует постоянный идентификатор.\n- Неподтверждённые связи помечаются как предположение.\n- Изменение требования инициирует Impact Analysis (анализ влияния)."

write_doc engineering/standards/STD-009_METADATA_STANDARD.md \
  "STD-009" \
  "Metadata Standard (стандарт метаданных)" \
  "Определяет обязательные метаданные инженерных артефактов." \
  "- Обязательны ID, title, version, status, owner, source of truth и dates.\n- Связи с Release, Capability, ADR и OP указываются при применимости.\n- Пустое поле обозначается Not Applicable, а не удаляется.\n- Метаданные должны быть пригодны для будущей автоматической проверки."

write_doc engineering/standards/STD-010_NAMING_STANDARD.md \
  "STD-010" \
  "Naming Standard (стандарт именования)" \
  "Устанавливает понятные и устойчивые имена файлов и идентификаторов." \
  "- Стандарты: STD-NNN_NAME.md.\n- Шаблоны: TPL-NNN_NAME.md.\n- Операции: OP-NNN-name.md.\n- ADR: ADR-NNN-name.md.\n- Имена файлов используют латиницу, цифры, дефис или подчёркивание.\n- Идентификатор после публикации не переиспользуется."

cat > engineering/templates/TPL-001_DOCUMENT_TEMPLATE.md <<'EOF'
# DOC-NNN — Название документа

| Поле | Значение |
|---|---|
| Document ID (идентификатор документа) | DOC-NNN |
| Version (версия) | 0.1 |
| Status (статус) | Draft (черновик) |
| Owner (владелец) | Platform Owner |
| Source of Truth (источник истины) | GitHub |
| Related Release (связанный релиз) | Not Applicable |
| Related Capability (связанная возможность) | Not Applicable |
| Related ADR (связанное решение) | Not Applicable |
| Related Operation (связанная операция) | Not Applicable |
| Last Updated (последнее обновление) | YYYY-MM-DD |
| Next Review (следующий пересмотр) | YYYY-MM-DD или событие |

## Назначение

## Область действия

## Подтверждённые факты

## Предположения

## Решение или правила

## Связи и трассируемость

## Риски

## Критерии актуальности

## История изменений
EOF

cat > engineering/templates/TPL-002_README_TEMPLATE.md <<'EOF'
# Название раздела

## Назначение

## Владелец

## Источник истины

## Навигация

## Правила добавления материалов

## Связанные разделы
EOF

cat > engineering/templates/TPL-003_ADR_TEMPLATE.md <<'EOF'
# ADR-NNN — Название решения

- Status (статус): Proposed (предложено)
- Date (дата): YYYY-MM-DD
- Owner (владелец): Platform Owner
- Related Release (связанный релиз):
- Related Capability (связанная возможность):

## Контекст

## Решение

## Рассмотренные альтернативы

## Последствия

## Безопасность и RLS

## UX-влияние

## План реализации
EOF

cat > engineering/templates/TPL-004_RELEASE_TEMPLATE.md <<'EOF'
# Release X.Y — Название

## Ценность для пользователей

## Scope (границы)

## Capabilities (возможности)

## Architecture Impact (влияние на архитектуру)

## UX заказчика

## UX исполнителя

## Security and RLS (безопасность и RLS)

## Migrations (миграции)

## Definition of Done (критерии завершения)
EOF

cat > engineering/templates/TPL-005_OPERATION_TEMPLATE.md <<'EOF'
# OP-NNN — Название операции

## Цель

## Architecture Readiness Check (проверка архитектурной готовности)

## Изменяемые артефакты

## Реализация

## Security and RLS (безопасность и RLS)

## UX-влияние

## Проверки

- [ ] Lint
- [ ] TypeScript
- [ ] Production Build
- [ ] Diff Check
- [ ] Migration Check
- [ ] Documentation Update

## Definition of Done (критерии завершения)
EOF

cat > engineering/templates/TPL-006_CAPABILITY_TEMPLATE.md <<'EOF'
# C-NNN — Название возможности

## Бизнес-проблема

## Пользователи

## Пользовательская ценность

## Доменные объекты

## Зависимости

## События

## Operations (инженерные операции)

## Метрики успеха
EOF

cat > engineering/templates/TPL-007_STANDARD_TEMPLATE.md <<'EOF'
# STD-NNN — Название стандарта

## Метаданные

## Назначение

## Обязательные правила

## Исключения

## Проверка соблюдения

## История изменений
EOF

cat > engineering/templates/TPL-008_CHECKLIST_TEMPLATE.md <<'EOF'
# Название проверки

- [ ] Цель определена
- [ ] Источник истины проверен
- [ ] Архитектурные зависимости проверены
- [ ] Безопасность и RLS проверены
- [ ] UX заказчика проверен
- [ ] UX исполнителя проверен
- [ ] Миграции проверены
- [ ] Документация обновлена
- [ ] Критерии завершения выполнены
EOF

cat > engineering/metadata/DOCUMENT_METADATA_STANDARD.md <<'EOF'
# Document Metadata Standard (стандарт метаданных документов)

Обязательные поля: ID, название, версия, статус, владелец, источник истины, связанные артефакты, дата обновления и условие следующего пересмотра.

Метаданные должны быть читаемы человеком и пригодны для последующего автоматического анализа.
EOF

cat > engineering/metadata/DOCUMENT_STATUS_STANDARD.md <<'EOF'
# Document Status Standard (стандарт статусов документов)

Допустимые статусы:

- Draft (черновик);
- In Review (на проверке);
- Approved (утверждён);
- Implemented (реализован);
- Superseded (заменён новым документом);
- Deprecated (устарел);
- Archived (архивирован).

Юридически, финансово, репутационно и безопасностно значимые документы утверждает Platform Owner.
EOF

cat > engineering/metadata/DOCUMENT_VERSIONING_STANDARD.md <<'EOF'
# Document Versioning Standard (стандарт версионирования документов)

Используется формат Major.Minor (основная.вспомогательная версия).

- Minor увеличивается при уточнении без изменения смысла.
- Major увеличивается при изменении обязательных правил или области действия.
- Для ADR смысл принятого решения не переписывается: создаётся новый ADR, а старый получает статус Superseded.
EOF

cat > engineering/registry/STANDARD_REGISTRY.md <<'EOF'
# Standard Registry (реестр стандартов)

| ID | Название | Версия | Статус |
|---|---|---:|---|
| STD-001 | Documentation Standard | 1.0 | Approved |
| STD-002 | Markdown Standard | 1.0 | Approved |
| STD-003 | README Standard | 1.0 | Approved |
| STD-004 | ADR Standard | 1.0 | Approved |
| STD-005 | Release Standard | 1.0 | Approved |
| STD-006 | Operation Standard | 1.0 | Approved |
| STD-007 | Capability Standard | 1.0 | Approved |
| STD-008 | Traceability Standard | 1.0 | Approved |
| STD-009 | Metadata Standard | 1.0 | Approved |
| STD-010 | Naming Standard | 1.0 | Approved |
EOF

cat > engineering/registry/TEMPLATE_REGISTRY.md <<'EOF'
# Template Registry (реестр шаблонов)

| ID | Назначение |
|---|---|
| TPL-001 | Универсальный документ |
| TPL-002 | README |
| TPL-003 | ADR |
| TPL-004 | Release |
| TPL-005 | Operation |
| TPL-006 | Capability |
| TPL-007 | Standard |
| TPL-008 | Checklist |
EOF

cat > engineering/registry/ADR_REGISTRY.md <<'EOF'
# ADR Registry (реестр архитектурных решений)

Источник истины: `engineering/adr/index.md` и фактические ADR-файлы. Реестр не должен содержать решения, наличие которых не подтверждено в GitHub.
EOF

cat > engineering/registry/RELEASE_REGISTRY.md <<'EOF'
# Release Registry (реестр релизов)

| Release | Статус | Источник истины |
|---|---|---|
| 0.3 | Требует сохранения результата ручной демонстрации и отдельной проверки RLS | `engineering/releases/0.3/` |
| 0.4 | In Progress (в работе) | `engineering/releases/0.4/` |
EOF

cat > engineering/registry/CAPABILITY_REGISTRY.md <<'EOF'
# Capability Registry (реестр возможностей)

Источник истины: утверждённые Capability-документы и `engineering/releases/0.4/CAPABILITY_MAP.md`.

Новые записи добавляются только после проверки фактического файла и связи с Release.
EOF

cat > engineering/registry/OPERATION_REGISTRY.md <<'EOF'
# Operation Registry (реестр инженерных операций)

| Operation | Название | Статус |
|---|---|---|
| OP-019 | SPEC76 OS Skeleton | Implemented |
| OP-020 | Documentation Standards | In Progress |
EOF

cat > engineering/registry/DOCUMENT_REGISTRY.md <<'EOF'
# Document Registry (реестр документов)

Полный автоматизированный реестр будет реализован в OP-025 Architecture Traceability (архитектурная трассируемость).

До этого момента источником истины остаётся фактическая структура файлов GitHub. Ручной реестр не должен выдавать непроверенные документы за существующие.
EOF

cat > engineering/operations/OP-020-documentation-standards.md <<'EOF'
# OP-020 — Documentation Standards (стандарты документации)

## Цель

Создать единые стандарты, шаблоны, метаданные и реестры SPEC76 OS.

## Влияние

- бизнес-код: отсутствует;
- база данных: отсутствует;
- заказчик: интерфейс не изменяется;
- исполнитель: интерфейс не изменяется;
- безопасность: секреты и права доступа не затрагиваются.

## Definition of Done (критерии завершения)

- стандарты STD-001…STD-010 созданы;
- шаблоны TPL-001…TPL-008 созданы;
- правила статусов и версий созданы;
- базовые реестры созданы;
- Lint, TypeScript, Production Build и Diff Check проходят;
- изменения зафиксированы в GitHub.
EOF

python3 - <<'PY'
from pathlib import Path

index = Path("engineering/MASTER_INDEX.md")
text = index.read_text(encoding="utf-8")
section = """

## Documentation System (система документации)

- `standards/STD-001_DOCUMENTATION_STANDARD.md` — главный стандарт документации.
- `standards/` — обязательные инженерные стандарты.
- `templates/` — утверждённые шаблоны.
- `metadata/` — статусы, версии и метаданные.
- `registry/` — реестры инженерных артефактов.
- `operations/OP-020-documentation-standards.md` — паспорт OP-020.
"""
if "## Documentation System (система документации)" not in text:
    index.write_text(text.rstrip() + section + "\n", encoding="utf-8")

sprint = Path("engineering/sprints/CURRENT_SPRINT.md")
sprint.write_text("""# Current Sprint — Release 0.4 / Wave 1

## Goal (цель)

Создать управляемый фундамент SPEC76 OS без изменения бизнес-функций и пользовательских интерфейсов.

## Completed (завершено)

- Release 0.4 Architecture Package (архитектурный пакет релиза 0.4).
- OP-019 SPEC76 OS Skeleton (каркас SPEC76 OS).

## In Progress (в работе)

- OP-020 Documentation Standards (стандарты документации).

## Next (далее)

- EP-021 SPEC76 Build System (система сборки SPEC76).
- OP-022 Engineering Workplace (инженерное рабочее место).
- OP-023 Academy Foundation (основа академии).
- OP-024 AI & Knowledge Foundation (основа ИИ и платформы знаний).
- OP-025 Architecture Traceability (архитектурная трассируемость).

## Blockers (блокеры)

Нет подтверждённых блокеров для OP-020.

## Evidence Note (примечание о доказательствах)

Закрытие Release 0.3 требует сохранения результата ручной демонстрации и отдельной проверки политик RLS. OP-020 не изменяет бизнес-код и не блокируется этой работой.
""", encoding="utf-8")

log = Path("engineering/daily/SESSION_LOG.md")
entry = """

## 2026-07-15 — OP-020 Documentation Standards

- Начата реализация единой системы стандартов документации SPEC76 OS.
- Добавлены стандарты, шаблоны, метаданные и базовые реестры.
- Пользовательские интерфейсы, бизнес-код и база данных не изменялись.
"""
current = log.read_text(encoding="utf-8")
if "## 2026-07-15 — OP-020 Documentation Standards" not in current:
    log.write_text(current.rstrip() + entry + "\n", encoding="utf-8")
PY

echo "OP-020 Documentation Standards files created"
