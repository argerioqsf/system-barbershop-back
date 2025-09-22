# Migration Plan – Next Modules

Este plano complementa o `docs/sale/flow-refactor-plan.md` listando os próximos módulos a serem migrados para a nova arquitetura de use cases, serviços especializados e telemetria.

## 1. Caixa (Cash Register)
- **Escopo**: abertura/fechamento de sessão, movimentações, verificações de saldo.
- **Ações iniciais**
  - Mapear controllers e serviços em `src/http/controllers/cash-register` e `src/services/cash-register`.
  - Definir casos de uso principais (abrir sessão, fechar sessão, listar sessões, adicionar/retirar valores).
  - Criar factories e coordenadores em `src/modules/finance` reutilizando o padrão de `PaySaleCoordinator`.
- **Cuidados**
  - Garantir consistência com o fluxo de pagamento (integração com `PaySaleUseCase`).
  - Introduzir telemetria para abertura/fechamento e operações críticas.

## 2. Comissões e Transações
- **Escopo**: cálculo de comissões, distribuição de lucros, lançamentos em `TransactionRepository`.
- **Ações iniciais**
  - Extrair use cases para cálculo de comissão/repasse em `src/modules/finance/application`.
  - Revisar serviços em `src/services/transaction` e mover factories para `src/modules/finance/infra/factories`.
  - Centralizar lógica de “pending commissions” e relatórios usando o padrão de telemetria.
- **Cuidados**
  - Reutilizar utilitários de `sale/utils` já compartilhados.
  - Atualizar testes (`test/tests/transactions/*`, `test/tests/report/*`) para apontarem para os novos use cases.

## 3. Agendamentos (Appointments)
- **Escopo**: criação/remarcação/cancelamento, integração com vendas e planos.
- **Ações iniciais**
  - Mapear controllers em `src/http/controllers/appointment` e serviços em `src/services/appointment`.
  - Definir casos de uso por operação e mover lógica de `update-appointment.ts` para módulos.
  - Conectar com `SaleItemsBuildService` para reaproveitar rebuild de itens ligados a agendamentos.
- **Cuidados**
  - Validar impactos nas dependências (planos, notificações) antes da migração.
  - Acrescentar eventos de telemetria (ex.: `appointment.created`, `appointment.rescheduled`).

## Próximos Passos Gerais
1. Criar diagramas atualizados no diretório `docs/` conforme cada módulo for migrado.
2. Atualizar README, Insomnia e testes de integração conforme os novos fluxos forem ativados.
3. Usar o checklist de staging já definido em `sale-migration-checklist.md` como base para os novos módulos, adaptando os itens específicos.

> Mantenha PRs pequenos e rastreáveis, seguindo o mesmo modelo aplicado na migração de `Sale`.
