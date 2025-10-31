# Backlog XS/S — Índice de MIGRATION-TODO e Itens Transversais

Fonte da verdade
- As fases (docs/refactor-arquitetura/fases/*) são a fonte da verdade das tarefas. Não duplique aqui.
- Este backlog lista apenas:
  - Itens auto-rastreáveis por `MIGRATION-TODO` no código (rápidos e granulares), e
  - Checklists transversais (ex.: migração de controllers/rotas) que referenciam as fases.
  
Como atualizar
- Rode um grep por `MIGRATION-TODO` e ajuste esta lista quando necessário.
  Ex.: `rg -n "MIGRATION-TODO|MIGRATION‑TODO" --glob '!node_modules' --glob '!uploads'`

Legenda
- [ ] pendente • [x] feito • Área → tarefa → arquivo

## Finance (MIGRATION-TODO no código)
- [ ] Migrar serviço para módulo Finance — src/services/transaction/withdrawal-balance-transaction.ts
- [ ] Migrar serviço para módulo Finance — src/services/transaction/pay-balance-transaction.ts
- [ ] Factories legadas injetarem runner do módulo novo — src/services/@factories/transaction/make-withdrawal-balance-transaction.ts
- [ ] Factories legadas injetarem runner do módulo novo — src/services/@factories/transaction/make-pay-balance-transaction.ts
- [ ] Alinhar PaySaleUseCase ao padrão UseCaseCtx — src/modules/finance/application/use-cases/pay-sale.ts

## Sales (Ports/Adapters temporários)
- [ ] Substituir ports temporárias quando Catalog estiver migrado — src/modules/sale/application/ports/product-repository.ts
- [ ] Substituir ports temporárias quando Catalog estiver migrado — src/modules/sale/application/ports/service-repository.ts
- [ ] Substituir ports temporárias quando Catalog estiver migrado — src/modules/sale/application/ports/coupon-repository.ts
- [ ] Substituir ports temporárias quando Plans estiver migrado — src/modules/sale/application/ports/plan-repository.ts
- [ ] Substituir ports temporárias quando Plans estiver migrado — src/modules/sale/application/ports/plan-profile-repository.ts
- [ ] Substituir ports temporárias quando Organization/IAM estiver migrado — src/modules/sale/application/ports/profiles-repository.ts
- [ ] Substituir ports temporárias quando Organization/IAM estiver migrado — src/modules/sale/application/ports/barber-users-repository.ts
- [ ] Substituir ports temporárias quando Scheduling estiver migrado — src/modules/sale/application/ports/appointment-repository.ts

## Sales (Adapters InMemory/Prisma a mover)
- [ ] Mover para módulo Plans & Recurrence — src/modules/sale/infra/repositories/in-memory/in-memory-plan-repository.ts
- [ ] Mover para módulo Plans & Recurrence — src/modules/sale/infra/repositories/in-memory/in-memory-plan-profile-repository.ts
- [ ] Mover para módulo Scheduling — src/modules/sale/infra/repositories/in-memory/in-memory-appointment-repository.ts
- [ ] Mover para módulo Organization/IAM — src/modules/sale/infra/repositories/in-memory/in-memory-barber-users-repository.ts
- [ ] Mover para módulo Catalog — src/modules/sale/infra/repositories/in-memory/in-memory-product-repository.ts
- [ ] Mover para módulo Catalog — src/modules/sale/infra/repositories/in-memory/in-memory-service-repository.ts
- [ ] Mover para módulo Catalog — src/modules/sale/infra/repositories/in-memory/in-memory-coupon-repository.ts
- [ ] Mover para módulo Plans & Recurrence — src/modules/sale/infra/repositories/prisma/prisma-plan-repository.ts
- [ ] Mover para módulo Plans & Recurrence — src/modules/sale/infra/repositories/prisma/prisma-plan-profile-repository.ts
- [ ] Mover para módulo Scheduling — src/modules/sale/infra/repositories/prisma/prisma-appointment-repository.ts
- [ ] Mover para módulo Organization/IAM — src/modules/sale/infra/repositories/prisma/prisma-profiles-repository.ts
- [ ] Mover para módulo Organization/IAM — src/modules/sale/infra/repositories/prisma/prisma-barber-users-repository.ts
- [ ] Mover para módulo Catalog — src/modules/sale/infra/repositories/prisma/prisma-product-repository.ts
- [ ] Mover para módulo Catalog — src/modules/sale/infra/repositories/prisma/prisma-service-repository.ts
- [ ] Mover para módulo Catalog — src/modules/sale/infra/repositories/prisma/prisma-coupon-repository.ts

## Sales (Utils Legacy — MIGRATION-TODO no código)
- [ ] Remover wrapper após migração total de mappers — src/services/sale/utils/sale.ts
- [ ] Substituir imports diretos de utils por serviços do módulo — src/services/sale/utils/coupon.ts (se ainda houver)

## Sales (Doc e Cobertura)
- [ ] XS — Documentar uso de `UseCaseCtx`/`TransactionRunner` no módulo Sales (README curto + comentários)
- [ ] S — Cobertura unitária adicional para `coupon-applier`, `plan-benefit-applier` e `sale-item-price`

## Controllers & Rotas — Checklist transversal
- Evitar duplicação: os bindings por endpoint estão em cada fase. Use isto como índice:
- Sales
  - [ ] Rotas expostas pelo módulo (`src/modules/sale/infra/http/route.ts`) e registradas em `src/app.ts`
- Finance
  - [ ] add/withdraw/pay balance → controllers ligados a factories do módulo
  - [ ] list-transactions → controller ligado a Query Handler
  - [ ] loans/debts → controllers ligados a novas factories
  - [ ] cash-session → open/close/get-open/list/update-final-amount
- Scheduling
  - [ ] controllers migrados para factories; rotas expostas pelo módulo
- Catalog
  - [ ] controllers CRUD ligados às factories; rotas expostas pelo módulo
- Plans
  - [ ] controllers de Plan/PlanProfile ligados às factories; jobs em infra
- Organization
  - [ ] controllers de Unit/OpeningHour/Profile ligados às factories
- IAM
  - [ ] controllers de Register/Auth/SetUserUnit/Update/ListClients ligados às factories; middlewares mantidos
- Reporting/Config
  - [ ] controllers de relatórios e export usando Query Handlers/ports de Storage

## Notas
- Não duplique aqui as tasks das fases. Use este arquivo apenas para:
  - Itens marcados no código com `MIGRATION-TODO` (rápidos), e
  - Um índice transversal para migração de controllers/rotas.
- Ao concluir uma entrada, marque como feito e, na Fase 8, remova o `// MIGRATION-TODO` correspondente.
