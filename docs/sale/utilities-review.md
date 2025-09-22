# Sale Utilities Review

| File | Primary Responsibilities | Consumers | Decision |
| ---- | ------------------------ | ---------- | -------- |
| `src/services/sale/utils/item.ts` | Item rebuild helpers (discount application, stock computations, commission, etc.) | `SaleItemsBuildService`, sale update use cases, tests | Stay shared for now — tightly coupled to low-level repository interactions and reused across multiple use cases. |
| `src/services/sale/utils/sale.ts` | Totals calculation, stock updates | Sale use cases (update/remove/pay/recalculation) and finance use cases | Keep shared until we carve a dedicated `modules/sale/application/utils` namespace; high reuse and minimal domain logic. |
| `src/services/sale/utils/coupon.ts` | Coupon application/validation pipeline | `SaleItemsBuildService`, `SaleTotalsService`, coupon update use cases | Keep; candidates to move when we centralize coupon domain (future module). |
| `src/services/sale/utils/plan.ts` | Plan discount application | `UpdateSaleClientUseCase`, plan discount tests | Keep; depends on existing plan services still in legacy layer. |
| `src/services/sale/utils/barber-commission.ts` | Commission calculation for sale items | `SaleCommissionService` (finance) | Keep shared to avoid cross-module duplication (finance + sale). |
| `src/services/sale/utils/profit-distribution.ts` | Profit distribution rules | `SaleProfitDistributionService` (finance) | Keep shared, subject to future finance module migration. |
| `src/services/sale/utils/discount.ts` | Helper to summarise discounts | discount tests only | Keep; low impact. |

> **Summary**: Todos os utilitários permanecem compartilhados por enquanto, pois ainda suportam serviços que residem nos módulos de finanças e planos legados. Quando migrarmos esses domínios para os novos módulos, podemos mover os helpers relevantes para `src/modules/sale/application/utils` ou para camadas específicas de finanças.
