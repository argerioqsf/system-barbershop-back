# Fase 8 — Remoção de código legado

Objetivo
- Remover serviços em `src/services/*` que ficaram sem uso e finalizar a migração.

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

