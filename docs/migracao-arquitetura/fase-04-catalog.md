# Fase 4 — Catalog (Products/Services/Categories/Coupons/Benefits)

Objetivo
- Definir entidades e invariantes; extrair utilidades para serviços de domínio e padronizar factories/controllers.

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

