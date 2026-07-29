# SPEC76 Changelog

## 2026-07-29

### Fixed

- BUG-001: исправлено создание компании при включённом RLS.
- Операция создания разделена на отдельные INSERT и SELECT запросы.
- Политики RLS и модель доступа через company_members не ослаблялись.

### Verification

- Lint: PASS
- TypeScript: PASS
- Production Build: PASS
- Diff Check: PASS
- Локальная проверка создания компании через интерфейс: PASS
