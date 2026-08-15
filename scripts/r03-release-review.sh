#!/usr/bin/env bash
set -Eeuo pipefail

mkdir -p engineering/releases/0.3

required_files=(
  "engineering/operations/OP-015-documents-engine.md"
  "engineering/operations/OP-016-timeline-milestones.md"
  "engineering/operations/OP-017-notifications-engine.md"
  "engineering/operations/OP-018-project-communication-platform.md"
  "database/migrations/20260713_008_create_documents.sql"
  "database/migrations/20260714_009_create_project_timeline.sql"
  "database/migrations/20260714_010_create_notifications.sql"
  "database/migrations/20260714_011_create_project_communication.sql"
  "app/projects/[id]/docs/page.tsx"
  "app/projects/[id]/timeline/page.tsx"
  "app/projects/[id]/notifications/page.tsx"
  "app/projects/[id]/communication/page.tsx"
)

missing=0
for file in "${required_files[@]}"; do
  if [[ ! -f "$file" ]]; then
    echo "MISSING: $file"
    missing=1
  fi
done

if [[ "$missing" -ne 0 ]]; then
  echo "Release 0.3 review stopped: required artifacts are missing."
  exit 1
fi

if grep -R --line-number --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.git \
  --exclude='*.md' --exclude='*.sql' 'service_role' app services lib types 2>/dev/null; then
  echo "Release 0.3 review stopped: service_role found in client/application code."
  exit 1
fi

for migration in \
  database/migrations/20260713_008_create_documents.sql \
  database/migrations/20260714_009_create_project_timeline.sql \
  database/migrations/20260714_010_create_notifications.sql \
  database/migrations/20260714_011_create_project_communication.sql
do
  if ! grep -q "enable row level security" "$migration"; then
    echo "Release 0.3 review stopped: RLS declaration missing in $migration"
    exit 1
  fi
done

cat > engineering/releases/0.3/RELEASE_REVIEW.md <<'EOF'
# Release Review 0.3 — Project Collaboration

**Статус:** Verification in progress (проверка выполняется)

## Область обзора

Release 0.3 объединяет Capability C-001 Project Collaboration (возможность платформы «Совместная работа над проектом»):

- OP-015 Documents Engine (движок документов);
- OP-016 Timeline & Milestones (временная шкала и контрольные этапы);
- OP-017 Notifications Engine (движок уведомлений);
- OP-018 Project Communication Platform (платформа коммуникаций проекта).

## Архитектурный результат

Сформировано единое рабочее пространство проекта:

Project → Tasks → Documents → Timeline → Milestones → Activity → Notifications → Communication.

Модули используют Project (проект) как общий контекст, Activity Engine (движок активности) как журнал существенных действий и RLS (разграничение доступа на уровне строк) как основной механизм защиты данных.

## Подтверждённые автоматические проверки

- обязательные инженерные паспорта присутствуют;
- миграции Release 0.3 присутствуют;
- страницы четырёх модулей присутствуют;
- в прикладном коде не найден `service_role`;
- в каждой миграции Release 0.3 объявлено включение RLS;
- ESLint (статический анализ), TypeScript (проверка типов), Production Build (производственная сборка) и Diff Check (проверка различий) выполняются при применении пакета обзора.

## Проверки, требующие ручного подтверждения

- создание документа, версии и архивирование;
- создание временной шкалы и завершение контрольного этапа;
- создание и прочтение уведомления без дублирования;
- доступ к коммуникациям только участникам проекта;
- появление существенных действий в Activity Feed (ленте активности);
- корректность политик SELECT/INSERT/UPDATE/DELETE для разных ролей;
- последовательное применение миграций на чистой схеме;
- политики Supabase Storage (хранилища Supabase), когда будет включена реальная загрузка файлов.

## Предварительные ограничения

- автоматизированные интеграционные тесты базы данных пока не подтверждены;
- проверка RLS по нескольким тестовым пользователям выполняется вручную;
- каналы уведомлений пока ограничены In-App (внутри приложения);
- Communication Platform (платформа коммуникаций) реализует базовый текстовый обмен без Realtime (обновлений в реальном времени);
- файловые вложения представлены архитектурной моделью, но полный цикл загрузки через Storage требует отдельной проверки.

## Решение о закрытии

Release 0.3 закрывается только после прохождения `DEMO_CHECKLIST.md` и фиксации результата в `RELEASE_NOTES.md`.
EOF

cat > engineering/releases/0.3/DEMO_CHECKLIST.md <<'EOF'
# Demo Checklist — Release 0.3

**Demo (демонстрация)** — проверка полного пользовательского сценария на реальных данных.

## Подготовка

- [ ] Пользователь авторизован.
- [ ] Существует доступный пользователю проект.
- [ ] В проекте определены заказчик и исполнитель.

## Documents Engine (движок документов)

- [ ] Открывается `/projects/<id>/docs`.
- [ ] Создаётся документ.
- [ ] Создаётся версия документа либо подтверждается готовность модели версий.
- [ ] Документ архивируется и восстанавливается.
- [ ] Действия отражаются в Activity Feed (ленте активности).

## Timeline & Milestones (временная шкала и контрольные этапы)

- [ ] Открывается `/projects/<id>/timeline`.
- [ ] Создаётся этап временной шкалы.
- [ ] Создаётся контрольный этап.
- [ ] Контрольный этап переводится в завершённое состояние.
- [ ] Действия отражаются в Activity Feed.

## Notifications Engine (движок уведомлений)

- [ ] Открывается `/projects/<id>/notifications`.
- [ ] Событие другого участника создаёт уведомление.
- [ ] Одно событие не создаёт дублирующиеся уведомления.
- [ ] Уведомление отмечается прочитанным.
- [ ] Все уведомления проекта отмечаются прочитанными.

## Project Communication Platform (платформа коммуникаций проекта)

- [ ] Открывается `/projects/<id>/communication`.
- [ ] Создаётся или открывается диалог.
- [ ] Участник отправляет сообщение.
- [ ] Сообщение отражается в Activity Feed.
- [ ] Другой участник получает уведомление.
- [ ] Пользователь без доступа к проекту не видит диалог и сообщения.

## Итоговый сценарий

- [ ] Project → Document → Version → Milestone → Notification → Conversation → Message → Activity Feed.
- [ ] В консоли браузера нет критических ошибок.
- [ ] После обновления страницы данные сохраняются.
- [ ] Результаты и ограничения перенесены в `RELEASE_NOTES.md`.
EOF

cat > engineering/releases/0.3/RELEASE_NOTES.md <<'EOF'
# Release Notes 0.3 — Project Collaboration

**Статус:** Draft (черновик до завершения демонстрации)

## Что добавлено

- Documents Engine (движок документов): метаданные документов, версии, архивирование и восстановление.
- Timeline & Milestones (временная шкала и контрольные этапы): планирование этапов и фиксация ключевых результатов.
- Notifications Engine (движок уведомлений): внутренние уведомления из событий Activity Engine.
- Project Communication Platform (платформа коммуникаций проекта): диалоги, участники, сообщения и модель вложений.
- Engineering Playbook (Инженерный свод правил): практические правила разработки проекта.

## Архитектурные решения

- Release → Capability → OP (релиз → возможность платформы → инженерная операция).
- Platform First (сначала платформа).
- Event-Driven Architecture (событийно-ориентированная архитектура).
- Bilingual Engineering (двуязычная инженерная среда).
- GitHub, Engineering OS и Supabase используются как разделённые источники истины для кода, решений и данных.

## Известные ограничения

- Realtime (обновления в реальном времени) для сообщений ещё не включён.
- Email, Push, Telegram и MAX как каналы уведомлений ещё не реализованы.
- Полный файловый Upload Flow (поток загрузки файлов) через Supabase Storage требует следующего этапа.
- Автоматизированные RLS-тесты по ролям ещё не внедрены.
- Итоговый статус релиза будет изменён на Released (выпущен) после прохождения демонстрационного чек-листа.
EOF

cat > engineering/sprints/CURRENT_SPRINT.md <<'EOF'
# Current Sprint — Release 0.3 Review

## Goal (цель)

Проверить и официально закрыть Release 0.3 Project Collaboration (релиз 0.3 «Совместная работа над проектом»).

## Completed (завершено)

- OP-000 Engineering OS Foundation.
- OP-011 Execution Workspace Foundation.
- OP-012 Project Execution Workspace.
- OP-013 Project Activity Engine.
- OP-014 Task Engine.
- OP-015 Documents Engine.
- OP-016 Timeline & Milestones.
- OP-017 Notifications Engine.
- OP-018 Project Communication Platform.

## In Progress (в работе)

- Release Review 0.3 (обзор релиза 0.3).
- Demo Checklist (демонстрационный чек-лист).
- Security Review (обзор безопасности) политик RLS.

## Next (далее)

- Зафиксировать Release Notes (заметки к релизу).
- Закрыть Capability C-001.
- Спроектировать Release 0.4.

## Blockers (блокеры)

Нет подтверждённых блокеров. До закрытия релиза требуется ручная демонстрация полного сценария.
EOF

cat >> engineering/daily/SESSION_LOG.md <<'EOF'

## 2026-07-14 — Release Review 0.3

- Запущен Release Review 0.3 (обзор релиза 0.3).
- Подготовлены Release Review, Demo Checklist и Release Notes.
- Выполняется автоматическая проверка обязательных артефактов, RLS и отсутствия service_role в прикладном коде.
- Следующее действие: пройти демонстрационный сценарий и зафиксировать итоговый статус релиза.
EOF

echo "Release 0.3 review package created"
