# EP-023 — AI Usage Execution Result

| Поле | Значение |
|---|---|
| Version (версия) | 1.1 |
| Status (статус) | Remote Verification Passed |
| Owner (владелец) | Platform Owner |
| Related Release (связанный релиз) | Release 0.4 |
| Related Capability (связанная возможность) | C-006 AI Request Foundation |
| Related ADR | ADR-025 Platform Sovereignty and Autonomous Operations |

---

# Purpose (назначение)

Документ фиксирует фактический результат локальной и remote проверки EP-023 AI Usage migration и связанных security controls.

Remote migration execution основной Supabase базы подтверждено фактической проверкой после применения migration.

---

# Execution Scope (границы исполнения)

Выполнено только локально:

- восстановление локального Supabase environment;
- reset базы до migration `20260728000100`;
- проверка существующей domain model;
- ручное локальное применение EP-023 migration;
- проверка структуры `public.ai_usage`;
- проверка RLS;
- выполнение RLS verification test;
- Lint;
- TypeScript;
- Production Build;
- Diff Check.

Не выполнялось:

- `supabase db push`;
- remote migration execution;
- production schema change;
- production data change;
- remote RLS modification.

---

# Local Baseline Verification (проверка локального baseline)

Локальный Supabase успешно восстановлен до:

```text
20260728000100_ep024_platform_domain_security_completion
```

Подтверждена migration history:

```text
202607190001   ep_023_billing_recovery
20260724000100 ep024_platform_domain_foundation
20260724000200 ep024_platform_domain_security_hardening
20260728000100 ep024_platform_domain_security_completion
```

Подтверждены зависимости:

- `public.projects` существует;
- `public.companies` существует;
- `auth.users` доступна;
- `public.can_access_project(uuid)` существует.

---

# EP-023 Migration Execution Result (результат применения migration)

Файл:

```text
supabase/migrations/20260802000100_ep023_ai_usage.sql
```

Локальное применение завершилось успешно:

```text
BEGIN
CREATE TABLE
COMMENT
CREATE INDEX
CREATE INDEX
CREATE INDEX
ALTER TABLE
ALTER TABLE
CREATE POLICY
REVOKE
GRANT
GRANT
COMMIT
```

Статус:

```text
LOCAL MIGRATION VERIFICATION: PASSED
```

---

# Schema Verification (проверка схемы)

Создана таблица:

```text
public.ai_usage
```

Подтверждены колонки:

```text
id
project_id
company_id
user_id
operation_type
provider
model
input_tokens
output_tokens
created_at
```

---

# RLS Verification (проверка RLS)

Подтверждено:

```text
relrowsecurity = true
relforcerowsecurity = true
```

Подтверждена policy:

```text
ai_usage_select_access
```

Role:

```text
authenticated
```

Access condition:

```text
public.can_access_project(project_id)
```

Client write policies для `INSERT`, `UPDATE`, `DELETE` не обнаружены.

---

# Verification Test Result (результат проверочного теста)

Файл:

```text
supabase/tests/ep_023_ai_usage_rls_verification.sql
```

Фактический результат:

```text
BEGIN
DO
DO
DO
DO
DO
DO
NOTICE:  EP-023 AI Usage RLS verification passed
DO
ROLLBACK
```

Статус:

```text
RLS VERIFICATION: PASSED
```

---

# Engineering Quality Gate (контроль качества)

Фактически выполнено:

```text
git diff --check
npm run lint
npx tsc --noEmit
npm run build
```

Результат:

```text
DIFF CHECK: PASSED
LINT: PASSED
TYPESCRIPT: PASSED
PRODUCTION BUILD: PASSED
```

Коммиты:

```text
1566f34 chore(lint): ignore generated supabase temp files
f5a62a2 test(ep-023): fix ai_usage rls verification notice
```

---

# Architecture Observation (архитектурное наблюдение)

Во время локальной проверки обнаружено расхождение исторических baseline.

Greenfield baseline:

```text
public.projects.name
```

Existing PROD-compatible baseline:

```text
public.projects.title
```

Применённые исторические migrations не изменялись.

Это расхождение не препятствовало изолированной локальной проверке EP-023 поверх baseline `20260728000100`.

Отдельное исправление migration history compatibility должно выполняться отдельной архитектурной задачей.

---

# Remote Execution Verification (проверка remote execution)

Основная Supabase база:

```text
project_id = ficjhafnnrznfxgezfay
status = ACTIVE_HEALTHY
```

Migration history после выполнения содержит:

```text
20260809135054 ep023_ai_usage
```

Подтверждено удалённо:

- `public.ai_usage` существует;
- `relrowsecurity = true`;
- `relforcerowsecurity = true`;
- policy `ai_usage_select_access` существует;
- policy разрешает `SELECT` роли `authenticated` через `can_access_project(project_id)`;
- client write policy count для `INSERT`, `UPDATE`, `DELETE` равен `0`;
- `authenticated` имеет только `SELECT` на `public.ai_usage`;
- `service_role` имеет полный набор table privileges;
- foreign keys ведут на `public.projects(id)`, `public.companies(id)` и `auth.users(id)`;
- существуют индексы `ai_usage_project_created_idx`, `ai_usage_company_created_idx`, `ai_usage_user_created_idx`.

Статус:

```text
REMOTE MIGRATION EXECUTION: PASSED
REMOTE SCHEMA VERIFICATION: PASSED
REMOTE RLS VERIFICATION: PASSED
CLIENT WRITE PROTECTION: PASSED
```

---

# Database Impact (влияние на базу)

Local Supabase:

```text
EP-023 migration applied for verification
```

Remote Supabase:

```text
EP-023 migration applied and verified
```

Production Supabase:

```text
PRODUCTION DATABASE CHANGE: APPLIED
```

---

# Security Result (результат безопасности)

Подтверждено локально:

- RLS включён;
- FORCE RLS включён;
- SELECT ограничен project access;
- клиентские write policies отсутствуют;
- server-side access model сохранена.

Статус:

```text
LOCAL SECURITY VERIFICATION: PASSED
REMOTE SECURITY VERIFICATION: PASSED
```

---

# Security Advisor Findings (наблюдения Security Advisor)

По `public.ai_usage` новых предупреждений после EP-023 не выявлено.

При этом в основной базе существуют отдельные pre-existing security findings:

- `public.billing_webhook_events`: RLS включён, но policy отсутствует;
- несколько `SECURITY DEFINER` функций доступны `anon` и/или `authenticated`;
- leaked password protection отключена.

Эти findings не создавались EP-023 и относятся к отдельному security debt. Исправление их не входит в scope текущего execution record.

---

# Human Accountability (ответственность человека)

ИИ использовался для:

- анализа;
- подготовки команд;
- проверки архитектурных зависимостей;
- подготовки документации.

ИИ не принимал решение о production execution.

Remote и production migration execution выполнено после решения Platform Owner.

---

# Final Result (итоговый результат)

```text
LOCAL MIGRATION VERIFICATION: PASSED
LOCAL RLS VERIFICATION: PASSED
ENGINEERING QUALITY GATE: PASSED
REMOTE MIGRATION EXECUTION: PASSED
REMOTE SCHEMA VERIFICATION: PASSED
REMOTE RLS VERIFICATION: PASSED
CLIENT WRITE PROTECTION: PASSED
PRODUCTION DATABASE CHANGE: APPLIED
```

Следующий этап:

```text
EP-023 remote execution documentation closeout
server-side usage operation integration
```
