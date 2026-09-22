# SPEC76 Technical Debt Register

## TD-001 — Multiple lockfiles

Статус: Open
Приоритет: Low

Next.js обнаруживает дополнительный `/Users/andraybalashov/package-lock.json` и может неверно определять workspace root.

Решение позже: проверить родительский lockfile и либо удалить его после подтверждения ненужности, либо явно задать `turbopack.root`.

Причина отсрочки: не влияет на Lint, TypeScript, Build и текущий MVP-поток.

## TD-002 — Security automation

Статус: In Review
Приоритет: Medium

Добавить GitHub Actions для secret scanning, проверки клиентского использования `service_role`, базового контроля RLS и открытых API.

Реализовано в `.github/workflows/security-checks.yml` (ветка `security/td-002-automation`):
secret scanning (gitleaks-action), проверка `app/`/`components/` на утечку `service_role`
(`scripts/security/check-client-service-role.mjs`), базовая сверка `CREATE TABLE` /
`ENABLE ROW LEVEL SECURITY` по `supabase/migrations` с предупреждением в логе workflow
(`scripts/security/check-rls.mjs`). Проверка открытых API не реализована — вне шагов,
поставленных для этой итерации.
