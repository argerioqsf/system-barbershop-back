# Fase 7 — Reporting e Config

Objetivo
- Separar queries de leitura como Application Query Handlers e manter exportações/storage estáveis.

Macro objetivos (O1, O2, ...)
- O1 — Query Handlers dedicados por relatório, contratos estáveis.
- O2 — Repositórios de leitura otimizados/isolados; índices ajustados conforme medição.
- O3 — Exportações via caso de uso + port `Storage` (upload/serve) sem alterar contratos.
- O4 — Testes de leitura/relatórios batendo baseline atual.

Slicing (tarefas pequenas)
- [ ] XS — Extrair Query Handler para `reports/sales` com repositório de leitura dedicado [O1,O2].
  - Critérios: contrato inalterado; testes de leitura batendo baseline.
  - Backout: controller volta a usar consulta antiga.
- [ ] XS — `reports/barber/:barberId/balance` como Query Handler com filtros testados [O1,O4].
  - Critérios: números equivalentes ao atual; cobertura mínima de filtros.
  - Backout: reverter binding do controller.
- [ ] XS — `config/export/users` via caso de uso simples + port `Storage` [O3].
  - Critérios: export gerada igual à atual; sem quebrar permissões.
  - Backout: usar implementação anterior.
- [ ] XS — Adicionar índices de DB necessários conforme medições [O2].
  - Critérios: queries estáveis em tempo; sem regressão.
  - Backout: remover índice ou ajustar consulta.
- [ ] XS — Dashboard do colaborador: extrair Query Handler `GetCollaboratorDashboard` [O1].
  - Critérios: move a partir do módulo `collaborator`; sem dependência de ORM na application.
  - Backout: controller volta a usar use-case legado.
- [ ] XS — Definir ports de leitura para o dashboard: `SaleItemReadRepository`, `TransactionReadRepository`, `ProfilesReadRepository` [O2].
  - Critérios: interfaces em `application/ports`; adapters Prisma em `infra`.
  - Backout: adapters de compat chamando consultas legadas.
- [ ] XS — Migrar controllers `GET /collaborators/me/dashboard` e endpoints afins para factories do módulo Reporting [O1].
  - Critérios: contratos inalterados; validações na borda; E2E ok.
  - Backout: reverter binding.
- [ ] XS — Criar adapters ACL para consumir portas de outros módulos (ex.: Finance → Reporting) mapeando os modelos locais [O1,O2].
  - Critérios: nenhum import direto de entidades de outros módulos; mapeamento explícito em `infra/repositories`.
  - Backout: usar adapter de compat temporário.

Independência & Handoff
- Sem bloqueio dos módulos de escrita: Query Handlers consomem somente repositórios de leitura; manter binding de controllers por relatório.
- Handoff: quando módulos de domínio migrarem, opcionalmente reusar mappers ou DTOs, mas sem dependência estrita (só leitura). Remover TODOs de compat ao consolidar.

Tarefas
- [ ] Criar Query Handlers dedicados para relatórios (sales, barbers, units, dashboard colaborador).
- [ ] Repositórios otimizados para leitura (pode usar Prisma direto, isolado) e ports específicos.
- [ ] Migrar controllers/rotas para factories do módulo mantendo contratos; validar respostas.
- [ ] Encaminhar endpoints de pendências de comissão do colaborador para Query(ies) do Finance (ou expor como queries de Reporting consumindo portas de Finance) sem duplicar regra.

Critérios de aceite
- [ ] Leitura/relatórios batem com baseline atual.

Riscos & Mitigações
- Performance de queries: medir e ajustar índices, quando necessário.

Rollout
- PR por relatório ou por agregado de leitura.

---

De/Para do Legado
- Migrar `src/modules/collaborator/application/use-cases/get-collaborator-dashboard.use-case.ts` → `src/modules/reporting/application/query-handlers/get-collaborator-dashboard.ts`.
- Ports/Telemetry do módulo → `src/modules/reporting/(application|infra)/{ports,telemetry}`.
- Controllers `src/http/controllers/collaborators/*` → `src/modules/reporting/infra/http/controllers/*` (rotas/contratos preservados).

Conformidade com o Guia de Arquitetura
- [ ] Query Handlers (application) sem dependência direta de ORM/adapters.
- [ ] Repositórios de leitura (ports) e adapters Prisma isolados em `infra`.
- [ ] Mappers de leitura separados quando necessário; DTOs no application.
- [ ] Controllers com validação (Zod) e mapeamento de erros.
- [ ] Sem compartilhamento de entidades entre módulos; consumo via ports.
- [ ] Testes de leitura batendo baseline atual.
