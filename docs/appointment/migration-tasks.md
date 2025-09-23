# Tasks – Migração do Domínio de Agendamentos

Este arquivo lista todas as atividades necessárias para concluir a migração do domínio de agendamentos para a arquitetura modular. As tarefas estão agrupadas por fases e apresentam dependências, artefatos esperados e responsáveis sugeridos.

## 0. Preparação Geral
- [ ] Revisar `docs/appointment/migration-plan.md` e validar escopo com o time.
- [ ] Definir responsáveis e prazos para cada fase.
- [ ] Criar branch dedicada para a migração (`feature/appointments-module`).
- [ ] Atualizar o roadmap (`docs/roadmap/next-modules-migration.md`) com status inicial da migração.

## 1. Diagnóstico e Inventário
- [ ] Mapear controllers existentes (`src/http/controllers/appointment/*`).
- [ ] Levantar serviços legados (`src/services/appointment/*`) e dependências transversais.
- [ ] Catalogar repositórios e contratos utilizados (`AppointmentRepository`, `BarberUsersRepository`, `SaleRepository`, `ServiceRepository`, `UnitRepository`).
- [ ] Identificar utilitários compartilhados (`@/utils/barber-availability`, `@/utils/permissions`).
- [ ] Mapear testes atuais (`test/integration/appointment`).
- [ ] Documentar lacunas de testes e comportamentos críticos que precisam de cobertura.

## 2. Planejamento de Telemetria
- [ ] Definir contrato `AppointmentTelemetry` com métodos (`recordCreated`, `recordUpdated`, `recordCancelled`, `recordAvailabilityCheck`).
- [ ] Especificar payload mínimo para cada evento (IDs, timestamps, duração, status).
- [ ] Validar alinhamento com padrões existentes em `sale` (`SaleTelemetry`).
- [ ] Atualizar `docs/appointment/migration-plan.md` se necessário após revisões.

## 3. Infraestrutura Base do Módulo
- [ ] Criar diretórios `src/modules/appointment/application`, `src/modules/appointment/infra`.
- [ ] Estruturar subpastas `contracts`, `services`, `use-cases`, `infra/factories`, `infra/prisma`.
- [ ] Definir e exportar `AppointmentModuleTypes` (interfaces auxiliares) se necessário.
- [ ] Implementar contrato `AppointmentTelemetry` em `contracts/appointment-telemetry.ts` com type signatures.
- [ ] Criar stub de `make-appointment-telemetry.ts` retornando implementação concreta (mesmo provider de `sale`).

## 4. Serviços Especializados
- [ ] Implementar `ValidateAppointmentWindowService` (futuros limites, data passada, unidade).
- [ ] Implementar `CheckBarberAvailabilityService` encapsulando `isAppointmentAvailable`.
- [ ] Implementar `SyncAppointmentSaleService` (criação/atualização da venda vinculada).
- [ ] Implementar serviço/função para validar permissões de barbeiro (reutilizar `assertPermission`).
- [ ] Escrever testes unitários para cada serviço.
- [ ] Documentar decisões ou ajustes em `docs/appointment/migration-plan.md`.

## 5. Casos de Uso
- [ ] Criar `CreateAppointmentUseCase` utilizando serviços especializados e telemetria.
- [ ] Criar `UpdateAppointmentUseCase` (revalidação de janela, disponibilidade, sincronização da venda).
- [ ] Criar `ListAppointmentsUseCase` (refatorar lógica de listagem).
- [ ] Criar `ListAvailableBarbersUseCase` (usar novo serviço de disponibilidade).
- [ ] (Opcional) Criar `CancelAppointmentUseCase` se existir fluxo equivalente.
- [ ] Adicionar testes unitários para cada use case (incluindo mocks de telemetria).

## 6. Adaptadores e Repositórios
- [ ] Criar `PrismaAppointmentRepository` dentro de `infra/prisma` reutilizando o repositório existente.
- [ ] Validar se repositórios legados precisam de ajustes (métodos extras, DTOs).
- [ ] Atualizar interfaces de repositório se necessário, garantindo retrocompatibilidade com outros módulos.
- [ ] Adicionar testes unitários/integrados para os adaptadores (ex.: interações com Prisma mockado).

## 7. Factories
- [ ] Implementar `make-create-appointment.ts` criando use case com dependências concretas.
- [ ] Implementar `make-update-appointment.ts` com `SyncAppointmentSaleService` reutilizado.
- [ ] Implementar `make-list-appointments.ts` e `make-list-available-barbers.ts`.
- [ ] Garantir que `make-appointment-telemetry.ts` injete implementação configurada.
- [ ] Escrever testes unitários para factories (instanciação correta, dependências obrigatórias).

## 8. Integração com Controllers
- [ ] Atualizar `create-appointment-controller.ts` para invocar factory nova.
- [ ] Atualizar `update-appointment-controller.ts` para use case modular.
- [ ] Atualizar `list-appointments-controller.ts` e `list-available-barbers-controller.ts`.
- [ ] Revisar rotas em `src/http/controllers/appointment/route.ts` para garantir que dependem das factories.
- [ ] Inserir telemetria onde necessário (antes/depois de execuções) se controllers tratam eventos adicionais.

## 9. Sincronização com Módulo de Vendas
- [ ] Avaliar necessidade de criar use case específico em `sale` para lidar com vendas de agendamento.
- [ ] Garantir que `SyncAppointmentSaleService` utilize `SaleTotalsService`/`SaleItemUpdateExecutor` quando aplicável.
- [ ] Atualizar documentação em `docs/sale/flow-overview.md` sobre integração com agendamentos.
- [ ] Ajustar testes do módulo de vendas se comportamento mudar.

## 10. Remoção / Depreciação de Serviços Legados
- [ ] Garantir que nenhuma referência permanece aos serviços em `src/services/appointment/*`.
- [ ] Marcar serviços legados como obsoletos ou excluí-los após validação.
- [ ] Atualizar importações nos testes para apontarem para novos use cases.
- [ ] Registrar migração em changelog/nota de versão (se houver).

## 11. Testes e Qualidade
- [ ] Atualizar testes de integração (`test/integration/appointment`) para novos casos de uso.
- [ ] Adicionar testes cobrindo cenários de erro (indisponibilidade, permissão, limite futuro).
- [ ] Rodar `npm test` e assegurar suites verdes.
- [ ] Rodar `npm run lint` e `npm run typecheck`.
- [ ] Verificar telemetria emitida em ambiente local/staging.
- [ ] Preparar evidências de QA (prints/logs) se necessário.

## 12. Documentação e Hand-off
- [ ] Atualizar `docs/appointment/migration-plan.md` com decisões finais e status.
- [ ] Atualizar `docs/README.md` e `README.md` caso novas referências sejam necessárias.
- [ ] Revisar `insominia-barbershop.yaml` com novos endpoints/payloads (se alterados).
- [ ] Atualizar `src/repositories/prisma/seed.ts` se houver mudanças em dados iniciais.
- [ ] Comunicar squad via Slack/Confluence com resumo da migração.
- [ ] Preparar checklist de deploy específico (se necessário) e anexar a PR.

## 13. Deploy e Pós-Deploy
- [ ] Validar staging: criar/atualizar/cancelar agendamento checando telemetria e venda.
- [ ] Validar integração com comissões/relatórios.
- [ ] Monitorar logs por 24h após deploy para capturar regressões.
- [ ] Atualizar roadmap com status “Concluído”.
- [ ] Realizar retrospectiva rápida da migração (lições aprendidas).

> Mantenha este checklist atualizado conforme cada item for concluído, adicionando links para PRs, tarefas do board e decisões relevantes.
