# Fase 4 — Catalog (Products/Services/Categories/Coupons/Benefits)

Objetivo
- Definir entidades e invariantes; extrair utilidades para serviços de domínio e padronizar factories/controllers.

Macro objetivos (O1, O2, ...)
- O1 — Entidades/VOs e invariantes de Product/Service/Category/Coupon/Benefit modelados no domínio.
- O2 — Casos de uso CRUD padronizados por agregado, com validações Zod nos controllers.
- O3 — Serviços de domínio para estoque e descontos (cupom/benefícios) com testes unitários.
- O4 — Ports definidas por agregado e adapters Prisma com mappers isolados.
- O5 — Controllers via factories do módulo, contratos estáveis; E2E ok.

Slicing (tarefas pequenas)
- [ ] S — Product: VO/entidade com invariante de estoque ≥ 0 + casos de uso CRUD [O1,O2,O3].
  - Critérios: testes unitários de estoque; E2E CRUD ok.
  - Backout: manter serviços antigos.
- [ ] S — Service: preço mínimo/ativo; CRUD [O1,O2].
  - Critérios: validações Zod alinhadas; E2E CRUD ok.
  - Backout: reverter controller.
- [ ] S — Category: CRUD simples [O1,O2].
  - Critérios: contrato inalterado; E2E ok.
  - Backout: reverter binding.
- [ ] S — Coupon/Benefit: invariantes de validade; serviços de domínio para cálculo básico [O1,O3].
  - Critérios: unit tests dos cálculos; integração com Sales via serviço do módulo.
  - Backout: manter utilidades anteriores.
- [ ] XS — Definir ports por agregado e adapters Prisma com mappers [O4].
  - Critérios: interfaces estritas; adapters isolados do domínio.
  - Backout: manter repositórios legados.
- [ ] XS — Migrar controllers para factories do módulo, validando com Zod [O5].
  - Critérios: contratos estáveis; E2E CRUDs ok.
  - Backout: reverter binding.

Independência & Handoff
- Sem bloqueio de Sales: expor serviços/ports (estoque/descontos/cupom) no módulo Catalog e manter adapters/compat wrappers no Sales até a migração completa. Marcar `// MIGRATION-TODO` nos pontos de integração.
- Handoff: quando Sales depender dos ports nativos de Catalog, remover wrappers/compat e apagar TODOs.

Tarefas
- [ ] Modelar invariantes (estoque não negativo, preço mínimo, validade de cupom).
- [ ] Casos de uso CRUD + serviços auxiliares (estoque, desconto).
- [ ] Factories + controllers revisados.
- [ ] Migrar utilidades de `src/services/sale/utils/*` quando fizer sentido.

Critérios de aceite
- [ ] CRUD mantêm contrato HTTP; E2E ok.
- [ ] Regras críticas cobertas por unit tests.

Riscos & Mitigações
- Impacto em cálculo de desconto: comparar antes/depois com testes existentes.

Rollout
- PRs por entidade (Product, Service, Category, Coupon, Benefit).
