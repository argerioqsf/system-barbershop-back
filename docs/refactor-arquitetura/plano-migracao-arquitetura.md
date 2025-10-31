# Plano de Refatoração: Clean Architecture + DDD + Arquitetura Hexagonal

Este documento apresenta uma visão geral do projeto, catálogo completo de rotas atuais, proposição de domínios/subdomínios e um plano incremental de migração para uma arquitetura mais sustentável baseada em Clean Architecture, DDD e Arquitetura Hexagonal (Ports & Adapters), com uso de factories para composição e injeção de dependências.

 Sumário (rápido)
- Guia e Índice das Fases: `docs/refactor-arquitetura/README.md`
- Regras de Slicing e Estratégia de Legado: seção "Slicing/Adapters" abaixo
- Template de fase: `docs/refactor-arquitetura/fases/_template.md`
- Rotas completas (referência): `docs/backend-endpoints.md` (mantemos lista aqui como apêndice)
 - Backlog XS (MIGRATION-TODO): `docs/refactor-arquitetura/backlog-xs.md`

Observações do contexto atual:
- Node.js 20, TypeScript, Fastify, Prisma.
- Testes com Vitest.
- Mistura de estilos: `src/services/*` (estilo service layer atual) coexistindo com módulos mais alinhados ao DDD em `src/modules/*` (p.ex., `sale`, `finance`, `appointment`, `collaborator`).
- Controllers Fastify em `src/http/controllers/*` organizados por recurso, com rotas registradas em `src/app.ts`.

---

## Slicing/Adapters (tarefas pequenas e mínimo impacto)

Regras para dividir trabalho:
- Preferir tarefas XS/S (15–90 min) ou M (≤ meio dia), focadas e com blast radius pequeno.
- Evitar mudanças de contrato HTTP; quando inevitável, versionar/encapsular no controller.
- Usar `// MIGRATION-TODO` e re-exports temporários para manter o legado operando.
- Conectar novo ↔ antigo via adapters em `infra` (Strangler): borda fala com o legado ou o novo sem knowledge cross‑layer.
- Cada tarefa deve listar passos, critérios de aceite, riscos e backout simples.

Gates de segurança (sempre):
- `npm test` (Vitest), `npm run typecheck` (tsc), `npm run lint` (ESLint).
- Atualizar `.env.example`, `test/setup.ts` e `src/env/index.ts` se variáveis novas forem introduzidas.

Fluxo por task:
1) Implementar porta/serviço/caso de uso no módulo alvo.
2) Expor via factory e conectar no controller/adapter mantendo contrato HTTP.
3) Cobrir com testes (unit para domínio/aplicação; E2E quando for endpoint).
4) Marcar MIGRATION‑TODO e planejar remoção no fim da fase.

Estratégia de legado (Strangler):
- Quando módulo migrado precisa de algo do legado, criar adapter em `infra` e encapsular chamada.
- Quando legado precisa usar regra nova, amarrar factory do novo no controller legado.
- Remover adapters/re-exports na Fase 8 (remoção do legado).

Independência das fases e handoffs
- Cada fase deve ser executável isoladamente, sem bloquear por outra fase. Sempre que houver dependência cruzada:
  - Adicionar uma port (no módulo da fase vigente) representando a necessidade externa.
  - Implementar um adapter de compatibilidade que chame o serviço/consulta legados correspondentes.
  - Marcar `// MIGRATION-TODO` no adapter e na factory para troca futura pela implementação nativa do módulo dependente quando sua fase chegar.
- Handoffs: documentar no fim de cada fase quais adapters/ports ficam “engatados” para substituição posterior.

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
- Escopo: Organization, Units, OpeningHours, Profiles (perfil operacional de todos os usuários da unidade).
- Entidades: Organization, Unit, OpeningHour, Profile, WorkHour, BlockedHour.
- Casos de uso: CRUD de Organization/Unit; Gerenciar horários da unidade e do perfil; Vincular usuário à unidade.
- Nota sobre Profile: manter uma entidade `Profile` única com diferenciação por papéis/tipos (RBAC) cobre a maioria dos casos e evita duplicação. Todos os usuários (client, barber, attendant, admin, owner) possuem um `Profile` vinculado; caso algumas categorias passem a ter invariantes muito distintos, avaliar especialização (subtipos) ou agregado separado. Até lá, preferir `Profile` único + `Role`/`Permission` para capacidades.

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
- Casos de uso: PaySale (já em módulos, alinhar ao UseCaseCtx), ListPendingCommissions, Pay/Withdrawal/AddBalance Transactions (pagamentos/retiradas/entradas), ListTransactions (leitura), PayCommission, PayLoan, UpdateLoanStatus, CreateDebt/PayDebt, CashSession Open/Close/List/GetOpen/UpdateCashFinalAmount, ProfitDistribution (serviço de domínio).
- Notas recentes:
  - `LoanStatus.VALUE_TRANSFERRED` agora representa empréstimos cujo valor já saiu do caixa, mas ainda depende de acerto com o colaborador; a liquidação efetiva muda para `PAID_OFF`. O caso de uso de atualização de status deve validar essa transição explicitamente.
  - `Transaction.reason` passou a ser obrigatório (`ReasonTransaction`). Ao migrar o módulo Finance, os ports e casos de uso precisam receber o motivo explícito (ex.: `PAY_LOAN`, `PAY_COMMISSION`, `PAY_PLAN_DEBT`, `ADD_COMMISSION`, `LOAN`, `OTHER`) para eliminar fallback implícito no adapter legado.

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

---

## Template Padrão de Módulo (estrutura + convenções)

Estrutura por contexto em `src/modules/<contexto>/` seguindo Clean Architecture + Hexagonal. Utilize este template ao migrar ou criar módulos:

```
src/modules/<contexto>/
  domain/
    // Regras de negócio puras (sem ORM/http)
    entities/            // Entidades/agregados (ex.: Sale, SaleItem)
    value-objects/       // VOs (ex.: Money, Percentage)
    services/            // Serviços de domínio (poucos, estáveis)
    errors/              // Erros de domínio
    events/              // (opcional) eventos de domínio

  application/
    // Orquestração de casos de uso (sem dependência de infra)
    use-cases/           // Casos de uso (ex.: CreateSale, UpdateSale)
    ports/               // Interfaces (ex.: Repositórios, Telemetry, Clock)
    dto/                 // DTOs de entrada/saída dos use-cases
    validators/          // Validadores específicos de aplicação
    errors/              // Erros de aplicação (ex.: conflito/estado inválido)
    services/            // Serviços de aplicação (coordenação não trivial)

  infra/
    // Adapters de entrada/saída (bordas do sistema)
    repositories/
      prisma/            // Implementações Prisma das ports
    http/
      controllers/       // Controllers + mapeamento HTTP ↔ DTO/use-case
      route.ts           // Registro de rotas do módulo
      middlewares/       // (opcional) middlewares específicos
    factories/           // make<UseCase|Service>() injeta dependências (ports, runner, clock)
    mappers/             // Prisma ↔ Domain / Domain ↔ DTO
    telemetry/           // Adapters de logging/metrics para a port Telemetry
    schedulers/          // (opcional) jobs/cron do módulo (ex.: Plans)

  // (opcional) presentation/ se precisar de DTOs específicos da borda
```

Convenções e regras (aplicam-se a todos os módulos):
- Camadas e dependências:
  - domain não depende de application/infra.
  - application depende de domain e ports. Não conhece adapters/ORM.
  - infra implementa ports e expõe factories, controllers, mappers, etc.

- Transações:
  - Injete `TransactionRunner` via factories dos use-cases/serviços de aplicação.
  - Propague `tx?: Prisma.TransactionClient` pelas ports de repositório.
  - Use o padrão `execute(input, ctx?: UseCaseCtx)` quando for compor use-cases.

- Ports e naming:
  - Repositórios por agregado principal (ex.: `SaleRepository`, `SaleItemRepository`).
  - Outras ports cross-cutting: `Clock`, `IdGenerator`, `Telemetry`, `Authorization` (quando aplicável).
  - Nomeie factories como `make<UseCase|Service>()` e expor apenas o necessário.

- DTOs e validação:
  - Zod/validação na borda HTTP; application pode ter validadores leves.
  - Mapeie Request/Response ↔ DTOs no controller; DTO ↔ domínio nos mappers/services de application.

- Erros:
  - Erros de domínio em `domain/errors` (sem status HTTP).
  - Controllers traduzem para status adequados (422/409/404/401/403/500).

- Telemetry/Logger:
  - Defina uma port `Telemetry` (ex.: `SaleTelemetry`) em `application/ports` e adapters em `infra/telemetry`.

- Tests:
  - Unit: domain/services puros; application com fakes/mocks de ports.
  - Integration: adapters Prisma (SQLite/MySQL); E2E pelas rotas do módulo.

- Migração e compatibilidade (durante refactors):
  - Quando precisar chamar lógica legada, crie um adapter de compatibilidade em `infra` que implementa a port nova e delega ao serviço antigo; marque com `// MIGRATION-TODO`.
  - Evite importar utilidades legadas diretamente de application/domain.

Exemplo mínimo de wiring (factory):
```
// src/modules/<contexto>/infra/factories/make-update-foo.ts
import { PrismaFooRepository } from '@/repositories/prisma/prisma-foo-repository'
import { UpdateFooUseCase } from '@/modules/<contexto>/application/use-cases/update-foo'
import { defaultTransactionRunner } from '@/infra/prisma/transaction-runner'

export function makeUpdateFoo() {
  const repo = new PrismaFooRepository()
  return new UpdateFooUseCase(repo, defaultTransactionRunner)
}
```

Checklist de conformidade rápida por módulo:
- [ ] domain só contém entidades/VOs/serviços/erros/eventos.
- [ ] application só depende de domain + ports; sem import de ORM/adapters.
- [ ] infra implementa ports e concentra adapters (HTTP/Prisma/telemetry/jobs).
- [ ] use-cases recebem `TransactionRunner`; ports aceitam `tx?`.
- [ ] controllers validam com Zod e mapeiam erros de domínio.
- [ ] sem utilidades legadas importadas diretamente (usar adapters com MIGRATION-TODO quando necessário).


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
- Checklist operacional: [docs/migracao-arquitetura/fase-00-fundacoes.md](docs/migracao-arquitetura/fase-00-fundacoes.md)
- Objetivo: isolar infraestrutura transversal (transações, tempo, IDs) para reduzir acoplamento e permitir migração por módulos sem retrabalho.
- Entregáveis:
  - Portas cross-cutting: `TransactionRunner`, `Clock`, `IdGenerator` (interfaces em `src/core/...`).
  - Adapter Prisma para `TransactionRunner` (ex.: `src/infra/prisma/transaction-runner-prisma.ts`).
  - Tipo `UseCaseCtx { tx? }` central (já mapeado) e guideline de propagação de `tx`.
  - Factories por domínio padronizadas (alinhar com `modules/sale`; preparar `modules/finance`).
- Impacto esperado (muitos arquivos, baixo risco):
  - Criação de 3–5 arquivos core/adapters.
  - Pequenos ajustes de construtores/assinaturas em serviços/use-cases para aceitar `tx?` e/ou `TransactionRunner` (sem mudar regra de negócio).
  - Reescritas de import mínimas (preferir re-exports temporários para evitar churn).
- Estratégia de adoção:
  - Não substituir chamadas diretas a `prisma.$transaction` em todo o codebase de uma vez. Em novos casos de uso, usar `TransactionRunner`. Nos legados, apenas aceitar `tx?` e propagar.
  - Fornecer um `DefaultTransactionRunner` que delega ao `prisma` atual, permitindo injeção fácil em locais antigos sem refactor profundo.
- Critérios de aceite (Fase 0):
  - Build, testes e typecheck passam sem alterar comportamento funcional.
  - Novos casos de uso/factories usam `TransactionRunner`; serviços legados continuam funcionando aceitando `tx?`.
  - Uma verificação automatizada simples (grep) identifica pontos com `// MIGRATION-TODO` para rastrear o rollout.

Fase 1 — Sales (consolidar o que já existe)
- Checklist operacional: [docs/migracao-arquitetura/fase-01-sales.md](docs/migracao-arquitetura/fase-01-sales.md)
- Revisar `src/modules/sale/*` para alinhar nomenclaturas, portas e patterns com este documento.
- Substituir utilidades antigas de sale em `src/services/sale/utils/*` por serviços de aplicação/domínio equivalentes (quando duplicadas). Onde ainda houver dependência antiga, criar adapter de compatibilidade temporário.

Fase 2 — Finance (Transações/Comissões/Caixa/Empréstimos/Dívidas)
- Checklist operacional: [docs/migracao-arquitetura/fase-02-finance.md](docs/migracao-arquitetura/fase-02-finance.md)
- Migrar `withdrawal-balance-transaction` e `pay-balance-transaction` para `src/modules/finance/application/use-cases/*`:
  - Casos de uso propostos: `WithdrawBalanceUseCase`, `PayBalanceUseCase`, `ListPendingCommissionsUseCase`.
  - Portas: `UsersRepository`, `SaleItemRepository`, `CashRegisterRepository`, `UnitRepository`, `TransactionsRepository`, `LoansRepository`, `DebtsRepository`, `TransactionRunner`.
  - Consolidar cálculo de comissão no domínio Finance (ou Sales, se preferir), removendo acoplamento direto a `src/services/users/utils/calculatePendingCommissions` com um serviço de domínio: `CommissionCalculator`.
  - Criar factories: `makeWithdrawBalance()`, `makePayBalance()`, `makeListPendingCommissions()`.
  - Controllers atuais (`src/http/controllers/transaction/*.ts`) passam a chamar as novas factories.
  - Adapters temporários para quaisquer chamadas que ainda toquem lógica antiga (marcar com `// MIGRATION-TODO`).
- Caixa (cash-register): extrair casos de uso: `OpenSession`, `CloseSession`, `GetOpenSession`, `ListSessions`, `UpdateCashFinalAmount` com `TransactionRunner`.
- Empréstimos/Dívidas: criar casos de uso alinhados (Create/Get/List/Update/Pay/Delete) e seus adapters Prisma, mantendo rotas.
 - Critérios de aceite (Fase 2):
   - Rotas atuais de transação continuam com o mesmo contrato.
   - `ReasonTransaction` explicitado em todos os caminhos de criação de transação (sem fallback para `OTHER` exceto exceções documentadas).
   - Liquidação de empréstimos consolidada: transição `VALUE_TRANSFERRED` → `PAID_OFF` padronizada e testada.

Fase 3 — Scheduling (Appointments)
- Checklist operacional: [docs/migracao-arquitetura/fase-03-scheduling.md](docs/migracao-arquitetura/fase-03-scheduling.md)
- Já existem serviços/aplicação em `src/modules/appointment/application/*` (e factories em `infra`).
- Verificar controllers: migrar para factories dos módulos.
- Consolidar `CheckBarberAvailability` e `ValidateAppointmentWindow` como serviços de domínio; garantir testes unitários.

Fase 4 — Catalog (Products/Services/Categories/Coupons/Benefits)
- Checklist operacional: [docs/migracao-arquitetura/fase-04-catalog.md](docs/migracao-arquitetura/fase-04-catalog.md)
- Definir entidades e invariantes (ex.: estoque não negativo, preço mínimo, validade de cupom).
- Criar casos de uso CRUD e serviços auxiliares (estoque, desconto) como serviços de domínio.
- Extrair utilidades de `src/services/sale/utils/*` para novos serviços do domínio onde fizer sentido.

Fase 4b — Plans & Recurrence (Plans/PlanProfiles/TypeRecurrence)
- Checklist operacional: [docs/migracao-arquitetura/fase-04b-plans.md](docs/migracao-arquitetura/fase-04b-plans.md)
- Migrar casos de uso de Plan/PlanProfile para `modules/plans` (Create/List/Get/Update/Delete, Cancel/Renew).
- Reposicionar `TypeRecurrence` sob Plans (ou sob Finance-Billing, se preferir), como fonte de verdade para a periodicidade das cobranças.
- Integrar com Finance/Debts para geração e reconciliação de débitos recorrentes e renovações.

Fase 5 — Organization (Org/Unit/OpeningHour/Profile e horas de trabalho/bloqueio)
- Checklist operacional: [docs/migracao-arquitetura/fase-05-organization.md](docs/migracao-arquitetura/fase-05-organization.md)
- Unificar regra de horário em serviços de domínio (interseção de agendas, validações, etc.).
- Criar casos de uso com portas para repositórios atuais de Profile/OpeningHour/Unit.
- Adaptar controllers a factories.

Fase 6 — IAM (Users, Roles, Permissions, Sessions)
- Checklist operacional: [docs/migracao-arquitetura/fase-06-iam.md](docs/migracao-arquitetura/fase-06-iam.md)
- Consolidar RBAC como serviço de domínio simples (checagem por escopo).
- Casos de uso: Register, Authenticate, SetUserUnit, UpdateUser, ListClients.
- Factories e adapters Prisma; controllers passam a usar factories.

Fase 7 — Reporting e Config
- Checklist operacional: [docs/migracao-arquitetura/fase-07-reporting-config.md](docs/migracao-arquitetura/fase-07-reporting-config.md)
- Separar queries de leitura como Application Query Handlers com repositórios voltados a leitura (pode reutilizar Prisma direto aqui).
- Manter rotas idênticas; apenas mover a lógica para casos de uso de consulta.

Fase 8 — Remoção de código legado
- Checklist operacional: [docs/migracao-arquitetura/fase-08-remocao-legado.md](docs/migracao-arquitetura/fase-08-remocao-legado.md)
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
 - Preferir re-exports temporários (ex.: `src/services/transaction/index.ts` reexportando novas factories) para reduzir mudanças em imports; remover ao final.
 - Em testes, introduzir fakes para `TransactionRunner`/`Clock` e manter um adapter Prisma real para E2E.

---

## Padrões de Testes

- Unit: Casos de uso com repositórios in-memory (já há padrão em `src/repositories/in-memory/*`).
- Integration: Adapters Prisma (quando necessário).
- E2E: Rotas Fastify exercitando controllers + factories.
- Sempre rodar `npm test`, `npm run typecheck` e `npm run lint` antes de abrir PR.
 - Critérios de não-regressão para Fase 0: nenhum teste existente deve ser atualizado por conta de portas/TransactionRunner; apenas adição de fakes/stubs quando necessário.

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
- [ ] Tratar `ReasonTransaction` como campo obrigatório nas portas/adapters de transação e revisar cálculos de saldo para evitar uso do motivo `OTHER`.
- [ ] Garantir fluxo único de liquidação de empréstimos (`PayLoan` x `PayUserLoansService`), consolidando a transição `VALUE_TRANSFERRED` → `PAID_OFF` e removendo lógica duplicada.
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
- Organization: `Profile` agrega atributos operacionais do usuário na organização/unidade (ex.: comissões, workHours, blockedHours, vínculos com serviços/produtos, planos). Um único `Profile` com `roleId` (RBAC) evita duplicação; especializações só se invariantes divergirem muito. O fluxo de criação de usuário deve garantir o vínculo imediato com um `Profile`.
- Sales: assume que todo `User` possui `Profile`. Use `userId` do vendedor/colaborador e `clientId` do comprador (ambos `User`) e recupere dados operacionais via portas que retornem `User+Profile` quando necessário. Regras como “usuário pertence à unidade” devem ser verificadas no use case via repositórios (sem acoplar o domínio a Profile).
- Tipos de perfil (client, barber, attendant, admin, owner) são tratados via `Role`/permissões. Entidades e serviços de domínio condicionam comportamento por papel quando necessário, sem multiplicar entidades.

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
3) Migrar `withdrawal-balance-transaction` e `pay-balance-transaction` para `modules/finance` (Fase 2) com `CommissionCalculator` no domínio, amarrando `ReasonTransaction` explícito nas portas e consolidando liquidação de empréstimos (`VALUE_TRANSFERRED` → `PAID_OFF`).
4) Adicionar adapters de compatibilidade e marcar com `// MIGRATION-TODO`.
5) Iniciar migração de `cash-register` para casos de uso com `TransactionRunner`.
6) Definir timeline das fases restantes (Scheduling → Catalog → Plans & Recurrence → Organization → IAM → Reporting).

> Este plano permite migrar por partes mantendo o sistema funcional, com comunicação temporária via adapters para módulos ainda não migrados. Quando um domínio migrado precisar falar com módulo antigo, encapsular a chamada no adapter e documentar o ponto de troca para futura substituição.
