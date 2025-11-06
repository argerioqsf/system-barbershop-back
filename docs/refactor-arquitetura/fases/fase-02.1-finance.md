# Fase 2.1 — Finance (DTOs & Erros)

Objetivo
- Padronizar a definição de DTOs (Data Transfer Objects) e Erros de Aplicação/Domínio para todos os casos de uso do módulo de Finanças, eliminando tipos inline e garantindo consistência.

Macro objetivos (O1, O2, ...)
- O1 — DTOs de entrada e saída de todos os Casos de Uso e Queries de Finanças são definidos em arquivos explícitos dentro de `application/dto`.
- O2 — Erros específicos de negócio são definidos como classes em `application/errors` ou `domain/errors`, substituindo o uso de `new Error()`.

Slicing (tarefas pequenas)

### DTOs
- [x] XS — Criar DTOs para `CreateDebtUseCase` (`create-debt.dto.ts`).
- [x] XS — Criar DTOs para `ListDebtsQuery` (`list-debts.dto.ts`).
- [x] XS — Criar DTOs para `GetDebtUseCase` (`get-debt.dto.ts`).
- [x] XS — Criar DTOs para `UpdateDebtUseCase` (`update-debt.dto.ts`).
- [x] XS — Criar DTOs para `PayDebtUseCase` (`pay-debt.dto.ts`).
- [x] XS — Criar DTOs para `DeleteDebtUseCase` (`delete-debt.dto.ts`).
- [x] XS — Criar DTOs para `PaySaleUseCase` (`pay-sale.dto.ts`).
- [x] XS — Criar DTOs para `AddBalanceUseCase` (`add-balance.dto.ts`).
- [x] XS — Criar DTOs para `WithdrawBalanceUseCase` (`withdraw-balance.dto.ts`).
- [x] XS — Criar DTOs para `PayCommissionUseCase` (`pay-commission.dto.ts`).
- [x] XS — Criar DTOs para `ListPendingCommissionsUseCase` (`list-pending-commissions.dto.ts`).
- [x] XS — Criar DTOs para `PayLoanUseCase` (`pay-loan.dto.ts`).
- [x] XS — Criar DTOs para `UpdateLoanStatusUseCase` (`update-loan-status.dto.ts`).
- [x] XS — Criar DTOs para `ListUserLoansUseCase` (`list-user-loans.dto.ts`).
- [x] XS — Criar DTOs para `OpenCashSessionUseCase` (`open-cash-session.dto.ts`).
- [x] XS — Criar DTOs para `CloseCashSessionUseCase` (`close-cash-session.dto.ts`).
- [x] XS — Criar DTOs para `GetOpenCashSessionUseCase` (`get-open-cash-session.dto.ts`).
- [x] XS — Criar DTOs para `ListCashSessionsUseCase` (`list-cash-sessions.dto.ts`).
- [x] XS — Criar DTOs para `UpdateCashFinalAmountUseCase` (`update-cash-final-amount.dto.ts`).
- [x] XS — Criar DTOs para `ListTransactionsQuery` (`list-transactions.dto.ts`).

### Erros
- [x] S — Mapear e criar classes de erro para os casos de uso de `Debt` (Ex: `DebtNotFoundError` em `application/errors`).
- [x] S — Mapear e criar classes de erro para os casos de uso de `Loan` (Ex: `LoanNotFoundError`, `LoanAlreadyPaidError` em `application/errors`).
- [x] S — Mapear e criar classes de erro para os casos de uso de `CashSession` (Ex: `CashRegisterAlreadyOpenError` em `application/errors`).
- [x] S — Mapear e criar classes de erro para os casos de uso de `Transaction` (Ex: `InsufficientBalanceError` em `application/errors`).

Critérios de aceite (fase)
- [x] As pastas `application/dto` e `application/errors` do módulo de finanças estão populadas.
- [x] Os casos de uso e queries importam seus DTOs e Erros dos novos arquivos, em vez de defini-los inline.
- [x] Testes de unidade são atualizados para usar os novos DTOs e para esperar os novos tipos de erro.

---

Conformidade com o Guia de Arquitetura
- [ ] Pastas e camadas seguem `docs/arquitetura/guia-arquitetura.md`.
- [ ] DTOs/Erros residem em `application/*`; sem dependência de ORM/adapters.
- [ ] Controllers mapeiam erros para HTTP; application lança erros específicos.
- [ ] Testes atualizados e typecheck verde.
