# EP-023 — AI Usage RLS Test Plan

| Поле | Значение |
|---|---|
| Version (версия) | 0.1 |
| Status (статус) | Architecture Design |
| Owner (владелец) | Platform Owner |
| Related Release (связанный релиз) | Release 0.4 |
| Related Capability (связанная возможность) | C-006 AI Request Foundation |
| Related ADR | ADR-025 Platform Sovereignty and Autonomous Operations |
| Related Document | EP-023 AI Usage Schema Design |
| Source of Truth (источник истины) | GitHub для кода и документов; Supabase для данных |

---

# Purpose (назначение)

Документ определяет план проверки RLS (Row Level Security — безопасность на уровне строк) для будущей сущности `ai_usage`.

Документ не изменяет Supabase schema (схему Supabase).

---

# Confirmed Context (подтверждённый контекст)

Подтверждено:

- Release 0.4 активен;
- C-006 AI Request Foundation утверждена;
- ADR-025 утверждён;
- EP-023 AI Usage Schema Design создан;
- таблица `ai_usage` отсутствует;
- текущая модель доступа основана на EP-024.

Используемые сущности:

- profiles;
- companies;
- company_members;
- projects.

---

# RLS Test Objectives (цели тестирования)

Проверить:

- изоляцию данных между компаниями;
- связь AI Usage с проектом;
- контроль доступа через членство;
- запрет подмены пользователя;
- запрет обхода ролей.

---

# Test Cases (тестовые сценарии)

## TC-001 — Access Own Project

Ожидание:

Пользователь получает доступ только к операциям проектов, где он имеет разрешение.

---

## TC-002 — Cross Company Isolation

Ожидание:

Пользователь одной компании не получает доступ к данным другой компании.

---

## TC-003 — User Identity Protection

Ожидание:

`user_id` берётся из серверного контекста.

Клиент не может указать другого пользователя.

---

## TC-004 — Role Enforcement

Ожидание:

Роли компании определяют допустимые операции.

---

## TC-005 — Direct Insert Protection

Ожидание:

Прямая запись клиента в `ai_usage` запрещена.

Запись выполняется только через защищённую серверную операцию.

---

# Verification Requirements (требования проверки)

Перед созданием миграции необходимо подтвердить:

- тестовый набор;
- ожидаемые результаты;
- rollback strategy (стратегию отката);
- отсутствие обхода RLS.

---

# Implementation Boundary (граница реализации)

До отдельного утверждения запрещено:

- создавать таблицу `ai_usage`;
- создавать Supabase migration;
- изменять существующие RLS политики;
- подключать AI provider.

Следующий этап:

- atomic function design;
- migration design;
- RLS implementation после Architecture Gate.
