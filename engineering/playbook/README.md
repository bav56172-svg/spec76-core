# Engineering Playbook (Инженерный свод правил)

Практические правила разработки SPEC76 и будущего Enterprise Core (общего инженерного ядра).

## Development Flow (поток разработки)

Vision → Release → Capability → OP → Implementation → Quality Gate → Release Review.

## Mandatory Rules (обязательные правила)

1. Architecture Readiness Check (проверка архитектурной готовности) выполняется до реализации.
2. Platform First (сначала платформа): повторно используемые возможности проектируются как сервисы платформы.
3. Bilingual Engineering (двуязычная инженерная среда): новые термины сопровождаются русским переводом.
4. Canonical Model (каноническая модель): сущность имеет идентификатор, жизненный цикл, владельца, события, права, аудит и связи.
5. Event-Driven Architecture (событийно-ориентированная архитектура): интеграция по возможности строится через события.
6. Quality Gate (контроль качества): ESLint, TypeScript, Build, Migration, Supabase Check и Git.
7. Single Source of Truth (единый источник истины): GitHub для кода, Engineering OS для решений, Supabase для рабочих данных.
