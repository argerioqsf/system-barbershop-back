# Fase 0 — Fundações (baixo risco)

Objetivo
- Isolar infraestrutura transversal (transações, tempo, IDs) para reduzir acoplamento e permitir migração por módulos sem retrabalho.

Macro objetivos (O1, O2, ...)
- O1 — Portas cross‑cutting criadas (`TransactionRunner`, `Clock`, `IdGenerator`) e centralizadas no core.
- O2 — Adapter Prisma para transações disponível e reutilizável.
- O3 — `UseCaseCtx { tx? }` definido e adotado como convenção de composição.
- O4 — Factories usam `defaultTransactionRunner` em vez de `prisma.$transaction` direto.
- O5 — Fakes de `TransactionRunner`/`Clock` para testes unitários.
- O6 — Diretrizes de propagação de `tx` documentadas no core.

Slicing (tarefas pequenas)
- [x] XS — Criar interfaces `TransactionRunner`, `Clock`, `IdGenerator` em `src/core` [O1].
  - Critérios: tipos estritos; sem dependências de ORM/HTTP; docs breves.
  - Backout: remover arquivos; sem impacto em runtime.
- [x] S — Implementar `PrismaTransactionRunner` (`src/infra/prisma/transaction-runner.ts`) [O2].
  - Critérios: executa função recebendo `tx`; testes unitários com fake.
  - Backout: retornar ao uso direto de `prisma.$transaction`.
- [x] XS — Introduzir `UseCaseCtx { tx? }` em `src/core/application/use-case-ctx.ts` [O3].
  - Critérios: export central e sem refs cíclicas.
  - Backout: manter tipos locais nos módulos.
- [x] S — Ajustar factories para usar `defaultTransactionRunner` [O4].
  - Critérios: nenhuma factory chamando `prisma.$transaction` direto.
  - Backout: revert factory individual.
- [x] S — Fakes para testes (`fake-clock`, `fake-transaction-runner`) [O5].
  - Critérios: usados por testes unitários de módulos.
  - Backout: manter testes que não usam fakes.
- [ ] XS — Documentar a convenção de `tx`/`UseCaseCtx` no core (README curto) [O6].
  - Critérios: exemplos simples; linkado nas fases.
  - Backout: n/a (doc-only).

Entregáveis
- Portas cross-cutting: `TransactionRunner`, `Clock`, `IdGenerator` (interfaces em `src/core/...`).
- Adapter Prisma para `TransactionRunner` (ex.: `src/infra/prisma/transaction-runner-prisma.ts`).
- Tipo `UseCaseCtx { tx? }` e guideline de propagação de `tx`.
- Factories por domínio padronizadas (alinhar com `modules/sale`; preparar `modules/finance`).

Tarefas
- [x] Criar interfaces `TransactionRunner`, `Clock`, `IdGenerator` em `src/core`.
- [x] Implementar `PrismaTransactionRunner` e `DefaultTransactionRunner` em `src/infra/prisma`.
- [x] Introduzir `UseCaseCtx { tx? }` e documentar padrão de propagação de `tx`.
- [x] Ajustar novos casos de uso para consumir `TransactionRunner` (legado apenas aceita `tx?`).
- [x] Criar fakes de `TransactionRunner`/`Clock` para testes unitários.
- [x] Marcar pontos de migração com `// MIGRATION-TODO`.

Critérios de aceite
- [ ] Build, testes e typecheck passam sem mudança de contrato.
- [ ] Novos casos de uso/factories usam `TransactionRunner`.
- [ ] Serviços legados continuam funcionando aceitando `tx?`.

Riscos & Mitigações
- Alteração pulverizada de assinaturas: usar re-exports temporários e mudanças mínimas de import.
- Possível confusão sobre `tx`: padronizar documentação e exemplos em um README curto do core.

Rollout
- PRs pequenos por pacote (core, infra/prisma, primeiro uso). Gate: `npm test`, `npm run typecheck`, `npm run lint`.

Locais para propagar TransactionRunner/UseCaseCtx
- Uso explícito de `prisma.$transaction` (substituir por `TransactionRunner.run`):
  - [x] `src/services/transaction/pay-balance-transaction.ts`
  - [x] `src/services/transaction/withdrawal-balance-transaction.ts`
  - [x] `src/modules/finance/application/use-cases/pay-sale.ts` (use-case agora injeta runner via factory)
  - [x] `src/modules/sale/application/use-cases/recalculate-user-sales.ts` (fallback sem `tx` agora usa runner)

- Use-cases/serviços que já aceitam runner local (alinhar ao `core TransactionRunner` e remover tipos locais):
  - `src/modules/sale/application/services/sale-item-update-executor.ts:14` (define `TransactionRunner` local e usa `prisma.$transaction` como default)
  - `src/modules/sale/application/use-cases/update-sale.ts:11` (tipo local `TransactionRunner` + injeção de runner)
  - `src/modules/sale/application/use-cases/remove-add-sale-item.ts:32` (tipo local `TransactionRunner` + injeção de runner)
  - `src/modules/sale/application/use-cases/update-sale-client.ts:23,39` (usa `TransactionRunner` do executor)
  - `src/modules/sale/application/use-cases/update-sale-coupon.ts:16,31` (usa `TransactionRunner` do executor)

- Factories que injetam runner via `prisma.$transaction` (trocar para `PrismaTransactionRunner` do core):
  - [x] `src/modules/sale/infra/factories/make-update-sale.ts`
  - [x] `src/modules/sale/infra/factories/make-remove-add-sale-item.ts`
  - [x] `src/modules/sale/infra/factories/make-update-client-sale.ts`
  - [x] `src/modules/sale/infra/factories/make-update-sale-coupon.ts`
  - [x] `src/modules/sale/infra/factories/make-sale-item-update-executor.ts`
  - [x] `src/modules/finance/infra/factories/make-pay-sale.ts`

- Factories legadas de transação ajustadas para injetar runner padrão:
  - [x] `src/services/@factories/transaction/make-pay-balance-transaction.ts`
  - [x] `src/services/@factories/transaction/make-withdrawal-balance-transaction.ts`

- Serviços com fallback transacional interno (preferir runner externo e `ctx.tx`):
  - `src/modules/sale/application/use-cases/recalculate-user-sales.ts:63-69` (se `tx` não vier, abre transação)

Observações de propagação
- Where to start: priorizar `Finance` (pagamentos/retiradas) e `PaySale`, por impacto direto em caixa/saldos.
- Padrão de assinatura: `execute(input, ctx?: UseCaseCtx)` e/ou injetar `TransactionRunner` no construtor.
- Adotar `defaultTransactionRunner` nas factories, evitando referências diretas a `prisma.$transaction`.
- Manter `tx?: Prisma.TransactionClient` nas portas de repositório; apenas o orquestrador deve abrir a transação.

Progresso
- [x] Portas/adapters criados (TransactionRunner/Clock/IdGenerator, Prisma runner).
- [x] Serviços críticos de transação (pay/withdraw) usando runner + MIGRATION-TODO no cabeçalho.
- [x] Factories de Sale trocadas para `defaultTransactionRunner`.
- [x] RecalculateUserSales: fallback passou a usar runner (MIGRATION-TODO para injetar no construtor).
- [x] PaySaleUseCase: marcado com MIGRATION-TODO para injeção de runner.
