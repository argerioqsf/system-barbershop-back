# Fase 4b — Plans & Recurrence (Plans/PlanProfiles/TypeRecurrence)

Objetivo
- Migrar casos de uso de planos e recorrência, integrando com dívidas/finance.

Macro objetivos (O1, O2, ...)
- O1 — CRUD de Plan no módulo, com invariantes básicos e contratos inalterados.
- O2 — PlanProfile com criar/cancelar/renovar integrado a dívidas (Finance) de forma idempotente.
- O3 — TypeRecurrence reposicionado sob Plans (ou Finance‑Billing) como fonte de verdade.
- O4 — Jobs/schedulers em infra orquestrando casos de uso puros, com idempotência e logs.

Slicing (tarefas pequenas)
- [ ] S — CRUD de Plan (entidade e invariantes básicos) [O1].
  - Critérios: E2E CRUD sem quebra; typecheck ok.
  - Backout: reverter controller.
- [ ] S — PlanProfile: criar/cancelar/renovar com portas Finance para débitos [O2].
  - Critérios: integração idempotente com geração de dívidas.
  - Backout: desligar integração e manter fluxo antigo.
- [ ] S — TypeRecurrence sob Plans (ou Finance-Billing) como fonte de verdade [O3].
  - Critérios: jobs usam tipo unificado; logs estruturados.
  - Backout: apontar jobs para tabela/adapter antigo.
- [ ] S — Jobs/schedulers em infra chamando casos de uso puros (3 jobs) [O4].
  - Critérios: idempotência validada; testes de unidade dos handlers.
  - Backout: desativar cron e usar manual trigger.
 - [ ] XS — Definir ports `PlanRepository`/`PlanProfileRepository`/`TypeRecurrenceRepository` e adapters Prisma mínimos [O1,O2,O3].
   - Critérios: interfaces estritas; mappers isolados.
   - Backout: manter repositórios legados.
 - [ ] XS — Binding de controllers para factories dos casos de uso [O1,O2].
   - Critérios: contratos estáveis; E2E ok.

Independência & Handoff
- Sem bloqueio de Finance: integrar com dívidas via port `DebtsRepository`; caso Finance ainda não esteja migrado, usar adapter de compatibilidade chamando o serviço/consulta legada. Marcar `// MIGRATION-TODO` para trocar pelo adapter Prisma do módulo Finance.
- Jobs/schedulers: orquestram casos de uso puros e dependem apenas das ports; a implementação de `DebtsRepository` pode ser de compatibilidade até o Finance ficar pronto.

Tarefas
- [ ] Migrar Create/List/Get/Update/Delete de Plan e PlanProfile.
- [ ] Reposicionar `TypeRecurrence` sob Plans (ou Finance-Billing) como fonte de verdade.
- [ ] Jobs/schedulers: orquestração em infra chamando casos de uso puros.
- [ ] Integrar geração e reconciliação de débitos com Finance/Debts.

Critérios de aceite
- [ ] Rotas mantidas; jobs idempotentes; logs estruturados.

Riscos & Mitigações
- Concorrência em jobs: usar locks suaves e idempotência.

Rollout
- PRs por caso de uso e um para agendadores.
