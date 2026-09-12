# Порядок миграций (`supabase/migrations/`)

Все SQL-миграции schema (структуры БД) для greenfield-установки (новой, пустой базы)
теперь лежат в этой одной папке, в порядке имени файла (timestamp-префикс).
`supabase migration up` / `supabase db push` применяют их именно в этом порядке.

## Важно про apps-serve (self-hosted прод-сервер, 192.168.1.108)

Файлы `20260729000100_create_requests.sql` … `20260729001100_create_project_communication.sql`
раньше лежали в отдельной папке `database/migrations/` (с более ранними датами в имени)
и были применены на apps-serve ВРУЧНУЮ (`psql`/`docker exec`), а не через `supabase migration up`.
Из-за этого Supabase CLI не знает, что они уже применены на этой конкретной базе.

**Перед первым запуском `supabase migration up` (или `db push`) против живой базы apps-serve
после этого переноса — обязательно выполнить `supabase migration repair --status applied <version>`
для каждого из 11 файлов выше**, иначе CLI попробует накатить их заново и упадёт
(объекты уже существуют). Подробная история и полный порядок применения — см.
`docs/ops/qnap-apps-serve-infrastructure.md`, раздел 3.10.

Для новой (greenfield), ещё не существующей базы этот шаг не нужен — там миграции
из этой папки просто применяются по порядку через обычный `supabase migration up`.

## Отдельная от greenfield миграция

`supabase/prod-upgrades/ep024/20260801000100_ep024_prod_compatible_upgrade.sql` —
это НЕ greenfield-миграция, а разовый скрипт переноса СТАРОЙ прод-схемы (где у
`projects` была колонка `title`) на новую. Он намеренно не лежит в этой папке,
чтобы `supabase migration up` не пытался применить его на чистой базе (упадёт:
`column "title" does not exist`). Запускать вручную, только если реально мигрируете
старую прод-базу с этой структурой.
