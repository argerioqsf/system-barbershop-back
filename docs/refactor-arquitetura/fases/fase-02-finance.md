# Fase 2 — Finance (Transações/Comissões/Caixa/Empréstimos/Dívidas)

Objetivo
- Migrar transações (pagamento/retirada), consolidar cálculo de comissão, padronizar caixa e liquidação de empréstimos.

Macro objetivos (O1, O2, ...)
- O1 — Transações de pagamento/retirada migradas para use-cases + factories, controllers sem mudar contrato.
- O2 — Cálculo de comissão consolidado em serviço de domínio (CommissionCalculator) com testes.
- O3 — Fluxo único de empréstimos consolidando `VALUE_TRANSFERRED` → `PAID_OFF` com cobertura.
- O4 — `ReasonTransaction` obrigatório em todas as criações de transação.
- O5 — Casos de uso de Caixa (abrir/fechar/listar/aberta/atualizar valor final) usando `TransactionRunner`.
- O6 — Dívidas (Create/Get/List/Update/Pay/Delete) migradas para casos de uso + adapters Prisma.
- O7 — ListPendingCommissions disponível como caso de uso e exposto via factory.
- O8 — AddBalance (entrada de saldo) migrado para use-case + factory (contrato estável).
- O9 — ListTransactions como Query Handler (leitura), mantendo contrato.
- O10 — PaySale alinhado ao padrão UseCaseCtx/TransactionRunner e integrado aos serviços de domínio.
- O11 — PayCommission disponível como caso de uso, usando CommissionCalculator e transações padronizadas.
- O12 — ProfitDistribution como serviço de domínio (sem I/O) e integrado ao fluxo de pagamento de vendas.

Slicing (tarefas pequenas)
- [ ] S — Extrair `WithdrawBalanceUseCase` de `src/services/transaction/withdrawal-balance-transaction.ts` [O1].
  - Critérios: factory `makeWithdrawalBalance`; controller passa a chamar factory; contrato HTTP inalterado.
  - Backout: controller volta a chamar serviço legado.
- [ ] S — Extrair `PayBalanceUseCase` de `src/services/transaction/pay-balance-transaction.ts` [O1].
  - Critérios: factory `makePayBalance`; contrato HTTP inalterado; E2E ok.
  - Backout: revert binding do controller.
- [ ] XS — Introduzir `CommissionCalculator` (domínio) com cenários básicos e testes [O2].
  - Critérios: cálculo unitário coberto; sem I/O.
  - Backout: manter utilidade anterior.
- [ ] S — Tornar `ReasonTransaction` obrigatório nos ports/adapters de transação [O4].
  - Critérios: sem fallback para `OTHER` (exceto casos documentados); typecheck verde.
  - Backout: permitir `OTHER` temporariamente.
- [ ] S — Unificar lógica de empréstimos: consolidar `VALUE_TRANSFERRED` → `PAID_OFF` e remover duplicações (`PayLoan` x `PayUserLoansService`) [O3].
  - Critérios: testes cobrindo transição; uma única orquestração de pagamento.
  - Backout: manter implementação antiga lado a lado (feature flag interna).
- [ ] S — Caixa: casos de uso `OpenSession/CloseSession/GetOpen/List/UpdateCashFinalAmount` com `TransactionRunner` [O5].
  - Critérios: portas com `tx?`; repos Prisma; E2E de sessão ok.
  - Backout: controllers chamam serviços anteriores.
- [ ] XS — Factories e controllers atualizados para chamar as novas factories [O1,O5,O6].
  - Critérios: módulos desacoplados de `src/services/transaction/*`.
  - Backout: revert import pontual.
- [ ] S — Dívidas: casos de uso (Create/Get/List/Update/Pay/Delete) + adapters Prisma, mantendo rotas [O6].
  - Critérios: E2E das rotas de dívida ok.
  - Backout: restaurar handlers antigos.
- [ ] XS — `ListPendingCommissionsUseCase` exposto via factory e ligado ao endpoint atual [O7].
  - Critérios: contrato inalterado; testes cobrindo cálculo de base.
  - Backout: controller volta a usar serviço/consulta anterior.
- [ ] S — Extrair `AddBalanceUseCase` de `src/services/transaction/add-balance-transaction.ts` [O8].
  - Critérios: factory `makeAddBalance`; controller passa a chamar factory; contrato HTTP inalterado.
  - Backout: controller volta a chamar serviço legado.
- [ ] XS — `ListTransactions` como Query Handler (leitura) + factory, contrato inalterado [O9].
  - Critérios: resposta equivalente; testes de leitura básicos.
  - Backout: controller volta a usar serviço legado.
- [ ] XS — Alinhar `PaySaleUseCase` ao padrão `UseCaseCtx` e injetar `TransactionRunner` via factory [O10].
  - Critérios: sem abrir transação dentro do caso de uso quando `ctx.tx` existir; typecheck verde.
  - Backout: manter fallback anterior.
- [ ] S — `PayCommissionUseCase` usando `CommissionCalculator`, criando transação com `ReasonTransaction.PAY_COMMISSION` [O11].
  - Critérios: E2E do endpoint de pagar comissão (se existir) ou fluxo integrado; testes unitários do cálculo.
  - Backout: chamar serviço/consulta anterior.
- [ ] XS — Extrair `ProfitDistribution` para serviço de domínio e integrar no fluxo de PaySale [O12].
  - Critérios: importar serviço novo ao invés de util legado; testes de distribuição passantes.
  - Backout: voltar a util anterior.

Independência & Handoff
- Sem bloqueio de outras fases:
  - Comissões: `CommissionCalculator` é serviço de domínio puro; para endpoints de pendências, usar um adapter temporário (ex.: `LegacyCommissionQueryAdapter`) se ainda houver consumidores legados. Marcar `// MIGRATION-TODO: substituir por CommissionRepository`.
  - Distribuição de lucros: enquanto o serviço de domínio não estiver 100% integrado, encapsular uso do util legado (`src/services/sale/utils/profit-distribution`) em um adapter de infra, com `// MIGRATION-TODO` para troca futura.
  - Dívidas ↔ Plans: expor `DebtsRepository` como port estável. O módulo Plans deve depender da port (não de implementação). Se Plans não estiver migrado, manter um adapter de compatibilidade chamando os serviços/queries atuais de dívida.
  - Caixa/Transações: controllers mudam apenas o binding para factories; contratos HTTP permanecem iguais, permitindo rollout independente.
- Handoffs claros para outras fases:
  - Plans & Recurrence: consumir `DebtsRepository`/`TransactionsRepository` via ports, sem dependência direta de implementação.
  - Sales: `PaySale` alinhado a `UseCaseCtx` permite orquestração com outros casos de uso em transação compartilhada.

Ports e adapters (pequenos)
- [ ] XS — Definir ports Finance (`TransactionsRepository`, `CashRegisterRepository`, `LoansRepository`, `DebtsRepository`) com `tx?` [O1,O5,O6,O11,O9].
  - Critérios: interfaces em `application/ports`; sem dependência de ORM; tipos estritos.
  - Backout: manter repositórios legados.
- [ ] S — Implementar adapters Prisma mínimos para `TransactionsRepository` e `CashRegisterRepository` com mappers básicos [O1,O5].
  - Critérios: leitura/escrita essenciais; `ReasonTransaction` mapeado explicitamente; testes básicos.
  - Backout: voltar a usar adapters legados.

Binding de controllers (fatiar por endpoint)
- [ ] XS — Ligar controller `add-balance-transaction` à nova factory [O8].
- [ ] XS — Ligar controller `withdrawal-balance-transaction` à nova factory [O1].
- [ ] XS — Ligar controller `pay-balance-transaction` à nova factory [O1].
- [ ] XS — Ligar controller `list-transactions` ao Query Handler [O9].
- [ ] XS — Ligar controllers de caixa: `open`, `close`, `get-open`, `list`, `update-final-amount` [O5].
- [ ] S — Ligar controllers de dívida: `create`, `get`, `list`, `update`, `pay`, `delete` às novas factories [O6].
- [ ] XS — Revisar `ReasonTransaction` explícito nos bindings dos controllers/factories de transação [O4].
- [ ] S — Ligar controllers de empréstimo: `pay-loan`, `update-loan-status`, `list-user-loans` às novas factories [O3].
- [ ] XS — Deprecar `PayUserLoansService` integrando a orquestração no `PayLoanUseCase` único [O3].


Critérios de aceite
- [ ] Rotas de transação mantêm o mesmo contrato (E2E ok).
- [ ] `ReasonTransaction` explícito em todos os fluxos de criação de transação.
- [ ] Liquidação de empréstimos consolidada e coberta por testes (incluindo transição `VALUE_TRANSFERRED` → `PAID_OFF`).

Riscos & Mitigações
- Mudanças de saldo/caixa: cobrir E2E e unit; usar `TransactionRunner` para consistência.

Rollout
- PRs por caso de uso (withdraw, pay-balance, cash-session, loans/debts). Adapters temporários com `// MIGRATION-TODO`.
