# Fase 6 — IAM (Users, Roles, Permissions, Sessions)

Objetivo
- Consolidar RBAC e casos de uso de identidade, mantendo contratos atuais.

Macro objetivos (O1, O2, ...)
- O1 — Casos de uso: Register, Authenticate, SetUserUnit, UpdateUser, ListClients.
- O2 — RBAC service/guard padronizado com ports claras; helper `authGuard(permissions)` reutilizado.
- O3 — Controllers migrados para factories; contratos estáveis; E2E de auth/RBAC passam.
- O4 — Ports/adapters Prisma para Users/Roles/Permissions/Sessions; token/password providers como ports.

Slicing (tarefas pequenas)
- [ ] S — Register/Authenticate como use-cases com ports `UsersRepository`/`PasswordHash`/`TokenProvider` [O1,O4].
  - Critérios: E2E de autenticação passante; sem mudança de payload.
  - Backout: controllers chamam serviço antigo.
- [ ] XS — SetUserUnit com validação de permissão via guard simples [O1,O2].
  - Critérios: checagem de permissão consistente; unit test do guard.
  - Backout: checagem antiga no preHandler.
- [ ] XS — RBAC service: checagem por escopo e helper `authGuard(permissions)` [O2].
  - Critérios: middlewares compartilham helper; sem quebra.
  - Backout: usar middlewares antigos.
- [ ] XS — ListClients: mover consulta para query handler dedicado [O1].
  - Critérios: contrato inalterado; melhor isolamento.
  - Backout: voltar a usar repositório direto no controller.
- [ ] XS — Definir ports/adapters Prisma de Users/Roles/Permissions/Sessions; providers de token/senha [O4].
  - Critérios: interfaces estritas; mappers isolados.
  - Backout: repositórios legados.
- [ ] XS — Migrar controllers de IAM para factories [O3].
  - Critérios: contratos estáveis; E2E ok.
  - Backout: reverter binding.

Independência & Handoff
- Sem bloqueio de Organization/Scheduling: exposições de `authGuard(permissions)` e ports de IAM não exigem mudanças nos módulos consumidores; apenas binding dos controllers.
- Middlewares: manter `verify-jwt`/`verify-permission` atuais e criar helper `authGuard` como camada paralela; migrar gradualmente os controllers sem alterar contrato.
- Handoff: quando demais módulos adotarem o helper/ports, remover duplicações e TODOs dos middlewares antigos.

Tarefas
- [ ] Casos de uso: Register, Authenticate, SetUserUnit, UpdateUser, ListClients.
- [ ] RBAC service simples (checagem por escopo) com portas claras.
- [ ] Factories e adapters Prisma; controllers usam factories.

Critérios de aceite
- [ ] E2E de autenticação e RBAC passam sem mudança de contrato.

Riscos & Mitigações
- Token/session: validar impacto em middlewares e renovar testes E2E conforme necessário.

Rollout
- PR único ou por caso de uso, priorizando segurança.
