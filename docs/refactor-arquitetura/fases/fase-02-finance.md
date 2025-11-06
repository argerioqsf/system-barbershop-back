# Fase 2 — Finance (Transações/Comissões/Caixa/Empréstimos/Dívidas)

Objetivo
- Migrar transações (pagamento/retirada), consolidar cálculo de comissão, padronizar caixa e liquidação de empréstimos.

Macro objetivos (O1, O2, ...)
- O1 — Transações de pagamento/retirada migradas para use-cases + factories (sem mudar contrato HTTP), usando VOs `Money` e `Percentage` (quando aplicável) no domínio.
- O2 — Cálculo de comissão consolidado em serviço de domínio (CommissionCalculator) com testes e VOs `Money`/`Percentage`.
- O3 — Fluxo único de empréstimos consolidando `VALUE_TRANSFERRED` → `PAID_OFF` com cobertura e valores em `Money` (taxas percentuais com `Percentage` quando houver).
- O4 — `ReasonTransaction` obrigatório em todas as criações de transação.
- O5 — Casos de uso de Caixa (abrir/fechar/listar/aberta/atualizar valor final) usando `TransactionRunner` e `Money` (taxas com `Percentage`, se aplicável).
- O6 — Dívidas (Create/Get/List/Update/Pay/Delete) migradas para casos de uso + adapters Prisma, valores em `Money` no domínio (taxas com `Percentage`, se aplicável).
- O7 — ListPendingCommissions disponível como caso de uso e exposto via factory (cálculos em `Money`/`Percentage`, resposta preserva contrato atual).
- O8 — AddBalance (entrada de saldo) migrado para use-case + factory (contrato estável), valores em `Money` no domínio.
- O9 — ListTransactions como Query Handler (leitura), usando `Money` internamente e mantendo contrato de saída.
- O10 — PaySale alinhado ao padrão UseCaseCtx/TransactionRunner e serviços de domínio usando `Money`/`Percentage`.
- O11 — PayCommission disponível como caso de uso, usando CommissionCalculator e `Money`/`Percentage` nas operações.
- O12 — ProfitDistribution como serviço de domínio (sem I/O), integrado ao pagamento de vendas, operando com `Money`/`Percentage`.
- O13 — Introduzir VOs `Money` e `Percentage` em `core/domain/value-objects` para padronizar operações monetárias e percentuais no domínio (sem I/O), com mapeadores nas bordas.

Entidades do domínio (especificação)
- Transaction — evento financeiro atômico (crédito/débito) usado para auditoria e relatórios.
  - Campos: `id`, `amount: Money` (≠ 0), `reason` (domínio), `description?`, `createdAt`, `userId` (ator), `affectedUserId?`, `unitId?`, `sessionId?`, `saleId?`, `loanId?`, `profileId?`, `appointmentServiceId?`, `receiptUrl?`.
  - Invariantes: `amount` não é zero; `reason` obrigatório; sinal semântico consistente com o fluxo (ex.: retirada/comissão → débito do caixa).
- CashSession (aka CashRegisterSession) — janela de caixa (abrir/fechar) vinculando vendas e transações.
  - Campos: `id`, `unitId`, `openedByUserId`, `openedAt`, `closedAt?`, `openingAmount: Money`, `finalAmount: Money`.
  - Invariantes: apenas 1 sessão aberta por unidade; não lançar transações de caixa sem sessão aberta; fechamento idempotente (sem lançamentos após fechar).
- Loan — empréstimos ao colaborador com quitação parcial e transição de status.
  - Campos: `id`, `unitId`, `userId`, `amount: Money`, `paidAmount: Money`, `status: VALUE_TRANSFERRED | PAID_OFF`, `createdAt`, `paidAt?`.
  - Invariantes: `PAID_OFF` apenas quando `paidAmount >= amount`; pagamentos geram `Transaction` com `reason: PAY_LOAN`.
- Debt — dívidas (ex.: planos) com pagamento/cancelamento.
  - Campos: `id`, `unitId`, `profileId`/`userId`, `amount: Money`, `status: OPEN | PAID | CANCELED`, `dueDate?`, `paidAt?`, `description?`.
  - Invariantes: não pagar dívida cancelada; pagamento gera `Transaction` com `reason: PAY_PLAN_DEBT`.

Slicing (tarefas pequenas)
- [x] XS — Mapear entidades de domínio (Transaction/CashSession/Loan/Debt) e seus invariantes nesta fase [O1,O3,O5,O6,O9,O11].
  - Critérios: seção "Entidades do domínio" detalhada; sem implementação de classes ainda.
  - Backout: manter referências ao contrato atual via ORM onde necessário.
- [x] XS — Criar entidade de domínio `Transaction` com invariantes e testes unitários [O1,O4,O9].
   - Critérios: amount (Money) ≠ 0; reason obrigatório; construtores/fábricas claras; testes cobrindo sinal e validações.
   - Backout: usar tipos atuais (schema/DTO) enquanto a entidade não é criada.
- [x] XS — Criar entidade de domínio `CashSession` com invariantes e testes unitários [O5].
   - Critérios: apenas 1 sessão aberta por unidade; bloqueio de lançamentos sem sessão; abertura/fechamento idempotentes; testes cobrindo regras.
   - Backout: manter regras nos serviços/ports existentes.
- [x] XS — Criar entidade de domínio `Loan` com invariantes e testes unitários [O3].
   - Critérios: transição VALUE_TRANSFERRED → PAID_OFF quando paidAmount ≥ amount; cálculo de restante; testes cobrindo transições e limites.
   - Backout: manter validações no use case.
- [x] XS — Criar entidade de domínio `Debt` com invariantes e testes unitários [O6].
   - Critérios: proibir pagamento quando CANCELED; mudança de status para PAID com `Transaction` PAY_PLAN_DEBT; testes básicos.
   - Backout: manter validações no use case.
- [x] S — Extrair `WithdrawBalanceUseCase` de `src/services/transaction/withdrawal-balance-transaction.ts` [O1].
  - Critérios: factory `makeWithdrawalBalance`; controller passa a chamar factory; contrato HTTP inalterado; usar `Money` internamente e `Percentage` para taxas (bordas convertem para número).
  - Backout: controller volta a chamar serviço legado.
- [x] S — Extrair `PayBalanceUseCase` de `src/services/transaction/pay-balance-transaction.ts` [O1].
  - Critérios: factory `makePayBalance`; contrato HTTP inalterado; E2E ok; usar `Money` no domínio (e `Percentage` quando houver taxas/percentuais envolvidos).
  - Backout: revert binding do controller.
- [x] XS — Introduzir `CommissionCalculator` (domínio) com cenários básicos e testes [O2].
  - Critérios: cálculo unitário coberto; sem I/O.
  - Backout: manter utilidade anterior.
- [x] XS — Introduzir `Money`/`Percentage` (VOs de domínio) com operações básicas e testes [O13].
   - Localização: `src/core/domain/value-objects`.
   - Consumo: módulos (Sales/Finance/Cash) importam do core (sem re-export).
   - Critérios: Money (soma/subtração/multiplicação/percentual, arredondamento determinístico), Percentage (validação, decimal, composição); sem I/O.
   - Backout: manter utilitários atuais e números nas bordas.
 - [x] S — Migrar `CommissionCalculator` para usar `Money`/`Percentage` internamente [O13,O2].
   - Critérios: API de saída estável; cálculos equivalentes; testes ajustados para `Money`/`Percentage`.
   - Backout: retornar ao cálculo com `number` mantendo cobertura de testes.
 - [x] S — Adotar `Money`/`Percentage` nos casos de uso de transação/caixa (`Add/Withdraw/PayBalance`, `Open/Close`) mantendo mapeamento em adapters [O13,O1,O5].
   - Critérios: domínio sem `number` cru; adapters/DTOs convertem para `number`; typecheck verde.
 - Backout: isolar uso de `Money` em funções auxiliares e reverter chamadas.
- [x] S — Tornar `ReasonTransaction` obrigatório nos ports/adapters de transação [O4].
  - Critérios: sem fallback para `OTHER` (exceto casos documentados); typecheck verde.
  - Backout: permitir `OTHER` temporariamente.
- [x] S — Unificar lógica de empréstimos: consolidar `VALUE_TRANSFERRED` → `PAID_OFF` e remover duplicações (`PayLoan` x `PayUserLoansService`) [O3].
  - Critérios: testes cobrindo transição; uma única orquestração de pagamento; valores monetários com `Money` e percentuais com `Percentage` no domínio.
  - Backout: manter implementação antiga lado a lado (feature flag interna).
- [x] S — Caixa: casos de uso `OpenSession/CloseSession/GetOpen/List/UpdateCashFinalAmount` com `TransactionRunner` [O5].
  - [x] OpenSession
  - [x] CloseSession
  - [x] GetOpen
  - [x] List
  - [x] UpdateCashFinalAmount
  - Critérios: portas com `tx?`; repos Prisma; E2E de sessão ok; valores de caixa com `Money` no domínio e `Percentage` quando houver taxas.
  - Backout: controllers chamam serviços anteriores.
- [x] XS — Factories e controllers atualizados para chamar as novas factories [O1,O5,O6].
  - Critérios: módulos desacoplados de `src/services/transaction/*`.
  - Backout: revert import pontual.
- [x] S — Dívidas: casos de uso (Create/Get/List/Update/Pay/Delete) + adapters Prisma, mantendo rotas [O6].
  - Critérios: E2E das rotas de dívida ok; valores em `Money` no domínio; percentuais com `Percentage` quando houver; adapters convertem para números.
  - Backout: restaurar handlers antigos.
- [x] XS — `ListPendingCommissionsUseCase` exposto via factory e ligado ao endpoint atual [O7].
  - Critérios: contrato inalterado; testes cobrindo cálculo de base; uso de `Money`/`Percentage` em cálculos internos.
  - Backout: controller volta a usar serviço/consulta anterior.
- [x] S — Extrair `AddBalanceUseCase` de `src/services/transaction/add-balance-transaction.ts` [O8].
  - Critérios: factory `makeAddBalance`; controller passa a chamar factory; contrato HTTP inalterado; usar `Money` no domínio; atualizar `CashSession.finalAmount`; emitir `Transaction` via `TransactionsRepository` com `reason` apropriado.
  - Backout: controller volta a chamar serviço legado.
- [x] XS — `ListTransactions` como Query Handler (leitura) + factory, contrato inalterado [O9].
  - Critérios: resposta equivalente; testes de leitura básicos; usar entidade de domínio `Transaction` (mapeada via adapter) e `Money` internamente; saída em número.
  - Backout: controller volta a usar serviço legado.
 - [x] XS — Especificar entidade de domínio `Transaction` (Finance) e `ReasonTransaction` [O1,O9,O11].
   - Critérios: modelo de domínio documentado (campos, semântica de `amount: Money` e `reason`); sem implementação.
   - Backout: continuar referenciando o contrato atual via ORM onde necessário.
 - [x] XS — Alinhar `PaySaleUseCase` ao padrão `UseCaseCtx` e injetar `TransactionRunner` via factory [O10].
  - Critérios: sem abrir transação dentro do caso de uso quando `ctx.tx` existir; usar `Money`/`Percentage` nos serviços de domínio (comissões/distribuição); typecheck verde.
  - Backout: manter fallback anterior.
- [x] S — `PayCommissionUseCase` usando `CommissionCalculator`, criando transação com `ReasonTransaction.PAY_COMMISSION` [O11].
  - Critérios: E2E do endpoint de pagar comissão (se existir) ou fluxo integrado; testes unitários do cálculo; domínio com `Money`/`Percentage`.
  - Backout: chamar serviço/consulta anterior.
- [x] XS — Extrair `ProfitDistribution` para serviço de domínio e integrar no fluxo de PaySale [O12].
  - Critérios: importar serviço novo ao invés de util legado; operar em `Money`/`Percentage`; testes de distribuição passantes.
  - Backout: voltar a util anterior.
- [x] M — Mover controllers e rotas HTTP para a camada de infra do módulo (`src/modules/finance/infra/http`).
  - Critérios: Rotas de `transaction`, `cash-session`, `loan` e `debt` movidas de `src/http/controllers` para a nova estrutura. O registro principal em `src/app.ts` é atualizado para importar as rotas do novo local.
  - Backout: Reverter os imports no `app.ts` para apontar para a estrutura antiga.

Independência & Handoff
- Sem bloqueio de outras fases:
  - Comissões: `CommissionCalculator` é serviço de domínio puro; para endpoints de pendências, usar um adapter temporário (ex.: `LegacyCommissionQueryAdapter`) se ainda houver consumidores legados. Marcar `// MIGRATION-TODO: substituir por CommissionRepository`.
  - Distribuição de lucros: enquanto o serviço de domínio não estiver 100% integrado, encapsular uso do util legado (`src/services/sale/utils/profit-distribution`) em um adapter de infra, com `// MIGRATION-TODO` para troca futura.
  - Dívidas ↔ Plans: expor `DebtsRepository` como port estável. O módulo Plans deve depender da port (não de implementação). Se Plans não estiver migrado, manter um adapter de compatibilidade chamando os serviços/queries atuais de dívida.
  - Caixa/Transações: controllers mudam apenas o binding para factories; contratos HTTP permanecem iguais, permitindo rollout independente.
  - Money/Percentage globais: sem re-export. Quando os VOs forem movidos para o core (O13), atualizar diretamente os imports em Sales/Finance/Cash para `@/core/domain/value-objects`. Documentar no PR.
- Handoffs claros para outras fases:
  - Plans & Recurrence: consumir `DebtsRepository`/`TransactionsRepository` via ports, sem dependência direta de implementação.
  - Sales: `PaySale` alinhado a `UseCaseCtx` permite orquestração com outros casos de uso em transação compartilhada.

Ports e adapters (pequenos)
- [x] XS — Definir ports Finance (`TransactionsRepository`, `CashRegisterRepository`, `LoansRepository`, `DebtsRepository`) com `tx?` [O1,O5,O6,O11,O9].
  - Critérios: interfaces em `application/ports` (apenas mapeadas no doc nesta fase); sem dependência de ORM; amounts tipados com `Money` e taxas com `Percentage` no domínio; `ReasonTransaction` definido no domínio (não usar enum do ORM nos ports). Sem implementação neste item.
  - Backout: manter repositórios legados.
- [x] S — Implementar adapters Prisma mínimos para `TransactionsRepository` e `CashRegisterRepository` com mappers básicos [O1,O5].
  - Critérios: leitura/escrita essenciais; `ReasonTransaction` mapeado explicitamente; conversões `Money` ↔ `number` e `Percentage` ↔ `number`; testes básicos.
  - Backout: voltar a usar adapters legados.
- [x] S — Implementar adapters Prisma para `LoansRepository` e `DebtsRepository` mapeando entidades de domínio [O3,O6].
  - Critérios: mapeamento `Loan`/`Debt` ↔ schema; conversões `Money`; status/enum coerentes; testes básicos de leitura/atualização.
  - Backout: usar adapters legados enquanto não integrado.
  - [x] XS — Criar mapeadores nas bordas (HTTP/Prisma): `MoneyMapper` e `PercentageMapper` [O13].
    - Critérios: sem vazamento de VOs em DTOs HTTP; arredondamento consistente; validação de percentuais.
    - Backout: remover mapper e usar utilitários atuais.
- [x] XS — Auditoria e substituição de `round/toCents/fromCents` e números crus de percentual nas camadas de domínio do módulo Finance por `Money`/`Percentage` [O13].
  - Critérios: nenhum uso de utilitário de arredondamento e números crus diretamente no domínio; manter conversões apenas nos mappers/bordas.
  - Backout: rollback pontual em trechos críticos.
- [x] S — Integrar `WithdrawBalanceUseCase`/`PayBalanceUseCase` ao `TransactionsRepository` (emissão de `Transaction` com `reason`) [O1,O4,O9].
   - Critérios: criação de transações via port (não direto no ORM); invariantes de `reason` e `amount` aplicadas; logs mantidos.
   - Backout: continuar usando serviços legados de incremento e update de caixa, mantendo compatibilidade.
- [x] XS — Expor `TransactionReadRepository` para Reporting (consulta por usuário/unidade/período) [O9].
   - Critérios: interface de leitura dedicada; adapter Prisma isolado; testes de leitura.
   - Backout: adapter de compat lendo consulta legada.
 - [ ] XS — Consolidar `ListPendingCommissionsQuery` no Finance (ou Sales) e expor porta de leitura para Reporting/Colaborador [O11].
   - Critérios: contrato de leitura claro; sem efeitos colaterais; testes cobrindo filtros.
   - Backout: manter endpoint atual sob collaborator até migração.

Binding de controllers (fatiar por endpoint)
- [x] XS — Ligar controller `add-balance-transaction` à nova factory [O8].
- [x] XS — Ligar controller `withdrawal-balance-transaction` à nova factory [O1].
- [x] XS — Ligar controller `pay-balance-transaction` à nova factory [O1].
- [x] XS — Ligar controller `list-transactions` ao Query Handler [O9].
- [x] XS — Ligar controllers de caixa: `open`, `close`, `get-open`, `list`, `update-final-amount` [O5].
- [x] S — Ligar controllers de dívida: `create`, `get`, `list`, `update`, `pay`, `delete` às novas factories [O6].
  - [ ] TODO — substituir a fachada temporária do `PayDebtService` por um caso de uso alinhado ao domínio após migrar o fluxo de quitação.
- [x] XS — Revisar `ReasonTransaction` explícito nos bindings dos controllers/factories de transação [O4].
- [x] S — Ligar controllers de empréstimo: `pay-loan`, `update-loan-status`, `list-user-loans` às novas factories [O3].
- [x] XS — Deprecar `PayUserLoansService` integrando a orquestração no `PayLoanUseCase` único [O3].
- [x] XS — Atualizar imports dos módulos (Sales/Finance/Cash) para `Money/Percentage` do core após O13 (sem re-export) [O13].
   - Critérios: build e testes verdes; sem mudanças de contrato; remover quaisquer re-exports residuais.


Critérios de aceite
- [ ] Rotas de transação mantêm o mesmo contrato (E2E ok).
- [ ] `ReasonTransaction` explícito em todos os fluxos de criação de transação.
- [ ] Liquidação de empréstimos consolidada e coberta por testes (incluindo transição `VALUE_TRANSFERRED` → `PAID_OFF`).
 - [ ] Operações de valores e percentuais na camada de domínio utilizando `Money`/`Percentage` (sem `number` cru), com conversão apenas nas bordas; arredondamento consistente e coberto por testes.
 - [ ] Entidades do domínio (Transaction/CashSession/Loan/Debt) especificadas e invariantes refletidas nos casos de uso e testes relacionados.
 - [ ] Quando O13 for entregue, imports de `Money/Percentage` nos módulos (incluindo Sales) apontam para o core.

Riscos & Mitigações
- Mudanças de saldo/caixa: cobrir E2E e unit; usar `TransactionRunner` para consistência.

Rollout
- PRs por caso de uso (withdraw, pay-balance, cash-session, loans/debts). Adapters temporários com `// MIGRATION-TODO`.
 - PR específico para O13: introduzir `Money/Percentage` em core + ajuste dos imports em Sales/Finance/Cash diretamente para o core (sem re-export). Documentar impactos e plano de rollback.

---

Conformidade com o Guia de Arquitetura
- [ ] Separação domain/application/infra conforme `docs/arquitetura/guia-arquitetura.md`.
- [ ] Ports por agregado (`TransactionsRepository`, `CashRegisterRepository`, `LoansRepository`, `DebtsRepository`) com `tx?` e adapters Prisma em `infra`.
- [ ] Controllers com validação (Zod) e mapeamento de erros.
- [ ] Uso de `TransactionRunner`/`UseCaseCtx` para coordenação transacional.
- [ ] Sem compartilhamento de entidades; consumo via ports.
- [ ] Testes unitários de regras (cálculos, transições de status) e E2E de endpoints.
