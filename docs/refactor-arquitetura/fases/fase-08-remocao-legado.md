# Fase 8 — Remoção de código legado

Objetivo
- Remover serviços em `src/services/*` que ficaram sem uso e finalizar a migração.

Macro objetivos (O1, O2, ...)
- O1 — Remoção de serviços/handlers legados em `src/services/*` sem consumidores.
- O2 — Remoção de re-exports temporários e comentários `// MIGRATION-TODO` resolvidos.
- O3 — Bindings de controllers utilizando apenas factories dos módulos novos.
- O4 — Limpeza de docs/backlog relacionados à migração concluída.

Slicing (tarefas pequenas)
- [ ] XS — Listar e marcar serviços sem uso com base no `docs/refactor-arquitetura/backlog-xs.md`.
  - Critérios: nenhum import restante; PR só de remoção.
  - Backout: revert fácil; sem mudanças de contrato.
- [ ] XS — Remover re-exports temporários de `src/services/sale/utils/*`.
  - Critérios: `modules/sale` sem imports daqueles utils; testes passantes.
  - Backout: restaurar re-export.
- [ ] XS — Remover utilitários restantes de `src/services/sale/utils/*` após migração total dos consumidores.
  - Critérios: grep sem referências; testes e typecheck verdes.
  - Backout: n/a (somente remoção com revert simples).
- [ ] XS — Remover factories legadas de transação após migrar para `modules/finance`.
  - Critérios: controllers usam factories novas; E2E ok.
  - Backout: reverter binding.
- [ ] XS — Apagar comentários `// MIGRATION-TODO` resolvidos.
  - Critérios: grep não retorna ocorrências desatualizadas.
  - Backout: n/a.

Tarefas
- [ ] Mapear serviços obsoletos e remover em etapas.
- [ ] Atualizar importadores para módulos migrados.
- [ ] Remover re-exports temporários e comentários `// MIGRATION-TODO` concluídos.

Critérios de aceite
- [ ] Nenhuma referência aos serviços legados restantes.
- [ ] Testes e typecheck íntegros.

Riscos & Mitigações
- Quebra silenciosa por import residual: usar busca automatizada e CI rigoroso.

Rollout
- PRs pequenos, um por área removida, com checklist de impactos.
