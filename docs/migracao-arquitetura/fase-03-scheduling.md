# Fase 3 — Scheduling (Appointments)

Objetivo
- Consolidar disponibilidade e validação de agenda como serviços de domínio e alinhar controllers a factories do módulo.

Tarefas
- [ ] Migrar controllers para factories do módulo `appointment`.
- [ ] Consolidar `CheckBarberAvailability` e `ValidateAppointmentWindow` como serviços de domínio puros.
- [ ] Separar cálculos de disponibilidade base (Profile) vs. disponibilidade efetiva (Appointments).
- [ ] Cobrir com testes unitários e manter E2E.

Critérios de aceite
- [ ] Rotas atuais e validações Zod inalteradas.
- [ ] Serviços de domínio puros testados (sem dependência de ORM/HTTP).

Riscos & Mitigações
- Divergências de timezone: padronizar em UTC no domínio e converter na borda.

Rollout
- PR único pequeno ou por serviço (availability/validation), garantindo cobertura.

