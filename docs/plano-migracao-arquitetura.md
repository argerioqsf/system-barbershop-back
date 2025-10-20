# Plano de Refatoração: Clean Architecture + DDD + Arquitetura Hexagonal

Este documento apresenta uma visão geral do projeto, catálogo completo de rotas atuais, proposição de domínios/subdomínios e um plano incremental de migração para uma arquitetura mais sustentável baseada em Clean Architecture, DDD e Arquitetura Hexagonal (Ports & Adapters), com uso de factories para composição e injeção de dependências.

Observações do contexto atual:
- Node.js 20, TypeScript, Fastify, Prisma.
- Testes com Vitest.
- Mistura de estilos: `src/services/*` (estilo service layer atual) coexistindo com módulos mais alinhados ao DDD em `src/modules/*` (p.ex., `sale`, `finance`, `appointment`, `collaborator`).
- Controllers Fastify em `src/http/controllers/*` organizados por recurso, com rotas registradas em `src/app.ts`.

---

## Rotas Atuais (catálogo)

Rotas registradas em `src/app.ts` via módulos de rota em `src/http/controllers/*/route.ts` e rotas de upload no próprio `app.ts`.

Uploads (sem verificação de JWT):
- POST `/upload`
- GET `/uploads`
- GET `/uploads/:filename`
- DELETE `/uploads/:filename`

Auth e sessão:
- POST `/users`
- POST `/sessions`
- POST `/forgot-password`
- POST `/reset-password`
- PATCH `/sessions/unit`

Perfil e horários de perfil:
- GET `/profile`
- POST `/create/profile`
- PUT `/profile/:id`
- PUT `/profile`
- POST `/profile/:profileId/work-hours`
- POST `/profile/:profileId/blocked-hours`
- DELETE `/profile/:profileId/work-hours/:id`
- DELETE `/profile/:profileId/blocked-hours/:id`

Serviços, produtos e categorias:
- POST `/create/service` (upload de imagem)
- GET `/services` (lista geral por contexto barbershop)
- GET `/services/:id`
- PATCH `/services/:id`
- POST `/products` (upload de imagem)
- GET `/products`
- GET `/products/:id`
- PATCH `/products/:id`
- DELETE `/products/:id`
- GET `/product-sellers`
- POST `/categories`
- GET `/categories`
- PATCH `/categories/:id`

Agendamentos:
- POST `/create/appointment`
- GET `/appointments`
- GET `/appointment-barbers`
- PATCH `/appointments/:id`

Usuários (barbeiros, clientes):
- POST `/barber/users`
- GET `/barber/users`
- GET `/barber/users/:id`
- PUT `/barber/users/:id`
- DELETE `/barber/users/:id`
- GET `/clients`

Cupons, benefícios e recorrências:
- POST `/coupons`
- GET `/coupons`
- GET `/coupons/:id`
- PATCH `/coupons/:id`
- DELETE `/coupons/:id`
- POST `/benefits`
- GET `/benefits`
- GET `/benefits/:id`
- PATCH `/benefits/:id`
- DELETE `/benefits/:id`
- POST `/type-recurrences`
- GET `/type-recurrences`
- GET `/type-recurrences/:id`
- PATCH `/type-recurrences/:id`
- DELETE `/type-recurrences/:id`

Organização, unidades e horários de abertura:
- POST `/organizations`
- GET `/organizations`
- GET `/organizations/:id`
- PUT `/organizations/:id`
- DELETE `/organizations/:id`
- POST `/units`
- GET `/units`
- GET `/units/:id`
- PUT `/units/:id`
- DELETE `/units/:id`
- POST `/units/:unitId/opening-hours`
- DELETE `/units/:unitId/opening-hours/:id`
- GET `/units/opening-hours`

Planos e perfis de plano:
- POST `/plans`
- GET `/plans`
- GET `/plans/:id`
- PATCH `/plans/:id`
- DELETE `/plans/:id`
- PATCH `/plan-profiles/:id/cancel`
- PATCH `/plan-profiles/:id/renew`

Caixa, transações, empréstimos e dívidas:
- GET `/cash-session/open`
- POST `/cash-session/open`
- PUT `/cash-session/close`
- GET `/cash-session`
- POST `/pay/transactions` (upload `receipt`, permissão `MANAGE_OTHER_USER_TRANSACTION`)
- POST `/withdrawal/transactions` (upload `receipt`, permissão `MANAGE_USER_TRANSACTION_WITHDRAWAL`)
- GET `/pay/pending/:userId` (perm. `MANAGE_OTHER_USER_TRANSACTION`)
- GET `/transactions`
- POST `/loans`
- GET `/users/:userId/loans`
- PATCH `/loans/:id/status`
- PATCH `/loans/:id/pay`
- POST `/debts`
- GET `/debts`
- GET `/debts/:id`
- PATCH `/debts/:id`
- PATCH `/debts/:id/pay`
- DELETE `/debts/:id`

Permissões e papéis (RBAC):
- POST `/permissions`
- GET `/permissions`
- PUT `/permissions/:id`
- POST `/roles`
- GET `/roles`
- PUT `/roles/:id`

Relatórios e config:
- GET `/reports/sales`
- GET `/reports/barber/:barberId/balance`
- GET `/reports/owner/:ownerId/balance`
- GET `/reports/cash-session/:sessionId`
- GET `/reports/unit/:unitId/loan-balance`
- GET `/reports/user/:userId/products`
- GET `/config/export/users`

Colaboradores (métricas/pendências):
- GET `/collaborators/me/dashboard`
- GET `/collaborators/:userId/pending-commission-sale-items`
- GET `/collaborators/:userId/pending-commission-appointments`

---

## Proposta de Arquitetura-Alvo

Padrões combinados:
- DDD para modelagem de domínio (entidades, VOs, serviços de domínio e invariantes).
- Clean Architecture para isolamento de regras de negócio (camadas `domain` e `application`) e orquestração por casos de uso.
- Arquitetura Hexagonal (Ports & Adapters) para desacoplar entradas (HTTP/controllers) e saídas (Prisma, storage, e-mails, filas) via interfaces.
- Factories para composição de casos de uso e injeção de dependências (adapters, serviços, transações, relógio, etc.).

Estrutura de pastas sugerida por Bounded Context (mantendo padrão já iniciado em `src/modules`):
```
src/modules/<contexto>/
  domain/              # Entidades, VOs, regras e erros de domínio
  application/         # Use-cases, portas (interfaces) e serviços de aplicação
  infra/               # Adapters: Prisma, HTTP (controllers, rotas, mappers), telemetry, factories
  presentation/        # (opcional) DTOs/mappers específicos de transporte
```

Portas cross-cutting (reutilizáveis entre contextos):
- `Clock` (data/hora); `IdGenerator` (UUID);
- `TransactionRunner` (encapsular `prisma.$transaction` e permitir fake em testes);
- `Logger`/Telemetry; `Storage` (upload/serve); `Auth` (jwt verifier) como adapter de borda;
- Repositórios por agregado principal (Users, Sale, SaleItem, Loan, Debt, Transaction, CashRegister, Product, Service, Coupon, Benefit, Plan, Organization, Unit, Profile, OpeningHour, etc.).

Controllers e rotas dentro do módulo: controllers/rotas podem residir em `src/modules/<contexto>/infra/http/` (ou estrutura equivalente) alinhado à Clean Architecture/Hexagonal. Enquanto houver partes legadas, é possível manter o registro central em `src/app.ts` importando as rotas expostas pelos módulos e migrando gradualmente.

---

## Domínios e Subdomínios (Bounded Contexts)

1) Identity & Access (IAM)
- Escopo: Usuários (auth), papéis, permissões.
- Entidades: User, Role, Permission, Session.
- Casos de uso: RegisterUser, Authenticate, SetUserUnit, UpdateUser, ListClients, RBAC checks.
- Adapters: `UsersRepository`, `PasswordResetTokenRepository`, `RoleRepository`, `PermissionRepository`.

2) Organization
- Escopo: Organization, Units, OpeningHours, Profiles (perfil do barbeiro/colaborador).
- Entidades: Organization, Unit, OpeningHour, Profile, WorkHour, BlockedHour.
- Casos de uso: CRUD de Organization/Unit; Gerenciar horários da unidade e do perfil; Vincular usuário à unidade.
- Nota sobre Profile: manter uma entidade `Profile` única com diferenciação por papéis/tipos (RBAC) cobre a maioria dos casos e evita duplicação. Caso diferentes perfis (client, barber, admin, owner) passem a ter invariantes muito distintos, avaliar especialização (subtipos) ou agregado separado. Até lá, preferir `Profile` único + `Role`/`Permission` para capacidades.

3) Catalog
- Escopo: Services, Products, Categories, Coupons, Benefits.
- Entidades: Service, Product (com estoque), Category, Coupon, Benefit.
- Casos de uso: CRUD, consulta de vendedores de produto, verificação de estoque.

4) Scheduling (Appointments)
- Escopo: Agendamentos e disponibilidade.
- Entidades: Appointment (+ vínculo com Service/Barber/Client).
- Casos de uso: CreateAppointment, UpdateAppointment, ListAppointments, ListAvailableBarbers.

5) Sales
- Escopo: Vendas e itens de venda (serviços/produtos/plano/agendamento), cupom na venda.
- Entidades: Sale, SaleItem, SaleCoupon, SaleDiscount.
- Casos de uso: CreateSale, GetSale, UpdateSale, UpdateClient, UpdateStatus, Remove/Add Item, Update Item (barber/quantity/custom-price/coupon), ListSales, Recalculate.
- Observação: Já parcialmente migrado para `src/modules/sale`.

6) Finance
- Escopo: Transações, Comissões, Caixa (Cash Register Sessions), Empréstimos (Loans), Dívidas (Debts), Distribuição de Lucro, Pagamento de Vendas, Regras de cobrança recorrente.
- Entidades: Transaction, Commission (proposta), CashSession, Loan, Debt, (opcional) BillingRule.
- Casos de uso: PaySale (já em módulos), ListPendingCommissions, Pay/Withdrawal Transactions (pagamentos/retiradas), PayLoan, UpdateLoanStatus, CreateDebt/PayDebt, CashSession Open/Close/List/GetOpen.

7) Plans (Assinaturas)
- Escopo: Planos comerciais e o vínculo do usuário ao plano.
- Entidades: Plan, PlanProfile (vínculo do plano com usuário/beneficiário), TypeRecurrence (migrado para cá, pois dita a recorrência de débitos/renovações do plano).
- Casos de uso: Create/List/Get/Update/Delete Plan; Cancel/Renew PlanProfile; geração/renovação de cobranças recorrentes conforme `TypeRecurrence` (em coordenação com Finance/Debts).

Jobs & agendamentos (Plans)
- Manter a orquestração externa em camada de infraestrutura do módulo, disparando casos de uso puros:
  - `GeneratePlanDebtsUseCase` (antes: `generate-plan-debts-job.ts`).
  - `UpdatePlanProfilesStatusUseCase` (antes: `update-plan-profile-status-job.ts`).
  - `CancelOverduePlanProfilesUseCase` (antes: `cancel-overdue-plan-profiles-job.ts`).
- Local sugerido: `src/modules/plans/infra/schedulers|jobs/*` expondo uma função `start...Job()` que agenda execução (ex.: `setInterval` ou `node-cron`).
- Casos de uso devem utilizar `TransactionRunner`/`UseCaseCtx` e portas (`PlanRepository`, `PlanProfileRepository`, `DebtRepository`, `Clock`).
- Recomendações: idempotência (constraints únicas por período/planProfile), controle de concorrência simples (marcadores de execução/locks suaves) e logs estruturados.

8) Reporting
- Escopo: Relatórios e consultas de leitura agregada.
- Padrão: Application Query Handlers usando repositórios otimizados para leitura.

9) Config/Storage
- Escopo: Exportações e uploads.
- Abordagem: Ports para `Storage` e caso de uso simples para exportações.

---

## Padrões de Implementação

- Use-cases puros em `application` recebem apenas interfaces (ports) e valores primitivos/DTOs; retornam DTOs.
- Entidades/VOs no `domain` encapsulam invariantes (ex.: cálculo de comissão, validações de estoque, regras de desconto).
- Repositórios Prisma em `infra` implementam as portas e mapeiam para o banco.
- Factories em `infra/factories` compõem cada caso de uso integrando repositórios, `TransactionRunner`, `Logger`, `Clock` etc.
- Controllers convertem HTTP ↔ DTOs e chamam o caso de uso via factories.
- Transações: centralizar via `TransactionRunner` (porta) para não acoplar `prisma.$transaction` dentro do caso de uso.
- Telemetry/Logger: portas + adapters (já existe padrão em `modules/*/infra/telemetry`).

Exemplo de portas (pseudo-código):
```ts
// application/contracts
export interface TransactionRunner { run<T>(fn: (tx: DbTx) => Promise<T>): Promise<T> }
export interface UsersRepository { findById(id: string): Promise<User | null> }
export interface CashRegisterRepository { findOpenByUnit(unitId: string): Promise<CashSession | null> }
export interface TransactionsRepository { create(t: NewTransaction, tx?: DbTx): Promise<Transaction> }
```

### Repositórios e Ports (focados no domínio)
- Definir ports específicas por agregado (ex.: `SaleRepository`, `CashRegisterRepository`), evitando repositórios genéricos.
- Implementações Prisma em `infra/.../repositories` devem usar mappers para isolar ORM do domínio.
- Todos os métodos de repositório aceitam `tx?: Prisma.TransactionClient` para operar dentro de uma transação.

### Mappers por camada
- Infra (Prisma): mapeia Prisma ↔ Domain (sanitização, normalização de datas/números/enums).
- Application: mapeia Domain ↔ DTO (entrada/saída de use-cases).
- HTTP (em `infra/http`): mapeia Request/Response ↔ DTO/use-case e valida com Zod.

### Transações (ctx/tx complementar ao TransactionRunner)
- Além do `TransactionRunner`, casos de uso podem aceitar um `ctx` opcional com `tx` para cenários específicos de orquestração.
- Nunca misturar múltiplos `PrismaClient` em uma mesma transação; propagar o `tx` para todos os repositórios envolvidos.

### Padrão UseCaseCtx { tx? }
- Tipo padrão compartilhado (sugerido em `src/core/application/use-case-ctx.ts`):
```ts
import { Prisma } from '@prisma/client'
export interface UseCaseCtx { tx?: Prisma.TransactionClient }
```
- Assinatura dos use cases: `execute(input: Input, ctx?: UseCaseCtx)`.
- Exemplo de composição:
```ts
// Outer use case
await runInTransaction(async (tx) => {
  await innerUseCase.execute(innerInput, { tx })
})

// Inner use case (não abre transação se ctx.tx existir)
async execute(input: Input, ctx?: UseCaseCtx) {
  const tx = ctx?.tx
  await repoA.update(data, tx)
  await repoB.create(data, tx)
}
```

### HTTP e Erros
- Validar params/query/body e também response com Zod nos controllers.
- Controllers traduzem erros de domínio para 4xx adequados (422/409/404), e erros inesperados para 500 com log estruturado.
- Manter uma base de `DomainError` (ou equivalente) por agregado para padronizar mensagens e status codes.

### Middlewares (JWT & Permissões)
- Curto prazo: manter `verify-jwt` e `verify-permission` como preHandlers Fastify (como hoje), garantindo `request.user` com `sub`, `unitId` e `permissions`.
- Migração: mover para `modules/iam/infra/http/middlewares/` (ou pasta compartilhada de interfaces) e padronizar um helper `authGuard(permissions?: PermissionName[])` que compõe `verifyJWT` + `verifyPermission`.
- Longo prazo: além do preHandler, inserir checagens de autorização em use cases críticos via uma port `Authorization` (ex.: `assertPermissions(user, required)`). Isso garante defesa em profundidade quando o caso de uso for reutilizado fora do HTTP.
```ts
// Exemplo de port futura
export interface Authorization {
  assert(required: PermissionName[], user: { permissions?: PermissionName[] }): Promise<void> | void
}
// No controller: preHandler (HTTP)
// No use case: opcionalmente, chamar Authorization.assert para operações sensíveis
```

### Observabilidade e Saúde
- Logger estruturado (Pino) com correlation-id por request.
- Considerar OpenTelemetry para HTTP + Prisma quando estiver estável.
- Endpoints de health/readiness checando banco e dependências críticas.

### Padrões de Teste (complemento)
- Domínio: unit puros (sem banco/HTTP).
- Application: unit com fakes/mocks de ports.
- Infra (Prisma): integração com DB (ex.: SQLite em memória ou container).
- HTTP: E2E exercitando validações Zod, mapeamento de erros e contrato.

### Migração da pasta `src/utils/`
- Princípio: mover cada util para o contexto/camada correta; evitar util genérico no domínio quando ele depende de infra/ORM/HTTP.
- Mapeamento sugerido:
  - `utils/permissions.ts`: migrar para módulo IAM (application service/port Authorization e helpers de escopo). Funções que usam `UnitRepository` permanecem em application (não em domain). Marcar pontos com `// MIGRATION-TODO` enquanto coexistirem chamadas legadas.
  - `utils/barber-availability.ts` e `utils/time.ts`: separar responsabilidades:
    - Organization/Profile: extrair um `ProfileAvailabilityService` (domínio) que calcula a disponibilidade base do usuário a partir de `workHours` − `blockedHours` (sem conhecer agendamentos).
    - Scheduling/Appointments: um `SchedulingAvailabilityService` que recebe a disponibilidade base e subtrai agendamentos para produzir slots efetivos e validação (`isAppointmentAvailable`).
    - `isAppointmentAvailable`: permanece em Appointments (depende de agendamentos).
    - `listAvailableSlots`: fica em Appointments enquanto subtrair agendamentos; a parte de base fica no serviço de Profile.
  - `utils/format-currency.ts`: util de finanças compartilhado; mover para `src/core/utils/currency.ts` (ou `modules/finance` se preferir escopo). Manter APIs `round`, `toCents`, `fromCents`.
    - Evolução recomendada: introduzir um VO `Money` no domínio Finance e migrar gradualmente os usos de `round/toCents/fromCents` para métodos do VO. Manter re-exports temporários até a troca completa.
  - `utils/http-error-handler.ts`: pertence à borda HTTP; manter em interfaces/HTTP (ou pasta compartilhada), centralizando mapeamento `DomainError` → HTTP status.
  - `utils/assert-user.ts`: mover para IAM (application) como guard/validator em use cases ou controllers.
  - `utils/constants/pagination.ts`: mover para `src/core/constants/pagination.ts` como cross‑cutting.
- Durante a migração, exportar re-exports temporários para não quebrar imports legados e remover ao final.

### Value Object Money (VO financeiro)
- Local sugerido: `src/modules/finance/domain/value-objects/money.ts` (ou `src/core/domain/value-objects/money.ts` se neutro a domínios).
- Representação e criação:
  - Armazenar como inteiros em centavos para evitar erros de ponto flutuante.
  - Fábricas: `fromNumber(value)`, `fromCents(cents)`, com `currency` (ex.: `BRL`).
- Operações e leitura:
  - `toNumber()`, `toCents()`, `add`, `subtract`, `multiply`, `negate`, `equals`, `gt/gte/lt/lte`, `isNegative`, `isZero`.
  - Imutável: cada operação retorna um novo `Money`.
- Integração com o restante do sistema:
  - Prisma: adapters mapeiam `DECIMAL/NUMERIC` ↔ `Money` (ao ler `Money.fromNumber(row.amount)`, ao gravar `money.toNumber()`).
  - HTTP: controllers/DTOs expõem números; mapeamento para `Money` ocorre no controller/use case.
- Regras de não-negativo:
  - `Money` pode representar valores negativos (débito/estorno/retirada). A regra “não permitir negativo” pertence:
    - À Entidade, quando for um invariante (ex.: `Sale.total ≥ 0`).
    - Ao Use Case, quando for uma pré-condição de entrada (ex.: `amount` de retirada deve ser positivo, pois a operação fará a subtração).

### Eventos de Domínio (mapeado — implementação futura)
- Modelar eventos em `domain/events` com nomes estáveis (ex.: `sales.sale_created`).
- Aggregates acumulam eventos e `application/handlers` reagem via `EventBus` (port) após commit.
- Adapters de `EventBus` (in-memory/filas) em `infra/event-bus`.
- Observação: apenas mapeado agora; implementação ficará para fase futura.

### DI & Bootstrap (mapeado — implementação futura)
- Futuro composition root (plugins Fastify) para criar Prisma, repositórios, use-cases, event bus, handlers e wiring por request quando necessário.
- Por ora, manteremos factories com wiring explícito em `infra/factories` (padrão atual do projeto).

---

## Estratégia de Migração Incremental

Princípios:
- Rotas e contratos HTTP permanecem estáveis durante a migração.
- Cada módulo migrado passa a ter factories e casos de uso; o controller passa a usar o novo `make<UseCase>()`.
- Para dependências em módulos não migrados, criar Adapters de compatibilidade (Anti-corruption Layer) que chamam os serviços antigos em `src/services/*` por trás de uma porta nova. Manter comentários `// MIGRATION-TODO` próximos aos adapters e no factory indicando a substituição quando o módulo dependente for migrado.
- Testes: preservar testes atuais; adicionar unit tests de casos de uso migrados com repositórios in-memory. E2E seguem exercitando rotas.

Fases sugeridas:

Fase 0 — Fundações (baixo risco)
- Introduzir portas cross-cutting: `TransactionRunner`, `Clock`, `IdGenerator`.
- Adicionar adapters Prisma para `TransactionRunner`.
- Padronizar factories por domínio (manter padrão de `modules/sale` e `modules/finance`).

Fase 1 — Sales (consolidar o que já existe)
- Revisar `src/modules/sale/*` para alinhar nomenclaturas, portas e patterns com este documento.
- Substituir utilidades antigas de sale em `src/services/sale/utils/*` por serviços de aplicação/domínio equivalentes (quando duplicadas). Onde ainda houver dependência antiga, criar adapter de compatibilidade temporário.

Fase 2 — Finance (Transações/Comissões/Caixa/Empréstimos/Dívidas)
- Migrar `withdrawal-balance-transaction` e `pay-balance-transaction` para `src/modules/finance/application/use-cases/*`:
  - Casos de uso propostos: `WithdrawBalanceUseCase`, `PayBalanceUseCase`, `ListPendingCommissionsUseCase`.
  - Portas: `UsersRepository`, `SaleItemRepository`, `CashRegisterRepository`, `UnitRepository`, `TransactionsRepository`, `LoansRepository`, `DebtsRepository`, `TransactionRunner`.
  - Consolidar cálculo de comissão no domínio Finance (ou Sales, se preferir), removendo acoplamento direto a `src/services/users/utils/calculatePendingCommissions` com um serviço de domínio: `CommissionCalculator`.
  - Criar factories: `makeWithdrawBalance()`, `makePayBalance()`, `makeListPendingCommissions()`.
  - Controllers atuais (`src/http/controllers/transaction/*.ts`) passam a chamar as novas factories.
  - Adapters temporários para quaisquer chamadas que ainda toquem lógica antiga (marcar com `// MIGRATION-TODO`).
- Caixa (cash-register): extrair casos de uso: `OpenSession`, `CloseSession`, `GetOpenSession`, `ListSessions`, `UpdateCashFinalAmount` com `TransactionRunner`.
- Empréstimos/Dívidas: criar casos de uso alinhados (Create/Get/List/Update/Pay/Delete) e seus adapters Prisma, mantendo rotas.

Fase 3 — Scheduling (Appointments)
- Já existem serviços/aplicação em `src/modules/appointment/application/*` (e factories em `infra`).
- Verificar controllers: migrar para factories dos módulos.
- Consolidar `CheckBarberAvailability` e `ValidateAppointmentWindow` como serviços de domínio; garantir testes unitários.

Fase 4 — Catalog (Products/Services/Categories/Coupons/Benefits)
- Definir entidades e invariantes (ex.: estoque não negativo, preço mínimo, validade de cupom).
- Criar casos de uso CRUD e serviços auxiliares (estoque, desconto) como serviços de domínio.
- Extrair utilidades de `src/services/sale/utils/*` para novos serviços do domínio onde fizer sentido.

Fase 4b — Plans & Recurrence (Plans/PlanProfiles/TypeRecurrence)
- Migrar casos de uso de Plan/PlanProfile para `modules/plans` (Create/List/Get/Update/Delete, Cancel/Renew).
- Reposicionar `TypeRecurrence` sob Plans (ou sob Finance-Billing, se preferir), como fonte de verdade para a periodicidade das cobranças.
- Integrar com Finance/Debts para geração e reconciliação de débitos recorrentes e renovações.

Fase 5 — Organization (Org/Unit/OpeningHour/Profile e horas de trabalho/bloqueio)
- Unificar regra de horário em serviços de domínio (interseção de agendas, validações, etc.).
- Criar casos de uso com portas para repositórios atuais de Profile/OpeningHour/Unit.
- Adaptar controllers a factories.

Fase 6 — IAM (Users, Roles, Permissions, Sessions)
- Consolidar RBAC como serviço de domínio simples (checagem por escopo).
- Casos de uso: Register, Authenticate, SetUserUnit, UpdateUser, ListClients.
- Factories e adapters Prisma; controllers passam a usar factories.

Fase 7 — Reporting e Config
- Separar queries de leitura como Application Query Handlers com repositórios voltados a leitura (pode reutilizar Prisma direto aqui).
- Manter rotas idênticas; apenas mover a lógica para casos de uso de consulta.

Fase 8 — Remoção de código legado
- Apagar gradualmente serviços em `src/services/*` que ficaram sem uso.
- Atualizar testes que ainda dependam de implementações antigas.

---

## Diretrizes de Compatibilidade durante a Migração

- Quando um novo caso de uso precisar chamar lógica que ainda está em `src/services/*`, criar uma porta de aplicação (ex.: `CommissionQuery`) e implementá-la com um adapter temporário `LegacyCommissionQueryAdapter` que encapsula a chamada ao serviço antigo. Exemplo de comentário padrão:
  ```ts
  // MIGRATION-TODO: substituir LegacyCommissionQueryAdapter por CommissionRepository
  // quando o módulo de Sales/Finance estiver 100% migrado.
  ```
- Evitar “comentar chamadas” em controllers; preferir manter controllers chamando factories novas, e as factories usam adapters de compatibilidade. Isso mantém as rotas funcionando e deixa o ponto de troca concentrado.
- Centralizar transações no `TransactionRunner` para reduzir impacto quando a camada de persistência mudar.

---

## Padrões de Testes

- Unit: Casos de uso com repositórios in-memory (já há padrão em `src/repositories/in-memory/*`).
- Integration: Adapters Prisma (quando necessário).
- E2E: Rotas Fastify exercitando controllers + factories.
- Sempre rodar `npm test`, `npm run typecheck` e `npm run lint` antes de abrir PR.

---

## Checklists por Domínio

Sales (consolidação)
- [ ] Mapear portas necessárias (SaleRepository, SaleItemRepository, CouponRepo, ProductRepo, etc.).
- [ ] Revisar `application/services` e `use-cases`; remover duplicações com `src/services/sale/utils/*`.
- [ ] Atualizar factories; garantir `TransactionRunner`.
- [ ] Ajustar controllers para factories (onde faltar).
- [ ] Testes unitários para cálculos e coordenadores.

Finance
- [ ] Extrair `WithdrawBalanceUseCase` e `PayBalanceUseCase` de `src/services/transaction/*`.
- [ ] Portas + adapters Prisma (Transactions, CashRegister, Users, Loans, Debts, Unit).
- [ ] Serviço de domínio `CommissionCalculator`.
- [ ] Factories e controllers atualizados.
- [ ] Testes unitários e E2E de rotas de transação.

Scheduling
- [ ] Consolidar serviços de disponibilidade/validação de agenda.
- [ ] Factories e controllers alinhados.
- [ ] Testes unitários.

Catalog
- [ ] Entidades (Product/Service/Coupon/Benefit/TypeRecurrence) e invariantes.
- [ ] Casos de uso CRUD, estoque e descontos como serviços de domínio.
- [ ] Factories + controllers.
- [ ] Testes unitários (estoque/validações) e E2E (CRUD).

Organization
- [ ] Casos de uso de org/unit/opening hours/profile.
- [ ] Factories + controllers.
- [ ] Testes unitários para regras de horário.

IAM
- [ ] Casos de uso (register/auth/update/unit/clients) + RBAC service.
- [ ] Factories + controllers.
- [ ] Testes unitários e E2E de autenticação.

Reporting/Config
- [ ] Query Handlers dedicados.
- [ ] Factories + controllers.
- [ ] Testes de leitura.

---

## Notas de Implementação

- Reaproveitar padrões já existentes em `src/modules/*` (ex.: `infra/factories`, telemetry via logger) para reduzir entropia.
- Manter nomenclaturas claras e evitar `any`; criar tipos/DTOs explícitos por use-case.
- Quando adicionar variáveis de ambiente para adapters (ex.: storage), atualizar `.env.example`, `test/setup.ts` e `src/env/index.ts`.
- Sempre que alterar semântica de dados iniciais, sincronizar `src/repositories/prisma/seed.ts`.

Modelagem de Usuário vs Profile entre contextos
- IAM: `User`, `Role`, `Permission` representam identidade/autorização do sistema (IDs usados por todos os módulos).
- Organization: `Profile` agrega atributos operacionais do usuário na organização/unidade (ex.: comissões, workHours, blockedHours, vínculos com serviços/produtos, planos). Um único `Profile` com `roleId` (RBAC) evita duplicação; especializações só se invariantes divergirem muito.
- Sales: não precisa conhecer detalhes de `Profile`. Use `userId` do vendedor/colaborador e `clientId` do comprador (ambos `User`). Se necessário, mapeie um DTO de leitura (ex.: `CustomerView`, `CollaboratorView`) a partir de `User+Profile` via portas de leitura. Regras como “usuário pertence à unidade” devem ser verificadas no use case via repositórios (sem acoplar o domínio a Profile).
- Tipos de perfil (client, barber, admin, owner) são tratados via `Role`/permissões. Entidades e serviços de domínio condicionam comportamento por papel quando necessário, sem multiplicar entidades.

Políticas adicionais (quando aplicável)
- Timezone: padronizar domínio em UTC e converter na borda HTTP/clients. Unificar uso de `getUTC*` para cálculos de disponibilidade e datas recorrentes.
- Precisão de moeda: o VO `Money` evita erros de ponto flutuante. Avaliar migrar campos monetários do Prisma para `Decimal` (MySQL `DECIMAL`) conforme roadmap de dados.

---

## Riscos & Mitigações

- Divergência de regra entre legado e novo: centralizar invariantes no domínio novo e reduzir chamadas ao legado via adapters com comentários `MIGRATION-TODO`.
- Transações e consistência: usar `TransactionRunner` e testes de concorrência (quando aplicável) para evitar race conditions, especialmente em caixa, estoque e comissão.
- Compatibilidade de rotas: manter contratos HTTP estáveis; quando necessário, mapear DTOs no controller.

---

## Próximos Passos Propostos

1) Criar `core/application/transaction-runner.ts` e adapter Prisma em `infra` compartilhada.
2) Consolidar `modules/sale` (Fase 1) e alinhar controllers para factories em todos os endpoints de venda.
3) Migrar `withdrawal-balance-transaction` e `pay-balance-transaction` para `modules/finance` (Fase 2) com `CommissionCalculator` no domínio.
4) Adicionar adapters de compatibilidade e marcar com `// MIGRATION-TODO`.
5) Iniciar migração de `cash-register` para casos de uso com `TransactionRunner`.
6) Definir timeline das fases restantes (Scheduling → Catalog → Plans & Recurrence → Organization → IAM → Reporting).

> Este plano permite migrar por partes mantendo o sistema funcional, com comunicação temporária via adapters para módulos ainda não migrados. Quando um domínio migrado precisar falar com módulo antigo, encapsular a chamada no adapter e documentar o ponto de troca para futura substituição.
