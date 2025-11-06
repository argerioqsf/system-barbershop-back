# <Fase X — Nome>

Objetivo
- Descrever o resultado esperado em 1–2 linhas.

Macro objetivos (O1, O2, ...)
- O1 — Descrever objetivo macro 1
- O2 — Descrever objetivo macro 2

Slicing (tarefas pequenas)
- [ ] T1 (XS/S) [O1] — Descrição curta; sem mudar contrato HTTP.
  - Passos: ...
  - Dependências: ...
  - Critérios de aceite: ...
  - Backout: ...
- [ ] T2 (XS/S) [O2] — ...

Legado & Adapters
- Pontos onde adapters/re-exports serão usados e removidos.

Critérios de aceite (fase)
- Lista objetiva do que precisa estar ok ao fim da fase.

Riscos & Mitigações
- Lista curta de riscos com mitigação.

Rollout
- Estratégia de PRs pequenos e ordem sugerida.

---

Conformidade com o Guia de Arquitetura
- [ ] Separação domain/application/infra conforme `docs/arquitetura/guia-arquitetura.md`.
- [ ] Ports por agregado com `tx?: Prisma.TransactionClient` quando aplicável.
- [ ] Factories em `infra/factories` para wiring de use-cases/serviços/queries.
- [ ] Controllers com validação (Zod) e mapeamento de erros de domínio.
- [ ] Uso de `TransactionRunner`/`UseCaseCtx` quando houver transações.
- [ ] Sem compartilhamento de entidades entre módulos (usar ACL/ports e modelos locais).
- [ ] Testes adequados (unit/integration/E2E) conforme o módulo.

De/Para do Legado (se aplicável)
- (listar aqui os caminhos legados e seus destinos no novo módulo)
