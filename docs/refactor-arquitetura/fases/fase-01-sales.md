# Fase 1 — Sales (consolidação)

Objetivo
- Consolidar o módulo de vendas, alinhando portas, factories e serviços ao padrão definido.

Macro objetivos (O1, O2, ...)
- O1 — Ports padronizadas em `application/ports` (telemetry incluído), sem dependência de ORM/utils.
- O2 — Agregado `Sale` e entidades/VOs de item/discount/price modeladas no domínio.
- O3 — Serviços de aplicação `CouponService` e `StockService` substituem utils legadas; adapters temporários só na borda.
- O4 — Use-cases com `UseCaseCtx` e `TransactionRunner` injetado via factories.
- O5 — Mappers isolados em `infra/mappers` (Prisma ↔ Domínio; Domínio ↔ DTO).
- O6 — Controllers/rotas do módulo Sales chamam factories do próprio módulo (contratos HTTP estáveis).
- O7 — Cobertura unitária dos appliers e VO de preço/desconto.
- O8 — Legado de utils removido (planejado para Fase 8), módulo sem imports diretos de utils de `src/services/sale/utils/*`.

Slicing (tarefas pequenas)
- [x] XS — Renomear `application/contracts` → `application/ports` e mover `SaleTelemetry` [O1].
  - Critérios: imports atualizados; sem side effects.
  - Backout: revert rename.
- [x] S — Criar `application/services/coupon-service.ts` e wrappers legados delegando para ele [O3].
  - Critérios: `applyCouponSale`/`applyCouponSaleItem` chamam serviço do módulo; testes passantes.
  - Backout: wrappers voltam à implementação antiga.
- [x] S — Criar `application/services/stock-service.ts` e delegar `updateProductsStock`/`verifyStockProducts` [O3].
  - Critérios: uso nos use-cases `remove-add-sale-item` e `update-sale-item-*`.
  - Backout: revert uso no use-case.
- [x] XS — Adicionar `infra/mappers/` para Sale/SaleItem e centralizar mapeamentos Prisma ↔ Domínio [O5].
  - Critérios: use-cases não importam mais ORM.
  - Backout: mapeamento anterior ainda disponível.
- [x] S — Adotar `UseCaseCtx` e `TransactionRunner` nos casos de uso compostos [O4].
  - Critérios: assinatura `execute(input, ctx?)`; factories injetam runner.
  - Backout: manter fallback transacional interno.
- [x] S — Substituir usos dos utils de cupom nos use-cases por `CouponService` (remover imports diretos) [O3,O8].
  - Critérios: nenhum import de `src/services/sale/utils/coupon.ts` em `modules/sale`.
  - Backout: restaurar import pontual.
- [x] S — Substituir usos dos utils de estoque por `StockService` [O3,O8].
  - Critérios: `remove-add-sale-item` e `update-sale-item-*` usam serviço.
  - Backout: restaurar chamadas antigas.


Tarefas
- [x] Mapear portas necessárias (`SaleRepository`, `SaleItemRepository`, `CouponRepository`, `ProductRepository`, etc.).
- [x] Revisar `src/modules/sale/*` e alinhar nomenclaturas/contratos.
- [x] Substituir utilidades duplicadas em `src/services/sale/utils/*` por serviços de domínio/aplicação.
  - [x] Descontos (DiscountSyncService).
  - [x] Construção de itens (SaleItemDataBuilder).
  - [x] Aplicação de cupons/estoque (CouponService, StockService; wrappers legados delegam com `// MIGRATION-TODO`).
- [x] Criar adapters de compatibilidade quando ainda houver dependências legadas (com `// MIGRATION-TODO`).
- [x] Atualizar controllers para factories (quando faltarem).
- [x] Garantir `TransactionRunner` nos casos de uso que precisam de transação.

Estrutura/nomeação (padrão do plano)
- [x] Renomear `application/contracts` → `application/ports` e mover `SaleTelemetry` para lá.
- [x] Adicionar `infra/mappers/` para isolar mapeamento Prisma ↔ Domínio e Domínio ↔ DTO.
- [x] Confirmar subpastas: `application/{use-cases,ports,dto,services,validators,errors}`; `infra/{repositories/prisma,http/controllers,factories,mappers,telemetry}`.

Domínio (evitar entidades anêmicas)
- [x] Criar agregado `Sale` (domain/entities) para coordenar itens, cupom e totais.
- [x] Promover regras de desconto/cupom/total para VOs/entidades (ex.: `SaleItemPrice`, `SaleDiscount`).
- [x] (Opcional) Introduzir VO `Money`/`Percentage` ou aproveitar VO financeiro global, conforme plano.

Aplicação
- [x] Criar `CouponService` no módulo para substituir `applyCouponSale`/`applyCouponSaleItem` (hoje em utils).
- [x] Criar `StockService` no módulo para substituir `updateProductsStock`/`verifyStockProducts` (hoje em utils).
- [x] Adotar `UseCaseCtx` (assinatura `execute(input, ctx?: UseCaseCtx)`) nos use-cases core que compõem operações (ex.: Remove/Add Item, Update Client/Coupon), mantendo compatibilidade com TransactionRunner.

Infra
- [x] Garantir ports de repositório com `tx?: Prisma.TransactionClient` (padrão já usado; revisar todos).
- [x] `SaleTelemetry` como port de application e adapter em `infra/telemetry`.
- [x] Implementar `infra/http` (controllers/rotas) específicos do módulo Sales, alinhando DTOs/factories.
- [x] Implementar `infra/repositories` do módulo Sales (adapters Prisma/InMemory), isolando mapeamentos e removendo dependências diretas dos use-cases a `src/repositories/*` globais.

Critérios de aceite
- [x] Contratos HTTP inalterados; testes E2E de vendas passando.
- [x] Casos de uso de Sales não dependem de utilidades legadas (exceto adapters temporários documentados).
- [x] `application` não importa mais utilidades legadas nem ORM; bordas em `infra`.
- [x] `application/contracts` removido; `application/ports` padronizado.

Riscos & Mitigações
- Divergência de cálculo: cobrir cálculos críticos com unit tests e comparar antes/depois.

Rollout
- PRs por subárea (itens, descontos, cupom), mantendo cobertura de testes.

Notas
- MIGRATION-TODO mantidos onde ainda usamos utilidades em `src/services/sale/utils/*` (ex.: `applyCouponSale`, `updateProductsStock`). Próximo passo é encapsular essas utilidades em serviços de domínio no módulo e substituir gradualmente os imports.

Próximos passos recomendados (refino de domínio)
- [x] Mover entidades para `domain/entities` (ex.: `sale.ts`, `sale-item.ts`, `sale-discount.ts`, `sale-item-price.ts`), mantendo VOs em `domain/value-objects`.
- [x] Extrair serviços de domínio puros (sem I/O):
  - [x] `coupon-applier`: aplica cupom em item/coleção com dados já carregados; retorna novos descontos/valores.
  - [x] `plan-benefit-applier`: aplica benefícios de planos sobre itens; recebe a lista de benefícios já carregada.
- [x] Afinar serviços de aplicação existentes para orquestração:
  - [x] `coupon-service.ts` e `plan-discount-service.ts` passam a buscar dados/validar e delegar aos appliers de domínio.
  - [x] `sale-totals-service.ts` orquestra builders e repositórios; cálculos ficam em `sale-totals-calculator.ts`/VOs.
- [x] Garantir que builders retornem dados completos para o domínio (basePrice, quantity, discounts) e remover dependências de utils legados.
- [x] Atualizar imports/factories e cobrir com testes unitários dos appliers (cupom e benefícios) e de `SaleItemPrice` [O7].


Plano de ação (prioritário)
1) Renomear `application/contracts` → `application/ports` e ajustar imports (telemetry).
2) Criar `application/services/coupon-service.ts` e trocar usos de `applyCouponSale`/`applyCouponSaleItem` por esse serviço (depois apagar utils).
3) Criar `application/services/stock-service.ts` e trocar `updateProductsStock`/`verifyStockProducts` (depois apagar utils).
4) Introduzir agregado `Sale` e mover cálculos e aplicação de cupons para domínio; `SaleItemDataBuilder` passa a ser mais fino ou uma factory de domínio.
5) Adicionar `infra/mappers/` e mover mapeamentos Prisma ↔ Domínio (ex.: `mapDetailedSaleItemToBuild`).
6) Adotar `UseCaseCtx` nos use-cases que compõem operações (com TransactionRunner).

Arquivos‑chave para revisão
- `src/modules/sale/application/contracts/sale-telemetry.ts` → mover para `application/ports` e atualizar imports.
- `src/modules/sale/application/services/sale-item-data-builder.ts` (MIGRATION-TODO cupom).
- `src/modules/sale/application/use-cases/update-sale-item-quantity.ts` (estoque).
- `src/modules/sale/application/use-cases/remove-add-sale-item.ts` (estoque).
- `src/services/sale/utils/coupon.ts` (migrar para serviço do módulo).
- `src/services/sale/utils/sale.ts` e `src/services/sale/utils/item.ts` (restos de estoque/cálculo; migrar partes restantes).
- `src/modules/sale/application/services/sale-totals-service.ts` (transição de cálculos para domínio/agregado).

MIGRATION‑TODOs mapeados
- Duplicidade de `ensureSingleType`: manter apenas a versão do módulo após migração total.
- `applyCouponSale`, `applyCouponSaleItem`, `updateProductsStock`, `verifyStockProducts`: wrappers legados agora delegam para `CouponService` e `StockService`; remover definitivamente após módulos que ainda importam utils serem migrados.

Independência & Handoff
- Sem bloqueio de outros módulos: expor ports (`ProductRepository`, `ServiceRepository`, `CouponRepository`, `PlanRepository`, `PlanProfileRepository`, `ProfilesRepository`, `AppointmentRepository`) e manter adapters de compatibilidade dentro do módulo Sales (Prisma/Legacy) até que Catalog/Plans/Organization/Scheduling migrem.
- Controllers e contratos HTTP ficam inalterados; troca é via factory/binding interno ao módulo.
- Handoffs: quando Catalog/Plans/Organization/Scheduling migrarem, substituir adapters de compatibilidade por implementações nativas dos respectivos módulos; apagar `// MIGRATION-TODO` associados.
