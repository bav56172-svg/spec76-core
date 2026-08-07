# EP-023 — Migration Execution Plan

| Поле | Значение |
|---|---|
| Version (версия) | 0.1 |
| Status (статус) | Execution Planning |
| Owner (владелец) | Platform Owner |
| Related Release (связанный релиз) | Release 0.4 |
| Related Capability (связанная возможность) | C-006 AI Request Foundation |
| Related ADR | ADR-025 Platform Sovereignty and Autonomous Operations |

---

# Purpose (назначение)

Документ определяет безопасный порядок выполнения EP-023 Supabase migration после получения Platform Owner approval.

Документ не выполняет:

- migration execution;
- production deployment;
- изменение данных;
- включение AI usage tracking.

---

# Execution Preconditions (предварительные условия)

Перед выполнением должны быть подтверждены:

- Platform Owner approval;
- migration review completed;
- RLS verification plan approved;
- rollback strategy confirmed.

Статус:

Required.

---

# Migration Target (цель migration)

Файл:

supabase/migrations/20260802000100_ep023_ai_usage.sql

Назначение:

Создание основы хранения AI usage данных.

---

# Phase 1 — Pre-Execution Check (проверка перед выполнением)

Проверить:

- текущую Git ветку;
- актуальность migration файлов;
- отсутствие незакоммиченных изменений;
- доступ к Supabase project.

Остановка выполнения:

если состояние отличается от ожидаемого.

---

# Phase 2 — Migration Execution (выполнение migration)

Действия:

1. выполнить migration только после approval;
2. сохранить результат выполнения;
3. зафиксировать дату и ответственного.

Запрещено:

- ручное изменение production данных;
- обход migration процесса.

---

# Phase 3 — Verification (проверка результата)

После выполнения проверить:

- таблица public.ai_usage существует;
- constraints применены;
- indexes созданы;
- RLS включён;
- FORCE RLS включён;
- policies созданы;
- grants соответствуют модели безопасности.

---

# Phase 4 — RLS Verification (проверка RLS)

Выполнить:

- собственный project access;
- foreign project isolation;
- cross company isolation;
- client write protection;
- service role access.

Ожидаемый результат:

Все проверки проходят.

---

# Rollback Trigger Conditions (условия отката)

Rollback требуется при:

- ошибке создания таблицы;
- ошибке RLS;
- нарушении security boundary;
- невозможности пройти verification tests.

---

# Rollback Procedure (процедура отката)

Выполнить:

1. остановить дальнейшие изменения;
2. удалить созданные объекты EP-023;
3. проверить восстановление состояния;
4. зафиксировать причину rollback.

---

# Security Boundaries (границы безопасности)

Запрещено:

- использовать client-side write;
- хранить AI provider keys;
- обходить RLS;
- менять существующие domain policies без review.

---

# Business Impact (влияние на бизнес)

Заказчик:

- получает основу контроля AI usage;
- не получает изменения интерфейса на данном этапе.

Исполнитель:

- получает техническую основу для server-side usage operation.

---

# Human Accountability (человеческая ответственность)

ИИ может:

- анализировать результаты;
- помогать выполнять проверки;
- готовить документацию.

ИИ не утверждает:

- production execution;
- финансовые решения;
- юридические решения.

---

# Final Execution Status (итоговый статус)

Текущий статус:

READY FOR EXECUTION AFTER APPROVAL

Следующий этап:

1. получить Platform Owner approval;
2. выполнить migration;
3. выполнить verification;
4. зафиксировать результат.
