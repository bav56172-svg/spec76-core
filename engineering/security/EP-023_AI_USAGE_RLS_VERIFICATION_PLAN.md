# EP-023 — AI Usage RLS Verification Plan

| Поле | Значение |
|---|---|
| Version (версия) | 0.1 |
| Status (статус) | Security Verification Plan |
| Owner (владелец) | Platform Owner |
| Related Release (связанный релиз) | Release 0.4 |
| Related Capability (связанная возможность) | C-006 AI Request Foundation |
| Related ADR | ADR-025 Platform Sovereignty and Autonomous Operations |

---

# Purpose (назначение)

Документ определяет проверки безопасности для таблицы `public.ai_usage`.

Цели:

- подтвердить корректность RLS;
- подтвердить изоляцию данных;
- подтвердить запрет клиентской записи;
- подтвердить серверную модель управления usage.

Документ не выполняет применение migration.

---

# Security Context (контекст безопасности)

Источник истины:

- Supabase migrations;
- существующая модель доступа EP-024.

Модель доступа:

User

↓

Company Membership

↓

Project Access

↓

AI Usage

---

# Verification Scope (область проверки)

Проверяются:

- SELECT access;
- INSERT protection;
- UPDATE protection;
- DELETE protection;
- cross-company isolation;
- service_role access.

---

# Test Case 1 — Own Project Access

Цель:

Пользователь получает доступ только к usage своих доступных проектов.

Ожидаемый результат:

- SELECT разрешён.

---

# Test Case 2 — Foreign Project Isolation

Цель:

Проверить отсутствие доступа к чужим проектам.

Ожидаемый результат:

- SELECT возвращает 0 строк.

---

# Test Case 3 — Cross Company Isolation

Цель:

Проверить изоляцию между компаниями.

Сценарий:

Company A:

- пользователь A;
- проект A.

Company B:

- пользователь B;
- проект B.

Ожидаемый результат:

- пользователь A не видит данные Company B.

---

# Test Case 4 — Client Insert Protection

Роль:

authenticated

Операция:

INSERT в public.ai_usage

Ожидаемый результат:

- операция запрещена.

---

# Test Case 5 — Client Update Protection

Роль:

authenticated

Операция:

UPDATE public.ai_usage

Ожидаемый результат:

- операция запрещена.

---

# Test Case 6 — Client Delete Protection

Роль:

authenticated

Операция:

DELETE public.ai_usage

Ожидаемый результат:

- операция запрещена.

---

# Test Case 7 — Service Role Access

Роль:

service_role

Операции:

- INSERT;
- SELECT;
- UPDATE.

Ожидаемый результат:

- операции разрешены.

---

# RLS Policy Verification (проверка политики RLS)

Проверяется политика:

public.can_access_project(project_id)

Требования:

- доступ определяется текущим пользователем;
- проверяется membership;
- пользователь не может получить доступ через другой проект.

---

# Failure Conditions (условия отказа)

Migration не допускается к применению при:

- отсутствии RLS;
- возможности клиентской записи;
- доступе между компаниями;
- обходе project access;
- отсутствии rollback.

---

# Approval Criteria (критерии утверждения)

Migration готова после:

- прохождения всех тестов;
- подтверждения Security Review;
- Platform Owner approval.

---

# Next Step (следующий шаг)

После утверждения:

1. выполнить локальные RLS tests;
2. применить migration только после approval;
3. подключить server-side usage operation.
