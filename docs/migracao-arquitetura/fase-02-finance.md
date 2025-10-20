#+ Fase 2 — Finance (Transações/Comissões/Caixa/Empréstimos/Dívidas)

Objetivo
- Migrar transações (pagamento/retirada), consolidar cálculo de comissão, padronizar caixa e liquidação de empréstimos.

Tarefas
- [ ] Extrair `WithdrawBalanceUseCase` e `PayBalanceUseCase` de `src/services/transaction/*`.
- [ ] Introduzir serviço de domínio `CommissionCalculator` (ou mover para Sales se preferir) e trocar uso de utils legadas.
- [ ] Unificar lógica de empréstimos: consolidar transição `VALUE_TRANSFERRED` → `PAID_OFF` e remover duplicações (`PayLoan` x `PayUserLoansService`).
- [ ] Tornar `ReasonTransaction` obrigatório em todas as criações de transação (sem fallback para `OTHER`, salvo exceções documentadas).
- [ ] Criar factories: `makeWithdrawBalance()`, `makePayBalance()`, `makeListPendingCommissions()`.
- [ ] Atualizar controllers para chamar factories novas.
- [ ] Caixa: casos de uso `OpenSession`, `CloseSession`, `GetOpenSession`, `ListSessions`, `UpdateCashFinalAmount` com `TransactionRunner`.
- [ ] Dívidas: casos de uso (Create/Get/List/Update/Pay/Delete) + adapters Prisma, mantendo rotas.

Critérios de aceite
- [ ] Rotas de transação mantêm o mesmo contrato (E2E ok).
- [ ] `ReasonTransaction` explícito em todos os fluxos de criação de transação.
- [ ] Liquidação de empréstimos consolidada e coberta por testes (incluindo transição `VALUE_TRANSFERRED` → `PAID_OFF`).

Riscos & Mitigações
- Mudanças de saldo/caixa: cobrir E2E e unit; usar `TransactionRunner` para consistência.

Rollout
- PRs por caso de uso (withdraw, pay-balance, cash-session, loans/debts). Adapters temporários com `// MIGRATION-TODO`.

