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

Independência & Handoff
- Sem bloqueio dos módulos de escrita: Query Handlers consomem somente repositórios de leitura; manter binding de controllers por relatório.
- Handoff: quando módulos de domínio migrarem, opcionalmente reusar mappers ou DTOs, mas sem dependência estrita (só leitura). Remover TODOs de compat ao consolidar.

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
