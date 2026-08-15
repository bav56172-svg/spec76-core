# SPEC76 Traceability Matrix

| Capability | Domain Entity | Database | Service | UI | Verification | Status |
|---|---|---|---|---|---|---|
| Создание заявки | Request | requests | services/requests.ts | /projects/new, /requests/[id] | Lint, Types, Build, manual | Done |
| Анализ заявки | RequestAnalysis | request_analyses | services/requestAnalysis.ts | /requests/[id] | Lint, Types, Build, manual | Done |
| Подбор исполнителей | ContractorMatch | request_matches, company_services, company_equipment | services/contractorMatching.ts | /requests/[id] | Lint, Types, Build, manual | Done |
| Предложения | Offer | offers | services/offers.ts | /requests/[id] | Lint, Types, Build | Done |
| Активация проекта | Project | projects | services/offers.ts, services/projects.ts | /projects/[id] | Migration check, Build | Done |
| Исполнение проекта | Task | tasks | pending OP-012 | /projects/[id]/tasks | pending | Planned |
