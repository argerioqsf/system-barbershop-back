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
- **Escopo**: criação, remarcação, cancelamento e sincronização da venda associada.
- **Referência**: `docs/appointment/migration-plan.md` detalha todas as etapas.
- **Status**: Em planejamento — este módulo será o próximo a migrar.
- **Fase 1 – Preparação**
  - Levantar testes existentes e mapear dependências (`BarberUsersRepository`, `SaleRepository`, utilitários de disponibilidade).
  - Definir contrato `AppointmentTelemetry` e eventos mínimos (`appointment.created`, `appointment.updated`, `appointment.cancelled`, `appointment.availability_checked`).
- **Fase 2 – Serviços especializados**
  - Extrair validações de janela (limite futuro, data passada) para `ValidateAppointmentWindowService`.
  - Encapsular cálculo de disponibilidade em `CheckBarberAvailabilityService` reutilizando `isAppointmentAvailable`.
  - Criar `SyncAppointmentSaleService` responsável por criar/atualizar a venda vinculada ao agendamento.
- **Fase 3 – Casos de uso e factories**
  - Implementar `CreateAppointmentUseCase`, `UpdateAppointmentUseCase`, `ListAppointmentsUseCase` e `ListAvailableBarbersUseCase` em `src/modules/appointment/application/use-cases`.
  - Criar factories correspondentes em `src/modules/appointment/infra/factories` e atualizar controllers para consumi-las.
  - Instrumentar telemetria nos pontos críticos.
- **Fase 4 – Testes e hardening**
  - Atualizar e expandir testes de integração para os endpoints de agendamento.
  - Adicionar testes unitários para serviços extraídos (janela, disponibilidade, sincronização de venda).
  - Validar integração com o módulo de vendas e relatórios/commissions existentes.

## Próximos Passos Gerais
1. Criar diagramas atualizados no diretório `docs/` conforme cada módulo for migrado.
2. Atualizar README, Insomnia e testes de integração conforme os novos fluxos forem ativados.
3. Usar o checklist de staging já definido em `sale-migration-checklist.md` como base para os novos módulos, adaptando os itens específicos.

> Mantenha PRs pequenos e rastreáveis, seguindo o mesmo modelo aplicado na migração de `Sale`.
