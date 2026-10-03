# Document Registry (реестр документов)

Полный автоматизированный реестр будет реализован в OP-025 Architecture Traceability (архитектурная трассируемость).

До этого момента источником истины остаётся фактическая структура файлов GitHub. Ручной реестр не должен выдавать непроверенные документы за существующие.

## Временный ручной список (подтверждено наличие в GitHub на 2026-09-26)

| Документ | Путь | Статус |
|---|---|---|
| SPEC76-DOC-ROADMAP-CRITICAL-ASSESSMENT | `engineering/roadmap/PROJECT_CRITICAL_ASSESSMENT_AND_PLAN.md` | Draft — Pending Platform Owner Confirmation |
| SPEC76-ADR-026 | `engineering/adr/ADR-026_RUSSIAN_PRODUCTION_DATA_BOUNDARY.md` | Accepted |
| Russian Production Dependency Audit | `engineering/security/EP-023_RUSSIAN_PRODUCTION_DEPENDENCY_AUDIT.md` | Проверенный аудит (см. `CURRENT_SPRINT.md`) |
| QNAP apps-serve Infrastructure | `docs/ops/qnap-apps-serve-infrastructure.md` | В работе (dev/local стенд) |
| SPEC76-FOUNDATIONAL-TZ | `engineering/foundational/TZ_SPEC76_ORIGINAL.md` | Historical Source Document |
| SPEC76-FOUNDATIONAL-PRD | `engineering/foundational/PRD_SPEC76_ORIGINAL.md` | Historical Source Document |
| SPEC76-FOUNDATIONAL-MASTER-PROMPT | `engineering/foundational/MASTER_PROMPT_ORIGINAL.md` | Historical Source Document (логотип и стек — пересмотрены) |
| SPEC76-FOUNDATIONAL-AI-TEAM-ARCHITECTURE | `engineering/foundational/AI_TEAM_ARCHITECTURE_ORIGINAL.md` | Historical Source Document |
| SPEC76-FOUNDATIONAL-AI-AGENTS-DEFINITION | `engineering/foundational/AI_AGENTS_DEFINITION_ORIGINAL.md` | Historical Source Document |
| SPEC76-FOUNDATIONAL-PLATFORM-ARCHITECTURE-CHAT | `engineering/foundational/PLATFORM_ARCHITECTURE_CHAT_ORIGINAL.md` | Historical Source Document — Bot Gateway (MAX/Telegram/VK), расширенный кабинет владельца платформы, YandexGPT/GigaChat как целевые AI-провайдеры |
| SPEC76-FOUNDATIONAL-CONSTITUTION-V2 | `engineering/foundational/PROJECT_CONSTITUTION_ORIGINAL.md` | Historical Source Document — **Superseded**, см. `DOCUMENT_READING_ORDER_ORIGINAL.md` |
| SPEC76-FOUNDATIONAL-ARCHITECTURE-REVIEW-PROCESS | `engineering/foundational/ARCHITECTURE_REVIEW_PROCESS_ORIGINAL.md` | Historical Source Document — **не принят как действующий процесс**, несовместимая нумерация ADR/FR, см. предупреждение в файле |
| SPEC76-FOUNDATIONAL-READING-ORDER | `engineering/foundational/DOCUMENT_READING_ORDER_ORIGINAL.md` | Historical Source Document — разрешает конфликт по Конституции; точная карта текущей структуры `engineering/`, кандидат на оформление как действующий онбординг-гайд |

Этот список не заменяет OP-025 и не претендует на полноту — только фиксирует то, что было явно проверено в рамках сессии 2026-09-26 и 2026-10-03.
