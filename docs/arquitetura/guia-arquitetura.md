# Guia de Arquitetura — Clean Architecture + DDD + Hexagonal

Este guia descreve como estruturamos e desenvolvemos o sistema seguindo Clean Architecture, DDD e Arquitetura Hexagonal (Ports & Adapters). É um material prático para orientar decisões diárias de desenvolvimento, independente de tarefas de migração.

## Princípios e Stack
- Node.js 20, TypeScript, Fastify, Prisma.
- Testes com Vitest.
- Clean Architecture para isolamento de regras (domain/application) e bordas em `infra`.
- DDD para modelagem: Entidades, VOs, Serviços de Domínio e invariantes.
- Ports & Adapters para entradas (HTTP) e saídas (DB, storage, filas, etc.).
- Factories para compor casos de uso e injetar dependências.

## Estrutura por Módulo (Bounded Context)

Diretório base: `src/modules/<contexto>/`

```
src/modules/<contexto>/
  domain/              # Regras de negócio puras (sem ORM/HTTP)
    entities/          # Entidades/agregados (ex.: Sale, SaleItem)
    value-objects/     # VOs (ex.: Money, Percentage)
    services/          # Serviços de domínio (poucos, estáveis)
    errors/            # Erros de domínio
    events/            # (opcional) eventos de domínio

  application/         # Orquestração; sem dependência de infra/ORM
    use-cases/         # Casos de uso (ex.: CreateSale, UpdateSale)
    query-handlers/    # Consultas de leitura (CQRS)
    ports/             # Interfaces (repositórios, Telemetry, Clock...)
    dto/               # DTOs de entrada/saída dos use-cases/queries
    validators/        # Validadores específicos de aplicação
    errors/            # Erros de aplicação
    services/          # Serviços de aplicação (coordenação)

  infra/               # Adapters de entrada/saída (bordas)
    repositories/
      prisma/          # Implementações Prisma das ports
    http/
      controllers/     # Controllers + mapeamento HTTP ↔ DTO/use-case
      route.ts         # Registro de rotas do módulo
      middlewares/     # (opcional) middlewares específicos
    factories/         # make<UseCase|Service>() injeta deps (ports, runner, clock)
    mappers/           # Prisma ↔ Domain / Domain ↔ DTO
    telemetry/         # Adapters de logging/metrics
    schedulers/        # (opcional) jobs/cron do módulo

  # (opcional) presentation/ se houver DTOs específicos da borda
```

### Camadas e Dependências
- `domain` não depende de `application`/`infra`.
- `application` depende de `domain` e de ports (interfaces), nunca de adapters/ORM.
- `infra` implementa ports e concentra adapters (HTTP/Prisma/telemetry/jobs) e factories.

## Bounded Contexts (Visão Geral)

1) Identity & Access (IAM)
- Escopo: autenticação, papéis e permissões.
- Entidades: User, Role, Permission, Session.
- Casos de uso: RegisterUser, Authenticate, SetUserUnit, UpdateUser, ListClients, RBAC checks.

2) Organization
- Escopo: Organization, Units, OpeningHours, Profiles.
- Entidades: Organization, Unit, OpeningHour, Profile, WorkHour, BlockedHour.
- Casos de uso: CRUD de Organization/Unit; horários de unidade e perfil; vínculo usuário↔unidade.

3) Catalog
- Escopo: Services, Products, Categories, Coupons, Benefits.
- Entidades: Service, Product (estoque), Category, Coupon, Benefit.

4) Scheduling (Appointments)
- Escopo: agendamentos e disponibilidade.
- Entidades: Appointment (+ Service/Barber/Client).

5) Sales
- Escopo: Vendas e itens (serviços/produtos/plano/agendamento), cupom na venda.
- Entidades: Sale, SaleItem, SaleCoupon, SaleDiscount.

6) Finance
- Escopo: Transações, Comissões, Caixa, Empréstimos, Dívidas, Distribuição de Lucro.
- Entidades: Transaction, Commission, CashSession, Loan, Debt.

7) Plans (Assinaturas)

``// TODO trazer Benefits para o modulo Plans, pois ele é o beneficio dos planos
``
- Escopo: Planos e vínculos de usuário ao plano (PlanProfile), recorrência (TypeRecurrence).

8) Reporting
- Escopo: consultas agregadas de leitura via Query Handlers.

9) Config/Storage
- Escopo: exportações e uploads.

## CQRS (Commands x Queries)
- Use-cases (commands) representam intenções de mudança de estado. Devem receber apenas interfaces (ports) e valores primitivos/DTOs e retornar DTOs.
- Query Handlers (queries) leem dados sem efeitos colaterais. Podem usar repositórios otimizados para leitura.

Pontos de apoio:
- Repositórios Prisma em `infra` implementam as ports.
- Factories em `infra/factories` compõem casos de uso com `TransactionRunner`, `Logger`, `Clock` etc.
- Controllers apenas convertem HTTP ↔ DTOs e chamam factories.

## Ports Cross‑cutting (reutilizáveis)
- `TransactionRunner` para centralizar transações (encapsula `prisma.$transaction`). Arquivo: `src/core/application/ports/transaction-runner.ts`.
- `Clock` para tempo, `IdGenerator` para UUID.
- `Telemetry`/Logger, `Storage`, `Authorization`/Auth (bordas), etc.

## Transações
- Injete `TransactionRunner` via factories dos use-cases e serviços de aplicação. `src/infra/prisma/transaction-runner.ts` expõe `defaultTransactionRunner`.
- Propague `tx?: Prisma.TransactionClient` nas ports de repositório para operar no mesmo contexto transacional.
- Padrão de composição com contexto opcional:
  - Tipo `UseCaseCtx { tx?: Prisma.TransactionClient }` em `src/core/application/use-case-ctx.ts`.
  - Assinatura: `execute(input, ctx?: UseCaseCtx)`.

## Repositórios e Ports (focados no domínio)
- Defina ports por agregado principal (ex.: `SaleRepository`, `CashRegisterRepository`).
- Implementações Prisma ficam em `infra/.../repositories/prisma` e usam mappers para isolar o ORM do domínio.
- Todos os métodos aceitam `tx?: Prisma.TransactionClient`.

## Mapeamento por Camada
- Infra (Prisma): Prisma ↔ Domain (normalização de datas, números, enums).
- Application: Domain ↔ DTO (entrada/saída de use-cases/queries).
- HTTP (`infra/http`): Request/Response ↔ DTO/use-case + validação (Zod).

## Comunicação entre Módulos (Contextos)
- O módulo consumidor define sua própria porta em `application/ports` descrevendo a necessidade (ex.: `IProductsForSaleRepository`).
- Os métodos dessa porta retornam modelos locais (entidades/VOs do próprio módulo), não entidades do módulo externo.
- O adaptador em `infra/repositories/adapters` implementa a porta e pode depender do repositório oficial do módulo dono da informação.
- É proibido acessar diretamente as tabelas do banco de outro módulo: respeite a fonte da verdade através dos repositórios oficiais.

## Modelagem entre Módulos (Anti‑Corruption Layer)
- Não compartilhe entidades de domínio entre módulos.
- Crie um modelo local (Entidade/VO) contendo apenas os atributos relevantes ao seu contexto.
- A tradução do modelo externo para o local ocorre na infraestrutura (adaptador). O domínio permanece puro.

## Erros e HTTP
- Erros de domínio residem em `domain/errors` (sem status HTTP).
- Controllers traduzem erros para HTTP adequados (422/409/404/401/403/500).
- Centralize o mapeamento de erros na borda HTTP (ex.: util/handler em `infra/http`).

## Middlewares (JWT & Permissões)
- Validação de JWT e checagem de permissões (RBAC) ocorrem na borda HTTP.
- Application pode expor portas/serviços de autorização quando necessário para decisões de negócio.

## Observabilidade e Saúde
- Defina portas de Telemetry (ex.: `SaleTelemetry`) em `application/ports` para métricas/logs relevantes ao domínio.
- Adapters vivem em `infra/telemetry`.
- Exponha endpoints/sondas de saúde quando necessário no módulo HTTP.

## Padrões de Testes
- Unit: serviços de domínio e use-cases com fakes/mocks de ports.
- Integration: adapters Prisma (SQLite/MySQL). Repositórios in-memory podem ajudar a isolar regras.
- E2E: rotas Fastify exercitando controllers + factories.

## Convenções e Naming
- Factories: `make<UseCase|Service>()` expondo apenas o necessário.
- Ports: uma interface por agregado principal; cross‑cutting (`Clock`, `IdGenerator`, `Telemetry`, `Authorization`) quando aplicável.
- Evite `any`; prefira tipos/DTOs explícitos por caso de uso.

## Utilitários e Cross‑cutting
- Evite utilidades “genéricas” no domínio quando dependerem de infra/ORM/HTTP.
- Centralize permissões/guards sob IAM (application) quando exigirem repositórios.
- Convenções comuns (ex.: paginação) podem viver em `src/core/constants/*`.
- Valores monetários e percentuais: prefira VOs — `Money` para valores financeiros e `Percentage` para percentuais. Até a adoção completa, utilidades como `round`, `toCents`, `fromCents` podem ser usadas como fallback e posteriormente migradas.
 
## VOs Financeiros (Money e Percentage)

### Money
- Objetivo: representar valores financeiros sem erros de ponto flutuante.
- Representação: valores em centavos (inteiros) para garantir precisão.
- Criação: fábricas como `fromNumber(value)`, `fromCents(cents)` e, quando aplicável, `currency` (ex.: `BRL`).
- Operações: `toNumber()`, `toCents()`, `add`, `subtract`, `multiply`, `negate`, `equals`, `gt/gte/lt/lte`, `isNegative`, `isZero`.
- Imutabilidade: toda operação retorna um novo `Money`.
- Integrações usuais:
  - Persistência: adapters convertem `DECIMAL/NUMERIC` ↔ `Money` na camada Prisma.
  - HTTP: controllers/DTOs expõem números; o mapeamento para/desde `Money` ocorre no controller/use-case.
- Negativos e invariantes:
  - `Money` pode ser negativo (ex.: retirada/estorno). Restrições do tipo “não permitir negativo” ficam:
    - Na Entidade, quando invariante do agregado (ex.: `Sale.total ≥ 0`).
    - No Use Case, quando pré‑condição de entrada (ex.: `amount` de retirada precisa ser positivo; a operação subtrai).

### Percentage
- Objetivo: evitar ambiguidades e erros ao trabalhar com percentuais (comissão, descontos).
- Representação recomendada: valor normalizado em 0..1 (ex.: 0.1 = 10%) ou base points (inteiro em centésimos de ponto percentual). Escolha deve ser consistente no módulo; normalizado 0..1 é preferível para simplicidade.
- Operações: `of(Money) -> Money` (aplicar percentual a um valor), `add`, `subtract`, `equals`, `gt/gte/lt/lte`.
- Imutável e estritamente tipado.

Observação prática: quando os VOs ainda não estiverem implementados no módulo, use utilidades existentes (`round`, `toCents`, `fromCents`) e crie uma tarefa de migração para adotar `Money`/`Percentage` assim que possível.

## Exemplo (Factory mínima)
```ts
// src/modules/<contexto>/infra/factories/make-update-foo.ts
import { PrismaFooRepository } from '@/repositories/prisma/prisma-foo-repository'
import { UpdateFooUseCase } from '@/modules/<contexto>/application/use-cases/update-foo'
import { defaultTransactionRunner } from '@/infra/prisma/transaction-runner'

export function makeUpdateFoo() {
  const repo = new PrismaFooRepository()
  return new UpdateFooUseCase(repo, defaultTransactionRunner)
}
```

## Exemplo (Ports — pseudo‑código)
```ts
// application/contracts
export interface TransactionRunner { run<T>(fn: (tx: DbTx) => Promise<T>): Promise<T> }
export interface UsersRepository { findById(id: string): Promise<User | null> }
export interface CashRegisterRepository { findOpenByUnit(unitId: string): Promise<CashSession | null> }
export interface TransactionsRepository { create(t: NewTransaction, tx?: DbTx): Promise<Transaction> }
```

## Checklist de Conformidade por Módulo
- domain contém apenas entidades/VOs/serviços/erros/eventos.
- application depende apenas de domain + ports; sem import de ORM/adapters.
- infra implementa ports e concentra adapters (HTTP/Prisma/telemetry/jobs).
- use-cases recebem `TransactionRunner`; ports aceitam `tx?`.
- controllers validam com Zod e mapeiam erros de domínio.
- sem utilidades de legado importadas diretamente (usar adapters quando preciso).

## Disclaimers (Eventos de Domínio e DI/Bootstrap)
- Eventos de Domínio: ainda não adotados. Quando e se forem implementados, devem ser modelados em `domain/events` com nomes estáveis, publicados após commit e consumidos por handlers de `application` via uma porta `EventBus` (adapters in‑memory/filas em `infra`). Até lá, evite introduzir eventos sem uma RFC aprovada.
- DI/Bootstrap: o projeto usa factories explícitas para composição. Caso passemos a um composition root (plugins Fastify ou container DI), ele deve apenas orquestrar a criação de adapters/ports/use-cases por request, mantendo a separação de camadas. Não introduzir container DI sem discussão prévia.
