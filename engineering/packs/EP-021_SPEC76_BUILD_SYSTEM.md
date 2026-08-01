# EP-021 — SPEC76 Build System

## Metadata

| Поле | Значение |
|---|---|
| Document ID (идентификатор документа) | EP-021 |
| Status (статус) | Implemented |
| Owner (владелец) | Platform Owner |
| Source of Truth (источник истины) | GitHub |
| Related Release (связанный релиз) | Release 0.4 |

## Purpose

Создать единую воспроизводимую команду инженерной проверки SPEC76.

## Architecture Readiness Check

- бизнес-логика не изменяется;
- интерфейсы заказчика и исполнителя не изменяются;
- Supabase не изменяется;
- миграции базы данных не требуются;
- политики RLS не изменяются;
- новые зависимости не добавляются;
- отдельный ADR не требуется.

## Implementation

В `package.json` добавлены команды:

```text
typecheck
verify
```

Команда `typecheck` запускает проверку TypeScript без создания файлов.

Команда `verify` выполняет:

```text
lint → typecheck → build
```

## Security

- аутентификация не изменяется;
- авторизация не изменяется;
- политики RLS не изменяются;
- внешние зависимости не добавляются;
- пользовательские данные не обрабатываются.

## Customer Impact

Изменения интерфейса и поведения продукта для заказчика отсутствуют.

## Contractor Impact

Изменения интерфейса и поведения продукта для исполнителя отсутствуют.

## Migration Check

Изменения файлов миграций отсутствуют.

## Verification

```bash
npm run verify
git diff --check
```

## Definition of Done

- команда `npm run typecheck` существует;
- команда `npm run verify` существует;
- Lint проходит;
- TypeScript проходит;
- Production Build проходит;
- Diff Check не обнаруживает ошибок;
- миграции отсутствуют;
- документация обновлена;
- изменения зафиксированы в GitHub.
