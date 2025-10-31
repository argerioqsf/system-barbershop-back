# Fase 3 — Scheduling (Appointments)

Objetivo
- Consolidar disponibilidade e validação de agenda como serviços de domínio e alinhar controllers a factories do módulo.

Macro objetivos (O1, O2, ...)
- O1 — Serviços de domínio puros para disponibilidade base (Profile) e efetiva (Appointments).
- O2 — Validação de janela de agendamento isolada e testada (sem I/O).
- O3 — Controllers migrados para factories do módulo `appointment` com contratos inalterados.
- O4 — Ports definidas (`AppointmentsRepository`, `ProfilesRepository`) com `tx?` e adapters Prisma mínimos.
- O5 — Testes unitários cobrindo timezone e interseções; E2E estáveis.

Slicing (tarefas pequenas)
- [ ] XS — Extrair `ProfileAvailabilityService` (base: workHours − blockedHours) sem conhecer agendamentos [O1].
  - Critérios: puro, testado, timezone em UTC.
  - Backout: manter util antigo.
- [ ] S — Extrair `SchedulingAvailabilityService` (base − appointments) com validação de janela [O1,O2].
  - Critérios: puro, testado; controllers convertem datas.
  - Backout: voltar a util antigo.
- [ ] XS — Migrar um controller por vez para factories do módulo `appointment` [O3].
  - Critérios: contrato HTTP inalterado; E2E ok após cada migração.
  - Backout: reverter binding do controller migrado.
- [ ] XS — Definir ports `AppointmentsRepository` e `ProfilesRepository` e adicionar adapters Prisma mínimos [O4].
  - Critérios: interfaces em `application/ports`; adapters em `infra/repositories/prisma`; testes básicos.
  - Backout: usar repositórios legados temporariamente.
- [ ] XS — Adicionar testes unitários cobrindo timezone/overlaps; manter E2E estáveis [O5].
  - Critérios: casos UTC; edge cases de sobreposição.
  - Backout: manter baseline anterior.

Independência & Handoff
- Sem bloqueio de Organization: `ProfilesRepository` é uma port com adapter de compatibilidade chamando os repositórios/queries atuais até a migração de Organization.
- Controllers mantêm contratos; binding gradual por endpoint.
- Handoff: quando Organization migrar, trocar o adapter de `ProfilesRepository` por implementação nativa do módulo; remover `// MIGRATION-TODO`.

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
