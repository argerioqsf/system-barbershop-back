# Refatoração de Arquitetura — Guia e Roadmap

Este diretório organiza o plano de migração para Clean Architecture + DDD + Hexagonal, com foco em tarefas pequenas, de baixo risco e mantendo o legado funcionando durante toda a transição.

- Base: `docs/refactor-arquitetura/plano-migracao-arquitetura.md`
- Fases: `docs/refactor-arquitetura/fases/*`
- Template de fase: `docs/refactor-arquitetura/fases/_template.md`
- Catálogo de rotas (referência): `docs/backend-endpoints.md`
 - Backlog XS (MIGRATION-TODO): `docs/refactor-arquitetura/backlog-xs.md`

## Como usar
- Leia os Princípios e Regras de Slicing abaixo.
- Em cada fase, há duas camadas:
  - Macro objetivos (O1, O2, …): o “resultado da fase”.
  - Slicing (tarefas XS/S): passos pequenos que entregam os macro objetivos. Cada tarefa referencia [O#].
- Escolha uma tarefa XS/S (15–90 min) dentro de uma fase e avance o [O#] correspondente.
- Siga o Fluxo por Task e os Gates de Segurança.
- Marque os checkboxes no arquivo da fase correspondente.

## Princípios
- Manter o legado funcionando: contratos HTTP e semântica de negócio estáveis.
- Migrar pelas bordas (Strangler): adapters temporários e re-exports quando necessário.
- Tarefas pequenas e isoladas: evitar PRs grandes; reduzir blast radius.
- Camadas claras: domínio e aplicação sem dependência de ORM/HTTP; infra como borda.
- Testes primeiro onde o risco é maior (caixa, comissões, estoque, cupons).

## Regras de Slicing (Tarefas pequenas)
- Tamanho alvo: XS/S (15–90 min) ou M (até meio dia) no máximo.
- Impacto mínimo: 0 mudança de contrato HTTP; mudanças internas com adapters.
- Sem dependências ocultas: listar dependências explícitas e backout simples.
- Cada tarefa deve ter: objetivo curto, passos, critérios de aceite, riscos, backout.
- Documentar pontos de migração com `// MIGRATION-TODO` e re-exports temporários.

## Estratégia de Legado (Strangler/Adapters)
- Onde o novo precisa falar com o antigo, encapsular chamada em adapter de infra.
- Onde o antigo precisa usar regra nova, expor serviço/caso de uso novo por factory e fazer o binding no controller legado.
- Remover adapters/re-exports ao concluir a fase (ver Fase 8).

## Fluxo por Task
1) Criar/atualizar porta/serviço/caso de uso no módulo alvo.
2) Conectar via factory e ajustar controller/adapter (sem mudar contrato HTTP).
3) Cobrir com testes (unit no domínio/aplicação; E2E quando rota muda de implementação).
4) Rodar gates: `npm test`, `npm run typecheck`, `npm run lint`.
5) Atualizar docs/checklists e marcar MIGRATION-TODO quando aplicável.

## Índice das Fases
- Fase 0 — Fundações: `docs/refactor-arquitetura/fases/fase-00-fundacoes.md`
- Fase 1 — Sales: `docs/refactor-arquitetura/fases/fase-01-sales.md`
- Fase 2 — Finance: `docs/refactor-arquitetura/fases/fase-02-finance.md`
- Fase 3 — Scheduling: `docs/refactor-arquitetura/fases/fase-03-scheduling.md`
- Fase 4 — Catalog: `docs/refactor-arquitetura/fases/fase-04-catalog.md`
- Fase 4b — Plans & Recurrence: `docs/refactor-arquitetura/fases/fase-04b-plans.md`
- Fase 5 — Organization: `docs/refactor-arquitetura/fases/fase-05-organization.md`
- Fase 6 — IAM: `docs/refactor-arquitetura/fases/fase-06-iam.md`
- Fase 7 — Reporting/Config: `docs/refactor-arquitetura/fases/fase-07-reporting-config.md`
- Fase 8 — Remoção de Legado: `docs/refactor-arquitetura/fases/fase-08-remocao-legado.md`
