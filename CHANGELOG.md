# Changelog

Todas as mudanças notáveis deste projeto serão documentadas aqui.

## 1.3.0 - 2025-08-29

### Principais mudanças
- Débitos recorrentes passam a ter data de vencimento explícita via `Debt.dueDate` (obrigatória).
- `Debt.paymentDate` tornou-se opcional (apenas presente quando o débito está pago).
- Campo de perfil de plano renomeado: `PlanProfile.dueDateDebt` → `dueDayDebt` (dia do vencimento recorrente).
- Lógica de expiração passa a considerar somente `dueDate` (sem fallback para `paymentDate`).
- Removida dependência de `PlanRepository` em `UpdatePlanProfilesStatusService`.
- Várias operações passam a rodar em transação (`prisma.$transaction`) e a acionar recálculo de vendas afetadas quando necessário.

### Schema & Migrations
- `prisma/schema.prisma`:
  - Adicionado `Debt.dueDate: DateTime` (obrigatório).
  - `Debt.paymentDate` agora é `DateTime?` (opcional).
  - `PlanProfile.dueDateDebt` renomeado para `dueDayDebt`.
- Migrations:
  - `20250729162303_novos_campos_para_plan_e_debts`: adiciona `dueDate` em `debts` e renomeia `dueDateDebt` para `dueDayDebt` em `plan_profiles`.
  - `20250729162511_campo_opcional_no_debito`: torna `paymentDate` opcional em `debts`.

### Repositórios
- In-memory:
  - `src/repositories/in-memory/in-memory-debt-repository.ts`: suporta `dueDate` (obrigatório) e `paymentDate` nulo; atualiza create/update.
  - `src/repositories/in-memory/in-memory-plan-profile-repository.ts`: usa `dueDayDebt`; mapeia `debts` com `dueDate` e `paymentDate` opcional; `typeRecurrence` agora inclui `{ id, period }`.
  - `src/repositories/in-memory/in-memory-plan-repository.ts`: métodos com recorrência retornam `typeRecurrence` completo `{ id, period }`.
- Prisma:
  - `src/repositories/prisma/prisma-plan-profile-repository.ts`: criação com `dueDayDebt`.
  - `src/repositories/prisma/seed.ts`: perfis com `dueDayDebt` e dívida inicial com `dueDate`.
- Contratos:
  - `src/repositories/plan-repository.ts`: `PlanWithRecurrence.typeRecurrence` agora é `TypeRecurrence` completo.

### Utils
- Novas funções em `src/services/plan/utils/helpers.ts`:
  - `hasPendingDebts`, `getLastDebt`, `getLastDebtPaid`, `addMonthsCustom`, `calculateNextDueDate`.
- `src/services/plan/utils/expired.ts`:
  - `isPlanExpired(lastDebtPaid, today)`: compara apenas `today` vs `lastDebtPaid.dueDate`.
  - `isPlanExpiredOfTheLimit(lastDebtPaid, planTime, today)`: considera `dueDate` + `(planTime + 1)` meses (período máximo de inadimplência, futuramente configurável por unidade).
- `src/services/plan/utils/overdue.ts`:
  - `isPlanOverdue(debts, today, lastDebtPaid)`: plano em atraso somente se há pendências e a última dívida paga está expirada.
- `src/services/sale/utils/item.ts`:
  - `checkAndRecalculateAffectedSales(profileId, recalcService, profilesRepo, tx?)`: helper para disparar recálculo das vendas relacionadas ao usuário, com suporte a transação.

### Serviços (Planos)
- `src/services/plan/update-plan-profiles-status.ts`:
  - Remove `PlanRepository`; usa `getLastDebtPaid` + `isPlanExpired` e `hasPendingDebts`.
  - Atualiza status para `EXPIRED` quando há vencimento e para `DEFAULTED` quando há pendências em perfis já expirados.
  - Envolve atualizações em `prisma.$transaction` e recalcula vendas afetadas.
- `src/services/plan/generate-plan-debts.ts`:
  - Calcula próxima `dueDate` via `calculateNextDueDate` (com base em recorrência e `dueDayDebt`).
  - Cria débito PENDING próximo do vencimento; evita duplicidade verificando `PENDING` com a mesma `dueDate`.
- `src/services/plan/cancel-overdue-plan-profiles.ts`:
  - Considera somente perfis `EXPIRED` e cancela para `CANCELED_EXPIRED` quando passa do limite por `isPlanExpiredOfTheLimit`.
- `src/services/plan/renew-plan-profile.ts`:
  - Renova criando uma dívida `PAID` com `paymentDate` atual e `dueDate` calculada (a partir da última dívida paga e recorrência); valida usuário do perfil e recalcula vendas.
- `src/services/plan/pay-debt.ts`:
  - Impede pagar dívidas de planos cancelados.
  - Marca a dívida como `PAID`; obtém dívidas atualizadas e:
    - Se perfil `DEFAULTED` e sem pendências: muda para `PAID` e ajusta `dueDayDebt` para o dia atual.
    - Se perfil `EXPIRED` e sem pendências: muda para `PAID` e ajusta `dueDayDebt` (se ainda houver pendências, mantém `EXPIRED`).
  - Recalcula vendas afetadas dentro da mesma transação.

### Serviços (Vendas)
- `src/services/sale/pay-sale.ts`:
  - Ao pagar uma venda com plano, define `dueDayDebt` pelo dia da compra e cria a primeira dívida com `dueDate` calculada via `TypeRecurrenceRepository`.

### Fábricas
- `src/services/@factories/plan/make-update-plan-profiles-status.ts`:
  - Remove `PrismaPlanRepository` (serviço não depende mais).
- `src/services/@factories/plan/make-cancel-overdue-plan-profiles.ts`:
  - Passa a injetar `PrismaPlanRepository` (para obter recorrência no cancelamento por limite).
- `src/services/@factories/plan/make-pay-debt.ts`:
  - Injetado `PrismaPlanRepository`, `makeRecalculateUserSalesService()` e `PrismaProfilesRepository` (para recálculo e perfis).
- `src/services/@factories/sale/make-set-sale-status.ts`:
  - Injetado `PrismaTypeRecurrenceRepository` (necessário para calcular `dueDate` de planos).

### Controller & Insomnia
- `src/http/controllers/debt/create-debt-controller.ts`:
  - Novo body: `status` (enum), `dueDate` (obrigatório) e `paymentDate` (opcional).
- `insominia-barbershop.yaml`:
  - Atualizada a requisição de criação de débito para enviar `status: "PENDING"` e `dueDate` (sem `paymentDate` para pendentes).

### Testes
- Atualizados para refletir `dueDate` obrigatório e `paymentDate` opcional (nulo para PENDING):
  - `test/tests/plan/*`: `cancel-overdue-plan-profiles.spec.ts`, `cancel-plan-profile.spec.ts`, `generate-plan-debts.spec.ts`, `pay-debt.spec.ts`, `renew-plan-profile.spec.ts`, `update-plan-profiles-status.spec.ts`, `update-plan.spec.ts`, `create-plan.spec.ts`, `expired-utils.spec.ts` (novos testes para `expired.ts`).
  - `test/tests/sale/*`: `pay-sale.spec.ts` (injeção de `FakeTypeRecurrenceRepository`), `apply-plan-discounts.spec.ts`, `recalculate-user-sales.spec.ts`, `update-client-sale.spec.ts`, `update-sale-item.spec.ts`.
- Removido uso excessivo de `any` em testes; criado helper tipado para perfis associados a usuário quando necessário; mocks de transação tipados com `Prisma.TransactionClient`.
- Para testes que dependem de transação, `prisma.$transaction` é mockado para evitar acesso ao banco real.

### Mudanças de comportamento
- Expiração/atraso de planos baseados exclusivamente em `Debt.dueDate`.
- Pagamento de uma única dívida não reativa automaticamente o plano: o perfil só volta para `PAID` quando não houver dívidas pendentes.
- Geração de dívidas recorrentes evita duplicar débitos PENDING para a mesma `dueDate`.

### Ações de migração
- Rodar as migrations adicionadas.
- Atualizar quaisquer criadores de `Debt` (API/seed/tests) para sempre informar `dueDate` e, quando PENDING, manter `paymentDate` nulo.
- Substituir o uso de `PlanProfile.dueDateDebt` por `dueDayDebt` em todo o código e seeds.
- Se houver integrações externas (ex.: Insomnia ou clientes) que criam débitos, ajustar payload para refletir `status` + `dueDate`.

### Observações
- O limite de cancelamento por inadimplência usa atualmente `planTime + 1` mês(eses) como base. Está sinalizado como ponto de configuração futura por unidade.
- A remoção de fallback de datas exige que os dados antigos sejam adaptados para conter `dueDate` — os testes e seeds foram atualizados nesse sentido.

### Guia de Upgrade (1.3.0)
- Banco de dados:
  - Execute as migrations: `20250729162303_novos_campos_para_plan_e_debts` e `20250729162511_campo_opcional_no_debito`.
- Código/Seeds:
  - Onde houver criação de `Debt`, informe `dueDate`. Para débitos pendentes, deixe `paymentDate` ausente/nulo.
  - Atualize qualquer referência de `PlanProfile.dueDateDebt` para `dueDayDebt`.
  - Seeds: ajuste as dívidas iniciais para incluir `dueDate` coerente com a recorrência.
- Integrações:
  - Insomnia/Clientes: atualizar payload de criação de débito para incluir `status` e `dueDate` (sem `paymentDate` para PENDING).
- Serviços afetados:
  - Se você instanciava `UpdatePlanProfilesStatusService` manualmente, remova a injeção de `PlanRepository`.
  - `PaySaleService` agora requer `TypeRecurrenceRepository` para calcular `dueDate`.
