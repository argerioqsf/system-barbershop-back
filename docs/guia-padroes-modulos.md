# Guia de Padrões de Implementação – Node + TypeScript + Fastify + Prisma
> **Objetivo**: padronizar a criação e manutenção de módulos seguindo Design Modular + Clean/Hexagonal (Ports & Adapters), com práticas de repositórios, mappers, transações, DI, testes e observabilidade.
>
> **Escopo**: Este guia NÃO contém tutoriais extensos nem dumps de código de módulo específico. Serve como **referência de arquitetura e checklist** para o time.

---

## 1) Princípios Fundamentais

1. **Design Modular (Modular Monolith)**
   - Organizar por **domínio/feature** (ex.: `sales`, `users`, `billing`) — não por camadas globais.
   - Cada módulo é autonomamente estruturado (domain, application, infrastructure, interfaces).

2. **Clean/Hexagonal (Ports & Adapters)**
   - Dependências sempre apontam de “fora → dentro”: `interfaces` → `application` → `domain`.
   - O **domínio** é o núcleo: **não** importa Prisma, HTTP, Zod ou libs de infra.

3. **Repository Pattern (focado)**
   - Defina **ports específicas de domínio** (ex.: `SaleRepository`) com operações do negócio.
   - Evite `GenericRepository<T>`. Use **mappers** para isolar o formato do ORM.

4. **Factories / Builders (Domínio)**
   - Construa aggregates/entidades complexas e garanta invariantes no momento da criação.

5. **Injeção de Dependência (DI)**
   - Prefira **composition root** e **Fastify plugins** (escopo por request) antes de usar containers.
   - Containers leves (ex.: `tsyringe`, `awilix`) são opcionais conforme a complexidade.

---

## 2) Estrutura por Módulo (padrão)

```
src/
  modules/
    <feature>/
      domain/
        entities/
        value-objects/
        services/
        factories/
        events/          # eventos de domínio (tipos/nomes/payloads)
        errors/
      application/
        use-cases/
        dto/
        ports/           # ex.: repositories, gateways, event-bus
        mappers/         # Domain ⇄ DTO
        handlers/        # handlers de domain events (reação de aplicação)
      infrastructure/
        prisma/
          repositories/  # adapters concretos do Prisma
          mappers/       # Prisma ⇄ Domain
        gateways/        # adapters para integrações externas
        event-bus/       # adapters do EventBus (in-memory, filas…)
      interfaces/
        http/
          routes.ts
          controllers/
          validators/    # contratos HTTP (Zod) — req/res
          mappers/       # HTTP ⇄ DTO/UseCase
```

> **Observação sobre Mappers**  
> - **Infra (Prisma)**: `infrastructure/prisma/mappers` (traduz ORM ↔ domínio).  
> - **Application**: `application/mappers` (domínio ↔ DTO).  
> - **HTTP**: `interfaces/http/mappers` (request/response ↔ DTO/use case).  
> - **Domínio**: mappers entre entidades/VOs **somente** se não houver dependência externa.

---

## 3) Dependências entre Camadas

- `interfaces/http` **pode** importar `application` (use cases, DTOs) e seus mappers.
- `application` **pode** importar `domain` e **ports**; **não** importa Prisma/HTTP.
- `infrastructure` **implementa** ports de `application`; **não** importa `interfaces/http`.
- `domain` não importa nada “para fora”. Mantém-se puro (TypeScript e lógica de negócio).

---

## 4) Padrões Específicos

### 4.1 Repositórios
- Contratos em `application/ports`: expressam **intenção de negócio** (ex.: `findOpenByCustomer`).
- Implementações em `infrastructure/prisma/repositories`: contêm queries Prisma.
- **Unit of Work**: usar `prisma.$transaction` e injetar `tx` nos repositórios quando necessário.
- `save` faz *upsert* ou orquestra create/update conforme o agregado.

### 4.2 Transações
- Expor nos use cases um `ctx` opcional com transação:
  - `execute(input, ctx?: { tx?: PrismaClient })`.
- Nunca misturar múltiplos clients em uma transação; use o `tx` repassado.

### 4.3 Mappers
- **Sem atalhos**: nada de retornar objetos do Prisma para o domínio.
- `Mapper.toDomain(prismaModel)`, `Mapper.toPrisma(entity)` são obrigatórios onde couber.
- Datas normalizadas; números tratados; enums mapeados; campos opcionais coerentes.

### 4.4 Domain Events
- Eventos vivem em `domain/events/` com **nome imutável** (ex.: `sales.sale_created`).  
- Aggregates acumulam e expõem `pullDomainEvents()`; use case publica via `EventBus` (port).  
- Handlers em `application/handlers/` reagem e acionam side-effects via ports.  
- Adapters do bus em `infrastructure/event-bus/` (in-memory, SNS/SQS, Kafka, etc.).

### 4.5 HTTP (Interfaces)
- **Validators Zod** em `interfaces/http/validators`: validar **params/query/body** e também **response**.
- Controllers enxutos: validar I/O, chamar use case, mapear erros → HTTP codes.
- **Nunca** importar Prisma ou repositório em controller; sempre via use case.

### 4.6 Erros
- `DomainError` base em `src/core/errors` e erros específicos por agregado em `domain/errors`.
- Controllers traduzem `DomainError` para 4xx apropriados (422/409/404…).
- Erros inesperados → 500, preservando logs com correlation-id.

### 4.7 DI & Bootstrap
- **Bootstrap (composition root)** cria PrismaClient, repositórios, use cases, event bus e registra handlers.
- Em Fastify, use `fastify-plugin` e `decorate` para expor dependências com **escopo por request** quando necessário.

### 4.8 Observabilidade
- **Logger**: Pino (correlation-id por request, níveis consistentes).
- **Traços/Métricas**: OpenTelemetry (HTTP + Prisma auto-instrumentado é recomendado).
- **Health/Readiness**: endpoints dedicados; verificar DB e dependências críticas.

---

## 5) Convenções

- **Nomenclatura**
  - Use cases: `VerbObject` (`CreateSale`, `RefundSale`).
  - Ports: `NounRepository`, `EventBus`, `EmailGateway`.
  - Eventos: namespace + ação (`sales.sale_created`).  
- **Pureza**
  - Domínio é puro: sem IO/ORM/HTTP/Zod.
- **DTOs**
  - DTOs pertencem à `application/dto`.  
  - Nunca expor entidades do domínio diretamente para HTTP.
- **Validação**
  - Entrada **e saída** HTTP sempre validadas (Zod).  
- **Idempotência**
  - Para operações suscetíveis a duplicidade, considerar chave idempotente no use case/adapters.

---

## 6) Checklist para Novo Módulo

### Domínio
- [ ] Entidades/VOs definidos com invariantes.
- [ ] Factories/Builders para composições complexas.
- [ ] Domain Events mapeados (se houver reações).
- [ ] Erros de domínio específicos.

### Application
- [ ] Use cases pequenos e focados.
- [ ] Ports necessárias (repos/gateways/event-bus).
- [ ] DTOs + mappers Domain ⇄ DTO.
- [ ] Handlers para domain events (se aplicável).

### Infra
- [ ] Repositórios Prisma por port + mappers Prisma ⇄ Domain.
- [ ] Gateways/clients externos como adapters.
- [ ] EventBus adapter (in-memory em dev; fila em prod, quando preciso).
- [ ] Testes de integração de repositórios.

### Interfaces
- [ ] Rotas e controllers por caso de uso.
- [ ] Validators Zod para req/res (params, query, body, response).
- [ ] Mappers HTTP ⇄ DTO/use case.
- [ ] Tradução padronizada de erros.

### Cross-cutting
- [ ] Transações padronizadas (ctx/tx).
- [ ] Logger + correlation-id.
- [ ] ENV validados no bootstrap.
- [ ] Testes: unit (domínio), integration (infra), E2E (HTTP).
- [ ] Health/readiness.

---

## 7) Padrões de Testes

- **Domínio**: unit puros (sem banco, sem HTTP).
- **Application**: unit com fakes/mocks de ports.
- **Infra (Prisma)**: integration com banco (SQLite em memória ou container).
- **HTTP**: E2E (Fastify + supertest), validando contratos Zod e mapeamento de erros.

---

## 8) Anti‑Patterns a evitar

- Repositório genérico para tudo (`GenericRepository<T>`).
- Use cases gigantes (faça orquestração mínima, delegue para domínio).
- Controller falando direto com Prisma/ORM.
- Models do Prisma vazando para domínio/HTTP.
- Zod dentro do domínio.
- Não validar **resposta** HTTP.
- Misturar múltiplos `PrismaClient` dentro de uma mesma transação.

---

## 9) Roadmap de Evolução (quando crescer)

- Trocar **InMemoryEventBus** por filas (SNS/SQS, Kafka) se houver integrações/escala.
- Adicionar **políticas de idempotência** (chaves únicas + locks suaves).
- Implementar **feature flags** para toggles de comportamento.
- Observabilidade avançada (traces distribuídos, métricas customizadas).
- Fatiar módulo em serviço separado **apenas** quando requisitos de escala/acoplamento exigirem.

---

## 10) Template mínimo de arquivos (sem código específico)

Crie estes arquivos vazios ao iniciar um módulo:

```
modules/<feature>/
  domain/
    entities/.gitkeep
    value-objects/.gitkeep
    services/.gitkeep
    factories/.gitkeep
    events/.gitkeep
    errors/.gitkeep
  application/
    use-cases/.gitkeep
    dto/.gitkeep
    ports/.gitkeep
    mappers/.gitkeep
    handlers/.gitkeep
  infrastructure/
    prisma/
      repositories/.gitkeep
      mappers/.gitkeep
    gateways/.gitkeep
    event-bus/.gitkeep
  interfaces/
    http/
      controllers/.gitkeep
      validators/.gitkeep
      mappers/.gitkeep
      routes.ts
```
