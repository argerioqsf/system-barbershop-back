# Fase 5 — Organization (Org/Unit/OpeningHour/Profile)

Objetivo
- Unificar regras de horário, perfis e vínculos com unidade como casos de uso e serviços de domínio.

Macro objetivos (O1, O2, ...)
- O1 — Casos de uso de Organization/Unit/OpeningHour/Profile definidos e isolados (Clean/Hexagonal).
- O2 — Regras de horário modeladas em serviços de domínio (interseções, validações de sobreposição).
- O3 — Garantir a criação de `Profile` para todo `User` com vínculo imediato à unidade.
- O4 — Ports e adapters Prisma para cada agregado, com `tx?`.
- O5 — Controllers migrados para factories; contratos estáveis; E2E ok.
- O6 — Testes unitários cobrindo regras de horário e vínculos.

Slicing (tarefas pequenas)
- [ ] S — OpeningHour: entidade/validações e CRUD [O1,O2].
  - Critérios: sobreposição inválida bloqueada; unit tests.
  - Backout: manter validação antiga no controller.
- [ ] S — Profile: garantir criação para todo `User` (vínculo imediato) + portas necessárias [O1,O3,O4].
  - Critérios: fluxo de criação integrado com IAM; E2E ok.
  - Backout: criar profile via serviço antigo.
- [ ] XS — Unit: validações simples + controllers via factories [O1,O5].
  - Critérios: contrato inalterado.
  - Backout: reverter binding.
- [ ] XS — Definir ports para Organization/Unit/OpeningHour/Profile e adapters mínimos [O4].
  - Critérios: interfaces estritas; mappers isolados.
  - Backout: repositórios legados.
- [ ] XS — Testes unitários de regras de horário e vínculos [O6].
  - Critérios: casos de sobreposição e criação de profile.
  - Backout: manter baseline anterior.

Independência & Handoff
- Sem bloqueio de IAM: `UsersRepository` usado apenas via port; se IAM não estiver migrado, usar adapter chamando os repositórios/queries atuais de usuário.
- Scheduling pode consumir `ProfilesRepository` via port; até migrar, manter adapter de compatibilidade em Scheduling.
- Handoff: quando IAM/Scheduling migrarem, trocar adapters por implementações nativas e remover TODOs.

Tarefas
- [ ] Casos de uso de Organization/Unit/OpeningHour/Profile.
- [ ] Serviços de domínio para regras de horário (interseções, validações).
- [ ] Factories + controllers atualizados.
- [ ] Garantir criação de `Profile` para todo `User` (vínculo imediato).

Critérios de aceite
- [ ] Regras de horário cobertas por unit tests.
- [ ] Rotas mantidas.

Riscos & Mitigações
- Regressão em disponibilidade: alinhar com Scheduling e testes cruzados.

Rollout
- PRs por agregado (Unit, OpeningHour, Profile).
