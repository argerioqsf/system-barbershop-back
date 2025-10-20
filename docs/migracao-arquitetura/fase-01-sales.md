# Fase 1 — Sales (consolidação)

Objetivo
- Consolidar o módulo de vendas, alinhando portas, factories e serviços ao padrão definido.

Tarefas
- [ ] Mapear portas necessárias (`SaleRepository`, `SaleItemRepository`, `CouponRepository`, `ProductRepository`, etc.).
- [ ] Revisar `src/modules/sale/*` e alinhar nomenclaturas/contratos.
- [ ] Substituir utilidades duplicadas em `src/services/sale/utils/*` por serviços de domínio/aplicação.
- [ ] Criar adapters de compatibilidade quando ainda houver dependências legadas (com `// MIGRATION-TODO`).
- [ ] Atualizar controllers para factories (quando faltarem).
- [ ] Garantir `TransactionRunner` nos casos de uso que precisam de transação.

Critérios de aceite
- [ ] Contratos HTTP inalterados; testes E2E de vendas passando.
- [ ] Casos de uso de Sales não dependem de utilidades legadas (exceto adapters temporários documentados).

Riscos & Mitigações
- Divergência de cálculo: cobrir cálculos críticos com unit tests e comparar antes/depois.

Rollout
- PRs por subárea (itens, descontos, cupom), mantendo cobertura de testes.

