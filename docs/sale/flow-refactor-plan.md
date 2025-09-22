# Plano de Ação – Fluxo de Sales

Este plano descreve as tarefas necessárias para migrar o fluxo de vendas (sale) para a nova arquitetura proposta, mantendo o restante do sistema na arquitetura atual enquanto evoluímos gradualmente.

## 1. Mapeamento e Diagnóstico
- [x] Levantar todos os serviços, controllers, rotas e factories relacionados a criação, edição, remoção e pagamento de vendas.
- [x] Desenhar o fluxo atual (sequência de chamadas, dependências e cálculos) para servir de referência durante a migração.
- [x] Identificar pontos de acoplamento e duplicidade de regras (ex.: recalculadores, validações espalhadas, logs diretos).

## 2. Camada de Orquestração (Coordinators / Use Cases)
- [x] Definir um diretório `src/sale/application` (ou equivalente) para concentrar os novos casos de uso.
- [x] Especificar contratos de entrada/saída para cada caso de uso principal (criar venda, atualizar item, aplicar pagamento, recalcular totais).
- [x] Implementar coordenadores que recebam dependências via construtor e orquestrem chamadas aos serviços especializados.
- [x] Atualizar controllers para delegarem a esses coordenadores (primeiro em paralelo, depois substituindo a lógica antiga).

## 3. Serviços Especializados por Operação
- [x] Quebrar `update-sale-item` em serviços específicos (ex.: `UpdateSaleItemBarberService`, `UpdateSaleItemQuantityService`, `UpdateSaleItemCustomPriceService`).
- [x] Extrair a lógica de cupom para um serviço dedicado (`UpdateSaleItemCouponService`) substituindo o fluxo atual.
- [x] Revisar rotas e controllers para apontarem para os novos serviços individuais.
- [x] Garantir que validações e erros específicos estejam localizados em cada serviço especializado.

## 4. Recalculador Central de Totais
- [x] Criar um serviço compartilhado (`SaleTotalsService` ou similar) responsável por rebuild de itens, reaplicação de cupom, cálculo de totais bruto/líquido e diffs.
- [x] Migrar helpers (`rebuildAllItemsApplyingCoupon`, `applyTotalsDelta`, `calculateTotalsFromItems`) para este serviço.
- [x] Atualizar todos os fluxos que recalculam totais para utilizarem o serviço centralizado.
- [x] Adicionar testes unitários cobrindo cenários com/sem cupom, descontos em valor e percentual, custom price e rebuild total.

## 5. Camada de Domínio e Validações
- [x] Criar objetos de domínio (ex.: `SaleItem`, `SaleDiscount`, `SaleCoupon`) em `src/modules/sale/domain` encapsulando regras de negócio puras.
- [x] Centralizar validações de entrada (ex.: payload de atualização de item) em validadores ou value objects reutilizáveis.
- [x] Garantir que erros estejam padronizados e contextualizados (mensagens consistentes, mapeamento 4xx/5xx no HTTP).

## 6. Injeção de Dependências e Factories
- [x] Ajustar services para receberem dependências explicitamente no construtor (repos, recalculador, logger, etc.).
- [x] Organizar factories em `src/sale/infra/factories` para montar os coordinators e services com as dependências corretas.
- [x] Atualizar testes e controllers para usar as novas factories.

- [x] Refatorar `pay-sale.ts` para utilizar o coordinator e os serviços especializados (ex.: recalculador, cálculo de comissão, atualização de saldo).
- [x] Extrair lógica de comissões e distribuição de lucros para serviços específicos (`SaleCommissionService`, `SaleProfitDistributionService`).
- [x] Assegurar que os eventos/recalculos de usuários dependentes (`recalculate-user-sales.ts`) sejam integrados via coordinator ou event handler.
- [x] Cobrir toda cadeia de pagamento com testes de integração (pagamento integral, parcial, com cupom, comissões pagas/não pagas).

## 8. Observabilidade e Logs
- [x] Substituir `console.log` por um logger padronizado no módulo (incluindo contextos `saleId`, `operation`, `userId`).
- [x] Definir níveis de log e mensagens claras para erros e warnings.
- [x] Validar que os novos serviços retornam métricas ou eventos conforme necessário (audit trail, monitoramento).

## 9. Testes e Migração Gradual
- [x] Criar suites unitárias para cada serviço e caso de uso recém-criado.
- [x] Implementar testes de integração cobrindo os fluxos principais antes e depois da migração.
- [x] Migrar rotas gradualmente para a nova arquitetura, mantendo fallback para lógica antiga até estabilizar.
- [x] Documentar o processo de migração, incluindo checklists de validação e plano de rollback.

## 10. Conclusão e Manutenção
- [ ] Validar o fluxo completo de criação, edição e pagamento de sales em ambiente de staging.
- [ ] Atualizar a documentação (`README`, `insominia-barbershop.yaml`, diagramas) refletindo a nova arquitetura.
- [ ] Treinar a equipe sobre os novos padrões (coordinators, services especializados, domínio).
- [ ] Definir próximos módulos a migrar seguindo o mesmo padrão, priorizando impactos em sale.

### Próximos módulos sugeridos
1. **Cash register (`src/modules/finance` / `src/services/cash-register`)** – compartilha dependências com pagamento de venda e deve aproveitar o mesmo padrão de coordenadores para abertura/fechamento de caixa.
2. **Comissões e transações (`src/modules/finance/application/services`, `src/services/transaction`)** – garantir que cálculos e lançamentos financeiros sigam use cases explícitos.
3. **Agendamentos (`src/services/appointment`)** – alto acoplamento com vendas de serviços; migrar para expor casos de uso (criar, remarcar, cancelar) e compartilhar regras com módulo de sale.

### Ações pendentes para concluir a migração de Sale
- [x] Migrar `src/services/sale/pay-sale.ts` para um use case em `src/modules/finance` ou `src/modules/sale`, atualizando o `PaySaleCoordinator`.
- [x] Migrar `src/services/sale/recalculate-user-sales.ts` para a nova arquitetura e expor via factory modular.
- [x] Transportar as factories remanescentes em `src/services/@factories/sale` (ex.: `make-get-item-build.ts`, `make-get-items-build.ts`, `make-set-sale-status.ts`, `make-list-user-pending-commissions.ts`) para `src/modules/**/infra/factories`.
- [x] Avaliar se os utilitários em `src/services/sale/utils/*` devem ser realocados para `src/modules/sale` (ou mantidos compartilhados com documentação).
- [x] Adicionar teste unitário para `LoggerSaleTelemetry` (opcional, garante cobertura do wrapper).
- [x] Revisar e ajustar testes (`test/tests/sale/pay-sale.spec.ts`, `recalculate-user-sales.spec.ts`) após migração dos serviços legados.

> Observação: cada tarefa deve resultar em PRs pequenos e rastreáveis, priorizando entregas frequentes e reversíveis.
