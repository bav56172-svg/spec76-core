# SPEC76 Changelog

## 2026-08-01

### Added

- EP-024 Platform Domain Foundation завершён.
- Добавлена PROD-compatible Upgrade migration.
- Выполнена репетиция локального окружения.
- Выполнена проверка миграции и целостности данных.

### Verification

- Migration: PASS
- Lint: PASS
- TypeScript: PASS
- Production Build: PASS

## 2026-07-29

### Fixed

- BUG-001: исправлено создание компании при включённом RLS.
- Операция создания разделена на отдельные INSERT и SELECT запросы.
- Политики RLS и модель доступа через company_members не ослаблялись.
- BUG-002 / NAV-UX-001: карточка «Компании» на главной странице стала рабочей ссылкой на `/companies`.
- Карточка «Проекты» сохранена как ссылка на `/projects`.
- Карточки «AI-агенты» и «Настройки» больше не ведут на несуществующие маршруты и показывают уведомление о недоступности разделов в текущем Release.
- Улучшена доступность навигационных карточек: добавлены `type="button"`, состояния `focus-visible` и адаптивная сетка.

### Verification

- Lint: PASS
- TypeScript: PASS
- Production Build: PASS
- Diff Check: PASS
- Локальная проверка создания компании через интерфейс: PASS
- BUG-002 commit: `8da44af`
