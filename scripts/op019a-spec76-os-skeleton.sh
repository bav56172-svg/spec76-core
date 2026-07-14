#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(pwd)"

required=(package.json engineering scripts)
for path in "${required[@]}"; do
  if [[ ! -e "$ROOT/$path" ]]; then
    echo "Ошибка: команда должна выполняться из корня spec76-core; отсутствует $path" >&2
    exit 1
  fi
done

mkdir -p \
  engineering/workplace \
  engineering/onboarding \
  engineering/academy \
  engineering/governance \
  engineering/metrics \
  engineering/journal \
  engineering/security \
  engineering/templates \
  engineering/capabilities \
  engineering/architecture \
  scripts/ap001

cat > engineering/README.md <<'EOF'
# SPEC76 OS — инженерный портал

**Версия:** 1.0  
**Статус:** Active (действует)  
**Владелец:** Platform Owner (владелец платформы)  
**Дата основания:** 15.07.2026

SPEC76 OS (инженерная операционная система SPEC76) объединяет архитектуру, стандарты, процессы, знания и правила работы человека и ИИ.

## Главный принцип

Сложность находится внутри платформы. Заказчик и исполнитель работают с простым и понятным интерфейсом.

## Навигация

- [MASTER_INDEX.md](MASTER_INDEX.md) — единый индекс инженерной системы.
- [VISION.md](VISION.md) — долгосрочное видение.
- [HISTORY.md](HISTORY.md) — архитектурные вехи.
- [constitution/](constitution/) — конституционные принципы.
- [architecture/](architecture/) — архитектурные модели и обзоры.
- [adr/](adr/) — Architecture Decision Record (запись архитектурного решения).
- [releases/](releases/) — архитектура и результаты релизов.
- [capabilities/](capabilities/) — Capability (возможности платформы).
- [operations/](operations/) — OP (инженерные операции).
- [standards/](standards/) — обязательные инженерные стандарты.
- [playbook/](playbook/) — рабочие регламенты.
- [workplace/](workplace/) — паспорт инженерного рабочего места.
- [onboarding/](onboarding/) — Onboarding (введение в проект).
- [academy/](academy/) — обучение на материалах SPEC76.
- [ai/](ai/) — AI Operations (ИИ-операции) и Agent Cards (паспорта агентов).
- [knowledge-platform/](knowledge-platform/) — управляемая платформа знаний.
- [ux/](ux/) — пользовательский опыт заказчика и исполнителя.
- [security/](security/) — безопасность и контроль доступа.
- [governance/](governance/) — Governance (управление платформой).
- [metrics/](metrics/) — показатели качества, безопасности и UX.
- [journal/](journal/) — уроки, ошибки и развитие архитектуры.
- [templates/](templates/) — унифицированные шаблоны.
- [daily/](daily/) — журналы рабочих сессий.
- [sprints/](sprints/) — текущий спринт и планы поставки.

## Источники истины

- GitHub — код и инженерные документы.
- Supabase — данные, схема и политики RLS (разграничения доступа на уровне строк).
- Утверждённые ADR — архитектурные решения.
- Чат — рабочая среда обсуждения, но не единственное хранилище знаний.

## Обязательный цикл изменения

Architecture Readiness Check (проверка архитектурной готовности) → Implementation (реализация) → Lint (статический анализ) → TypeScript (проверка типов) → Production Build (производственная сборка) → Diff Check (проверка различий) → Migration Check (проверка миграций) → Git Commit (фиксация изменений) → Documentation Update (обновление документации).
EOF

cat > engineering/MASTER_INDEX.md <<'EOF'
# SPEC76 OS — Master Index (главный индекс)

**Версия:** 1.0  
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

- `ai/`
- `knowledge-platform/`

## Правило актуальности

Каждый существенный документ должен указывать владельца, статус, версию, связанные ADR, Capability (возможности платформы), Release (релиз) и дату следующего пересмотра.
EOF

cat > engineering/VISION.md <<'EOF'
# SPEC76 OS — Vision (видение)

**Версия:** 1.0  
**Статус:** Approved (утверждено)  
**Владелец:** Platform Owner (владелец платформы)

## Зачем существует SPEC76

SPEC76 помогает обычному заказчику быстро найти надёжного исполнителя спецтехники, а исполнителю — получать подходящие заказы без сложного интерфейса и лишней административной нагрузки.

## Горизонт 5–10 лет

SPEC76 развивается как масштабируемая цифровая платформа с простым пользовательским интерфейсом, управляемой автоматизацией, прозрачным аудитом и специализированными ИИ-агентами под окончательным контролем человека.

## Неприкосновенные принципы

- Human First (человек прежде всего).
- Invisible Complexity (невидимая сложность).
- Security by Design (безопасность по проекту).
- Platform First (сначала платформа).
- Governed Intelligence (управляемый интеллект).
- Human Accountability (ответственность человека).
- GitHub является источником истины для кода и инженерных документов.
- Supabase является источником истины для данных.
EOF

cat > engineering/HISTORY.md <<'EOF'
# SPEC76 OS — History (история)

## 15.07.2026 — Birth of SPEC76 OS (рождение SPEC76 OS)

**Тип:** Architecture Milestone (архитектурная веха)  
**Статус:** Approved (утверждено)

Принято решение рассматривать архитектуру, инженерные стандарты, документацию, знания, процессы, пользовательский опыт и правила работы ИИ как единую инженерную операционную систему проекта.

Дата 15 июля ежегодно используется как внутренний Architecture Day (день архитектуры) для пересмотра принципов, ADR, архитектурного долга, дорожной карты и накопленных знаний.
EOF

cat > engineering/workplace/README.md <<'EOF'
# Workplace (инженерное рабочее место)

Раздел содержит воспроизводимые инструкции настройки macOS, Terminal (терминала), Git, GitHub, Node.js, npm, редактора кода, Supabase, ChatGPT, резервного копирования и базовой безопасности.

## Владелец

Platform Owner (владелец платформы).

## План наполнения

- `WORKPLACE_SETUP.md`
- `CHATGPT_SETUP.md`
- `GITHUB_SETUP.md`
- `SUPABASE_SETUP.md`
- `TERMINAL_SETUP.md`
- `MACOS_SETUP.md`
- `SECURITY_SETUP.md`
- `BACKUP_SETUP.md`
- `CHECKLIST.md`
EOF

cat > engineering/onboarding/README.md <<'EOF'
# Onboarding (введение в проект)

Раздел обеспечивает быстрый и безопасный вход нового человека или ИИ-агента в SPEC76.

## Цель

Новый участник должен понять продукт, архитектуру, источники истины и рабочий процесс без устных договорённостей.

## План наполнения

Первый день, рабочее место, ChatGPT, GitHub, Supabase, архитектура, Release Process (процесс релиза), правила работы, ИИ-организация, Knowledge Platform (платформа знаний) и Definition of Done (критерии завершения).
EOF

cat > engineering/academy/README.md <<'EOF'
# Academy (инженерная академия)

Практическое обучение владельца платформы и будущих участников на реальных примерах SPEC76.

## Темы

Git, GitHub, Terminal (терминал), Node.js, Next.js, TypeScript, Supabase, SQL, архитектура, безопасность, ИИ, Release Management (управление релизами) и роль Platform Owner (владельца платформы).
EOF

cat > engineering/governance/README.md <<'EOF'
# Governance (управление платформой)

Раздел описывает полномочия Platform Owner (владельца платформы), управление изменениями, релизами, безопасностью, ИИ и архитектурными решениями.

Юридически, финансово, репутационно и безопасностно значимые решения окончательно утверждает человек.
EOF

cat > engineering/metrics/README.md <<'EOF'
# Metrics (показатели)

Раздел определяет измеримые показатели качества платформы.

## Направления

- Quality (качество кода и поставки).
- Security (безопасность).
- UX (пользовательский опыт).
- Architecture (архитектурная целостность).
- AI (качество рекомендаций ИИ).
- Platform (надёжность платформы).
EOF

cat > engineering/journal/README.md <<'EOF'
# Engineering Journal (инженерный журнал)

Раздел хранит Lessons Learned (извлечённые уроки), ошибки, лучшие практики и историю эволюции архитектуры.

Подтверждённый опыт должен становиться управляемым знанием, а не оставаться только в переписке.
EOF

cat > engineering/security/README.md <<'EOF'
# Security (безопасность)

Раздел объединяет модель угроз, правила доступа, RLS (разграничение доступа на уровне строк), управление секретами, аудит и реагирование на инциденты.

Безопасность проектируется до реализации, а не добавляется после неё.
EOF

cat > engineering/templates/README.md <<'EOF'
# Templates (шаблоны)

Единые шаблоны инженерных документов обеспечивают воспроизводимость, трассируемость и понятность для человека и ИИ.

## Минимальные метаданные документа

Название, версия, статус, владелец, дата обновления, связанные ADR, Capability (возможности платформы), Release (релиз), источник истины и следующий пересмотр.
EOF

cat > engineering/capabilities/README.md <<'EOF'
# Capabilities (возможности платформы)

Capability (возможность платформы) описывает устойчивую бизнес- или платформенную способность, которая реализуется одной или несколькими OP (инженерными операциями).

Каждая Capability должна описывать ценность, пользователей, зависимости, данные, события, безопасность, UX и критерии завершения.
EOF

cat > engineering/architecture/README.md <<'EOF'
# Architecture (архитектура)

Раздел содержит целевую архитектуру, модели уровней Platform Core (ядра платформы), Product Layer (уровня продукта), Organization Layer (организационного уровня), интеграционные схемы и Architecture Reviews (архитектурные обзоры).
EOF

cat > scripts/ap001/README.md <<'EOF'
# AP-001 scripts (скрипты архитектурного пакета AP-001)

Модульные скрипты AP-001 будут добавляться по мере выполнения OP-019A…OP-019D. Каждый модуль должен иметь одну ответственность и запускаться через проверяемый главный сценарий.
EOF

cat > engineering/sprints/CURRENT_SPRINT.md <<'EOF'
# Current Sprint — Release 0.4 / AP-001

## Goal (цель)

Создать фундамент SPEC76 OS (инженерной операционной системы SPEC76) без изменения бизнес-функций и пользовательских интерфейсов.

## Completed (завершено)

- Release 0.3 Project Collaboration (совместная работа над проектом): OP-015…OP-018 реализованы и миграции применены.
- Release 0.4 Architecture Package (архитектурный пакет релиза 0.4) подготовлен.
- 15.07.2026 утверждена как дата рождения SPEC76 OS.

## In Progress (в работе)

- AP-001 SPEC76 OS Foundation (основа SPEC76 OS).
- OP-019A SPEC76 OS Skeleton (каркас SPEC76 OS).

## Next (далее)

- OP-019B Documentation Standards (стандарты документации).
- OP-019C Workplace & Onboarding (рабочее место и введение в проект).
- OP-019D AI & Knowledge Foundation (основа ИИ и платформы знаний).

## Blockers (блокеры)

Нет подтверждённых блокеров.

## Evidence Note (примечание о доказательствах)

Полное закрытие Release 0.3 требует хранения фактического результата ручного Demo (демонстрационного) сценария и отдельной проверки политик RLS. Архитектурная работа AP-001 не изменяет бизнес-код и не блокируется этим документированием.
EOF

cat >> engineering/daily/SESSION_LOG.md <<'EOF'

## 2026-07-15 — OP-019A SPEC76 OS Skeleton

- Зафиксирована дата рождения SPEC76 OS: 15.07.2026.
- Создан главный инженерный портал и Master Index (главный индекс).
- Созданы Vision (видение), History (история) и базовые разделы SPEC76 OS.
- Бизнес-код, пользовательские интерфейсы и база данных не изменялись.
- Следующий этап: OP-019B Documentation Standards (стандарты документации).
EOF

echo "OP-019A SPEC76 OS Skeleton files created"
