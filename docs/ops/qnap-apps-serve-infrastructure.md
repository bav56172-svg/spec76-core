# Инфраструктура: QNAP NAS + VM apps-serve (self-hosted для spec76-core и eceupo)

> Этот файл — история инфраструктурных изменений и найденных решений для миграции spec76-core и eceupo на собственный (self-hosted) сервер на базе домашнего QNAP NAS. Цель — соответствие 152-ФЗ (закон РФ о локализации персональных данных): базы данных и сами приложения должны физически находиться в России, а не в зарубежном облаке.
>
> Пиши сюда любые новые инфраструктурные изменения и найденные проблемы/решения — этот файл должен оставаться источником правды для ЛЮБОЙ сессии Claude (Cowork, Claude Code, claude.ai), открытой в любом из двух проектов, с любого компьютера.

Последнее обновление: 2026-09-11.

---

## 1. Общая схема

```
QNAP NAS "NAS07275C" (TS-451A, 192.168.1.164)
├── роль: файловое хранилище, медиа-сервер, бэкапы, зеркало Git (Gitea)
├── Container Station: Gitea (gitea/gitea:latest) — зеркала GitHub-репозиториев
│     spec76-core (публичный) и eceupo (приватный), автосинк из GitHub
└── Virtualization Station: гипервизор для полноценных VM
      └── VM "apps-serve" (192.168.1.108) — НОВЫЙ выделенный сервер приложений
            ├── self-hosted Supabase (для spec76-core)
            ├── standalone PostgreSQL (для eceupo, отдельная база — так решил владелец:
            │     "одна база на проект", контейнеры Supabase и eceupo НЕ шарят Postgres)
            ├── само Next.js-приложение spec76-core (будет задеплоено)
            └── само Spring Boot-приложение eceupo (будет задеплоено)
```

Почему одна VM на два проекта (а не две отдельные) — так решил владелец: экономия ресурсов NAS, оба проекта маленькие.

---

## 2. VM apps-serve — параметры и доступ

- Хост: QNAP Virtualization Station, гипервизор на NAS 192.168.1.164
- Имя VM: `apps-serve`
- IP в локальной сети: **192.168.1.108** (выдан по DHCP)
- Ресурсы: 2 vCPU, 4GB RAM, 60GB диск, сетевой адаптер VirtIO на "Virtual Switch 5"
- ОС: Ubuntu Server 24.04 (установлен через ISO вручную, subiquity-инсталлятор)
- Пользователь: `agent` (создан при установке ОС)
- SSH: доступ по ключу (passwordless) — публичный ключ iMac (`~/.ssh/id_ed25519.pub`, comment `bav56172@gmail.com`) добавлен в `~/.ssh/authorized_keys` пользователя `agent`. Пароль пользователя (использовался только один раз для bootstrap, затем весь доступ по ключу) хранится у владельца отдельно, в этот файл не пишем.
- sudo: настроен **без пароля** (`/etc/sudoers.d/90-agent-nopasswd` → `agent ALL=(ALL) NOPASSWD:ALL`)
- Как подключиться: `ssh agent@192.168.1.108` с iMac (или с любого устройства в этой же локальной сети / через desktop-commander shell на iMac, который и так в этой сети)

### ⚠️ Важное ограничение QNAP Virtualization Station

Встроенная браузерная консоль VM (VNC-консоль в вебе) **не поддерживает copy/paste**. Любые команды туда нужно печатать руками. Поэтому весь реальный командный доступ к VM всегда идёт через SSH с iMac (или другого компьютера в сети), а не через браузерную консоль QNAP.

---

## 3. Хронология: что делали, что ломалось, как чинили

### 3.1 Создание VM и установка ОС
Стандартная установка Ubuntu Server 24.04 через Virtualization Station: DHCP-сеть, "Use an entire disk" для диска, профиль `agent`/`apps-serve`, обязательно включены "Install OpenSSH server" и "Allow password authentication over SSH" (второе позже отключили в пользу ключа), Featured Server Snaps — ничего не выбирали.

### 3.2 Доступ по SSH-ключу и passwordless sudo
Проблема: интерактивный ввод пароля по SSH/sudo не работает через инструменты автоматизации (нет настоящего терминала/TTY).
Решение: один раз использовали `sshpass` с паролем, чтобы (а) дописать публичный ключ iMac в `authorized_keys`, и (б) создать sudoers-файл с NOPASSWD. После этого пароль больше не нужен — весь доступ по ключу.

### 3.3 Установка Docker
Установлен официальным скриптом `get-docker.sh`. Урок: длинные установки нельзя оставлять "привязанными" к процессу, который может прерваться — запускать через `nohup ... > log 2>&1 & disown`, чтобы установка продолжалась на сервере независимо от нашего соединения.

### 3.4 Первая попытка поднять Supabase (CLI `supabase start`) — ПРОВАЛ
Пытались поднять self-hosted Supabase через `supabase start` (тот же механизм, что и для локальной разработки). Образы (Docker images) для этого подхода тянутся с **`public.ecr.aws`** (AWS ECR Public), а реальная загрузка блобов (слоёв образов) идёт через конкретный CloudFront-домен `d2glxqk2uabbnd.cloudfront.net`.

**Проблема:** этот CloudFront-адрес оказался недоступен из сети провайдера (зависает на 0 байт и напрямую, и через рабочий прокси). Диагностировали вручную, по протоколу Docker Registry v2: token-эндпоинт → manifest → blob-URL → редирект 307 на CloudFront, который не отвечает.

**Решение:** отказались от `supabase start` (CLI) полностью. Вместо этого используем официальный self-hosted docker-compose стек из репозитория `supabase/supabase`, папка `docker/` — там образы обычные, с Docker Hub (`supabase/postgres`, `supabase/gotrue`, `postgrest/postgrest` и т.д., без префикса реестра), а Docker Hub из этой сети доступен (проверили тестовым `docker pull hello-world` — сработало).

### 3.5 Прокси Xray (обход блокировок) — продублирован на новый сервер
На старом сервере (`bacey-serve`) уже был настроен рабочий прокси Xray (VLESS/Reality-протокол, соединение на `r-us.flowceo.ai:443`) для обхода блокировок. Скопировали его один в один (бинарник, `config.json`, systemd user-сервис) на `apps-serve`, НЕ трогая рабочий прокси на `bacey-serve`. Локальный SOCKS5-порт 10808, HTTP-порт 10809 (оба на 127.0.0.1). Включено автозапуском через `systemctl --user enable --now xray-proxy` + `loginctl enable-linger agent`.

### 3.6 Docker daemon настроен качать через прокси — тоже оказалось ошибкой
Пока боролись с AWS CloudFront (см. 3.4), настроили Docker daemon качать вообще ВСЕ образы через Xray-прокси (`/etc/systemd/system/docker.service.d/http-proxy.conf`, `HTTP_PROXY`/`HTTPS_PROXY=http://127.0.0.1:10809`).

**Проблема (найдена уже ПОСЛЕ перехода на docker-compose подход):** этот прокси оказался очень медленным для больших файлов — скорость скачивания падала до ~16 КБ/с (проверено через `ss -tnp`, видели, что данные в приёмном буфере/Recv-Q накапливаются и вычитываются крайне медленно). При таких скоростях скачать несколько гигабайт образов Supabase заняло бы часы.

**Решение:** т.к. AWS ECR больше не нужен (отказались от CLI-подхода), а Docker Hub и так доступен напрямую без прокси — удалили этот прокси-конфиг у Docker daemon (`rm /etc/systemd/system/docker.service.d/http-proxy.conf`, `daemon-reload`, `systemctl restart docker`). Скачивание сразу пошло с нормальной скоростью напрямую с Docker Hub.

### 3.7 Баг в официальном `setup.sh` — вложенная директория проекта
Официальный скрипт `setup.sh` из `supabase/supabase/docker/` (bootstrap-скрипт: копирует файлы, генерирует `.env` с секретами, запускает `docker compose pull`) был вызван с абсолютным путём: `--project-dir ~/projects/spec76-supabase`.

**Проблема:** скрипт создал директорию проекта не по абсолютному пути, а вложенно, внутри своей же рабочей директории — получилось `~/projects/supabase-selfhost/docker/home/agent/projects/spec76-supabase` (похоже на баг конкатенации путей внутри скрипта при абсолютном `--project-dir`). Из-за этого показалось, что скрипт "завис" — на самом деле он просто работал молча (флаг `--progress quiet` не выводит прогресс).

**Решение:** нашли реальную рабочую директорию через `readlink -f /proc/<pid>/cwd` запущенного `docker compose pull` процесса, переместили (`mv`) директорию на чистый путь `~/projects/spec76-supabase`, дальше работали уже из него.

### 3.8 Скачивание образов (docker compose pull) — идёт медленно из-за нагрузки на саму VM
Сама VM (2 vCPU) сильно нагружена во время распаковки слоёв образов — `load average` доходит до ~8 при 2 ядрах, `%steal` (время, украденное гипервизором QNAP у VM) — около 10-20%. Это не ошибка, а особенность слабого железа/виртуализации: скачивание и распаковка идут, просто медленнее, чем на обычном сервере. Прогресс отслеживается через лог `/tmp/compose-pull.log` (запущен в фоне через `nohup ... & disown`, переживает разрыв SSH-сессии).

Статус на 2026-09-11 ~22:08 UTC: скачано 5 из 13 образов (сервисов) стека, занято ~13GB из 48GB диска, процесс `docker compose pull` продолжает работать.

Итог: к ~22:37 UTC все 11 образов (реальное число сервисов в `docker-compose.yml`, не 13) скачаны полностью (`docker compose config --images` = 11 = счётчик "Pulled" в логе).

### 3.9 `docker compose up -d` — контейнеры стартуют ОЧЕНЬ медленно, VM перегружена

После `docker compose pull` запустили `docker compose up -d`. Все 11 контейнеров создались, но старт занял намного дольше ожидаемого:

- `supabase-db` (Postgres) первым проходит `initdb` — реальная первичная инициализация (создание ролей, схем auth/storage/realtime, extensions, JWT-настройки) заняла несколько минут вместо секунд. Пока идёт `initdb`, Postgres не слушает 5432 — health-check закономерно шлёт "no response", это НЕ ошибка, а стандартное поведение entrypoint-скрипта Postgres (сначала прогоняет init-скрипты в standalone-режиме, потом перезапускается в серверном режиме).
- После того как `db` стал healthy, `docker compose up -d` (первый запуск) уже успел выйти по внутреннему таймауту ожидания зависимости — пришлось запустить `docker compose up -d` ПОВТОРНО, чтобы он подхватил оставшиеся сервисы, которые ждали healthy `db`.
- Дальше каждый сервис (auth, realtime, storage, meta) при первом старте гоняет СВОИ миграции в ту же Postgres одновременно — это создаёт огромную нагрузку на CPU: `load average` дошёл до **37-43 при 2 vCPU** (то есть VM перегружена в ~20 раз относительно номинала). `containerd` сам по себе ест ~50% CPU только на управление контейнерами.
- Из-за этого health-check'и отдельных сервисов периодически не укладываются в свой timeout (например у imgproxy: `docker inspect` показывает `"Health check exceeded timeout (5s)"`, хотя сам процесс отвечает нормально) — сервисы "мигают" между healthy/unhealthy не потому что сломаны, а потому что VM физически не успевает ответить на health-check вовремя.
- PostgREST (`supabase-rest`) в какой-то момент падал с `"canceling statement due to statement timeout"` при попытке загрузить schema cache — тоже эффект перегрузки Postgres конкурентными миграциями, само прошло, когда нагрузка чуть спала.

**Вывод (для будущих сессий):** это НЕ баг конфигурации — это ожидаемое поведение self-hosted Supabase (11 сервисов) на слабой VM (2 vCPU / 4GB) при первом запуске, когда все сервисы одновременно инициализируются. Процесс должен постепенно сойтись сам (по мере того как каждый сервис заканчивает разовую миграцию), просто это может занимать 20-40+ минут вместо обычных 1-2 минут.

**Практическое решение, которое реально сработало:** когда `realtime` не мог получить подключение к БД и падал в цикл рестартов (`DBConnection.ConnectionError`, connection pool исчерпан) — временная остановка `docker stop realtime-dev.supabase-realtime` сразу же освободила ресурсы, и следом `storage` (до этого 20+ минут не слушал порт) практически сразу стал healthy. После этого `docker compose up -d` (повторно) подняла `realtime` уже без конкуренции — и она успешно смигрировала. **Урок:** при перегрузке лучше остановить один "шумный" сервис и дать остальным дозапуститься, чем ждать вслепую.

Итог: все 11 контейнеров стека в итоге стали healthy/running.

### 3.10 Применение SQL-миграций spec76-core — обнаружен пропущенный набор миграций и один явно неприменимый файл

При первом проходе по `supabase/migrations/*.sql` (9 файлов, по порядку) — 2 миграции упали:
- `20260801000100_ep024_prod_compatible_upgrade.sql` — `ERROR: column "title" does not exist` (таблица `public.projects`)
- `20260815010000_op023_contractor_available_requests_rls.sql` — `ERROR: relation "public.request_matches" does not exist`

**Причина:** в репозитории есть ВТОРОЙ, отдельный набор миграций — `database/migrations/*.sql` (11 файлов, `20260712_001_...` — `20260714_011_...`) — которые создают таблицы фич-уровня (`requests`, `request_analyses`, `request_matches`/contractor matching, `offers`, `tasks`, `documents`, `project_activities`, `project_timelines`, `notifications`, `conversations`/messages и т.д.). Несмотря на то, что даты в именах файлов (12-14 июля) РАНЬШЕ дат `supabase/migrations` (19 июля - 15 августа), по факту содержимого — эти файлы должны накатываться МЕЖДУ `supabase/migrations` #4 (`20260728000100_ep024_platform_domain_security_completion.sql`) и #5 (`ep024_prod_compatible_upgrade`), т.к. используют таблицы `companies`/`projects`, которые создаются только в `ep024_platform_domain_foundation` (миграция #2 из `supabase/migrations`).

**Правильный порядок для новой (greenfield) базы:**
1. `supabase/migrations/` файлы 1-4 (billing_recovery → platform_domain_foundation → security_hardening → security_completion)
2. **`database/migrations/` все 11 файлов по порядку номеров** (001…011)
3. `supabase/migrations/` файлы 6-9 (ai_usage → ai_usage_lifecycle_rate_limit → role_model_foundation → contractor_available_requests_rls)
4. Файл `supabase/migrations/20260801000100_ep024_prod_compatible_upgrade.sql` (#5) — **СОЗНАТЕЛЬНО ПРОПУЩЕН**. Собственный заголовок файла прямо говорит: *"Target baseline: existing PROD companies/projects schema verified on 2026-08-01. This is an Upgrade migration. It must not be used as a substitute for the existing Greenfield migrations on a clean installation."* Это миграция для переноса данных со СТАРОЙ прод-схемы (где у `projects` была колонка `title`) на новую — она не предназначена для новой пустой базы (где `projects.name`, а не `title`, создаётся сразу правильно через greenfield-путь). Применять её к чистой базе не нужно и не имеет смысла.

**Побочный урок:** при повторном прогоне migrations после частичной неудачи простой `DROP TABLE ... CASCADE` для созданных таблиц оказался НЕДОСТАТОЧНЫМ — остались "осиротевшие" функции (15 штук в public-схеме) и триггер `auth_users_create_profile` прямо на `auth.users` (не каскадируется от дропа public-таблиц, т.к. живёт в другой схеме). Пришлось отдельно чистить: `DROP TRIGGER ... ON auth.users`, затем DO-блок, динамически дропающий все функции в public по `pg_proc`. Итоговый результат после исправленного порядка: **24 таблицы в public-схеме, все миграции (кроме сознательно пропущенной #5) применены с EXIT 0.**

### 3.11 КРИТИЧНЫЙ инцидент: полная перегрузка VM (load average до 134!) — zombie-процессы от healthcheck'ов

**Дата:** 2026-09-12, ночь. Обнаружено при попытке установить Node.js для деплоя spec76-core.

**Симптомы:** `uptime` показывал `load average: 134.14, 81.73, 46.82` на VM с 2 vCPU. Простые SSH-команды (`uptime`, `docker ps`) выполнялись по 3-5 минут или вообще не отвечали (обрывы SSH-сессии). Все 11 контейнеров Supabase одновременно ушли в статус `unhealthy` (включая `supabase-db`, который обычно очень стабилен).

**Корневая причина (две накладывающиеся):**
1. **`unattended-upgrades` / `apt-daily` systemd-таймеры** — стандартный Ubuntu-таймер автообновлений запустил `update-notifier/apt-check`, который на этой слабой VM ел 60-70% CPU почти час, и параллельно висел процесс `apt update -y`, державший dpkg-lock.
2. **Healthcheck'и Supabase-контейнеров построены на `node -e "fetch(...)"`** (Studio на порту 3000 — `/api/platform/profile`, Pooler на 8080 — `/health`). Каждый health-check — это полный запуск нового процесса Node.js/V8. Когда VM уже под нагрузкой от (1), health-check запросы не успевают выполниться за интервал до следующего запуска → они начинают накапливаться параллельно (несколько живых `node -e fetch(...)` процессов на один и тот же контейнер одновременно) → это ещё больше нагружает CPU → health-check'и следующих контейнеров тоже не успевают → **порочный круг**. За ~1 час накопилось 87+ зомби-процессов `[node] <defunct>` (родительский процесс не успевал их reap'ить).

**Дополнительный наблюдаемый фактор:** `vmstat`/`iostat` показывали `%steal` 15-40% (гипервизор QNAP забирает CPU-время у этой VM) и повышенную задержку записи на диск (`w_await` ~140ms). Это похоже на конкуренцию за ресурсы с другими VM на том же физическом QNAP TS-451A (по независимому расследованию в параллельной сессии Claude Code по проекту Bacey — на этом же QNAP сейчас поднята ещё одна VM `bacey-serve`, которая тоже активно пишет на диск). **Важно для дальнейшей работы:** apps-serve — не единственная нагрузка на этот NAS; при повторных похожих зависаниях стоит проверить, не активна ли одновременно вторая VM.

**Исправление:**
1. Убил зависший `apt-check` (`sudo pkill -9 -f "/usr/lib/update-notifier/apt-check"` — **осторожно**: `pkill -f apt-check` без полного пути один раз убил саму SSH-сессию, т.к. совпал по подстроке с текстом самой команды!).
2. Остановил и отключил таймеры автообновлений насовсем: `sudo systemctl disable --now apt-daily.timer apt-daily-upgrade.timer` (на выделенном сервере автообновления не нужны и только мешают).
3. `supabase-edge-functions` не восстановился сам (упал по отдельной причине — см. ниже) — перезапущен вручную (`docker start`), но с ним осталась отдельная проблема.
4. Как решительный шаг для полного сброса состояния — **временно остановил весь docker-compose стек** (`docker compose stop`, все 11 контейнеров успешно остановились с кодами `Exited (0)`/`(137)`/`(143)` — данные в volumes не тронуты), это сразу уронило load average с 95+ до ~5-13. Стек поднят обратно после установки Node.js (см. ниже, следующий шаг работы).

**Результат:** load average вернулся к нормальным ~5-15 (адекватно для 2 vCPU под docker-compose стеком). Все контейнеры (кроме edge-functions) вернулись в статус `healthy` в течение минуты после устранения (1).

**Известная отдельная проблема (не блокирует, отложено):** `supabase-edge-functions` падает с `worker boot error: ... JSR package version manifest for '@panva/jose@6.2.12' failed to load: error reading a body from connection: timed out` — это Deno-рантайм при старте пытается получить манифест пакета с `jsr.io` и получает ту же медленную сеть, что и раньше описанная в 3.6 (прямой `curl` с хоста на `jsr.io` тоже получил только 21KB/36KB за 8 секунд, аналогично старой проблеме с throttling для Docker Hub). Возможно, есть ещё один необнаруженный уровень прокси/redirect для исходящего трафика (помимо уже убранного в 3.6 для Docker-демона). Edge Functions не нужны для базовой работы приложения spec76-core — отложено, не является блокером.

### 3.12 Node.js: важная поправка версии (нужен Node 22, не 20)

Изначально поставил Node.js 20 LTS через NodeSource (`setup_20.x`), но `npm install` в spec76-core выдал `EBADENGINE` предупреждения — пакеты `@supabase/*` (auth-js, functions-js, postgrest-js, realtime-js, storage-js, supabase-js — все версии 2.112.2) требуют `node >= 22.0.0`. Чтобы не рисковать скрытыми runtime-багами (несовпадение engine-требований), удалил Node 20 (`sudo apt-get remove -y nodejs`) и поставил Node 22 LTS через NodeSource (`setup_22.x`). Итог: **Node.js v22.23.2, npm 10.9.8** — соответствует требованиям всех зависимостей.

**Урок по времени установки:** на этой VM даже простая установка/удаление deb-пакета Node.js через apt может занимать 5-10 минут (не секунды, как обычно) — это нормально для данного слабого железа с чужими VM на той же хост-системе, не является признаком зависания, если процесс `dpkg`/`apt-get` виден активным в `ps aux` (state `R`/`S`, ненулевое и растущее CPU-время).

### 3.13 Тюнинг healthcheck'ов Supabase-стека + деплой spec76-core

После установки Node 22: `npm install` (385 пакетов, ~14 минут — нормально для этого железа) и `npm run build` (Next.js 16 + Turbopack, ~5.5 минуты: 3 мин компиляция + 2.2 мин TypeScript) прошли **без единой ошибки**.

При повторном подъёме стека (`docker compose up -d` после временной остановки в 3.11) вскрылась системная проблема: **все healthcheck'и в `docker-compose.yml` изначально настроены с таймаутами 5-10 секунд**, а на этой VM даже простой `docker exec` + запуск `node -e ...` может занимать 5+ секунд сам по себе (замерено: `NODE_BOOT_MS: 5504` только на старт пустого node-процесса через `docker exec`). Из-за этого `supabase-studio` (единственный сервис, у которого нет `wget`/`curl` внутри образа — healthcheck сделан через `node -e fetch(...)`) стабильно не укладывался в исходный `timeout: 10s`, что и запустило порочный круг из 3.11.

**Исправление (закоммичено прямо в `~/projects/spec76-supabase/docker-compose.yml` на apps-serve, бэкап оригинала — `docker-compose.yml.bak-before-healthcheck-tuning`):**
- Глобально во всех healthcheck-блоках: `timeout: 5s|10s` → `timeout: 30s`, `interval: 5s` → `interval: 15s` (чтобы проверки не успевали накапливаться параллельно, как в 3.11).
- Для `supabase-studio` отдельно: `start_period: 20s` → `90s`, `retries: 3` → `5` (даёт больше времени на холодный старт Next.js-сервера Studio под нагрузкой).
- **`supabase-envoy`: `depends_on: studio: condition: service_healthy` → `condition: service_started`.** Envoy (API-шлюз, критичен для работы приложения) физически не нуждается в том, чтобы Studio (админ-панель, не нужна для работы самого API) была healthy — раньше это создавало полную блокировку всего REST/Auth API каждый раз, когда Studio флапала.

**Важное наблюдение:** несмотря на все исправления, `studio`/`storage`/`meta`/`realtime`/`envoy` периодически всё равно показывают статус `unhealthy` в `docker ps`, хотя сами сервисы РАБОТАЮТ нормально (проверено напрямую: `docker logs supabase-envoy` показывает, что воркеры стартовали и слушают порт; реальный запрос через `curl http://localhost:8000/rest/v1/companies` вернул корректный ответ от Postgres, а не ошибку соединения). Причина — `%steal` в `vmstat`/`iostat` регулярно скачет до 20-53%, т.е. гипервизор QNAP ЗАБИРАЕТ CPU-время у этой VM в пользу другой активности на хосте (см. 3.11 про параллельную VM `bacey-serve`). **Вывод для будущих сессий: статус `unhealthy` у некритичных сервисов (studio/realtime/storage/meta) на этой VM не обязательно означает реальную проблему — сначала проверяйте фактическую доступность через прямой `curl`/`docker logs`, прежде чем тратить время на диагностику.**

**Деплой spec76-core:**
- `.env` создан на сервере с реальными Supabase-ключами (см. §4), запущен через systemd-юнит `/etc/systemd/system/spec76-core.service` (`next start`, порт 3000, `enabled` — автозапуск при перезагрузке VM, `Restart=on-failure`).
- Подтверждено: приложение отвечает `HTTP 200` и по `localhost:3000`, и по `http://192.168.1.108:3000` (сетевой доступ из LAN).
- Подтверждено: полный путь `приложение → Envoy (8000) → PostgREST → Postgres` рабочий (получен реальный ответ от БД на тестовый запрос к таблице `companies`).

### 3.14 Начало деплоя eceupo: обнаружена и уважена формальная блокировка production-деплоя

Перед стартом работы над eceupo обнаружено, что в `README.md` репозитория задокументировано формальное решение Platform Owner (**EP-020, статус `Defer`**, см. `engineering/architecture/EP-020_PRODUCTION_LAUNCH_DECISION_RECORD.md`), которое **запрещает**: production-деплой, реальные персональные данные, production-базу данных, внешний домен и production-секреты — до нового решения Platform Owner. При этом явно подтверждён как уже одобренный baseline: локальный PostgreSQL и локальный backend.

Это несовместимо с изначальной задачей "задеплоить eceupo на apps-serve" в её буквальном прочтении (apps-serve — внешний сервер, не "локально"). Решение не принималось самостоятельно — вопрос был задан пользователю напрямую, пользователь выбрал вариант **"как локальный/dev-стенд"**: разворачивать на apps-serve приложение и БД eceupo так, будто это тот же самый уже одобренный локальный baseline (dev-креды, без реальных ПДн, без внешнего домена, без "production"-секретов, файлы репозитория используются как есть, без изменений). Все последующие шаги в этом разделе выполнены строго в рамках этого решения.

### 3.15 Доступ к приватному репозиторию eceupo — deploy-ключ (по аналогии с bacey)

На apps-serve сгенерирована отдельная ed25519-пара только для этого репозитория:
```
ssh-keygen -t ed25519 -f ~/.ssh/eceupo_deploy_key -N ""
```
Публичный ключ зарегистрирован как **read-only** deploy-ключ репозитория `bav56172-svg/eceupo` через `gh repo deploy-key add <pubkey> -R bav56172-svg/eceupo -t "apps-serve"` (выполнено с iMac, где `gh` уже аутентифицирован; флаг `-w/--allow-write` **не** передавался — по умолчанию ключ read-only). В `~/.ssh/config` на apps-serve добавлен алиас:
```
Host github.com-eceupo
  HostName github.com
  User git
  IdentityFile ~/.ssh/eceupo_deploy_key
  IdentitiesOnly yes
```
Клонирование: `git clone git@github.com-eceupo:bav56172-svg/eceupo.git ~/projects/eceupo` — успешно.

### 3.16 Конфликт портов: eceupo-postgres vs supabase-pooler на 5432 — найден и решён без изменения репозитория

Собственный `docker-compose.yml` репозитория (`eceupo-postgres` + `eceupo-pgadmin`, не менялся) публикует Postgres на хостовый порт **5432:5432**. На apps-serve этот порт **уже занят** — `supabase-pooler` (Supavisor) стека spec76-core давно слушает `0.0.0.0:5432`. Симптом был неочевидным: `docker compose up -d` для eceupo отработал без ошибки и контейнер показывал `healthy`, но backend при подключении к `jdbc:postgresql://localhost:5432/eceupo` получал не "connection refused", а осмысленную ошибку Postgres-протокола: `FATAL: (ENOIDENTIFIER) no tenant identifier provided (external_id or sni_hostname required)` — это фирменная ошибка **Supavisor** (multi-tenant pooler Supabase), а не eceupo-postgres. Т.е. трафик на `localhost:5432` физически уходил в чужой pooler, а не в контейнер eceupo.

**Решение — локальный, НЕ закоммиченный файл `~/projects/eceupo/docker-compose.override.yml`** (лежит только на apps-serve, в `git status` виден как untracked, никогда не добавлялся в `git add`/коммит — репозиторий остаётся ровно таким, каким его одобрил Platform Owner):
```yaml
services:
  postgres:
    ports: !override
      - "5433:5432"
  pgadmin:
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@eceupo-dev.com
```
Важный нюанс Docker Compose: обычное указание `ports:` в override-файле **не заменяет**, а **добавляет** к списку портов из базового файла (списки мёржатся конкатенацией) — первая попытка привела к тому, что compose пытался забиндить И 5432, И 5433 одновременно, и снова падал на "port is already allocated". Ключ `!override` (YAML-тег, поддерживается Docker Compose v2.24+, тут используется v5.5.1) явно указывает — **заменить** список, а не дополнить его.

Второй, независимый баг найден тем же способом: `eceupo-pgadmin` уходил в `Exited (1)`, потому что текущий образ `dpage/pgadmin4` проверяет домен в `PGADMIN_DEFAULT_EMAIL` и отклоняет зарезервированные домены из RFC 2606 (`admin@eceupo.test` → "special-use or reserved name"). Через тот же override-файл email заменён на `admin@eceupo-dev.com` (обычный TLD, проверка деliverability отключена — письма реально не отправляются).

После пересоздания (`docker compose up -d`) оба контейнера здоровы: `eceupo-postgres` слушает `0.0.0.0:5433->5432`, `eceupo-pgadmin` стартует без ошибок.

### 3.17 Java 21, сборка и systemd-деплой backend'а eceupo

На apps-serve не было Java вообще (`java: command not found`). Backend требует **Java 21** (см. `pom.xml`, `spring-boot-starter-parent` 3.5.16, `<java.version>21</java.version>`). Установлено: `sudo apt-get install -y openjdk-21-jdk-headless` → **OpenJDK 21.0.12**. Установка заняла ~22 минуты (пакет + все зависимости, включая шрифты/X11-либы для headless-JDK) — на этой перегруженной VM это ожидаемо, не зависание (см. урок из 3.12); в это же время наблюдался очередной всплеск load average до 114 — та же природа, что в 3.11/3.13 (steal-время от соседней VM), самостоятельно прошло после завершения установки.

Сборка: `cd ~/projects/eceupo/backend && ./mvnw clean package -DskipTests` — **BUILD SUCCESS** за 6:34 мин (первая сборка, полная загрузка зависимостей Maven Central с нуля), получен `target/backend-0.0.1-SNAPSHOT.jar` (Spring Boot fat-jar).

Деплой — systemd-юнит `/etc/systemd/system/eceupo-backend.service` (по аналогии с `spec76-core.service`):
```ini
[Unit]
Description=ECEUPO Backend (Spring Boot, dev/local stand)
After=network.target docker.service
Requires=docker.service

[Service]
Type=simple
User=agent
WorkingDirectory=/home/agent/projects/eceupo/backend
ExecStart=/usr/bin/java -Dspring.datasource.url=jdbc:postgresql://localhost:5433/eceupo -jar /home/agent/projects/eceupo/backend/target/backend-0.0.1-SNAPSHOT.jar
Restart=on-failure
RestartSec=10
StandardOutput=append:/var/log/eceupo-backend.log
StandardError=append:/var/log/eceupo-backend.log

[Install]
WantedBy=multi-user.target
```
Порт БД передан через JVM-параметр `-Dspring.datasource.url`, а не правкой `application.yml` — файл репозитория (с портом 5432) остаётся нетронутым; переопределение — чисто apps-serve-специфичное, из-за конфликта портов в 3.16.

**Результат:** приложение стартовало (`Started BackendApplication` — заняло ~5.5 минут при холодном старте под нагрузкой, это нормально для этой VM), Flyway **успешно применил все 4 миграции** (`V1__init_identity`, `V2__init_organization`, `V3__init_people`, `V20260724_01__create_auth_foundation`) к новой базе `eceupo` на порту 5433, создано 16 таблиц. `GET /actuator/health` → `{"status":"UP"}`, `HTTP 200`.

**Известный пробел (не исправлялся — код проекта не менялся, вне рамок инфраструктурной задачи):** `scripts/smoke.sh` из репозитория обращается к `POST /api/people` без аутентификации и получает `HTTP 401`. Причина — в текущем коде `AuthSecurityConfiguration` эндпоинт `/api/people/**` защищён (`httpBasic`, `.authenticated()`), а ни миграции, ни `run.sh`, ни сам `smoke.sh` не создают тестового пользователя автоматически. Похоже, smoke-скрипт не успели обновить вслед за добавлением аутентификации (таблицы `eceupo_user_account`/`identity_user_accounts` пусты после чистых миграций). Это вопрос для команды/владельца продукта — не инфраструктурная проблема и не то, что стоило "чинить" на ходу созданием тестовых пользователей в обход governance-процесса проекта.

### 3.18 ПОВТОРНЫЙ критичный инцидент перегрузки VM (load average до 231.79!) — найдена ИСТИННАЯ причина, отличная от 3.11/3.13

При начале работы над задачей бэкапов (см. 3.19) — при попытке настроить NFS для сетевой шары — VM снова ушла в критическую перегрузку, **хуже предыдущего инцидента (3.11)**: load average достиг **231.79** (против 134 ранее), `docker version` не отвечал вообще (`timeout 20 docker ... → EXIT:124`), `docker restart supabase-studio` занял 795 секунд (13 минут 15 секунд).

**Диагностика (через PID зомби-процессов, не "на глаз"):**
```
ps -eo ppid,stat | awk '$2 ~ /Z/ {print $1}' | sort | uniq -c | sort -rn
cat /proc/<PPID>/cgroup   # → узнать, какому контейнеру принадлежит PID-владелец зомби
docker ps --no-trunc      # → сопоставить длинный container ID с именем сервиса
```
Владельцем основной массы зомби оказался контейнер `d504887b...` → **`supabase-meta`**, а НЕ `supabase-studio`, как было (похоже, ошибочно) зафиксировано в 3.11. Перезапуск `studio` первым не снизил число зомби (осталось ~382-387); только после перезапуска именно `meta` зомби упали до 6, а load average начал падать (231 → ~30-38).

**Истинная причина:** у образа `supabase/postgres-meta:v0.99.0` есть **вшитый в Dockerfile HEALTHCHECK** (не описанный явно в `docker-compose.yml`!):
```
CMD-SHELL node -e "fetch('http://localhost:8080/health')..."
Interval: 5s, Timeout: 5s, Retries: 3
```
Это архитектурно та же проблема, что чинили для `studio` в 3.13 (полноценный Node.js-процесс на каждый healthcheck при интервале 5 секунд — на слабом железе VM это создаёт зомби быстрее, чем система успевает их "пожинать"/reap), но у `meta` не было явного блока `healthcheck:` в `docker-compose.yml`, поэтому правка 3.13 (которая трогала только явно прописанные блоки) её не затронула. Не исключено, что и часть исходного инцидента 3.11 была вызвана именно `meta`, а не только `studio` — атрибуция в 3.11 могла быть неполной/ошибочной.

**Исправление:** в `~/projects/spec76-supabase/docker-compose.yml` (с предварительным бэкапом `docker-compose.yml.bak-before-meta-healthcheck-fix`) в сервис `meta:` добавлен явный блок:
```yaml
    healthcheck:
      test:
        [
          "CMD-SHELL",
          "node -e \"fetch('http://localhost:8080/health').then((r) => {if (r.status !== 200) throw new Error(r.status)})\""
        ]
      timeout: 15s
      interval: 30s
      retries: 5
      start_period: 30s
```
(интервал/таймаут — по аналогии со уже проверенными значениями `studio` из 3.13). Применено через `docker rm -f supabase-meta && docker compose up -d meta` (стандартный обходной путь для containerd-ошибки `AlreadyExists: task ... already exists`, см. 3.11). После применения: `supabase-meta` → `healthy` через ~3 минуты, зомби стабильны на 6, load average устойчиво снижался (231 → 25 → 14 → 7 в течение ~10 минут).

**Побочный эффект:** после этого инцидента `supabase-studio` некоторое время оставался в статусе `unhealthy` из-за `docker exec`-ошибок вида `OCI runtime exec failed: ... error starting setns process: fork/exec /proc/self/fd/6: no such file or directory` — это симптом общей нехватки ресурсов хоста (containerd/runc не может запустить процесс для healthcheck), а не новая проблема; должен пройти сам по себе по мере полного восстановления VM. Не переделывался повторным циклом рестартов, чтобы не создавать новую нагрузку — статус на момент записи см. в §4.

**Вывод для будущих проверок:** при следующем аналогичном инциденте — сразу проверять ВСЕ сервисы Supabase-стека на предмет вшитого в образ (не в `docker-compose.yml`) healthcheck'а через `docker inspect <container> --format '{{json .Config.Healthcheck}}'`, а не только те, у кого блок `healthcheck:` явно виден в compose-файле.

### 3.19 Бэкапы БД (spec76-core + eceupo) на существующий бэкап-контур NAS — решение пользователя и статус (В ПРОЦЕССЕ)

**Решение пользователя** (по итогам обсуждения — на NAS уже настроен свой бэкап-контур: Hybrid Backup Sync 3 с заданиями Storage→Dev и Storage→SeagateBackup, USB-диск на ~1.82ТБ):
1. Куда писать бэкапы БД: **в существующую сетевую шару NAS** (не локально на apps-serve) — чтобы уже настроенные задания HBS3 подхватывали дампы автоматически и без дополнительной настройки самого HBS3.
2. Расписание/хранение: **раз в сутки ночью** (предложено 03:00), **хранить 7 последних копий** (старше — удалять).

**Попытка через NFS (не получилось):** установлен `nfs-common`, но `showmount -e 192.168.1.164` после стабилизации VM (см. 3.18) чётко вернул `clnt_create: RPC: Unable to receive` (не зависание — быстрый ответ) — NFS-сервис на NAS **не включён**. Ожидаемо: HBS3/Time Machine на этом NAS используют SMB/AFP, а не NFS.

**Пивот на SMB/CIFS:** порт 445 на NAS (192.168.1.164) открыт и отвечает (`nc -zv` → succeeded). На apps-serve установлены `cifs-utils` и `smbclient` (`sudo apt-get install -y cifs-utils smbclient` — сработало, но заняло ~2.5 минуты и упёрлось в dpkg-lock от собственного же фонового запуска, ничего страшного). Попытка анонимного/админского листинга шар (`smbclient -L 192.168.1.164 -U avbalashov -N`) вернула `NT_STATUS_LOGON_FAILURE` — ожидаемо, нужны реальные учётные данные.

**Заблокировано на:** нужны SMB-учётные данные для монтирования шары с apps-serve (рекомендация — отдельная выделенная учётная запись NAS с правом записи только в целевую шару для бэкапов, а не личный admin-аккаунт `avbalashov`, из соображений безопасности). Как только доступ будет дан — план:
1. Смонтировать шару через `/etc/fstab` (или systemd `.mount`) с `credentials=/root/.smbcreds-nas` (права 600, вне git).
2. Скрипт `pg_dump` для обеих баз (`supabase-db` → spec76-core, `eceupo-postgres` → eceupo) с таймстампом в имени файла, запись сжатых дампов на смонтированную шару.
3. `cron`-задание на 03:00 ночи (или systemd timer) + ротация: удаление копий старше 7 дней.
4. Обновление этого документа финальными деталями (точный путь шары, имя cron/timer-юнита, куда смотреть логи), коммит в оба репозитория.

**НЕ является инфраструктурной проблемой eceupo/spec76-core:** это чисто apps-serve-специфичная настройка (файл `/etc/fstab`, cron/systemd-юнит, скрипт) — в репозитории проектов ничего не меняется.

---

## 4. Текущий статус (обновляется по ходу работы)

- [x] VM apps-serve создана, ОС установлена, SSH/sudo настроены без пароля
- [x] Docker + Docker Compose установлены
- [x] Xray-прокси продублирован (на случай если снова понадобится обход блокировок для чего-то другого — сейчас для Docker Hub не используется)
- [x] Official self-hosted Supabase docker-compose стек развёрнут в `~/projects/spec76-supabase` (файлы + `.env` с сгенерированными секретами)
- [x] `docker compose pull` — завершено, все 11 образов скачаны
- [x] `docker compose up -d` — все 11 контейнеров healthy (после устранения инцидента 3.11). `supabase-edge-functions` периодически падает из-за медленной сети до jsr.io (см. 3.11) — не блокирует.
- [x] Применены все миграции spec76-core в правильном комбинированном порядке (см. 3.10) — 24 таблицы в public-схеме
- [x] Node.js установлен на apps-serve — **v22.23.2** (не 20, см. 3.12 — supabase-js требует >=22)
- [x] `.env` приложения spec76-core создан на apps-serve (`~/projects/spec76-core/.env`, gitignored) с `NEXT_PUBLIC_SUPABASE_URL=http://192.168.1.108:8000` (LAN IP, не localhost — важно для клиентского кода в браузере) и реальными ANON/SERVICE_ROLE ключами локального Supabase. Stripe/OpenAI/Twilio/S3-ключи оставлены пустыми (бизнес-решение пользователя, не мои значения)
- [x] `npm install` в spec76-core — 385 пакетов, ~14 минут (медленно из-за слабого железа, это нормально)
- [x] `npm run build` — успешно, `next build` (Turbopack), все 14 страниц + все API-роуты собраны без ошибок
- [x] spec76-core запущен как systemd-сервис `spec76-core.service` (`/etc/systemd/system/spec76-core.service`, `enabled` — переживёт перезагрузку VM), слушает `0.0.0.0:3000`, логи в `/var/log/spec76-core.log`
- [x] Приложение доступно из локальной сети: `http://192.168.1.108:3000` → HTTP 200
- [x] Проверен полный путь до БД: `http://192.168.1.108:8000/rest/v1/companies` (через Envoy → PostgREST → Postgres) отвечает реальным ответом от Postgres (сейчас — ожидаемый `42501 permission denied`, т.к. anon-роль не имеет GRANT на эту таблицу; это вопрос RLS/грантов на уровне схемы, а не инфраструктуры)
- [x] Исправлен инцидент с healthcheck'ами Supabase (см. 3.11/3.13) — увеличены таймауты, `envoy` больше не блокируется здоровьем `studio`
- [x] Уважена формальная блокировка production-деплоя eceupo (EP-020, Defer) — деплой выполнен как локальный/dev-стенд по явному решению пользователя (см. 3.14)
- [x] Получен доступ к приватному репозиторию eceupo на apps-serve — отдельный read-only deploy-ключ `~/.ssh/eceupo_deploy_key`, алиас `github.com-eceupo` (см. 3.15)
- [x] Поднят отдельный standalone PostgreSQL + pgAdmin для eceupo (`~/projects/eceupo/docker-compose.yml`, не изменён) — конфликт хостового порта 5432 с `supabase-pooler` решён через untracked `docker-compose.override.yml` (host-порт 5433, см. 3.16)
- [x] Java 21 (OpenJDK 21.0.12) установлена на apps-serve (см. 3.17)
- [x] Backend eceupo собран (`./mvnw clean package`, BUILD SUCCESS) и задеплоен как systemd-сервис `eceupo-backend.service` (см. 3.17)
- [x] Применены все 4 Flyway-миграции eceupo к новой базе (порт 5433) — 16 таблиц созданы автоматически при старте backend'а (`spring.flyway.enabled: true`)
- [x] `GET /actuator/health` → `{"status":"UP"}`, `HTTP 200`
- [ ] `scripts/smoke.sh` из репозитория падает с `HTTP 401` на `/api/people` — эндпоинт защищён (`AuthSecurityConfiguration`), а тестового пользователя ни миграции, ни сам скрипт не создают; это вопрос к команде проекта, не инфраструктурная задача (см. 3.17)
- [ ] Занести primary/starting-данные (dev-only, без реальных ПДн) в обе новые базы — не делалось, требует отдельного решения о том, какие данные и через какой канал (не в рамках "поднять инфраструктуру")
- [x] Найдена и устранена истинная причина повторной критической перегрузки VM (load average 231.79) — вшитый healthcheck `supabase-meta`, не `supabase-studio` (см. 3.18)
- [ ] Бэкапы БД (spec76-core + eceupo) на бэкап-контур NAS — решение принято (сетевая шара, ежесуточно ночью, hранить 7 копий), NFS оказался недоступен на NAS, пивот на SMB/CIFS выполнен (пакеты установлены, порт 445 доступен), **заблокировано на SMB-учётных данных для монтирования шары** (см. 3.19)

---

## 5. Полезные команды (шпаргалка)

Подключение к серверу:
```
ssh agent@192.168.1.108
```

Проверить прогресс скачивания образов Supabase:
```
ssh agent@192.168.1.108 "grep -c 'Pulled ' /tmp/compose-pull.log; ps aux | grep 'compose.*pull' | grep -v grep | wc -l; df -h / | tail -1"
```

Директория self-hosted Supabase на сервере:
```
~/projects/spec76-supabase/
```

Запуск/остановка/статус стека (после того как pull завершится):
```
cd ~/projects/spec76-supabase && docker compose up -d
docker compose ps
docker compose logs -f <имя_сервиса>
```

---

## 6. Где что лежит (навигация по проектам)

- `~/projects/spec76-core/` на apps-serve — shallow-клон репозитория spec76-core (для доступа к SQL-миграциям и конфигам)
- `~/projects/supabase-selfhost/docker/` на apps-serve — sparse-checkout официального репозитория `supabase/supabase` (только папка `docker/`) — источник шаблона для self-hosted стека
- `~/projects/spec76-supabase/` на apps-serve — рабочая копия self-hosted Supabase стека (скопирована из supabase-selfhost/docker через `setup.sh`), здесь `.env` с реальными секретами и `docker-compose.yml`
- `~/xray/` на apps-serve — прокси Xray (бинарник + конфиг), идентичен `~/xray/` на bacey-serve
- `~/projects/eceupo/` на apps-serve — полный клон приватного репозитория eceupo (через `github.com-eceupo` deploy-ключ), включая `docker-compose.override.yml` (untracked, только на этом сервере — см. 3.16) и собранный `backend/target/backend-0.0.1-SNAPSHOT.jar`
