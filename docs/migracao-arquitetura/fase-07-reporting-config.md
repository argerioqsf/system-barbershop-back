# Fase 7 — Reporting e Config

Objetivo
- Separar queries de leitura como Application Query Handlers e manter exportações/storage estáveis.

Tarefas
- [ ] Criar Query Handlers dedicados para relatórios.
- [ ] Repositórios otimizados para leitura (pode usar Prisma direto, isolado).
- [ ] Manter rotas e contratos inalterados; validar respostas.

Critérios de aceite
- [ ] Leitura/relatórios batem com baseline atual.

Riscos & Mitigações
- Performance de queries: medir e ajustar índices, quando necessário.

Rollout
- PR por relatório ou por agregado de leitura.

