# Fase 5 — Organization (Org/Unit/OpeningHour/Profile)

Objetivo
- Unificar regras de horário, perfis e vínculos com unidade como casos de uso e serviços de domínio.

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

