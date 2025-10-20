# Fase 6 — IAM (Users, Roles, Permissions, Sessions)

Objetivo
- Consolidar RBAC e casos de uso de identidade, mantendo contratos atuais.

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

