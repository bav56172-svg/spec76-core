# SPEC76 Domain Model v1.0

Статус: **Source of Truth (единый источник истины)**  
Область действия: Database (база данных), Backend (серверная часть), Frontend (клиентская часть), AI (искусственный интеллект), API (программный интерфейс)

---

## 1. Назначение

SPEC76 — цифровой диспетчер реальных работ. Пользователь описывает проблему обычным языком, система превращает её в структурированную заявку, подбирает исполнителей, собирает предложения и сопровождает выполнение до завершения.

Эта Domain Model (модель предметной области) определяет:

- единый словарь проекта;
- сущности и их границы ответственности;
- жизненные циклы;
- связи;
- бизнес-правила;
- события;
- границы MVP (минимально жизнеспособного продукта).

Любое изменение схемы данных, TypeScript types (типов TypeScript), API contracts (контрактов API), UI flows (пользовательских сценариев) или AI contracts (контрактов ИИ) должно соответствовать этому документу.

---

## 2. Core Domain (ядро предметной области)

Главная ценность SPEC76 создаётся цепочкой:

`Customer Problem → Request → Analysis → Matching → Offer → Project → Execution → Review`

Расшифровка:

1. Customer Problem (проблема заказчика) — исходное описание задачи.
2. Request (заявка) — формализованный запрос на выполнение работ.
3. Request Analysis (анализ заявки) — структурированный результат понимания задачи.
4. Contractor Matching (подбор исполнителей) — выбор подходящих компаний.
5. Offer (предложение) — коммерческий ответ исполнителя.
6. Project (проект выполнения) — исполнение принятого предложения.
7. Task (задача) — конкретный этап проекта.
8. Review (отзыв) — оценка результата.

---

## 3. Bounded Contexts (ограниченные контексты)

### 3.1 Identity & Access (идентификация и доступ)

Отвечает за пользователей, роли и права.

Сущности:

- User (пользователь)
- UserRole (роль пользователя)

Роли MVP:

- customer — заказчик;
- contractor — исполнитель;
- company_admin — администратор компании;
- platform_admin — администратор платформы.

### 3.2 Marketplace (рынок заявок и предложений)

Отвечает за заявки, анализ, подбор и предложения.

Сущности:

- Request
- RequestAnalysis
- Service
- EquipmentCategory
- MaterialRequirement
- MatchCandidate
- Offer

### 3.3 Company (исполнитель)

Отвечает за компании и их возможности.

Сущности:

- Company
- CompanyService
- CompanyEquipment
- CompanyCoverageArea

### 3.4 Execution (исполнение)

Отвечает за выполнение принятой заявки.

Сущности:

- Project
- Task
- Conversation
- Message
- CompletionRecord

### 3.5 Reputation & Payment (репутация и расчёты)

Отвечает за завершение сделки.

Сущности:

- Review
- Payment

В MVP Payment (платёж) может существовать как контракт и статус без встроенного эквайринга.

---

## 4. Aggregate Roots (корневые агрегаты)

### 4.1 Request Aggregate (агрегат заявки)

Request — центральная сущность входящего спроса.

Поля:

- id: UUID;
- customer_id: UUID;
- title: string;
- description: string;
- city: string;
- location_text: string | null;
- urgency: normal | urgent | scheduled;
- desired_start_at: datetime | null;
- status: draft | analyzing | published | matching | offers_received | accepted | cancelled | expired;
- created_at: datetime;
- updated_at: datetime.

Правила:

- заявка принадлежит одному заказчику;
- до публикации заявка может редактироваться заказчиком;
- опубликованная заявка не может быть удалена физически, только отменена;
- одна заявка может получить несколько анализов, но только один анализ является current (актуальным);
- одна заявка может иметь много предложений;
- принятие предложения возможно только один раз;
- принятие предложения создаёт Project (проект выполнения).

### 4.2 Company Aggregate (агрегат компании)

Поля:

- id: UUID;
- owner_id: UUID;
- name: string;
- description: string | null;
- phone: string | null;
- email: string | null;
- city: string | null;
- status: draft | active | suspended | archived;
- created_at: datetime;
- updated_at: datetime.

Правила:

- компания имеет одного владельца в MVP;
- публиковать предложения может только активная компания;
- компания участвует в matching (подборе) по услугам, технике и территории.

### 4.3 Offer Aggregate (агрегат предложения)

Поля:

- id: UUID;
- request_id: UUID;
- company_id: UUID;
- price: decimal | null;
- currency: RUB;
- message: string | null;
- estimated_start_at: datetime | null;
- estimated_duration_hours: number | null;
- status: submitted | accepted | rejected | withdrawn | expired;
- created_at: datetime;
- updated_at: datetime.

Правила:

- одна компания может иметь только одно активное предложение на заявку;
- предложение может быть изменено до принятия;
- после принятия все остальные предложения получают статус rejected;
- принятое предложение неизменяемо, кроме служебных полей.

### 4.4 Project Aggregate (агрегат проекта выполнения)

Project создаётся только из принятого Offer (предложения).

Поля:

- id: UUID;
- request_id: UUID;
- accepted_offer_id: UUID;
- customer_id: UUID;
- company_id: UUID;
- title: string;
- description: string | null;
- status: planned | active | paused | completed | cancelled | archived;
- started_at: datetime | null;
- completed_at: datetime | null;
- created_at: datetime;
- updated_at: datetime.

Правила:

- один Request создаёт не более одного Project в MVP;
- Project не создаётся без accepted Offer;
- завершённый Project не редактируется, кроме служебных комментариев и Review;
- Tasks принадлежат только одному Project.

---

## 5. Supporting Entities (поддерживающие сущности)

### RequestAnalysis

Поля:

- id;
- request_id;
- version;
- summary;
- detected_services: array;
- detected_equipment_categories: array;
- detected_materials: array;
- detected_city;
- detected_urgency;
- confidence_score;
- model_provider;
- model_name;
- is_current;
- created_at.

Правила:

- AI не изменяет исходный текст заявки;
- анализ всегда хранится отдельно от Request;
- пользователь может подтвердить или скорректировать анализ;
- откорректированный анализ становится текущим.

### MatchCandidate

Поля:

- id;
- request_id;
- company_id;
- score;
- reasons;
- status: suggested | notified | viewed | skipped;
- created_at.

### Task

Поля:

- id;
- project_id;
- title;
- description;
- status: todo | in_progress | review | done | cancelled;
- position;
- created_at;
- updated_at.

### Conversation

Поля:

- id;
- request_id | null;
- project_id | null;
- customer_id;
- company_id;
- created_at.

Правило: Conversation должна быть связана либо с Request, либо с Project.

### Message

Поля:

- id;
- conversation_id;
- sender_id;
- body;
- created_at;
- read_at | null.

### Review

Поля:

- id;
- project_id;
- author_id;
- company_id;
- rating: 1..5;
- comment;
- created_at.

Правило: один заказчик оставляет не более одного Review на завершённый Project.

---

## 6. Relationship Map (карта связей)

```text
User 1 ─── * Request
User 1 ─── * Company
Request 1 ─── * RequestAnalysis
Request 1 ─── * MatchCandidate
Request 1 ─── * Offer
Company 1 ─── * Offer
Request 1 ─── 0..1 Project
Offer 1 ─── 0..1 Project
Project 1 ─── * Task
Request/Project 1 ─── 0..1 Conversation
Conversation 1 ─── * Message
Project 1 ─── 0..1 Review
Project 1 ─── 0..* Payment
```

---

## 7. State Machines (машины состояний)

### Request lifecycle (жизненный цикл заявки)

```text
draft
  → analyzing
  → published
  → matching
  → offers_received
  → accepted
```

Допустимые выходы:

- draft → cancelled;
- published → cancelled;
- matching → expired;
- offers_received → expired.

Запрещено:

- accepted → draft;
- cancelled → published;
- expired → accepted без повторной активации.

### Offer lifecycle (жизненный цикл предложения)

```text
submitted → accepted
submitted → rejected
submitted → withdrawn
submitted → expired
```

### Project lifecycle (жизненный цикл проекта)

```text
planned → active → completed
planned → cancelled
active → paused → active
active → cancelled
completed → archived
```

---

## 8. Domain Events (доменные события)

Минимальный набор событий:

- RequestCreated;
- RequestPublished;
- RequestAnalysisCompleted;
- MatchingCompleted;
- ContractorNotified;
- OfferSubmitted;
- OfferAccepted;
- ProjectCreated;
- ProjectStarted;
- TaskCompleted;
- ProjectCompleted;
- ReviewCreated.

События используются Backend (серверной частью), уведомлениями и будущей аналитикой. В MVP они могут быть реализованы как журнал событий в базе данных.

---

## 9. AI Contract (контракт ИИ)

AI получает:

```ts
interface AnalyzeRequestInput {
  requestId: string;
  description: string;
  city?: string | null;
  urgency?: "normal" | "urgent" | "scheduled";
}
```

AI возвращает:

```ts
interface AnalyzeRequestOutput {
  summary: string;
  services: Array<{ name: string; confidence: number }>;
  equipmentCategories: Array<{ name: string; confidence: number }>;
  materials: Array<{ name: string; quantityHint?: string }>;
  city: string | null;
  urgency: "normal" | "urgent" | "scheduled";
  clarificationQuestions: string[];
  confidenceScore: number;
}
```

Ограничения:

- AI не публикует заявку без подтверждения пользователя;
- AI не выбирает исполнителя окончательно;
- AI не меняет цену предложения;
- AI обязан возвращать структурированный результат;
- низкая уверенность требует уточняющих вопросов.

---

## 10. API Boundaries (границы API)

### Requests

- POST /api/requests
- GET /api/requests
- GET /api/requests/:id
- PATCH /api/requests/:id
- POST /api/requests/:id/publish
- POST /api/requests/:id/analyze

### Matching

- POST /api/requests/:id/match
- GET /api/requests/:id/matches

### Offers

- POST /api/requests/:id/offers
- GET /api/requests/:id/offers
- POST /api/offers/:id/accept
- POST /api/offers/:id/withdraw

### Projects

- GET /api/projects/:id
- PATCH /api/projects/:id
- POST /api/projects/:id/start
- POST /api/projects/:id/complete

---

## 11. MVP Boundary (граница MVP)

Обязательно для MVP:

- регистрация и вход;
- создание Request;
- сохранение Request;
- анализ Request;
- подтверждение анализа;
- подбор компаний;
- отправка Offer;
- принятие Offer;
- создание Project;
- Tasks;
- базовый Chat;
- завершение Project;
- Review.

Не входит в MVP:

- встроенный эквайринг;
- автоматическое заключение договора;
- сложные рейтинговые формулы;
- динамическое ценообразование;
- автономные агенты;
- самоуправляемая AI-платформа;
- межрегиональное масштабирование.

---

## 12. Source of Truth Rules (правила единого источника истины)

1. Названия сущностей в Database, Backend, Frontend и AI должны совпадать с этим документом.
2. Request и Project — разные сущности и не должны смешиваться.
3. Исходное описание проблемы хранится неизменно в Request.description.
4. AI-результаты хранятся отдельно в RequestAnalysis.
5. Project создаётся только после OfferAccepted.
6. Новые статусы добавляются только вместе с переходами state machine (машины состояний).
7. Новая таблица допускается только при наличии доменной сущности или явной технической необходимости.
8. Страница не содержит бизнес-правила; они реализуются в domain/service layer (доменном/сервисном слое).
9. Любое изменение этой модели требует ADR (записи архитектурного решения) и обновления типов, миграций и API.

---

## 13. Implementation Order (порядок реализации)

1. Request types (типы заявки).
2. Request database migration (миграция базы данных заявки).
3. Request service (сервис заявки).
4. Request Wizard (мастер создания заявки).
5. Request Analysis contract (контракт анализа заявки).
6. Matching service (сервис подбора).
7. Offer service (сервис предложений).
8. Project creation from accepted Offer (создание проекта из принятого предложения).

---

## 14. Acceptance Criteria (критерии приёмки модели)

Модель считается внедрённой, когда:

- TypeScript types отражают сущности документа;
- SQL migrations (SQL-миграции) отражают связи и ограничения;
- API использует те же имена и статусы;
- Request Wizard создаёт Request, а не Project;
- принятие Offer создаёт Project;
- lint, type-check и build проходят без ошибок.
