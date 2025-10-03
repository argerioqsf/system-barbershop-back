# Plano de Migração – Agendamentos

Este plano descreve a migração do domínio de agendamentos para a arquitetura modular já aplicada em `sale`. O objetivo é encapsular regras de negócio em casos de uso específicos, reduzir dependências diretas de serviços legados e habilitar telemetria consistente.

> Consulte também `docs/appointment/migration-tasks.md` para um checklist sequencial da implementação.

**Status atual**: Casos de uso e factories de criação, atualização, listagem e listagem de barbeiros disponíveis estão implementados na nova arquitetura, com telemetria integrada para criação e atualização.

## 1. Diagnóstico Atual
- Controllers em `src/http/controllers/appointment` instanciam serviços legados diretamente.
- Serviços em `src/services/appointment/*` misturam validações de domínio, consultas Prisma e integração com vendas.
- Dependências relevantes: `AppointmentRepository`, `BarberUsersRepository`, `ServiceRepository`, `UnitRepository`, `SaleRepository` e utilitários `@/utils/barber-availability` e `@/utils/permissions`.
- Ausência de telemetria dedicada (não existem eventos `appointment.*`).
- Testes de agendamento estão acoplados ao comportamento atual dos serviços (verificar `test/integration/appointment`).

## 2. Objetivos da Migração
1. Criar `src/modules/appointment/application` com casos de uso distintos para criação, atualização, listagem e cálculo de disponibilidade.
2. Introduzir serviços especializados (ex.: `ValidateAppointmentWindowService`, `SyncAppointmentSaleService`).
3. Padronizar factories em `src/modules/appointment/infra/factories` e atualizar controllers para consumi-las.
4. Expor contrato de telemetria (`AppointmentTelemetry`) alinhado ao padrão aplicado em `sale`.
5. Garantir cobertura de testes unitários e de integração para os novos fluxos.

## 3. Arquitetura Alvo
```
src/modules/appointment/
  application/
    contracts/appointment-telemetry.ts
    services/
      validate-appointment-window-service.ts
      check-barber-availability-service.ts
      sync-appointment-sale-service.ts
    use-cases/
      create-appointment.ts
      update-appointment.ts
      list-appointments.ts
      list-available-barbers.ts
  infra/
    factories/
      make-create-appointment.ts
      make-update-appointment.ts
      make-list-appointments.ts
      make-list-available-barbers.ts
      make-appointment-telemetry.ts
    prisma/
      prisma-appointment-repository.ts (adaptador)
```
- Casos de uso recebem dependências via construtor e delegam tarefas específicas aos serviços.
- `sync-appointment-sale-service` encapsula criação/atualização de vendas associadas.
- Telemetria captura eventos como `appointment.created`, `appointment.updated`, `appointment.cancelled`, `appointment.availability_checked`.

## 4. Passo a Passo da Migração
1. **Preparação**
   - Mapear testes existentes (`test/integration/appointment/**/*`) e identificar lacunas.
   - Criar contrato `AppointmentTelemetry` com métodos mínimos (`recordCreated`, `recordUpdated`, `recordCancelled`, `recordAvailabilityCheck`).
2. **Camada de Serviços**
   - Extrair validações de disponibilidade e janelas para `ValidateAppointmentWindowService`.
   - Extrair consulta de disponibilidade (`isAppointmentAvailable`) para `CheckBarberAvailabilityService` (reusando utilitário atual).
   - Criar `SyncAppointmentSaleService` encapsulando a criação/atualização da venda vinculada ao agendamento.
3. **Casos de Uso**
   - `CreateAppointmentUseCase`: orquestra validações, disponibilidade, telemetria e sincronização de venda.
   - `UpdateAppointmentUseCase`: atualiza dados, revalida disponibilidade quando necessário, sincroniza venda e telemetria.
   - `ListAppointmentsUseCase` e `ListAvailableBarbersUseCase`: mover lógica atual dos serviços.
4. **Infraestrutura**
   - Implementar factories correspondentes instanciando as dependências (repositórios Prisma, serviços e telemetria).
   - Atualizar controllers para usarem as novas factories (seguindo padrão de `sale`).
5. **Teste e Ajustes Finais**
   - Atualizar testes de integração para chamar controllers com os novos use cases.
   - Adicionar testes unitários para os serviços extraídos (ex.: cenários de indisponibilidade, limite de agendamento, sincronização de vendas).
   - Garantir que telemetria seja invocada nos casos de uso principais.

## 5. Observabilidade e Telemetria
- Implementar `make-appointment-telemetry.ts` reutilizando provedor global (ex.: instância de OpenTelemetry/Logger já usada em `sale`).
- Eventos mínimos:
  - `appointment.created`
  - `appointment.updated`
  - `appointment.cancelled`
  - `appointment.availability_checked`
- Incluir IDs relevantes (cliente, barbeiro, unidade) e duração da operação.

## 6. Dependências Cruzadas
- `SyncAppointmentSaleService` deve reutilizar contratos já existentes em `src/modules/sale` para evitar duplicação de lógica de itens.
- Avaliar necessidade de novo use case em `sale` para lidar com a criação da venda de agendamento (evitar chamar repositórios diretamente).
- Confirmar compatibilidade com cálculo de comissões e relatórios após atualização do fluxo de vendas.

## 7. Plano de Testes
- **Unitários**: serviços de validação, disponibilidade e sincronização de venda.
- **Integração**: endpoints `/appointments`, `/appointments/:id`, `/appointments/:id/cancel` (se existir), `/appointments/available-barbers`.
- **End-to-end manual**: criar/atualizar/cancelar agendamento via Insomnia e verificar venda e telemetria.

## 8. Riscos e Mitigações
- **Risco**: desacoplamento incorreto entre agendamento e venda causar inconsistências.
  - *Mitigação*: escrever testes cobrindo criação de venda, status `PaymentStatus.PENDING` e atualização posterior.
- **Risco**: validação de disponibilidade regressiva por diferenças no utilitário.
  - *Mitigação*: snapshot de cenários existentes e comparação com novos resultados.
- **Risco**: aumento do tempo de resposta devido à telemetria.
  - *Mitigação*: telemetria assíncrona e testes de desempenho nos endpoints críticos.

## 9. Critérios de Conclusão
- Controllers de agendamento consumindo exclusivamente factories do novo módulo.
- Serviços legados em `src/services/appointment` não utilizados (candidatos à remoção numa etapa posterior).
- Telemetria ativa para eventos principais (verificada em logs/monitoramento).
- Testes unitários e de integração atualizados e verdes (`npm test`).
- Documentação (`docs/appointment/migration-plan.md` e `docs/roadmap/next-modules-migration.md`) revisada com status atual.

> Atualize este arquivo conforme as etapas forem concluídas, marcando checklists e adicionando decisões relevantes tomadas durante a migração.
