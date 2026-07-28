# Engineering Packs

Engineering Pack (инженерный пакет) — ограниченный инженерный результат, который поддерживает разработку платформы, но не занимает идентификатор продуктовой Operation (операции).

## Canonical Identifier Rules (правила канонических идентификаторов)

Канонический формат документов SPEC76:

```text
SPEC76-<TYPE>-<NUMBER>
```

Поддерживаемые типы:

- `SPEC76-EP-*` — Engineering Pack (инженерный пакет);
- `SPEC76-ADR-*` — Architecture Decision Record (запись архитектурного решения);
- `SPEC76-SES-*` — Engineering Execution Standard (стандарт инженерного исполнения);
- `SPEC76-STD-*` — Standard (стандарт);
- `SPEC76-OP-*` — Operation (операция);
- `SPEC76-C-*` — Capability (возможность платформы).

Исторические имена файлов сохраняются, чтобы не изменять Git history (историю Git). Короткие идентификаторы допустимы только как локальные исторические обозначения внутри SPEC76, когда ссылка однозначна.

В межпроектных ссылках используется полный канонический идентификатор. Канонические пространства имён ЕЦЭУПО `PLATFORM-*`, `ASVO-*` и `NPB-KUD-*` не изменяются и не входят в реестр SPEC76.

Один канонический идентификатор не может обозначать два разных результата.

## Registry (реестр)

| Canonical ID | Legacy ID | Document | Status | Notes |
|---|---|---|---|---|
| `SPEC76-EP-021` | `EP-021` | `EP-021_SPEC76_BUILD_SYSTEM.md` | Completed | Build System (система сборки) завершён |
| `SPEC76-EP-022` | `EP-022` | — | Completed governance result | Результат представлен `AGENTS.md`, `engineering/standards/SES-001_ENGINEERING_EXECUTION_STANDARD.md`, `engineering/standards/STD-001_DOCUMENTATION_STANDARD.md` и записью от 2026-07-18 в `engineering/decisions/DECISION_LOG.md`; отдельный паспорт Engineering Pack не создавался |
| `SPEC76-EP-023` | `EP-023` | `EP-023_SECURITY_RECOVERY.md` | In Progress | Security and Recovery (безопасность и восстановление) |
| `SPEC76-EP-024` | `EP-024` | `EP-024_PLATFORM_DOMAIN_FOUNDATION.md` | Architecture / Active Sprint | Platform Domain Foundation (фундамент платформенного домена) |
