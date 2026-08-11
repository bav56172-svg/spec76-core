# EP-023 — Russian Production Dependency Audit (аудит российских производственных зависимостей)

| Поле | Значение |
|---|---|
| Document ID (идентификатор документа) | SPEC76-EP-023-RU-AUDIT-001 |
| Version (версия) | 1.0 |
| Status (статус) | Verified Snapshot (проверенный снимок состояния) |
| Date (дата) | 2026-08-11 |
| Owner (владелец) | Platform Owner (владелец платформы) |
| Related Release (связанный релиз) | Release 0.4 |
| Related Capabilities (связанные возможности) | C-002 Identity & Access; C-006 AI Request Foundation; будущая пользовательская платёжная Capability |
| Related EP (связанный инженерный пакет) | EP-023 Security Recovery |
| Related Operation (связанная операция) | Not applicable (не применяется): аудит выполнен внутри EP-023 |
| Related ADR (связанное архитектурное решение) | ADR-026 Russian Production Data Boundary and Provider Independence |
| Source of Truth (источник истины) | GitHub для кода; Supabase для данных |
| Next Review (следующий пересмотр) | непосредственно перед юридическим заключением, выбором инфраструктуры или миграцией |

## Назначение

Документ сохраняет проверенные результаты аудита российских производственных зависимостей SPEC76 для Platform Owner, профильного юриста и будущего архитектурного пакета переноса.

Это инженерный аудит, а не юридическое заключение. Снимок данных действителен на дату проверки и должен быть повторно подтверждён перед миграцией.

## Границы аудита

Проверены:

1. размещение Supabase и таблицы, содержащие либо связывающие персональные и пользовательские данные;
2. точки интеграции Stripe без замены поставщика;
3. активные и архивные точки OpenAI без включения поставщика;
4. влияние на публичный российский запуск;
5. состояние Git до и после аудита.

Не выполнялись:

- изменение кода;
- изменение Supabase, Auth, Storage, RLS или миграций;
- подключение либо отключение внешних аккаунтов;
- перенос данных;
- выбор российского инфраструктурного, платёжного или ИИ-поставщика;
- юридическая квалификация конкретных пользовательских сценариев.

## 1. Supabase

### 1.1. Фактический производственный проект

На дату аудита основной проект имеет следующие свойства:

```text
Project ref (идентификатор проекта): ficjhafnnrznfxgezfay
Region (регион): eu-central-1
Location (местоположение): Frankfurt, Germany
Status (статус): ACTIVE_HEALTHY
```

Локальный `.env.local` указывает на локальную среду разработки и не использовался для определения производственного проекта. Производственный идентификатор подтверждён инженерными документами и доступным только для чтения состоянием Supabase.

### 1.2. Количество записей

Аудит не извлекал и не сохранял содержимое пользовательских строк. Проверены только количества:

| Таблица | Количество |
|---|---:|
| `auth.users` | 2 |
| `profiles` | 2 |
| `companies` | 1 |
| `company_members` | 1 |
| `company_services` | 2 |
| `company_equipment` | 2 |
| `requests` | 1 |
| `request_analyses` | 1 |
| `request_matches` | 1 |
| `projects` | 1 |
| `project_activities` | 1 |
| `billing_webhook_events` | 1 |

На дату проверки `ai_usage`, `billing_customers`, `billing_subscriptions`, `conversations`, `conversation_participants`, `documents`, `document_versions`, `message_attachments`, `messages`, `notifications`, `offers`, `project_timelines`, `project_milestones` и `tasks` пусты.

В Storage (файловом хранилище) отсутствуют buckets (контейнеры) и objects (объекты).

### 1.3. Прикладные таблицы и относящиеся к пользователю поля

Технические идентификаторы, статусы и даты учитываются как связанные метаданные, когда они могут быть сопоставлены с пользователем, компанией, заявкой или проектом.

#### Идентичность, компании, биллинг и использование ИИ

- `profiles`: `id`, `display_name`, `avatar_url`, `locale`, `timezone`, `created_at`, `updated_at`.
- `companies`: `id`, `owner_id`, `name`, `description`, `phone`, `email`, `city`, `status`, `slug`, `created_at`, `updated_at`.
- `company_members`: `company_id`, `user_id`, `role`, `created_at`, `updated_at`.
- `billing_customers`: `id`, `user_id`, `stripe_customer_id`, `created_at`, `updated_at`.
- `billing_subscriptions`: `id`, `billing_customer_id`, `user_id`, `stripe_subscription_id`, `stripe_price_id`, `status`, `current_period_start`, `current_period_end`, `cancel_at_period_end`, `cancel_at`, `canceled_at`, `ended_at`, `created_at`, `updated_at`.
- `billing_webhook_events`: `id`, `stripe_event_id`, `event_type`, `processing_status`, `processing_attempts`, `event_payload`, `processing_error`, `received_at`, `processed_at`, `updated_at`.
- `ai_usage`: `id`, `project_id`, `company_id`, `user_id`, `request_id`, `operation_type`, `provider`, `model`, `input_tokens`, `output_tokens`, `status`, `completed_at`, `created_at`.

#### Каталог, заявки и предложения

- `company_services`: `id`, `company_id`, `service_name`, `created_at`.
- `company_equipment`: `id`, `company_id`, `equipment_name`, `created_at`.
- `requests`: `id`, `customer_id`, `title`, `description`, `city`, `location_text`, `urgency`, `desired_start_at`, `status`, `created_at`, `updated_at`.
- `request_analyses`: `id`, `request_id`, `services`, `equipment`, `materials`, `estimated_scope`, `confidence`, `clarifications`, `status`, `is_current`, `created_at`.
- `request_matches`: `id`, `request_id`, `company_id`, `score`, `matched_services`, `matched_equipment`, `reasons`, `is_current`, `created_at`.
- `offers`: `id`, `request_id`, `company_id`, `price`, `currency`, `proposed_days`, `message`, `status`, `created_at`, `updated_at`.

#### Проекты и исполнение

- `projects`: `id`, `company_id`, `owner_id`, `request_id`, `accepted_offer_id`, `title`, `description`, `status`, `created_at`, `updated_at`.
- `project_activities`: `id`, `project_id`, `actor_id`, `event_type`, `title`, `description`, `metadata`, `source_key`, `created_at`.
- `project_timelines`: `id`, `project_id`, `title`, `description`, `planned_start`, `planned_finish`, `actual_start`, `actual_finish`, `status`, `progress`, `created_at`, `updated_at`.
- `project_milestones`: `id`, `project_id`, `timeline_id`, `title`, `description`, `due_date`, `completed_at`, `status`, `created_at`, `updated_at`.
- `tasks`: `id`, `project_id`, `assignee_id`, `title`, `description`, `status`, `priority`, `due_at`, `position`, `created_at`, `updated_at`.

#### Общение и уведомления

- `conversations`: `id`, `project_id`, `title`, `conversation_type`, `status`, `created_by`, `created_at`, `updated_at`.
- `conversation_participants`: `conversation_id`, `user_id`, `role`, `joined_at`.
- `messages`: `id`, `conversation_id`, `author_id`, `body`, `status`, `edited_at`, `created_at`, `updated_at`.
- `message_attachments`: `id`, `message_id`, `attachment_kind`, `linked_entity_id`, `created_at`.
- `notifications`: `id`, `user_id`, `project_id`, `activity_id`, `event_type`, `channel`, `status`, `title`, `message`, `read_at`, `created_at`, `updated_at`.

#### Документы

- `documents`: `id`, `project_id`, `task_id`, `owner_id`, `document_type`, `title`, `description`, `status`, `current_version`, `archived_at`, `created_at`, `updated_at`.
- `document_versions`: `id`, `document_id`, `version_number`, `storage_path`, `file_name`, `mime_type`, `size_bytes`, `checksum`, `uploaded_by`, `created_at`.

### 1.4. Управляемые схемы Auth и Storage

В зарубежном Supabase-контуре могут обрабатываться следующие данные Auth (авторизации):

- `auth.users`: email, телефон, парольный хеш, пользовательские и служебные метаданные, токены и даты подтверждения, восстановления и смены email, сведения о входах, блокировке и удалении;
- `auth.identities`: пользователь, поставщик идентификации, email и внешние данные идентификации;
- `auth.sessions`: пользователь, IP-адрес, `user_agent`, области доступа, сроки и состояние сессии;
- `auth.refresh_tokens`: токен продления, пользователь, сессия, родительский токен, даты и признак отзыва;
- `auth.audit_log_entries`: событие аудита, IP-адрес и время;
- `auth.flow_state`: пользователь, код авторизации, challenge (проверочная последовательность), токены внешнего поставщика, приглашение и адрес возврата;
- `auth.one_time_tokens`: пользователь, тип и хеш одноразового токена, связанный объект и даты;
- таблицы MFA (многофакторной авторизации) и WebAuthn (входа по защищённому устройству): пользователь, телефон, имя фактора, секреты, проверочные данные, IP-адреса и состояние;
- таблицы OAuth, SSO и SAML: разрешения, клиенты, внешние поставщики, домены, состояния входа и email, если соответствующие возможности будут включены.

Storage при использовании хранит `bucket_id`, имя и путь объекта, владельца, пользовательские метаданные, версии, даты и содержимое файла. Текущий Storage пуст, но `document_versions.storage_path` уже предусматривает будущую связь с файловым объектом.

### 1.5. Инженерные точки Supabase

Основные активные точки:

- `services/supabase.ts` — единый браузерный клиент;
- `lib/supabase/admin.ts` — закрытый серверный клиент с повышенными правами;
- `lib/supabase/middleware.ts` и `middleware.ts` — серверная сессия и защита маршрутов;
- `services/auth.ts` — вход по одноразовой ссылке;
- сервисы компаний, заявок, предложений, проектов, задач, документов, сообщений, уведомлений и учёта ИИ;
- `app/api/billing/webhook/route.ts` — серверная обработка платёжных событий;
- `supabase/migrations/` — воспроизводимая модель данных и RLS.

### 1.6. Предварительный юридический вопрос

Часть 5 статьи 18 Федерального закона № 152-ФЗ в редакции Федерального закона от 28.02.2025 № 23-ФЗ требует отдельной юридической проверки применительно к каждому сценарию сбора. Инженерная рекомендация — не расширять публичный сбор персональных данных граждан Российской Федерации в зарубежном первичном контуре до получения заключения и подготовки российской базы.

Официальные и справочные источники, проверенные 2026-08-11:

- `https://publication.pravo.gov.ru/document/0001202502280034`;
- `https://www.consultant.ru/document/cons_doc_LAW_61801/cbf4e15b7c330f9372e876cdf2bc928bad7950ef/`;
- `https://supabase.com/docs/guides/platform/regions`;
- `https://supabase.com/docs/guides/security/gdpr-compliance`.

## 2. Stripe

### 2.1. Активные точки интеграции

- `lib/billing/stripe.ts:5` — импорт библиотеки;
- `lib/billing/stripe.ts:71` — создание серверного клиента с `STRIPE_SECRET_KEY`;
- `lib/billing/stripe.ts:76` — получение секрета подписи webhook;
- `app/api/billing/webhook/route.ts:51` — минимизация сохраняемого события;
- `app/api/billing/webhook/route.ts:65` — регистрация и защита от повторной обработки события;
- `app/api/billing/webhook/route.ts:142` — поиск внутреннего клиента по идентификатору Stripe;
- `app/api/billing/webhook/route.ts:161` — синхронизация подписки;
- `app/api/billing/webhook/route.ts:222` — обработка `customer.subscription.created`, `updated` и `deleted`;
- `app/api/billing/webhook/route.ts:240` — проверка заголовка `stripe-signature`;
- `supabase/migrations/202607190001_ep_023_billing_recovery.sql` — `billing_customers`, `billing_subscriptions` и `billing_webhook_events`;
- `.env.example:12` — перечень обязательных серверных переменных;
- `package.json:23` и lock-файл — библиотека Stripe и зафиксированная версия зависимостей.

### 2.2. Отсутствующие части пользовательской оплаты

В активном коде нет:

- создания Stripe Customer (клиента Stripe);
- создания Checkout Session (платёжной сессии);
- маршрута начала оплаты;
- создания подписки через API;
- пользовательского интерфейса оплаты;
- кода, формирующего первичную связь `user_id` с `stripe_customer_id`.

Текущий обработчик webhook является защищённым восстановленным фундаментом, но не завершённым платёжным продуктом.

### 2.3. Территориальная граница

На дату проверки Россия отсутствует в списке поддерживаемых стран Stripe. Stripe сообщает об отсутствии поддержки пользователей, находящихся в России, и карт «Мир».

Проверенные источники:

- `https://stripe.com/global`;
- `https://support.stripe.com/questions/sanctions-on-russia-and-belarus`.

Stripe не заменялся и не активировался.

## 3. OpenAI

### 3.1. Активный Runtime

Поиск в `app`, `lib` и `services` подтвердил:

- библиотека OpenAI отсутствует в `package.json`;
- активных импортов OpenAI SDK (набора средств разработки) нет;
- обращений `chat.completions`, `responses.create` или `api.openai.com` нет;
- `app/api/ai/auto-deploy/route.ts` возвращает защитный отказ и не вызывает модель;
- `services/requestAnalysis.ts` выполняет локальный детерминированный анализ;
- `services/contractorMatching.ts` выполняет локальное ранжирование;
- `services/usageBilling.ts` учитывает поля поставщика и модели, но не вызывает поставщика;
- `supabase/config.toml` передаёт `OPENAI_API_KEY` только локальному помощнику Supabase Studio;
- `.env.example` резервирует ключ для Studio и возможного будущего серверного контура.

Фактическая активная модель OpenAI: отсутствует.

### 3.2. Архивные точки

Папка `archive` исключена из TypeScript-сборки через `tsconfig.json:40-43`. В ней сохранено 18 устаревших вызовов `openai.chat.completions.create` с моделью `gpt-4o-mini`:

```text
archive/legacy/api-ai/actions/route.ts:46-47
archive/legacy/api-ai/autopilot/route.ts:43-44
archive/legacy/api-ai/break-task/route.ts:11-12
archive/legacy/api-ai/chat/route.ts:33-34
archive/legacy/api-ai/improve-task/route.ts:11-12
archive/legacy/api-ai/realtime/route.ts:62-63
archive/legacy/api-ai/tasks/route.ts:46-47
archive/legacy/services-ai/autonomy.ts:92-93
archive/legacy/services-ai/autopilot.ts:71-72
archive/legacy/services-ai/errorDetector.ts:67-68
archive/legacy/services-ai/governance.ts:78-79
archive/legacy/services-ai/gpt.ts:39-40
archive/legacy/services-ai/kanbanAI.ts:11-12
archive/legacy/services-ai/marketSystem.ts:87-88
archive/legacy/services-ai/revenueSystem.ts:87-88
archive/legacy/services-ai/selfModifying.ts:58-59
archive/legacy/services-ai/swarm.ts:36-37
archive/legacy/services-ai/universalRuleEngine.ts:93-94
```

Архивный файл с именем `realtime` также использует Chat Completions API (API завершения чата), а не Realtime API (API реального времени).

### 3.3. Территориальная граница

Россия отсутствует в официальном списке поддерживаемых территорий OpenAI API. Официальная документация предупреждает, что доступ или предоставление доступа за пределами списка может привести к блокировке или приостановке аккаунта.

Проверенный источник:

- `https://developers.openai.com/api/docs/supported-countries`.

OpenAI не заменялся и не активировался.

## 4. Вопросы для профильного юриста

1. Является ли предполагаемое юридическое лицо или индивидуальный предприниматель оператором персональных данных по всем сценариям SPEC76?
2. Какие исключения части 5 статьи 18 Федерального закона № 152-ФЗ применимы либо неприменимы к регистрации, заявкам, предложениям, сообщениям, документам и аналитике?
3. Нужно ли уведомление Роскомнадзора до начала расширенного публичного сбора?
4. Какие обработки можно выполнять за рубежом после первичной локализации и при каких основаниях?
5. Какие уведомления необходимы для трансграничной передачи?
6. Как разделить обязательные договорные данные, согласие, распространение и публичную индексацию?
7. Какие сроки хранения и процедуры удаления нужны для каждой категории данных?
8. Какие требования применимы к контактам исполнителей, фотографиям, адресам объектов, документам и переписке?
9. Какая договорная и кассовая модель допустима для каталога, подписки, продвижения и безопасной сделки?
10. Какие документы должны быть готовы до закрытого пилота и до публичного запуска?

## 5. Вопросы для бизнес-решения

1. Выбрать юридическую модель оператора SPEC76.
2. Выбрать российскую инфраструктуру и ответственного за эксплуатацию.
3. Определить допустимый бюджет высокой доступности, резервного копирования и мониторинга.
4. Выбрать платёжную модель: подписка, оплата продвижения, комиссия либо безопасная сделка.
5. Выбрать российский ИИ-сценарий и предельный состав данных, передаваемых модели.
6. Определить границу закрытого пилота до полного Launch Gate (допуска запуска).

## 6. Итог аудита

- текущий зарубежный Supabase-контур нельзя считать готовым к расширенному публичному сбору данных граждан Российской Федерации;
- Stripe-интеграция незавершённая и не подходит как российский пользовательский платёжный контур;
- активных вызовов OpenAI нет, а архивные вызовы не участвуют в сборке;
- выполненную платформенную архитектуру можно сохранить через переносимый PostgreSQL/Supabase-контур и адаптеры поставщиков;
- публичный запуск требует отдельного юридического, миграционного, безопасностного и эксплуатационного допуска.

## Критерий актуальности

Перед каждым использованием этого документа для миграции или юридического заключения повторно проверяются:

- текущий Supabase project ref, регион, схема и количество строк;
- состояние Auth и Storage;
- действующие правила Stripe и OpenAI;
- актуальная редакция российского законодательства;
- фактические активные интеграции в GitHub;
- состояние рабочей ветки и связанные ADR.
