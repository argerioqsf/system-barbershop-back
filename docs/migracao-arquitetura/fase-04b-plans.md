# Fase 4b — Plans & Recurrence (Plans/PlanProfiles/TypeRecurrence)

Objetivo
- Migrar casos de uso de planos e recorrência, integrando com dívidas/finance.

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

